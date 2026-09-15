const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { generateRefNo } = require("../utils/refNo");
const { receiveLot } = require("../utils/fifo");
const { ApiError } = require("../middleware/errorHandler");
const { notifyRoles } = require("../utils/notifications");
const { assignedStoreIds } = require("../utils/scope");
const { requireConfirmation } = require("../utils/confirmation");

async function list(req, res) {
  const conditions = [];
  const params = [];

  if (req.user.role === "Department Head") {
    if (req.user.department) {
      params.push(req.user.department);
      conditions.push(`(LOWER(COALESCE(srn.department, sr.department, '')) = LOWER($${params.length}))`);
    }
  } else if (req.user.role === "Requesting Staff") {
    params.push(req.user.id);
    conditions.push(`srn.returned_by = $${params.length}`);
  } else {
    const storeIds = await assignedStoreIds(req.user);
    if (storeIds) {
      params.push(storeIds);
      conditions.push(`iv.store_id = ANY($${params.length}::uuid[])`);
    }
  }

  const scope = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await pool.query(
    `SELECT srn.*, i.name AS item_name, u.name AS returned_by_name,
          COALESCE(srn.department, sr.department) AS department,
          iv.ref_no AS source_voucher_ref,
          te.decision AS evaluation_condition, te.remarks AS evaluation_remarks
     FROM store_return_notes srn
     JOIN items i ON i.id = srn.item_id
     JOIN users u ON u.id = srn.returned_by
    LEFT JOIN issue_vouchers iv ON iv.id = srn.source_issue_voucher_id
    LEFT JOIN store_requisitions sr ON sr.id = iv.requisition_id
     LEFT JOIN technical_evaluations te ON te.entity_type = 'store_return' AND te.entity_id = srn.id
    ${scope}
     ORDER BY srn.created_at DESC`,
    params,
  );
  res.json(rows.rows);
}

