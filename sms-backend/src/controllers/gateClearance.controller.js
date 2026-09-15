/**
 * Gate Clearance Requests Controller
 * 
 * Pre-approval workflow: Store Head requests Security Officer approval BEFORE finalizing voucher
 * 
 * Flow:
 * 1. Store Head creates clearance request with collector details and schedule
 * 2. Security Officer reviews and approves/rejects
 * 3. Store Head can only finalize voucher if clearance is approved
 * 4. Security Officer verifies collection at gate
 */

const { pool } = require('../config/db');
const { notifyUser } = require('../utils/notifications');

/**
 * POST /api/gate-clearance-requests
 * Create a new gate clearance request (Store Head)
 */
async function createClearanceRequest(req, res) {
  const client = await pool.connect();
  
  try {
    const {
      issue_voucher_id,
      collector_name,
      collector_id_number,
      collector_phone,
      collector_department,
      vehicle_registration,
      scheduled_pickup_date,
      scheduled_pickup_time,
      pickup_justification,
    } = req.body;
    
    const user = req.user;
    
    // Validate required fields
    if (!issue_voucher_id || !collector_name || !collector_id_number || 
        !collector_phone || !scheduled_pickup_date || !scheduled_pickup_time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: issue_voucher_id, collector details, and scheduled pickup date/time are required',
      });
    }
    
    await client.query('BEGIN');
    
    // Check if voucher exists and is in correct state
    const voucherCheck = await client.query(
      `SELECT id, ref_no, status, store_id, gate_clearance_requested, gate_clearance_approved
       FROM issue_vouchers 
       WHERE id = $1`,
      [issue_voucher_id]
    );
    
    if (voucherCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Issue voucher not found',
      });
    }
    
    const voucher = voucherCheck.rows[0];
    
    // SUPPORT BOTH WORKFLOWS:
    // - NEW: Gate clearance during Preliminary stage (recommended)
    // - OLD: Gate clearance during Approved stage (for backward compatibility)
    if (voucher.status !== 'Preliminary' && voucher.status !== 'Approved') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot request clearance for voucher with status: ${voucher.status}. Gate clearance can be requested during Preliminary or Approved stage.`,
      });
    }
    
    // Check if clearance already requested
    if (voucher.gate_clearance_requested && voucher.gate_clearance_approved) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Gate clearance already approved for this voucher',
      });
    }
    
    // Check if pending clearance request exists
    const existingRequest = await client.query(
      `SELECT id, status FROM gate_clearance_requests
       WHERE issue_voucher_id = $1 AND status IN ('Pending', 'Approved')`,
      [issue_voucher_id]
    );
    
    if (existingRequest.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Active clearance request already exists with status: ${existingRequest.rows[0].status}`,
      });
    }
    
    // Validate scheduled date is in the future
    const scheduledDateTime = new Date(`${scheduled_pickup_date}T${scheduled_pickup_time}`);
    if (scheduledDateTime < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Scheduled pickup date/time must be in the future',
      });
    }
    
    // Create clearance request
    const insertResult = await client.query(
      `INSERT INTO gate_clearance_requests (
        issue_voucher_id,
        requested_by,
        collector_name,
        collector_id_number,
        collector_phone,
        collector_department,
        vehicle_registration,
        scheduled_pickup_date,
        scheduled_pickup_time,
        pickup_justification,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending')
      RETURNING *`,
      [
        issue_voucher_id,
        user.id,
        collector_name,
        collector_id_number,
        collector_phone,
        collector_department || null,
        vehicle_registration || null,
        scheduled_pickup_date,
        scheduled_pickup_time,
        pickup_justification || null,
      ]
    );
    
    const clearanceRequest = insertResult.rows[0];
    
    // Update issue voucher
    await client.query(
      `UPDATE issue_vouchers 
       SET gate_clearance_requested = true,
           gate_clearance_request_id = $1
       WHERE id = $2`,
      [clearanceRequest.id, issue_voucher_id]
    );
    
    // Audit log - TODO: Fix audit_logs table structure
    // await client.query(
    //   `INSERT INTO audit_logs (user_id, action, module)
    //    VALUES ($1, $2, $3)`,
    //   [user.id, 'create_gate_clearance_request', 'gate_clearance']
    // );
    
    await client.query('COMMIT');
    
    // Notify Security Officer(s)
    const securityOfficers = await client.query(
      `SELECT id FROM users WHERE role IN ('Security Officer', 'Campus Security Officer') AND status = 'Active'`
    );
    
    for (const officer of securityOfficers.rows) {
      await notifyUser(
        officer.id,
        `New gate clearance request for voucher ${voucher.ref_no}`,
        `${collector_name} scheduled for pickup on ${scheduled_pickup_date} at ${scheduled_pickup_time}`,
        'gate_clearance_request',
        clearanceRequest.id
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Gate clearance request created successfully',
      data: {
        clearance_request: clearanceRequest,
        voucher_ref: voucher.ref_no,
      },
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating clearance request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gate clearance request',
      error: error.message,
    });
  } finally {
    client.release();
  }
}

