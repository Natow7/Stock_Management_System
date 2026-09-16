const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { generateRefNo } = require("../utils/refNo");
const { receiveLot } = require("../utils/fifo");
const { ensureBinCard, postBinCardEntry } = require("../utils/binCard");
const { ApiError } = require("../middleware/errorHandler");
const { notifyRoles } = require("../utils/notifications");
const { assignedStoreIds } = require("../utils/scope");

async function list(req, res) {
  const storeIds = await assignedStoreIds(req.user);
  const scope = storeIds ? "WHERE gr.store_id = ANY($1::uuid[])" : "";
  
  const rows = await pool.query(
    `SELECT 
      gr.*,
      s.name AS supplier_name,
      st.name AS store_name,
      -- For single item receipts (backward compatibility)
      i.name AS item_name,
      -- Count of line items
      COALESCE(item_counts.total_items, 0) as total_items,
      COALESCE(item_counts.approved_items, 0) as approved_items,
      COALESCE(item_counts.rejected_items, 0) as rejected_items,
      -- Line items as JSON array
      COALESCE(items_json.items, '[]'::json) as items,
      -- Legacy fields for backward compatibility
      te.decision AS evaluation_decision,
      te.remarks AS evaluation_remarks,
      te.evaluated_at,
      g.grn_number,
      gr.expiry_date,
      -- User names for delegation workflow
      tec_user.name AS tec_evaluated_by_name,
      pro_user.name AS pro_approved_by_name,
      grn_user.name AS grn_generated_by_name,
      verify_user.name AS verified_by_name
    FROM goods_receipts gr
    JOIN suppliers s ON s.id = gr.supplier_id
    JOIN stores st ON st.id = gr.store_id
    LEFT JOIN items i ON i.id = gr.item_id
    LEFT JOIN technical_evaluations te ON te.entity_type = 'goods_receipt' AND te.entity_id = gr.id
    LEFT JOIN grns g ON g.goods_receipt_id = gr.id
    LEFT JOIN users tec_user ON tec_user.id = te.evaluator_id
    LEFT JOIN users pro_user ON pro_user.id = gr.pro_approved_by
    LEFT JOIN users grn_user ON grn_user.id = gr.grn_generated_by
    LEFT JOIN users verify_user ON verify_user.id = gr.verified_by
    LEFT JOIN (
      SELECT 
        receipt_id,
        COUNT(*) as total_items,
        COUNT(CASE WHEN tec_decision = 'Approved' THEN 1 END) as approved_items,
        COUNT(CASE WHEN tec_decision = 'Rejected' THEN 1 END) as rejected_items
      FROM goods_receipt_items
      GROUP BY receipt_id
    ) item_counts ON item_counts.receipt_id = gr.id
    LEFT JOIN (
      SELECT 
        gri.receipt_id,
        json_agg(
          json_build_object(
            'id', gri.id,
            'itemId', gri.item_id,
            'itemName', it.name,
            'itemCode', it.code,
            'qty', gri.qty,
            'unitCost', gri.unit_cost,
            'expiryDate', gri.expiry_date,
            'tecDecision', gri.tec_decision,
            'tecRemarks', gri.tec_remarks,
            'proApproved', gri.pro_approved,
            'grnGenerated', gri.grn_generated,
            'verified', gri.verified
          ) ORDER BY gri.created_at
        ) as items
      FROM goods_receipt_items gri
      JOIN items it ON it.id = gri.item_id
      GROUP BY gri.receipt_id
    ) items_json ON items_json.receipt_id = gr.id
    ${scope}
    ORDER BY gr.created_at DESC`,
    storeIds ? [storeIds] : [],
  );
  
  res.json(rows.rows);
}