async function create(req, res) {
  const { itemId, qty, reason, sourceIssueVoucherId } = req.body;
  if (!itemId || !qty || !reason || !sourceIssueVoucherId)
    throw new ApiError(
      400,
      "itemId, qty, reason, and sourceIssueVoucherId are required.",
    );

  const result = await withTransaction(async (client) => {
    const voucherResult = await client.query(
      `SELECT iv.*, sr.requested_by, sr.department AS req_department
       FROM issue_vouchers iv
       JOIN store_requisitions sr ON sr.id = iv.requisition_id
       WHERE iv.id = $1 FOR UPDATE`,
      [sourceIssueVoucherId],
    );
    if (voucherResult.rows.length === 0)
      throw new ApiError(404, "Source issue voucher not found.");
    const voucher = voucherResult.rows[0];
    if (voucher.status !== "Issued" || voucher.model !== "Model 22 (Final)") {
      throw new ApiError(
        400,
        "Returns can only reference a finalized Model 22 issue voucher.",
      );
    }
    if (voucher.item_id !== itemId)
      throw new ApiError(
        400,
        "Returned item does not match the source issue voucher.",
      );
    if (
      req.user.role === "Requesting Staff" &&
      voucher.requested_by !== req.user.id
    ) {
      throw new ApiError(
        403,
        "Staff may only return materials issued to their own request.",
      );
    }
    const returned = await client.query(
      `SELECT COALESCE(SUM(qty), 0) AS total_returned
       FROM store_return_notes
       WHERE source_issue_voucher_id = $1 AND status <> 'Rejected'`,
      [sourceIssueVoucherId],
    );
    const totalReturned = Number(returned.rows[0].total_returned || 0);
    if (totalReturned + Number(qty) > Number(voucher.qty)) {
      throw new ApiError(
        400,
        `Return exceeds the issued quantity. Remaining returnable quantity: ${Number(voucher.qty) - totalReturned}.`,
      );
    }
    const returnDepartment = req.user.department || voucher.req_department || "Academic Department";
    const refNo = generateRefNo("SRN");
    const inserted = await client.query(
      `INSERT INTO store_return_notes (ref_no, item_id, qty, source_issue_voucher_id, returned_by, reason, status, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        refNo,
        itemId,
        qty,
        sourceIssueVoucherId,
        req.user.id,
        reason,
        req.user.role === "Requesting Staff"
          ? "Pending Department Approval"
          : "Pending Technical Evaluation",
        returnDepartment,
      ],
    );
    await logAction(client, {
      user: req.user,
      module: "Returns",
      action: `Created return request ${refNo}`,
    });
    await notifyRoles(client, {
      roles:
        req.user.role === "Requesting Staff"
          ? ["Department Head"]
          : ["Technical Evaluation Committee"],
      title: "Material return awaiting review",
      message: `Return ${refNo} requires the next workflow review.`,
      module: "Returns",
      referenceId: inserted.rows[0].id,
    });
    return inserted.rows[0];
  });

  res.status(201).json(result);
}

async function evaluate(req, res) {
  const { id } = req.params;
  const { condition, remarks } = req.body;
  if (!["Serviceable", "Damaged", "Obsolete"].includes(condition)) {
    throw new ApiError(
      400,
      "condition must be 'Serviceable', 'Damaged', or 'Obsolete'.",
    );
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM store_return_notes WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0) throw new ApiError(404, "Return not found.");
    if (current.rows[0].status !== "Pending Technical Evaluation") {
      throw new ApiError(
        400,
        `Return is '${current.rows[0].status}' and cannot be re-evaluated.`,
      );
    }

    await client.query(
      `INSERT INTO technical_evaluations (entity_type, entity_id, evaluator_id, decision, remarks)
       VALUES ('store_return', $1, $2, $3, $4)`,
      [id, req.user.id, condition, remarks || null],
    );
    const updated = await client.query(
      `UPDATE store_return_notes SET status = 'Evaluated', condition = $1 WHERE id = $2 RETURNING *`,
      [condition, id],
    );
    await logAction(client, {
      user: req.user,
      module: "Returns",
      action: `Recorded technical evaluation (${condition}) for ${current.rows[0].ref_no}`,
    });
    await notifyRoles(client, {
      roles: ["Property Administration Officer", "Store Head"],
      title: "Material return evaluated - needs final decision",
      message: `Return ${current.rows[0].ref_no} has been evaluated by TEC as ${condition}. Please make the final decision (first to decide wins).`,
      module: "Returns",
      referenceId: id,
      severity: condition === "Serviceable" ? "Success" : "Warning",
    });
    return updated.rows[0];
  });

  res.json(result);
}

async function decide(req, res) {
  const { id } = req.params;
  const { decision, remarks } = req.body;
  
  if (!["Approved", "Rejected"].includes(decision))
    throw new ApiError(400, "decision must be 'Approved' or 'Rejected'.");

  // Password confirmation for PAO/Store Head
  if (["Property Administration Officer", "Store Head"].includes(req.user.role)) {
    await requireConfirmation(req);
  }

  const result = await withTransaction(async (client) => {
    // Lock the row to prevent concurrent approvals
    const current = await client.query(
      `SELECT * FROM store_return_notes WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0) throw new ApiError(404, "Return not found.");
    const note = current.rows[0];
    
    // Department Head first approval
    if (note.status === "Pending Department Approval") {
      if (req.user.role !== "Department Head") {
        throw new ApiError(
          403,
          "Only the Department Head can approve this return before technical evaluation.",
        );
      }
      if (decision === "Rejected") {
        const rejected = await client.query(
          `UPDATE store_return_notes 
           SET status = 'Rejected', 
               decided_by = $1, 
               decision_remarks = $2,
               decided_at = NOW()
           WHERE id = $3 RETURNING *`,
          [req.user.id, remarks || null, id],
        );
        await logAction(client, {
          user: req.user,
          module: "Returns",
          action: `Rejected return ${note.ref_no} at Department Head approval stage`,
        });
        return rejected.rows[0];
      }
      const routed = await client.query(
        `UPDATE store_return_notes 
         SET status = 'Pending Technical Evaluation', 
             department_approved_by = $1, 
             department_approved_at = NOW(), 
             decision_remarks = $2
         WHERE id = $3 RETURNING *`,
        [req.user.id, remarks || null, id],
      );
      await logAction(client, {
        user: req.user,
        module: "Returns",
        action: `Approved return ${note.ref_no} at Department Head approval stage and routed to TEC`,
      });
      await notifyRoles(client, {
        roles: ["Technical Evaluation Committee"],
        title: "Material return approved for TEC review",
        message: `Return ${note.ref_no} was approved by the Department Head and routed to TEC.`,
        module: "Returns",
        referenceId: id,
      });
      return routed.rows[0];
    }
    
    // Final approval (PAO or Store Head)
    if (note.status !== "Evaluated")
      throw new ApiError(
        400,
        "Return must be Evaluated before a final decision can be recorded.",
      );
      
    if (!["Property Administration Officer", "Store Head"].includes(req.user.role)) {
      throw new ApiError(
        403,
        "Only PAO or Store Head can make the final decision on an evaluated return.",
      );
    }

    // Check if already decided by someone else (conflict prevention)
    if (note.decided_by && note.decided_by !== req.user.id) {
      const decider = await client.query(
        `SELECT name, role FROM users WHERE id = $1`,
        [note.decided_by]
      );
      throw new ApiError(
        409,
        `This return was already ${note.status} by ${decider.rows[0].name} (${decider.rows[0].role}). Refresh the page to see the current status.`,
      );
    }

    const updated = await client.query(
      `UPDATE store_return_notes 
       SET status = $1, 
           decided_by = $2, 
           decided_at = NOW(),
           decision_remarks = $3,
           decision_role = $4
       WHERE id = $5 RETURNING *`,
      [decision, req.user.id, remarks, req.user.role, id],
    );

    if (decision === "Approved" && note.condition === "Serviceable") {
      // Route to Stock Clerk for physical receipt confirmation
      await client.query(
        `UPDATE store_return_notes SET status = 'Pending Physical Receipt' WHERE id = $1`,
        [id]
      );
      await logAction(client, {
        user: req.user,
        module: "Returns",
        action: `${req.user.role} approved return ${note.ref_no} - awaiting physical receipt by Stock Clerk`,
      });
      await notifyRoles(client, {
        roles: ["Stock Clerk"],
        title: "Material return approved - ready for physical receipt",
        message: `Return ${note.ref_no} has been approved by ${req.user.role}. Please physically receive and verify the material.`,
        module: "Returns",
        referenceId: id,
        severity: "Info",
      });
    } else if (decision === "Rejected" || note.condition !== "Serviceable") {
      // Route damaged/obsolete or rejected returns into the disposal workflow.
      const disposalRef = `DR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      await client.query(
        `INSERT INTO disposal_requests (ref_no, item_id, qty, reason, flagged_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          disposalRef,
          note.item_id,
          note.qty,
          `Routed from store return ${note.ref_no} (${note.condition || "rejected"})`,
          req.user.id,
        ],
      );
      await logAction(client, {
        user: req.user,
        module: "Returns",
        action: `${req.user.role} ${decision} store return ${note.ref_no} - routed to disposal`,
      });
    }

    await notifyRoles(client, {
      roles: ["Department Head", "Property Administration Officer", "Store Head"],
      title: `Material return ${decision.toLowerCase()}`,
      message: `Return ${note.ref_no} was ${decision.toLowerCase()} by ${req.user.role}.`,
      module: "Returns",
      referenceId: id,
      severity: decision === "Rejected" ? "Warning" : "Success",
    });
    return updated.rows[0];
  });

  res.json(result);
}

