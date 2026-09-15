const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { generateRefNo } = require("../utils/refNo");
const { consumeFifo } = require("../utils/fifo");
const {
  ensureBinCard,
  postBinCardEntry,
  resolveItemBin,
} = require("../utils/binCard");
const { ApiError } = require("../middleware/errorHandler");
const { notifyRoles } = require("../utils/notifications");
const { assignedStoreIds } = require("../utils/scope");
const { requireConfirmation } = require("../utils/confirmation");

async function list(req, res) {
  const conditions = [];
  const params = [];
  
  // Store filtering: Apply to Store Heads and related roles, NOT to Department Heads or Stock Clerks
  const storeIds = (req.user.role !== "Department Head" && req.user.role !== "Stock Clerk") 
    ? await assignedStoreIds(req.user) 
    : null;
  
  if (req.user.role === "Campus Security Officer")
    conditions.push("iv.status = 'Issued'");
  if (req.user.role === "Requesting Staff") {
    params.push(req.user.id);
    conditions.push(`sr.requested_by = $${params.length}`);
    conditions.push("iv.status = 'Issued'");
  }
  if (storeIds) {
    params.push(storeIds);
    conditions.push(`iv.store_id = ANY($${params.length}::uuid[])`);
  }
  if (req.user.role === "Department Head" && req.user.department) {
    params.push(req.user.department);
    conditions.push(`LOWER(sr.department) = LOWER($${params.length})`);
    // Department Heads only see Issued vouchers (ready for collection)
    conditions.push("iv.status = 'Issued'");
    console.log("🔵 [DEPT HEAD FILTER] User:", req.user.name, "Department:", req.user.department);
  }
  if (req.user.role === "Stock Clerk") {
    // Stock Clerks see ALL issue vouchers (read-only view for awareness)
    // No filtering - they need visibility across all stores and statuses
    console.log("🔵 [STOCK CLERK FILTER] User:", req.user.name, "Viewing all vouchers");
  }
  const statusFilter = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  console.log("🔵 [ISSUE VOUCHERS QUERY] Filter:", statusFilter, "Params:", params);
  const rows = await pool.query(
    `SELECT iv.*, i.name AS item_name, s.name AS store_name, 
      sr.ref_no AS requisition_ref,
      sr.department AS requisition_department,
      requester.name AS requested_by_name,
      requester.email AS requested_by_email,
      approver.name AS approved_by_name,
      COALESCE(iv.requires_gate_clearance, true) AS requires_gate_clearance,
      iv.gate_clearance_requested,
      iv.gate_clearance_approved,
      gcr.id AS clearance_request_id,
      gcr.status AS clearance_request_status,
      gcr.collector_name AS clearance_collector_name,
      gcr.scheduled_pickup_date AS clearance_pickup_date,
      gc.id IS NOT NULL AS gate_clearance,
      gc.cleared_at AS gate_cleared_at,
      clearance_user.name AS gate_cleared_by_name,
      gc.notes AS gate_clearance_notes
     FROM issue_vouchers iv
     JOIN items i ON i.id = iv.item_id
     JOIN stores s ON s.id = iv.store_id
     JOIN store_requisitions sr ON sr.id = iv.requisition_id
     LEFT JOIN users requester ON requester.id = sr.requested_by
     LEFT JOIN users approver ON approver.id = iv.approved_by
    LEFT JOIN gate_clearance_requests gcr ON iv.gate_clearance_request_id = gcr.id
    LEFT JOIN gate_clearances gc ON gc.issue_voucher_id = iv.id
    LEFT JOIN users clearance_user ON clearance_user.id = gc.cleared_by
    ${statusFilter}
     ORDER BY iv.created_at DESC`,
    params,
  );
  console.log("🔵 [ISSUE VOUCHERS RESULT] Found", rows.rows.length, "vouchers");
  res.json(rows.rows);
}