async function create(req, res) {
  const {
    supplierId,
    storeId,
    poReference,
    receiptType = "Single Item",
    deliveryDate,
    deliveryNoteNumber,
    deliveryRemarks,
    // Single item mode (backward compatible)
    itemId,
    qty,
    expiryDate,
    // Multi-item mode
    items = [],
  } = req.body;

  // Validation
  if (!supplierId || !storeId) {
    throw new ApiError(400, "supplierId and storeId are required.");
  }

  // Receipt type validation
  if (!["Single Item", "Multi Item", "Donation", "Transfer"].includes(receiptType)) {
    throw new ApiError(
      400,
      "receiptType must be: Single Item, Multi Item, Donation, or Transfer",
    );
  }

  // PO reference required unless it's a donation/transfer
  if (!poReference && !["Donation", "Transfer"].includes(receiptType)) {
    throw new ApiError(
      400,
      "poReference is required for Purchase receipts. Use receiptType='Donation' or 'Transfer' if no PO.",
    );
  }

  // Single item mode validation
  if (receiptType === "Single Item") {
    if (!itemId || !qty) {
      throw new ApiError(
        400,
        "itemId and qty are required for Single Item receipts.",
      );
    }
  }

  // Multi-item mode validation
  if (receiptType === "Multi Item") {
    if (!items || items.length === 0) {
      throw new ApiError(
        400,
        "items array is required and must not be empty for Multi Item receipts.",
      );
    }
    // Validate each item
    for (const item of items) {
      if (!item.itemId || !item.qty) {
        throw new ApiError(
          400,
          "Each item must have itemId and qty fields.",
        );
      }
      if (item.qty <= 0) {
        throw new ApiError(400, "Item quantities must be positive.");
      }
    }
  }

  const result = await withTransaction(async (client) => {
    // Store authorization check
    if (["Store Head", "Stock Clerk"].includes(req.user.role)) {
      const storeScope = await client.query(
        `SELECT 1 FROM stores WHERE id = $1 AND (head_user_id = $2 OR id = (SELECT store_id FROM users WHERE id = $2))`,
        [storeId, req.user.id],
      );
      if (!storeScope.rows.length) {
        const userStore = await client.query(
          `SELECT store_id FROM users WHERE id = $1`,
          [req.user.id],
        );
        if (
          userStore.rows[0]?.store_id &&
          userStore.rows[0]?.store_id !== storeId
        ) {
          throw new ApiError(
            403,
            "You are not assigned to the receiving store.",
          );
        }
      }
    }

    const refNo = generateRefNo("GR");

    // Create receipt header
    const insertedReceipt = await client.query(
      `INSERT INTO goods_receipts (
        ref_no, supplier_id, store_id, po_reference, 
        receipt_type, delivery_date, delivery_note_number, delivery_remarks,
        item_id, qty, expiry_date, recorded_by, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Awaiting Evaluation')
      RETURNING *`,
      [
        refNo,
        supplierId,
        storeId,
        poReference || null,
        receiptType,
        deliveryDate || new Date().toISOString().split("T")[0],
        deliveryNoteNumber || null,
        deliveryRemarks || null,
        // For single item mode, store in header for backward compatibility
        receiptType === "Single Item" ? itemId : null,
        receiptType === "Single Item" ? qty : null,
        receiptType === "Single Item" ? (expiryDate || null) : null,
        req.user.id,
      ],
    );

    const receipt = insertedReceipt.rows[0];

    // Create line items
    if (receiptType === "Single Item") {
      // Single item: create one line item
      await client.query(
        `INSERT INTO goods_receipt_items (
          receipt_id, item_id, qty, expiry_date
        ) VALUES ($1, $2, $3, $4)`,
        [receipt.id, itemId, qty, expiryDate || null],
      );
    } else if (receiptType === "Multi Item") {
      // Multi-item: create multiple line items
      for (const item of items) {
        await client.query(
          `INSERT INTO goods_receipt_items (
            receipt_id, item_id, qty, unit_cost, expiry_date
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            receipt.id,
            item.itemId,
            item.qty,
            item.unitCost || null,
            item.expiryDate || null,
          ],
        );
      }
    }

    // Get full receipt with items for response
    const fullReceipt = await client.query(
      `SELECT 
        gr.*,
        json_agg(
          json_build_object(
            'id', gri.id,
            'itemId', gri.item_id,
            'qty', gri.qty,
            'unitCost', gri.unit_cost,
            'expiryDate', gri.expiry_date
          ) ORDER BY gri.created_at
        ) as items
      FROM goods_receipts gr
      LEFT JOIN goods_receipt_items gri ON gr.id = gri.receipt_id
      WHERE gr.id = $1
      GROUP BY gr.id`,
      [receipt.id],
    );

    await logAction(client, {
      user: req.user,
      module: "Goods Receipt",
      action: `Recorded ${receiptType} goods receipt ${refNo} (${receiptType === "Single Item" ? "1 item" : items.length + " items"}), pending TEC evaluation`,
    });

    await notifyRoles(client, {
      roles: ["Technical Evaluation Committee"],
      title: "Goods receipt awaiting evaluation",
      message: `Receipt ${refNo} (${receiptType}) is ready for technical inspection.`,
      module: "Goods Receipt",
      referenceId: receipt.id,
    });

    return fullReceipt.rows[0];
  });

  res.status(201).json(result);
}

async function evaluate(req, res) {
  const { id } = req.params;
  const { decision, remarks, itemDecisions } = req.body;

  console.log('=== EVALUATE START ===');
  console.log('Receipt ID:', id);
  console.log('Decision:', decision);
  console.log('Remarks:', remarks);
  console.log('ItemDecisions:', itemDecisions);
  console.log('User:', req.user?.id, req.user?.email);

  try {
    // Validate input
    if (itemDecisions) {
      // Multi-item mode: per-item decisions
      if (!Array.isArray(itemDecisions) || itemDecisions.length === 0) {
        throw new ApiError(400, "itemDecisions must be a non-empty array for multi-item receipts.");
      }
      for (const itemDec of itemDecisions) {
        if (!itemDec.itemId || !["Approved", "Rejected"].includes(itemDec.decision)) {
          throw new ApiError(400, "Each item must have itemId and decision (Approved/Rejected).");
        }
      }
    } else {
      // Single-item mode: overall decision
      if (!["Approved", "Rejected"].includes(decision)) {
        throw new ApiError(400, "decision must be 'Approved' or 'Rejected'.");
      }
    }

  const result = await withTransaction(async (client) => {
    // Lock receipt first (no GROUP BY with FOR UPDATE)
    const lockQuery = await client.query(
      `SELECT * FROM goods_receipts WHERE id = $1 FOR UPDATE`,
      [id],
    );
    
    if (lockQuery.rows.length === 0) {
      throw new ApiError(404, "Goods receipt not found.");
    }
    
    const receipt = lockQuery.rows[0];
    
    // Then get items separately
    const itemsQuery = await client.query(
      `SELECT 
        gri.id,
        gri.item_id as "itemId",
        i.name as "itemName",
        gri.qty
      FROM goods_receipt_items gri
      JOIN items i ON i.id = gri.item_id
      WHERE gri.receipt_id = $1
      ORDER BY gri.created_at`,
      [id],
    );
    
    const receiptItems = itemsQuery.rows;
    
    if (receipt.status !== "Awaiting Evaluation") {
      throw new ApiError(
        400,
        `Receipt is '${receipt.status}' and cannot be re-evaluated.`,
      );
    }

    let newStatus;
    let approvedCount = 0;
    let rejectedCount = 0;
    let totalItems = 0;

    if (receipt.receipt_type === "Multi Item" && itemDecisions) {
      // Validate all item IDs exist in this receipt (efficiency boost #2)
      const itemIds = receiptItems.map(item => item.itemId);
      const requestedIds = itemDecisions.map(dec => dec.itemId);
      const invalidIds = requestedIds.filter(rid => !itemIds.includes(rid));
      
      if (invalidIds.length > 0) {
        throw new ApiError(400, `Invalid item IDs: ${invalidIds.join(', ')} not found in this receipt.`);
      }

      if (requestedIds.length !== receiptItems.length) {
        throw new ApiError(400, `Must evaluate all ${receiptItems.length} items in this receipt. Only ${requestedIds.length} provided.`);
      }

      totalItems = itemDecisions.length;

      // Count decisions efficiently (efficiency boost #3)
      approvedCount = itemDecisions.filter(d => d.decision === "Approved").length;
      rejectedCount = itemDecisions.filter(d => d.decision === "Rejected").length;

      // BULK UPDATE using UNNEST for efficiency (efficiency boost #4 - THE BIG ONE)
      // This replaces N individual queries with ONE bulk operation
      const itemIds_arr = itemDecisions.map(d => d.itemId);
      const decisions_arr = itemDecisions.map(d => d.decision);
      const remarks_arr = itemDecisions.map(d => d.remarks || null);
      
      await client.query(
        `UPDATE goods_receipt_items gri
         SET tec_decision = updates.decision,
             tec_remarks = updates.remarks,
             tec_evaluated_at = NOW(),
             tec_evaluated_by = $1
         FROM (
           SELECT 
             unnest($2::uuid[]) as item_id,
             unnest($3::text[]) as decision,
             unnest($4::text[]) as remarks
         ) AS updates
         WHERE gri.receipt_id = $5 
           AND gri.item_id = updates.item_id`,
        [req.user.id, itemIds_arr, decisions_arr, remarks_arr, id],
      );

      // Determine overall receipt status
      if (approvedCount === totalItems) {
        newStatus = "Awaiting PRO Approval"; // All approved
      } else if (rejectedCount === totalItems) {
        newStatus = "Rejected"; // All rejected
      } else {
        newStatus = "Partially Approved"; // Mixed results
      }

      // Log multi-item evaluation
      await logAction(client, {
        user: req.user,
        module: "Technical Evaluation",
        action: `Evaluated multi-item receipt ${receipt.ref_no}: ${approvedCount} approved, ${rejectedCount} rejected out of ${totalItems} items`,
      });
    } else {
      // Single-item evaluation (backward compatible)
      await client.query(
        `INSERT INTO technical_evaluations (entity_type, entity_id, evaluator_id, decision, remarks)
         VALUES ('goods_receipt', $1, $2, $3, $4)`,
        [id, req.user.id, decision, remarks || null],
      );

      // Update line item if exists (single query)
      await client.query(
        `UPDATE goods_receipt_items 
         SET tec_decision = $1,
             tec_remarks = $2,
             tec_evaluated_at = NOW(),
             tec_evaluated_by = $3
         WHERE receipt_id = $4`,
        [decision, remarks || null, req.user.id, id],
      );

      newStatus = decision === "Approved" ? "Awaiting PRO Approval" : "Rejected";

      await logAction(client, {
        user: req.user,
        module: "Technical Evaluation",
        action: `${decision} technical evaluation for ${receipt.ref_no}`,
      });
    }

    // Update receipt status and get final result
    await client.query(
      `UPDATE goods_receipts SET status = $1 WHERE id = $2`,
      [newStatus, id],
    );

    // Get updated receipt with items
    const finalReceipt = await client.query(
      `SELECT 
        gr.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', gri.id,
              'itemId', gri.item_id,
              'itemName', i.name,
              'qty', gri.qty,
              'tecDecision', gri.tec_decision,
              'tecRemarks', gri.tec_remarks,
              'tecEvaluatedAt', gri.tec_evaluated_at
            ) ORDER BY gri.created_at
          ) FILTER (WHERE gri.id IS NOT NULL),
          '[]'::json
        ) as items
      FROM goods_receipts gr
      LEFT JOIN goods_receipt_items gri ON gr.id = gri.receipt_id
      LEFT JOIN items i ON i.id = gri.item_id
      WHERE gr.id = $1
      GROUP BY gr.id`,
      [id],
    );

    // Notifications (efficiency boost #6 - compute message once)
    const notificationConfig = {
      "Awaiting PRO Approval": {
        roles: ["Property Registration Officer"],
        title: "Goods Receipt Approved by TEC - Awaiting PRO Approval",
        message: `Receipt ${receipt.ref_no} was approved by TEC. Please review and approve for GRN generation.`,
        severity: "Success"
      },
      "Rejected": {
        roles: ["Property Administration Officer", "Store Head", "Administrator"],
        title: "Goods Receipt Rejected by TEC",
        message: `Receipt ${receipt.ref_no} was rejected by the Technical Evaluation Committee.`,
        severity: "Warning"
      },
      "Partially Approved": {
        roles: ["Property Registration Officer", "Store Head"],
        title: "Goods Receipt Partially Approved by TEC",
        message: `Receipt ${receipt.ref_no}: ${approvedCount} items approved, ${rejectedCount} rejected. PRO review required.`,
        severity: "Success"
      }
    };

    const config = notificationConfig[newStatus];
    await notifyRoles(client, {
      roles: config.roles,
      title: config.title,
      message: config.message,
      module: "Goods Receipt",
      referenceId: id,
      severity: config.severity,
    });

    console.log('Transaction completed successfully');
    return finalReceipt.rows[0];
  });

  console.log('=== EVALUATE SUCCESS ===');
  res.json(result);
  } catch (error) {
    console.error('=== EVALUATE ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// ============================================================================
// NEW DELEGATION WORKFLOW (Phase 2: Segregation of Duties)
// ============================================================================

/**
 * STEP 1: PRO Approval
 * PRO reviews TEC-approved receipt and approves for GRN generation
 * Authorization: Property Registration Officer only
 */
async function approveForGRN(req, res) {
  const { id } = req.params;
  const { approvalNotes, grnNumber, unitCost } = req.body;

  // Validate: Must be PRO
  if (req.user.role !== "Property Registration Officer") {
    throw new ApiError(
      403,
      "Only the Property Registration Officer can approve receipts for GRN generation.",
    );
  }

  const result = await withTransaction(async (client) => {
    // Get current receipt
    const current = await client.query(
      `SELECT gr.*, i.name AS item_name, i.default_unit_cost 
       FROM goods_receipts gr
       JOIN items i ON i.id = gr.item_id
       WHERE gr.id = $1 FOR UPDATE`,
      [id],
    );

    if (current.rows.length === 0) {
      throw new ApiError(404, "Goods receipt not found.");
    }

    const receipt = current.rows[0];

    // Validate: Must be awaiting PRO approval
    if (receipt.status !== "Awaiting PRO Approval") {
      throw new ApiError(
        400,
        `Receipt is '${receipt.status}'. Can only approve receipts that are 'Awaiting PRO Approval' (TEC-approved).`,
      );
    }

    // Generate GRN number if not provided
    const finalGrnNumber = grnNumber || `GRN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Resolve unit cost
    const finalUnitCost = unitCost || receipt.default_unit_cost || 0;

    // Update receipt: Set PRO approval
    await client.query(
      `UPDATE goods_receipts 
       SET status = 'PRO Approved',
           pro_approved_by = $1,
           pro_approved_at = now(),
           pro_approval_notes = $2
       WHERE id = $3`,
      [req.user.id, approvalNotes || `Approved for GRN generation: ${finalGrnNumber}`, id],
    );

    // Create GRN record (pre-assigned number)
    await client.query(
      `INSERT INTO grns (goods_receipt_id, grn_number, generated_by)
       VALUES ($1, $2, $3)`,
      [id, finalGrnNumber, req.user.id],
    );

    // Log action
    await logAction(client, {
      user: req.user,
      module: "Goods Receipt",
      action: `Approved receipt ${receipt.ref_no} for GRN generation (${finalGrnNumber})`,
    });

    // Notify Stock Clerks to generate GRN
    await notifyRoles(client, {
      roles: ["Stock Clerk"],
      title: "GRN Generation Task Assigned",
      message: `Receipt ${receipt.ref_no} has been approved by PRO. Please generate GRN ${finalGrnNumber} and update stock records.`,
      module: "Goods Receipt",
      referenceId: id,
      severity: "Info",
    });

    return {
      receiptId: id,
      refNo: receipt.ref_no,
      grnNumber: finalGrnNumber,
      unitCost: finalUnitCost,
      status: "PRO Approved",
      message: "Approved for GRN generation. Awaiting Stock Clerk execution.",
    };
  });

  res.json(result);
}