async function confirmReceipt(req, res) {
  const { id } = req.params;
  const { receivedQty, condition, remarks } = req.body;

  if (req.user.role !== "Stock Clerk") {
    throw new ApiError(403, "Only Stock Clerks can confirm physical receipt.");
  }

  if (!receivedQty || receivedQty <= 0) {
    throw new ApiError(400, "Received quantity is required and must be positive.");
  }

  await requireConfirmation(req);

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM store_return_notes WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0) throw new ApiError(404, "Return not found.");
    
    const note = current.rows[0];
    if (note.status !== "Pending Physical Receipt") {
      throw new ApiError(
        400,
        "Return must be in 'Pending Physical Receipt' status to confirm receipt.",
      );
    }

    // Update return with receipt confirmation
    const updated = await client.query(
      `UPDATE store_return_notes 
       SET status = 'Received & Restocked', 
           received_qty = $1, 
           received_condition = $2, 
           receipt_remarks = $3,
           received_by = $4,
           received_at = NOW()
       WHERE id = $5 
       RETURNING *`,
      [receivedQty, condition, remarks, req.user.id, id],
    );

    // Now restock the inventory
    const itemRes = await client.query(
      `SELECT default_unit_cost FROM items WHERE id = $1`,
      [note.item_id],
    );
    
    await receiveLot(client, {
      itemId: note.item_id,
      sourceReference: note.ref_no,
      qty: parseFloat(receivedQty),
      unitCost: parseFloat(itemRes.rows[0]?.default_unit_cost || 0),
      type: "Return",
      userId: req.user.id,
    });

    // Update the source issue voucher to track return
    if (note.source_issue_voucher_id) {
      // Check if this is a full return (returned_qty >= original qty)
      const voucherCheck = await client.query(
        `SELECT qty, COALESCE(returned_qty, 0) as current_returned, requisition_id 
         FROM issue_vouchers WHERE id = $1`,
        [note.source_issue_voucher_id],
      );

      if (voucherCheck.rows.length > 0) {
        const voucher = voucherCheck.rows[0];
        const newReturnedQty = parseFloat(voucher.current_returned) + parseFloat(receivedQty);
        const isFullReturn = newReturnedQty >= parseFloat(voucher.qty);

        await client.query(
          `UPDATE issue_vouchers 
           SET returned_qty = COALESCE(returned_qty, 0) + $1,
               net_qty = qty - (COALESCE(returned_qty, 0) + $1),
               has_returns = true,
               status = CASE WHEN (COALESCE(returned_qty, 0) + $1) >= qty 
                             THEN 'Closed - Fully Returned' 
                             ELSE status END,
               return_notes = COALESCE(return_notes, '') || 
                 CASE WHEN return_notes IS NOT NULL AND return_notes != '' 
                      THEN E'\n' ELSE '' END || 
                 $2
           WHERE id = $3`,
          [
            parseFloat(receivedQty),
            `Returned ${receivedQty} units via ${note.ref_no} on ${new Date().toISOString().split('T')[0]}${isFullReturn ? ' - FULL RETURN' : ''}`,
            note.source_issue_voucher_id,
          ],
        );

        // Update the requisition if it exists
        if (voucher.requisition_id) {
          // Check requisition qty for full return determination
          const reqCheck = await client.query(
            `SELECT qty, COALESCE(returned_qty, 0) as current_returned 
             FROM store_requisitions WHERE id = $1`,
            [voucher.requisition_id],
          );

          if (reqCheck.rows.length > 0) {
            const req = reqCheck.rows[0];
            const reqNewReturnedQty = parseFloat(req.current_returned) + parseFloat(receivedQty);
            const reqIsFullReturn = reqNewReturnedQty >= parseFloat(req.qty);

            await client.query(
              `UPDATE store_requisitions 
               SET returned_qty = COALESCE(returned_qty, 0) + $1,
                   net_qty = qty - (COALESCE(returned_qty, 0) + $1),
                   has_returns = true,
                   status = CASE WHEN (COALESCE(returned_qty, 0) + $1) >= qty 
                                 THEN 'Closed - Fully Returned' 
                                 ELSE status END
               WHERE id = $2`,
              [parseFloat(receivedQty), voucher.requisition_id],
            );
          }
        }
      }
    }

    await logAction(client, {
      user: req.user,
      module: "Returns",
      action: `Physically received and restocked ${receivedQty} units from return ${note.ref_no}`,
    });

    await notifyRoles(client, {
      roles: ["Property Administration Officer", "Store Head", "Department Head"],
      title: "Material return completed",
      message: `Return ${note.ref_no} has been physically received and restocked by Stock Clerk.`,
      module: "Returns",
      referenceId: id,
      severity: "Success",
    });

    return updated.rows[0];
  });

  res.json(result);
}

module.exports = { list, create, evaluate, decide, confirmReceipt };