async function recordGateClearance(req, res) {
  const { id } = req.params;
  const { notes } = req.body || {};

  const result = await withTransaction(async (client) => {
    const voucher = await client.query(
      `SELECT * FROM issue_vouchers WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (voucher.rows.length === 0)
      throw new ApiError(404, "Voucher not found.");
    if (
      voucher.rows[0].status !== "Issued" ||
      voucher.rows[0].model !== "Model 22 (Final)"
    ) {
      throw new ApiError(
        400,
        "Gate clearance requires a finalized Model 22 voucher.",
      );
    }

    const existing = await client.query(
      `SELECT id FROM gate_clearances WHERE issue_voucher_id = $1`,
      [id],
    );
    if (existing.rows.length > 0) {
      throw new ApiError(
        400,
        "Gate clearance has already been recorded for this voucher.",
      );
    }

    // Find the associated gate_clearance_request
    const clearanceReq = await client.query(
      `SELECT id FROM gate_clearance_requests WHERE issue_voucher_id = $1`,
      [id],
    );

    const clearance = await client.query(
      `INSERT INTO gate_clearances (issue_voucher_id, cleared_by, notes, clearance_request_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, req.user.id, notes || null, clearanceReq.rows[0]?.id || null],
    );
    
    console.log("✅ Gate clearance recorded:", clearance.rows[0]);
    
    await logAction(client, {
      user: req.user,
      module: "Gate Clearance",
      action: `Recorded gate clearance for voucher ${voucher.rows[0].ref_no}`,
    });
    return clearance.rows[0];
  });

  res.status(201).json(result);
}

// Use Case: Create Preliminary SIV/ISIV (Model 20).
async function createPreliminary(req, res) {
  const { requisitionId, requires_gate_clearance = false } = req.body;
  console.log("🟢 [CREATE PRELIMINARY] Body:", req.body);
  console.log("🟢 [CREATE PRELIMINARY] requires_gate_clearance:", requires_gate_clearance, "Type:", typeof requires_gate_clearance);
  if (!requisitionId) throw new ApiError(400, "requisitionId is required.");

  const result = await withTransaction(async (client) => {
    const reqRes = await client.query(
      `SELECT * FROM store_requisitions WHERE id = $1 FOR UPDATE`,
      [requisitionId],
    );
    if (reqRes.rows.length === 0)
      throw new ApiError(404, "Requisition not found.");
    const requisition = reqRes.rows[0];
    if (requisition.status !== "Approved") {
      throw new ApiError(
        400,
        "A preliminary voucher can only be created from an Approved requisition.",
      );
    }

    const refNo = generateRefNo("SIV");
    const inserted = await client.query(
      `INSERT INTO issue_vouchers (ref_no, requisition_id, store_id, item_id, qty, created_by, requires_gate_clearance)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        refNo,
        requisitionId,
        requisition.store_id,
        requisition.item_id,
        requisition.qty,
        req.user.id,
        requires_gate_clearance,
      ],
    );

    const voucher = inserted.rows[0];

    // AUTOMATIC GATE CLEARANCE REQUEST CREATION
    // If gate clearance is required, automatically create the request
    if (requires_gate_clearance) {
      console.log("🟡 [AUTO GATE CLEARANCE] Creating clearance request for voucher:", refNo);
      
      // Use gate clearance details from requisition or defaults
      const collectorName = requisition.gc_collector_name || 'To be confirmed by department';
      const collectorIdNumber = requisition.gc_collector_id_number || 'TBD';
      const collectorPhone = requisition.gc_collector_phone || 'TBD';
      const vehicleRegistration = requisition.gc_vehicle_registration || null;
      const scheduledPickupDate = requisition.gc_scheduled_pickup_date || (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
      })();
      const scheduledPickupTime = requisition.gc_scheduled_pickup_time || '09:00:00';
      const pickupJustification = requisition.gc_pickup_justification || 
        `Automatic clearance request for ${requisition.department} requisition ${requisition.ref_no}`;
      
      console.log("🟡 [AUTO GATE CLEARANCE] Using collector details:", {
        collectorName,
        collectorIdNumber,
        collectorPhone,
        vehicleRegistration,
        scheduledPickupDate,
        scheduledPickupTime,
        pickupJustification
      });
      
      const clearanceRequest = await client.query(
        `INSERT INTO gate_clearance_requests (
          issue_voucher_id,
          requested_by,
          collector_name,
          collector_id_number,
          collector_phone,
          vehicle_registration,
          collector_department,
          scheduled_pickup_date,
          scheduled_pickup_time,
          pickup_justification,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          voucher.id,
          req.user.id,
          collectorName,
          collectorIdNumber,
          collectorPhone,
          vehicleRegistration,
          requisition.department,
          scheduledPickupDate,
          scheduledPickupTime,
          pickupJustification,
          'Pending'
        ]
      );

      // Update voucher with clearance request ID and flag
      await client.query(
        `UPDATE issue_vouchers 
         SET gate_clearance_request_id = $1, 
             gate_clearance_requested = true 
         WHERE id = $2`,
        [clearanceRequest.rows[0].id, voucher.id]
      );

      // Notify Security Officer
      const securityOfficers = await client.query(
        `SELECT id FROM users WHERE role = 'Campus Security Officer' LIMIT 1`
      );
      
      if (securityOfficers.rows.length > 0) {
        await notifyUser(client, {
          userId: securityOfficers.rows[0].id,
          title: "New Gate Clearance Request",
          message: `${requisition.department} needs gate clearance for ${refNo}. Collector: ${collectorName}. Please review and approve.`,
          type: "clearance_request",
          metadata: { clearance_request_id: clearanceRequest.rows[0].id, voucher_id: voucher.id }
        });
        console.log("🟢 [AUTO GATE CLEARANCE] Security Officer notified");
      }

      console.log("🟢 [AUTO GATE CLEARANCE] Request created with ID:", clearanceRequest.rows[0].id);
    }

    await logAction(client, {
      user: req.user,
      module: "Issuing",
      action: `Created preliminary voucher ${refNo} (Model 20) for requisition ${requisition.ref_no}${requires_gate_clearance ? ' - Gate clearance request automatically created and Security Officer notified' : ''}`,
    });

    return inserted.rows[0];
  });

  res.status(201).json(result);
}