/**
 * STEP 2: Stock Clerk GRN Generation (Execution)
 * Stock Clerk executes the GRN generation: creates FIFO lot, bin card, updates stock
 * Authorization: Stock Clerk only
 */
async function executeGRN(req, res) {
  const { id } = req.params;
  const { unitCost, bin, executionNotes } = req.body;

  // Validate: Must be Stock Clerk
  if (req.user.role !== "Stock Clerk") {
    throw new ApiError(
      403,
      "Only Stock Clerks can execute GRN generation.",
    );
  }

  const result = await withTransaction(async (client) => {
    // Get current receipt (lock it first)
    const current = await client.query(
      `SELECT gr.*, i.name AS item_name, i.default_unit_cost
       FROM goods_receipts gr
       JOIN items i ON i.id = gr.item_id
       WHERE gr.id = $1 FOR UPDATE`,
      [id],
    );

    if (current.rows.length === 0) {
      throw new ApiError(404, "Goods receipt not found.");
    }

    const receipt = current.rows[0];

    // Validate: Must have PRO approval
    if (receipt.status !== "PRO Approved") {
      throw new ApiError(
        400,
        `Receipt is '${receipt.status}'. Can only execute GRN for PRO-approved receipts.`,
      );
    }

    // Get GRN number
    const grnResult = await client.query(
      `SELECT grn_number FROM grns WHERE goods_receipt_id = $1`,
      [id],
    );

    if (grnResult.rows.length === 0 || !grnResult.rows[0].grn_number) {
      throw new ApiError(400, "No GRN number assigned. PRO must approve first.");
    }

    const grnNumber = grnResult.rows[0].grn_number;

    // Resolve unit cost
    const finalUnitCost = unitCost || receipt.default_unit_cost || 0;

    // 1. Create FIFO cost lot
    await receiveLot(client, {
      itemId: receipt.item_id,
      sourceReference: grnNumber,
      qty: parseFloat(receipt.qty),
      unitCost: finalUnitCost,
      expiryDate: receipt.expiry_date,
      userId: req.user.id,
    });

    // 2. Create/update bin card entry
    const targetBin = (bin && typeof bin === "string" && bin.trim()) ? bin.trim() : "RECEIVING";
    const binCardId = await ensureBinCard(client, {
      storeId: receipt.store_id,
      bin: targetBin,
      itemId: receipt.item_id,
    });
    await postBinCardEntry(client, {
      binCardId,
      direction: "Inbound",
      reference: grnNumber,
      qty: parseFloat(receipt.qty),
    });

    // 3. Update item location
    await client.query(
      `INSERT INTO item_locations (item_id, store_id, bin, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (item_id, store_id) DO UPDATE SET bin = EXCLUDED.bin, updated_at = now()`,
      [receipt.item_id, receipt.store_id, targetBin],
    );

    // 4. Update goods_receipt: Set clerk execution
    await client.query(
      `UPDATE goods_receipts 
       SET status = 'Awaiting Store Head Verification',
           grn_generated_by = $1,
           grn_generated_at = now()
       WHERE id = $2`,
      [req.user.id, id],
    );

    // Log action with delegation context
    await logAction(client, {
      user: req.user,
      module: "Goods Receipt",
      action: `Executed GRN generation ${receipt.grn_number} for ${receipt.ref_no}. FIFO lot created, bin card updated, stock adjusted.`,
    });

    // Notify Store Head for verification
    await notifyRoles(client, {
      roles: ["Store Head"],
      title: "GRN Generated - Awaiting Physical Verification",
      message: `GRN ${receipt.grn_number} (Receipt ${receipt.ref_no}) has been generated. Please verify physical stock matches the GRN.`,
      module: "Goods Receipt",
      referenceId: id,
      severity: "Info",
    });

    return {
      receiptId: id,
      refNo: receipt.ref_no,
      grnNumber: receipt.grn_number,
      bin: targetBin,
      status: "Awaiting Store Head Verification",
      message: "GRN generated successfully. Stock updated. Awaiting Store Head verification.",
    };
  });

  res.json(result);
}

