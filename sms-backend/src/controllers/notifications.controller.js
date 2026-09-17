const { pool } = require("../config/db");
const { ApiError } = require("../middleware/errorHandler");

/**
 * List notifications with optional filtering
 * Query params:
 * - limit: max results (default 30, max 100)
 * - offset: pagination offset
 * - unread: filter unread only (true/false)
 * - module: filter by module name
 * - entityType: filter by entity type
 * - priority: filter by priority (low/normal/high/urgent)
 * - actionRequired: filter action-required only (true/false)
 */
async function list(req, res) {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const unreadOnly = req.query.unread === 'true';
  const module = req.query.module;
  const entityType = req.query.entityType;
  const priority = req.query.priority;
  const actionRequired = req.query.actionRequired === 'true';

  let whereClause = 'WHERE recipient_id = $1 AND deleted_at IS NULL';
  const params = [req.user.id];
  let paramIndex = 2;

  if (unreadOnly) {
    whereClause += ' AND read_at IS NULL';
  }

  if (module) {
    params.push(module);
    whereClause += ` AND module = $${paramIndex}`;
    paramIndex++;
  }

  if (entityType) {
    params.push(entityType);
    whereClause += ` AND entity_type = $${paramIndex}`;
    paramIndex++;
  }

  if (priority) {
    params.push(priority);
    whereClause += ` AND priority = $${paramIndex}`;
    paramIndex++;
  }

  if (actionRequired) {
    whereClause += ' AND action_required = true';
  }

  params.push(limit, offset);

  const rows = await pool.query(
    `SELECT 
      id, title, message, module, entity_type, reference_id, 
      action_url, severity, priority, notification_type, 
      action_required, read_at, created_at
     FROM notifications 
     ${whereClause}
     ORDER BY 
       CASE priority 
         WHEN 'urgent' THEN 1 
         WHEN 'high' THEN 2 
         WHEN 'normal' THEN 3 
         WHEN 'low' THEN 4 
       END,
       created_at DESC 
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    params,
  );

  // Get total count for pagination
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM notifications ${whereClause}`,
    params.slice(0, -2), // Exclude limit and offset (last 2 params)
  );

  // For backward compatibility: if no query params, return just array
  // Otherwise return object with pagination metadata
  const hasFilters = req.query.unread || req.query.module || req.query.entityType || 
                     req.query.priority || req.query.actionRequired || req.query.offset;
  
  if (!hasFilters && limit === 30) {
    // Legacy behavior - just return array
    res.json(rows.rows);
  } else {
    // New behavior - return object with pagination
    res.json({
      notifications: rows.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    });
  }
}

/**
 * Get unread notifications count and summary
 */