// Use Case: Approve and Amend SIV/ISIV — allows quantity amendment while
// still Preliminary, before Generate SIV/ISIV finalizes it.
async function amend(req, res) {
  const { id } = req.params;
  const { qty, requires_gate_clearance } = req.body;
  if (qty && qty <= 0) throw new ApiError(400, "Quantity must be positive.");

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM issue_vouchers WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Voucher not found.");
    if (current.rows[0].status !== "Preliminary")
      throw new ApiError(400, "Only a Preliminary voucher can be amended.");

    // Build update dynamically based on what fields are provided
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (qty !== undefined) {
      updates.push(`qty = $${paramIndex++}`);
      params.push(qty);
    }
    
    if (requires_gate_clearance !== undefined) {
      updates.push(`requires_gate_clearance = $${paramIndex++}`);
      params.push(requires_gate_clearance);
    }
    
    if (updates.length === 0) {
      throw new ApiError(400, "No fields to update.");
    }
    
    params.push(id);
    const updated = await client.query(
      `UPDATE issue_vouchers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      params
    );
    
    const changes = [];
    if (qty !== undefined) changes.push(`quantity to ${qty}`);
    if (requires_gate_clearance !== undefined) {
      changes.push(requires_gate_clearance ? 'requires gate clearance' : 'no gate clearance needed');
    }
    
    await logAction(client, {
      user: req.user,
      module: "Issuing",
      action: `Amended voucher ${current.rows[0].ref_no}: ${changes.join(', ')}`,
    });
    return updated.rows[0];
  });

  res.json(result);
}

// Use Case: Approve and Amend SIV/ISIV (Model 20).
async function approve(req, res) {
  const { id } = req.params;
  const { decision, remarks } = req.body || {};
  await requireConfirmation(req);
  if (!["Approved", "Rejected"].includes(decision)) {
    throw new ApiError(400, "decision must be 'Approved' or 'Rejected'.");
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT iv.*, 
        gcr.status AS clearance_request_status,
        gcr.id AS clearance_request_id
       FROM issue_vouchers iv
       LEFT JOIN gate_clearance_requests gcr ON iv.gate_clearance_request_id = gcr.id
       WHERE iv.id = $1 FOR UPDATE OF iv`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Voucher not found.");
    
    const voucher = current.rows[0];
    
    if (voucher.status !== "Preliminary") {
      throw new ApiError(
        400,
        "Only a Preliminary Model 20 voucher can be approved or rejected.",
      );
    }

    // GATE CLEARANCE VALIDATION: Security must approve BEFORE PAO
    if (decision === "Approved" && voucher.requires_gate_clearance) {
      if (!voucher.gate_clearance_approved) {
        throw new ApiError(
          400,
          "Cannot approve: This voucher requires gate clearance approval from Security Officer first. Current clearance status: " + 
          (voucher.clearance_request_status || "Pending"),
        );
      }
    }

    const updated = await client.query(
      `UPDATE issue_vouchers
       SET status = $1, approved_by = $2, approved_at = now(), approval_remarks = $3
       WHERE id = $4 RETURNING *`,
      [decision, req.user.id, remarks || null, id],
    );
    await logAction(client, {
      user: req.user,
      module: "Issuing",
      action: `${decision} preliminary voucher ${current.rows[0].ref_no}${remarks ? ` (${remarks})` : ""}`,
    });
    await notifyRoles(client, {
      roles: ["Store Head"],
      title: `Model 20 voucher ${decision.toLowerCase()}`,
      message: `Voucher ${current.rows[0].ref_no} is ${decision.toLowerCase()}.`,
      module: "Issuing",
      referenceId: id,
      severity: decision === "Rejected" ? "Warning" : "Success",
    });
    return updated.rows[0];
  });

  res.json(result);
}