/**
 * STEP 3: Store Head Physical Verification
 * Store Head verifies physical stock matches GRN
 * Authorization: Store Head only
 */
async function verifyPhysicalStock(req, res) {
  const { id } = req.params;
  const { physicalCountConfirmed, verificationNotes, discrepancies } = req.body;

  // Validate: Must be Store Head
  if (req.user.role !== "Store Head") {
    throw new ApiError(
      403,
      "Only Store Heads can verify physical stock.",
    );
  }

  // Validate: Must confirm physical count
  if (!physicalCountConfirmed) {
    throw new ApiError(
      400,
      "Must confirm physical count matches GRN quantity.",
    );
  }

  const result = await withTransaction(async (client) => {
    // Get current receipt (lock it first)
    const current = await client.query(
      `SELECT gr.*, i.name AS item_name
       FROM goods_receipts gr
       JOIN items i ON i.id = gr.item_id
       WHERE gr.id = $1 FOR UPDATE`,
      [id],
    );

    if (current.rows.length === 0) {
      throw new ApiError(404, "Goods receipt not found.");
    }

    const receipt = current.rows[0];

    // Validate: Must be awaiting verification
    if (receipt.status !== "Awaiting Store Head Verification") {
      throw new ApiError(
        400,
        `Receipt is '${receipt.status}'. Can only verify receipts that are 'Awaiting Store Head Verification'.`,
      );
    }

    // Get GRN number
    const grnResult = await client.query(
      `SELECT grn_number FROM grns WHERE goods_receipt_id = $1`,
      [id],
    );
    const grnNumber = grnResult.rows[0]?.grn_number || "N/A";

    // Update receipt: Set verification
    await client.query(
      `UPDATE goods_receipts 
       SET status = 'Verified',
           verified_by = $1,
           verified_at = now(),
           verification_notes = $2
       WHERE id = $3`,
      [
        req.user.id,
        verificationNotes || `Physical stock verified. ${discrepancies ? `Discrepancies noted: ${discrepancies}` : "No discrepancies."}`,
        id,
      ],
    );

    // Log action with delegation context
    await logAction(client, {
      user: req.user,
      module: "Goods Receipt",
      action: `Verified physical stock for GRN ${grnNumber} (Receipt ${receipt.ref_no}). Physical count matches.`,
    });

    // Notify PRO and PAO of completion
    await notifyRoles(client, {
      roles: ["Property Registration Officer", "Property Administration Officer"],
      title: "GRN Finalized - Physical Stock Verified",
      message: `GRN ${grnNumber} (Receipt ${receipt.ref_no}) has been verified by Store Head. Workflow complete.`,
      module: "Goods Receipt",
      referenceId: id,
      severity: "Success",
    });

    return {
      receiptId: id,
      refNo: receipt.ref_no,
      grnNumber: grnNumber,
      status: "Verified",
      message: "Physical stock verified successfully. GRN workflow complete.",
    };
  });

  res.json(result);
}

