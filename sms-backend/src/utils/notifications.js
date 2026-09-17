/**
 * Generate action URL based on entity type and reference ID
 * Maps entity types to frontend routes with proper query parameters
 */
function generateActionUrl(entityType, referenceId = null) {
  if (!entityType) return null;

  const urlMap = {
    goods_receipt: referenceId 
      ? `/goods-receipt?tab=pending&highlight=${referenceId}`
      : `/goods-receipt?tab=pending`,
    grn: referenceId
      ? `/goods-receipt?tab=pending&highlight=${referenceId}`
      : `/goods-receipt?tab=pending`,
    requisition: referenceId
      ? `/requisitions?highlight=${referenceId}`
      : `/requisitions`,
    issue_voucher: referenceId
      ? `/issue-vouchers?highlight=${referenceId}`
      : `/issue-vouchers`,
    transfer: referenceId
      ? `/transfers?highlight=${referenceId}`
      : `/transfers`,
    return: referenceId
      ? `/returns?highlight=${referenceId}`
      : `/returns`,
    disposal: referenceId
      ? `/disposal?highlight=${referenceId}`
      : `/disposal`,
    fixed_asset: referenceId
      ? `/fixed-assets?highlight=${referenceId}`
      : `/fixed-assets`,
    stock_control: referenceId
      ? `/stock-control?highlight=${referenceId}`
      : `/stock-control`,
    gate_clearance: referenceId
      ? `/gate-clearance?highlight=${referenceId}`
      : `/gate-clearance`,
    user: referenceId
      ? `/users?highlight=${referenceId}`
      : `/users`,
    system: '/system-settings',
  };

  return urlMap[entityType] || '/';
}

/**
 * Determine notification type from severity
 */
function getNotificationType(severity) {
  const typeMap = {
    'Success': 'success',
    'Warning': 'warning',
    'Critical': 'error',
    'Info': 'info',
  };
  return typeMap[severity] || 'info';
}

/**
 * Determine if notification requires action based on message content
 */