/**
 * GET /api/gate-clearance-requests
 * List gate clearance requests (with filters)
 */
async function listClearanceRequests(req, res) {
  try {
    const { status, store_id, from_date, to_date } = req.query;
    const user = req.user;
    
    console.log("🔵 [GATE CLEARANCE LIST] User:", user.name, "Role:", user.role);
    
    let query = `
      SELECT 
        gcr.*,
        iv.ref_no AS voucher_ref,
        iv.status AS voucher_status,
        iv.model AS voucher_model,
        s.name AS store_name,
        u_req.name AS requested_by_name,
        u_req.email AS requested_by_email,
        u_app.name AS approved_by_name,
        u_rej.name AS rejected_by_name,
        gc.cleared_at,
        gc_user.name AS cleared_by_name,
        EXTRACT(EPOCH FROM (gcr.scheduled_pickup_date + gcr.scheduled_pickup_time - now())) / 3600 AS hours_until_pickup
      FROM gate_clearance_requests gcr
      JOIN issue_vouchers iv ON gcr.issue_voucher_id = iv.id
      JOIN stores s ON iv.store_id = s.id
      JOIN users u_req ON gcr.requested_by = u_req.id
      LEFT JOIN users u_app ON gcr.approved_by = u_app.id
      LEFT JOIN users u_rej ON gcr.rejected_by = u_rej.id
      LEFT JOIN gate_clearances gc ON gc.issue_voucher_id = iv.id
      LEFT JOIN users gc_user ON gc_user.id = gc.cleared_by
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    // Role-based filtering
    if (user.role === 'Store Head') {
      // Store Heads see only their store's requests (stores where they are head)
      query += ` AND s.head_user_id = $${paramIndex}`;
      params.push(user.id);
      paramIndex++;
    }
    // Security Officers and Administrators see all requests (no additional filter)
    
    // Status filter
    if (status) {
      query += ` AND gcr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    // Store filter
    if (store_id) {
      query += ` AND iv.store_id = $${paramIndex}`;
      params.push(store_id);
      paramIndex++;
    }
    
    // Date range filter
    if (from_date) {
      query += ` AND gcr.scheduled_pickup_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }
    
    if (to_date) {
      query += ` AND gcr.scheduled_pickup_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }
    
    query += ` 
      ORDER BY 
        CASE gcr.status
          WHEN 'Pending' THEN 1
          WHEN 'Approved' THEN 2
          ELSE 3
        END,
        gcr.scheduled_pickup_date,
        gcr.scheduled_pickup_time
    `;
    
    const result = await pool.query(query, params);
    
    console.log("🔵 [GATE CLEARANCE LIST] Found", result.rows.length, "requests");
    
    res.json({
      success: true,
      data: {
        clearance_requests: result.rows,
        total: result.rows.length,
      },
    });
    
  } catch (error) {
    console.error('Error listing clearance requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve clearance requests',
      error: error.message,
    });
  }
}

/**
 * GET /api/gate-clearance-requests/:id
 * Get single clearance request details
 */
async function getClearanceRequest(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        gcr.*,
        iv.ref_no AS voucher_ref,
        iv.status AS voucher_status,
        s.name AS store_name,
        u_req.name AS requested_by_name,
        u_req.email AS requested_by_email,
        u_app.name AS approved_by_name,
        u_rej.name AS rejected_by_name
      FROM gate_clearance_requests gcr
      JOIN issue_vouchers iv ON gcr.issue_voucher_id = iv.id
      JOIN stores s ON iv.store_id = s.id
      JOIN users u_req ON gcr.requested_by = u_req.id
      LEFT JOIN users u_app ON gcr.approved_by = u_app.id
      LEFT JOIN users u_rej ON gcr.rejected_by = u_rej.id
      WHERE gcr.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Clearance request not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        clearance_request: result.rows[0],
      },
    });
    
  } catch (error) {
    console.error('Error getting clearance request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve clearance request',
      error: error.message,
    });
  }
}