// Use Case: Generate SIV/ISIV (Model 22) — finalizes issuing, deducts stock.
async function finalize(req, res) {
  const { id } = req.params;
  await requireConfirmation(req);

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT iv.*, 
        COALESCE(iv.requires_gate_clearance, true) AS requires_gate_clearance,
        iv.gate_clearance_requested,
        iv.gate_clearance_approved,
        gcr.status AS clearance_status,
        gcr.collector_name,
        gcr.scheduled_pickup_date
       FROM issue_vouchers iv
       LEFT JOIN gate_clearance_requests gcr ON iv.gate_clearance_request_id = gcr.id
       WHERE iv.id = $1 FOR UPDATE OF iv`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Voucher not found.");
    const voucher = current.rows[0];
    if (voucher.status !== "Approved")
      throw new ApiError(
        400,
        "Only an approved Model 20 voucher can be finalized as Model 22.",
      );
    
    // CORRECTED WORKFLOW: No gate clearance check here!
    // Gate clearance is handled BEFORE PAO approval (during Preliminary stage)
    // Once PAO approves, voucher is FULLY AUTHORIZED and ready to finalize
    // This matches real-world government stores practice where:
    // - Security clearance (if needed) is obtained first
    // - PAO reviews Model 20 WITH knowledge of clearance status
    // - PAO approval = Complete authorization (no further approvals needed)

    const finalRefNo = voucher.ref_no.replace("SIV", "SIV-M22");

    const updated = await client.query(
      `UPDATE issue_vouchers
       SET status = 'Issued', model = 'Model 22 (Final)', finalized_by = $1, finalized_at = now()
       WHERE id = $2 RETURNING *`,
      [req.user.id, id],
    );

    await consumeFifo(client, {
      itemId: voucher.item_id,
      qty: parseFloat(voucher.qty),
      type: "Issue",
      reference: voucher.ref_no,
      userId: req.user.id,
    });

    const bin = await resolveItemBin(client, {
      storeId: voucher.store_id,
      itemId: voucher.item_id,
    });
    const binCardId = await ensureBinCard(client, {
      storeId: voucher.store_id,
      bin,
      itemId: voucher.item_id,
    });
    await postBinCardEntry(client, {
      binCardId,
      direction: "Outbound",
      reference: voucher.ref_no,
      qty: parseFloat(voucher.qty),
    });

    await client.query(
      `UPDATE store_requisitions SET status = 'Issued' WHERE id = $1`,
      [voucher.requisition_id],
    );

    await logAction(client, {
      user: req.user,
      module: "Issuing",
      action: `Generated final issue voucher ${voucher.ref_no} (Model 22) and deducted stock`,
    });
    await notifyRoles(client, {
      roles: ["Campus Security Officer", "Department Head"],
      title: "Model 22 issued",
      message: `Voucher ${voucher.ref_no} was finalized and stock was deducted.`,
      module: "Issuing",
      referenceId: id,
      severity: "Success",
    });

    return updated.rows[0];
  });

  res.json(result);
}

module.exports = {
  list,
  createPreliminary,
  amend,
  approve,
  finalize,
  recordGateClearance,
};