function requiresAction(message) {
  const actionKeywords = [
    'awaiting approval',
    'pending review',
    'requires action',
    'assigned to you',
    'please approve',
    'please review',
    'action needed',
    'approval required',
  ];
  
  const lowerMessage = message.toLowerCase();
  return actionKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Determine priority from severity and message content
 */
function determinePriority(severity, message) {
  const lowerMessage = message.toLowerCase();
  
  if (severity === 'Critical' || lowerMessage.includes('urgent') || lowerMessage.includes('critical')) {
    return 'urgent';
  }
  if (severity === 'Warning' || lowerMessage.includes('high priority')) {
    return 'high';
  }
  if (lowerMessage.includes('low priority')) {
    return 'low';
  }
  return 'normal';
}

/**
 * Notify users by role with enhanced metadata
 * @param {Object} client - Database client (for transactions)
 * @param {Object} options - Notification options
 * @param {string[]} options.roles - Array of role names to notify
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.module - Module name (for backwards compatibility)
 * @param {string} options.entityType - Entity type (goods_receipt, requisition, etc.)
 * @param {string} options.referenceId - Reference ID (optional)
 * @param {string} options.severity - Severity level (Info, Success, Warning, Critical)
 * @param {string} options.priority - Priority override (low, normal, high, urgent)
 * @param {boolean} options.actionRequired - Override action required flag
 * @param {string} options.excludeUserId - User ID to exclude from notification
 */
async function notifyRoles(
  client,
  {
    roles,
    title,
    message,
    module,
    entityType = null,
    referenceId = null,
    severity = "Info",
    priority = null,
    actionRequired = null,
    excludeUserId = null,
  },
) {
  if (!roles || roles.length === 0) return;

  // Auto-detect entity type from module if not provided
  if (!entityType && module) {
    entityType = inferEntityTypeFromModule(module);
  }

  // Generate action URL
  const actionUrl = generateActionUrl(entityType, referenceId);

  // Determine notification type
  const notificationType = getNotificationType(severity);

  // Determine if action is required (use override or auto-detect)
  const isActionRequired = actionRequired !== null 
    ? actionRequired 
    : requiresAction(message);

  // Determine priority (use override or auto-detect)
  const notificationPriority = priority || determinePriority(severity, message);

  const params = [
    roles, 
    title, 
    message, 
    module, 
    referenceId, 
    severity,
    actionUrl,
    entityType,
    isActionRequired,
    notificationPriority,
    notificationType,
  ];

  let exclusion = "";
  if (excludeUserId) {
    params.push(excludeUserId);
    exclusion = "AND id <> $12";
  }

  await client.query(
    `INSERT INTO notifications (
      recipient_id, title, message, module, reference_id, severity,
      action_url, entity_type, action_required, priority, notification_type
    )
    SELECT id, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 
    FROM users
    WHERE role = ANY($1::text[]) AND status = 'Active' ${exclusion}`,
    params,
  );
}

/**
 * Notify a specific user by ID with enhanced metadata
 * @param {string} userId - User UUID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} module - Module name
 * @param {Object} options - Additional options
 */
async function notifyUser(
  userId, 
  title, 
  message, 
  module, 
  {
    referenceId = null,
    severity = "Info",
    entityType = null,
    priority = null,
    actionRequired = null,
  } = {}
) {
  const { pool } = require('../config/db');

  // Auto-detect entity type from module if not provided
  if (!entityType && module) {
    entityType = inferEntityTypeFromModule(module);
  }

  // Generate action URL
  const actionUrl = generateActionUrl(entityType, referenceId);

  // Determine notification type
  const notificationType = getNotificationType(severity);

  // Determine if action is required
  const isActionRequired = actionRequired !== null 
    ? actionRequired 
    : requiresAction(message);

  // Determine priority
  const notificationPriority = priority || determinePriority(severity, message);

  await pool.query(
    `INSERT INTO notifications (
      recipient_id, title, message, module, reference_id, severity,
      action_url, entity_type, action_required, priority, notification_type
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      userId, 
      title, 
      message, 
      module, 
      referenceId, 
      severity,
      actionUrl,
      entityType,
      isActionRequired,
      notificationPriority,
      notificationType,
    ]
  );
}

/**
 * Notify multiple specific users by their IDs
 * @param {string[]} userIds - Array of user UUIDs
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} module - Module name
 * @param {Object} options - Additional options
 */
async function notifySpecificUsers(
  userIds,
  title,
  message,
  module,
  {
    referenceId = null,
    severity = "Info",
    entityType = null,
    priority = null,
    actionRequired = null,
  } = {}
) {
  if (!userIds || userIds.length === 0) return;

  const { pool } = require('../config/db');

  // Auto-detect entity type from module if not provided
  if (!entityType && module) {
    entityType = inferEntityTypeFromModule(module);
  }

  // Generate action URL
  const actionUrl = generateActionUrl(entityType, referenceId);

  // Determine notification type
  const notificationType = getNotificationType(severity);

  // Determine if action is required
  const isActionRequired = actionRequired !== null 
    ? actionRequired 
    : requiresAction(message);

  // Determine priority
  const notificationPriority = priority || determinePriority(severity, message);

  await pool.query(
    `INSERT INTO notifications (
      recipient_id, title, message, module, reference_id, severity,
      action_url, entity_type, action_required, priority, notification_type
    )
    SELECT UNNEST($1::uuid[]), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    WHERE EXISTS (SELECT 1 FROM users WHERE id = ANY($1::uuid[]) AND status = 'Active')`,
    [
      userIds,
      title,
      message,
      module,
      referenceId,
      severity,
      actionUrl,
      entityType,
      isActionRequired,
      notificationPriority,
      notificationType,
    ]
  );
}

/**
 * Infer entity type from module name (for backwards compatibility)
 */
function inferEntityTypeFromModule(module) {
  const moduleMap = {
    'Goods Receipt': 'goods_receipt',
    'GRN': 'grn',
    'GRN Delegation': 'grn',
    'GRN Execution': 'grn',
    'GRN Verification': 'grn',
    'Requisitions': 'requisition',
    'Requisition': 'requisition',
    'Issue Vouchers': 'issue_voucher',
    'Issue Voucher': 'issue_voucher',
    'Transfers': 'transfer',
    'Transfer': 'transfer',
    'Returns': 'return',
    'Return': 'return',
    'Disposal': 'disposal',
    'Fixed Assets': 'fixed_asset',
    'Fixed Asset': 'fixed_asset',
    'Stock Control': 'stock_control',
    'Stock Take': 'stock_control',
    'Gate Clearance': 'gate_clearance',
    'Users': 'user',
    'User': 'user',
    'System': 'system',
    'Audit': 'system',
  };

  return moduleMap[module] || 'system';
}

module.exports = { 
  notifyRoles, 
  notifyUser, 
  notifySpecificUsers,
  generateActionUrl,
  inferEntityTypeFromModule,
};