async function getUnreadSummary(req, res) {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total_unread,
      COUNT(*) FILTER (WHERE action_required = true) as action_required_count,
      COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
      COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count
     FROM notifications 
     WHERE recipient_id = $1 
       AND read_at IS NULL 
       AND deleted_at IS NULL`,
    [req.user.id],
  );

  res.json(result.rows[0]);
}

/**
 * Get notifications grouped by module
 */
async function getByModule(req, res) {
  const result = await pool.query(
    `SELECT 
      module,
      entity_type,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE read_at IS NULL) as unread_count,
      MAX(created_at) as latest_notification
     FROM notifications 
     WHERE recipient_id = $1 AND deleted_at IS NULL
     GROUP BY module, entity_type
     ORDER BY unread_count DESC, latest_notification DESC`,
    [req.user.id],
  );

  res.json(result.rows);
}

/**
 * Get notifications by entity type
 */
async function getByEntityType(req, res) {
  const { entityType } = req.params;
  const limit = Math.min(Number(req.query.limit) || 30, 100);

  const result = await pool.query(
    `SELECT 
      id, title, message, module, entity_type, reference_id, 
      action_url, severity, priority, notification_type, 
      action_required, read_at, created_at
     FROM notifications 
     WHERE recipient_id = $1 
       AND entity_type = $2 
       AND deleted_at IS NULL
     ORDER BY created_at DESC 
     LIMIT $3`,
    [req.user.id, entityType, limit],
  );

  res.json(result.rows);
}

/**
 * Mark single notification as read
 */
async function markRead(req, res) {
  const result = await pool.query(
    `UPDATE notifications 
     SET read_at = COALESCE(read_at, now()),
         marked_read_by = $3
     WHERE id = $1 
       AND recipient_id = $2 
       AND deleted_at IS NULL
     RETURNING id, read_at, marked_read_by`,
    [req.params.id, req.user.id, req.user.id],
  );

  if (result.rows.length === 0)
    throw new ApiError(404, "Notification not found.");
  
  res.json(result.rows[0]);
}

/**
 * Mark multiple notifications as read
 */
async function markMultipleRead(req, res) {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    throw new ApiError(400, "notificationIds array is required");
  }

  const result = await pool.query(
    `UPDATE notifications 
     SET read_at = COALESCE(read_at, now()),
         marked_read_by = $3
     WHERE id = ANY($1::uuid[]) 
       AND recipient_id = $2 
       AND deleted_at IS NULL
     RETURNING id`,
    [notificationIds, req.user.id, req.user.id],
  );

  res.json({ 
    updated: result.rowCount,
    ids: result.rows.map(r => r.id),
  });
}

/**
 * Mark all notifications as read
 */
async function markAllRead(req, res) {
  const result = await pool.query(
    `UPDATE notifications 
     SET read_at = COALESCE(read_at, now()),
         marked_read_by = $2
     WHERE recipient_id = $1 
       AND read_at IS NULL 
       AND deleted_at IS NULL`,
    [req.user.id, req.user.id],
  );

  res.json({ updated: result.rowCount });
}

/**
 * Mark all notifications in a module as read
 */
async function markModuleRead(req, res) {
  const { module } = req.params;

  const result = await pool.query(
    `UPDATE notifications 
     SET read_at = COALESCE(read_at, now()),
         marked_read_by = $3
     WHERE recipient_id = $1 
       AND module = $2 
       AND read_at IS NULL 
       AND deleted_at IS NULL`,
    [req.user.id, module, req.user.id],
  );

  res.json({ updated: result.rowCount, module });
}

/**
 * Soft delete notification (user dismisses it)
 */
async function deleteNotification(req, res) {
  const result = await pool.query(
    `UPDATE notifications 
     SET deleted_at = now()
     WHERE id = $1 
       AND recipient_id = $2 
       AND deleted_at IS NULL
     RETURNING id`,
    [req.params.id, req.user.id],
  );

  if (result.rows.length === 0)
    throw new ApiError(404, "Notification not found.");
  
  res.json({ deleted: true, id: result.rows[0].id });
}

/**
 * Soft delete multiple notifications
 */
async function deleteMultiple(req, res) {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    throw new ApiError(400, "notificationIds array is required");
  }

  const result = await pool.query(
    `UPDATE notifications 
     SET deleted_at = now()
     WHERE id = ANY($1::uuid[]) 
       AND recipient_id = $2 
       AND deleted_at IS NULL
     RETURNING id`,
    [notificationIds, req.user.id],
  );

  res.json({ 
    deleted: result.rowCount,
    ids: result.rows.map(r => r.id),
  });
}

/**
 * Get notification statistics for current user
 */
async function getStatistics(req, res) {
  const result = await pool.query(
    `SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE read_at IS NULL) as unread,
      COUNT(*) FILTER (WHERE action_required = true AND read_at IS NULL) as action_required,
      COUNT(*) FILTER (WHERE priority = 'urgent' AND read_at IS NULL) as urgent,
      COUNT(*) FILTER (WHERE priority = 'high' AND read_at IS NULL) as high_priority,
      COUNT(*) FILTER (WHERE notification_type = 'error') as errors,
      COUNT(*) FILTER (WHERE notification_type = 'warning') as warnings,
      AVG(EXTRACT(EPOCH FROM (COALESCE(read_at, now()) - created_at)) / 3600) as avg_hours_to_read,
      MAX(created_at) as latest_notification
     FROM notifications 
     WHERE recipient_id = $1 
       AND deleted_at IS NULL
       AND created_at > now() - INTERVAL '30 days'`,
    [req.user.id],
  );

  res.json(result.rows[0]);
}

module.exports = { 
  list, 
  getUnreadSummary,
  getByModule,
  getByEntityType,
  markRead, 
  markMultipleRead,
  markAllRead,
  markModuleRead,
  deleteNotification,
  deleteMultiple,
  getStatistics,
};