// ============================================================================
// OLD WORKFLOW (Deprecated - kept for backward compatibility)
// Will be removed after full migration to delegation workflow
// ============================================================================

async function generateGrn(req, res) {
  const { id } = req.params;
  const { unitCost, bin } = req.body || {};
  if (req.user.role !== "Property Registration Officer") {
    throw new ApiError(
      403,
      "Only the Property Registration Officer can generate an official GRN.",
    );
  }

  const result = await withTransaction(async (client) => {
    const current = await client.query(
      `SELECT * FROM goods_receipts WHERE id = $1 FOR UPDATE`,
      [id],
    );
    if (current.rows.length === 0)
      throw new ApiError(404, "Goods receipt not found.");
    const receipt = current.rows[0];
    if (receipt.status !== "Approved") {
      throw new ApiError(
        400,
        "GRN can only be generated for a receipt that TEC has Approved.",
      );
    }

    const grnNumber = `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await client.query(
      `INSERT INTO grns (goods_receipt_id, grn_number, generated_by) VALUES ($1, $2, $3)`,
      [id, grnNumber, req.user.id],
    );
    await client.query(
      `UPDATE goods_receipts SET status = 'GRN Generated' WHERE id = $1`,
      [id],
    );

    // Resolve unit cost: explicit override, else the item's default cost.
    let cost = Number(unitCost);
    if (!cost || isNaN(cost)) {
      const itemRes = await client.query(
        `SELECT default_unit_cost FROM items WHERE id = $1`,
        [receipt.item_id],
      );
      cost = parseFloat(itemRes.rows[0]?.default_unit_cost || 0);
    }

    await receiveLot(client, {
      itemId: receipt.item_id,
      sourceReference: grnNumber,
      qty: parseFloat(receipt.qty),
      unitCost: cost,
      expiryDate: receipt.expiry_date,
      userId: req.user.id,
    });

    const targetBin =
      bin && typeof bin === "string" && bin.trim() ? bin.trim() : "RECEIVING";
    const binCardId = await ensureBinCard(client, {
      storeId: receipt.store_id,
      bin: targetBin,
      itemId: receipt.item_id,
    });
    await postBinCardEntry(client, {
      binCardId,
      direction: "Inbound",
      reference: grnNumber,
      qty: parseFloat(receipt.qty),
    });

    await client.query(
      `INSERT INTO item_locations (item_id, store_id, bin, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (item_id, store_id) DO UPDATE SET bin = EXCLUDED.bin, updated_at = now()`,
      [receipt.item_id, receipt.store_id, targetBin],
    );

    await logAction(client, {
      user: req.user,
      module: "Goods Receipt",
      action: `Generated GRN ${grnNumber} for ${receipt.ref_no}`,
    });
    await notifyRoles(client, {
      roles: ["Store Head", "Property Administration Officer"],
      title: "GRN generated",
      message: `${grnNumber} was generated and stock was updated.`,
      module: "Goods Receipt",
      referenceId: id,
      severity: "Success",
    });

    return { grnNumber, receiptId: id };
  });

  res.json(result);
}

module.exports = { 
  list, 
  create, 
  evaluate, 
  approveForGRN,      // NEW: PRO approval
  executeGRN,         // NEW: Stock Clerk execution
  verifyPhysicalStock, // NEW: Store Head verification
  generateGrn         // OLD: Deprecated, kept for compatibility
};