/**
 * POST /api/gate-clearance-requests/:id/approve
 * Approve a clearance request (Security Officer)
 */
async function approveClearanceRequest(req, res) {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { security_notes } = req.body;
    const user = req.user;
    
    // Only Security Officers can approve
    const allowedRoles = ['Security Officer', 'Campus Security Officer'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only Security Officers can approve gate clearance requests',
      });
    }
    
    await client.query('BEGIN');
    
    // Get clearance request
    const requestResult = await client.query(
      `SELECT gcr.*, iv.ref_no, iv.store_id
       FROM gate_clearance_requests gcr
       JOIN issue_vouchers iv ON gcr.issue_voucher_id = iv.id
       WHERE gcr.id = $1`,
      [id]
    );
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Clearance request not found',
      });
    }
    
    const request = requestResult.rows[0];
    
    if (request.status !== 'Pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with status: ${request.status}`,
      });
    }
    
    // Update clearance request to Approved
    await client.query(
      `UPDATE gate_clearance_requests
       SET status = 'Approved',
           approved_by = $1,
           approved_at = now(),
           security_notes = $2,
           updated_at = now()
       WHERE id = $3`,
      [user.id, security_notes || null, id]
    );
    
    // Update issue voucher
    await client.query(
      `UPDATE issue_vouchers
       SET gate_clearance_approved = true
       WHERE id = $1`,
      [request.issue_voucher_id]
    );
    
    // Audit log - TODO: Fix audit_logs table structure
    // await client.query(
    //   `INSERT INTO audit_logs (user_id, action, module)
    //    VALUES ($1, $2, $3)`,
    //   [user.id, 'approve_gate_clearance', 'gate_clearance']
    // );
    
    await client.query('COMMIT');
    
    // Notify Store Head
    await notifyUser(
      request.requested_by,
      `Gate clearance approved for voucher ${request.ref_no}`,
      `Collector ${request.collector_name} approved for pickup on ${request.scheduled_pickup_date}. You can now finalize the voucher.`,
      'gate_clearance_approved',
      id
    );
    
    res.json({
      success: true,
      message: 'Gate clearance request approved successfully',
      data: {
        clearance_request_id: id,
        voucher_ref: request.ref_no,
      },
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving clearance request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve gate clearance request',
      error: error.message,
    });
  } finally {
    client.release();
  }
}

/**
 * POST /api/gate-clearance-requests/:id/reject
 * Reject a clearance request (Security Officer)
 */
async function rejectClearanceRequest(req, res) {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { rejection_reason, security_notes } = req.body;
    const user = req.user;
    
    // Only Security Officers can reject
    const allowedRoles = ['Security Officer', 'Campus Security Officer'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only Security Officers can reject gate clearance requests',
      });
    }
    
    if (!rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }
    
    await client.query('BEGIN');
    
    // Get clearance request
    const requestResult = await client.query(
      `SELECT gcr.*, iv.ref_no
       FROM gate_clearance_requests gcr
       JOIN issue_vouchers iv ON gcr.issue_voucher_id = iv.id
       WHERE gcr.id = $1`,
      [id]
    );
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Clearance request not found',
      });
    }
    
    const request = requestResult.rows[0];
    
    if (request.status !== 'Pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status: ${request.status}`,
      });
    }
    
    // Update clearance request to Rejected
    await client.query(
      `UPDATE gate_clearance_requests
       SET status = 'Rejected',
           rejected_by = $1,
           rejected_at = now(),
           rejection_reason = $2,
           security_notes = $3,
           updated_at = now()
       WHERE id = $4`,
      [user.id, rejection_reason, security_notes || null, id]
    );
    
    // Update issue voucher (clearance NOT approved)
    await client.query(
      `UPDATE issue_vouchers
       SET gate_clearance_approved = false
       WHERE id = $1`,
      [request.issue_voucher_id]
    );
    
    // Audit log - TODO: Fix audit_logs table structure
    // await client.query(
    //   `INSERT INTO audit_logs (user_id, action, module)
    //    VALUES ($1, $2, $3)`,
    //   [user.id, 'reject_gate_clearance', 'gate_clearance']
    // );
    
    await client.query('COMMIT');
    
    // Notify Store Head
    await notifyUser(
      request.requested_by,
      `Gate clearance rejected for voucher ${request.ref_no}`,
      `Reason: ${rejection_reason}. Please revise and submit a new request.`,
      'gate_clearance_rejected',
      id
    );
    
    res.json({
      success: true,
      message: 'Gate clearance request rejected',
      data: {
        clearance_request_id: id,
        voucher_ref: request.ref_no,
        rejection_reason,
      },
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting clearance request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject gate clearance request',
      error: error.message,
    });
  } finally {
    client.release();
  }
}

/**
 * POST /api/gate-clearance-requests/:id/cancel
 * Cancel a clearance request (Store Head - before approval)
 */
async function cancelClearanceRequest(req, res) {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const user = req.user;
    
    await client.query('BEGIN');
    
    // Get clearance request
    const requestResult = await client.query(
      `SELECT gcr.*, iv.ref_no
       FROM gate_clearance_requests gcr
       JOIN issue_vouchers iv ON gcr.issue_voucher_id = iv.id
       WHERE gcr.id = $1 AND gcr.requested_by = $2`,
      [id, user.id]
    );
    
    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Clearance request not found or you do not have permission to cancel it',
      });
    }
    
    const request = requestResult.rows[0];
    
    if (request.status !== 'Pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cannot cancel request with status: ${request.status}. Only Pending requests can be cancelled.`,
      });
    }
    
    // Update clearance request to Cancelled
    await client.query(
      `UPDATE gate_clearance_requests
       SET status = 'Cancelled',
           updated_at = now()
       WHERE id = $1`,
      [id]
    );
    
    // Update issue voucher
    await client.query(
      `UPDATE issue_vouchers
       SET gate_clearance_requested = false,
           gate_clearance_approved = false,
           gate_clearance_request_id = NULL
       WHERE id = $1`,
      [request.issue_voucher_id]
    );
    
    // Audit log - TODO: Fix audit_logs table structure
    // await client.query(
    //   `INSERT INTO audit_logs (user_id, action, module)
    //    VALUES ($1, $2, $3)`,
    //   [user.id, 'cancel_gate_clearance', 'gate_clearance']
    // );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Gate clearance request cancelled',
      data: {
        clearance_request_id: id,
        voucher_ref: request.ref_no,
      },
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling clearance request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel gate clearance request',
      error: error.message,
    });
  } finally {
    client.release();
  }
}

/**
 * GET /api/gate-clearances
 * List actual gate clearances (physical exits logged at gate)
 * Different from clearance_requests - this is the ACTUAL exit log
 */
async function listGateClearances(req, res) {
  try {
    const user = req.user;
    
    console.log("🔵 [GATE CLEARANCE LOG] User:", user.name, "Role:", user.role);
    
    const query = `
      SELECT 
        gc.*,
        iv.ref_no AS voucher_ref,
        s.name AS store_name,
        u_cleared.name AS cleared_by_name,
        u_cleared.email AS cleared_by_email,
        gcr.collector_name,
        gcr.collector_department,
        gcr.collector_phone
      FROM gate_clearances gc
      JOIN issue_vouchers iv ON gc.issue_voucher_id = iv.id
      JOIN stores s ON iv.store_id = s.id
      JOIN users u_cleared ON gc.cleared_by = u_cleared.id
      LEFT JOIN gate_clearance_requests gcr ON gc.clearance_request_id = gcr.id
      ORDER BY gc.cleared_at DESC
    `;
    
    const result = await pool.query(query);
    
    console.log("🔵 [GATE CLEARANCE LOG] Found", result.rows.length, "clearances");
    if (result.rows.length > 0) {
      console.log("🔵 [GATE CLEARANCE LOG] First clearance:", result.rows[0]);
    }
    
    res.json({
      success: true,
      data: {
        clearances: result.rows,
        total: result.rows.length,
      },
    });
    
  } catch (error) {
    console.error('❌ [GATE CLEARANCE LOG] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list gate clearances',
      error: error.message,
    });
  }
}

module.exports = {
  createClearanceRequest,
  listClearanceRequests,
  getClearanceRequest,
  approveClearanceRequest,
  rejectClearanceRequest,
  cancelClearanceRequest,
  listGateClearances,
};
