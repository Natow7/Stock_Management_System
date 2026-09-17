-- Migration: Enhance Notifications System
-- Purpose: Add action_url, entity_type, and improve notification tracking
-- Date: 2026-09-17
-- Related: Notification system optimization

-- ---------------------------------------------------------------------------
-- PART 1: Add new columns to notifications table
-- ---------------------------------------------------------------------------

-- Add action_url for direct navigation
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Add entity_type for better categorization
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS entity_type TEXT 
  CHECK (entity_type IN (
    'goods_receipt',
    'grn',
    'requisition',
    'issue_voucher',
    'transfer',
    'return',
    'disposal',
    'fixed_asset',
    'stock_control',
    'gate_clearance',
    'user',
    'system'
  ));

-- Add action_required flag for urgent notifications
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS action_required BOOLEAN DEFAULT false;

-- Add priority level
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Add notification type for better UI rendering
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'info'
  CHECK (notification_type IN ('info', 'success', 'warning', 'error', 'action'));

-- Add deleted_at for soft delete (keep notification history)
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add read_by_user for audit trail (who marked it read)
ALTER TABLE notifications 
  ADD COLUMN IF NOT EXISTS marked_read_by UUID REFERENCES users(id);

-- ---------------------------------------------------------------------------
-- PART 2: Add indexes for performance
-- ---------------------------------------------------------------------------

-- Index for filtering unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(recipient_id, read_at) 
  WHERE read_at IS NULL AND deleted_at IS NULL;

-- Index for action-required notifications
CREATE INDEX IF NOT EXISTS idx_notifications_action_required 
  ON notifications(recipient_id, action_required, created_at DESC) 
  WHERE action_required = true AND read_at IS NULL AND deleted_at IS NULL;

-- Index for filtering by entity type
CREATE INDEX IF NOT EXISTS idx_notifications_entity_type 
  ON notifications(recipient_id, entity_type, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Index for priority filtering
CREATE INDEX IF NOT EXISTS idx_notifications_priority 
  ON notifications(recipient_id, priority, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Index for reference lookups
CREATE INDEX IF NOT EXISTS idx_notifications_reference 
  ON notifications(reference_id, entity_type) 
  WHERE reference_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- PART 3: Create views for common queries
-- ---------------------------------------------------------------------------

-- View: User's unread notifications
CREATE OR REPLACE VIEW user_unread_notifications AS
SELECT 
  n.id,
  n.recipient_id,
  n.title,
  n.message,
  n.module,
  n.entity_type,
  n.reference_id,
  n.action_url,
  n.severity,
  n.priority,
  n.notification_type,
  n.action_required,
  n.created_at,
  u.name AS recipient_name,
  u.role AS recipient_role
FROM notifications n
JOIN users u ON u.id = n.recipient_id
WHERE n.read_at IS NULL 
  AND n.deleted_at IS NULL
  AND u.status = 'Active'
ORDER BY n.priority DESC, n.created_at DESC;

COMMENT ON VIEW user_unread_notifications IS 
  'All unread notifications for active users, sorted by priority then date';

-- View: User's urgent notifications
CREATE OR REPLACE VIEW user_urgent_notifications AS
SELECT 
  n.id,
  n.recipient_id,
  n.title,
  n.message,
  n.module,
  n.entity_type,
  n.reference_id,
  n.action_url,
  n.action_required,
  n.created_at AS notification_created_at,
  EXTRACT(EPOCH FROM (now() - n.created_at)) / 3600 AS hours_old,
  u.name AS recipient_name,
  u.role AS recipient_role
FROM notifications n
JOIN users u ON u.id = n.recipient_id
WHERE n.action_required = true
  AND n.read_at IS NULL 
  AND n.deleted_at IS NULL
  AND u.status = 'Active'
  AND n.created_at > now() - INTERVAL '7 days'
ORDER BY n.created_at DESC;

COMMENT ON VIEW user_urgent_notifications IS 
  'Action-required notifications from last 7 days for active users';

-- ---------------------------------------------------------------------------
-- PART 4: Add column comments for documentation
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN notifications.action_url IS 
  'Direct URL path to navigate when notification is clicked (e.g., /requisitions?id=123)';

COMMENT ON COLUMN notifications.entity_type IS 
  'Type of entity this notification relates to (goods_receipt, requisition, etc.)';

COMMENT ON COLUMN notifications.action_required IS 
  'True if notification requires user action (approval, review, etc.)';

COMMENT ON COLUMN notifications.priority IS 
  'Priority level: low, normal, high, urgent - affects sorting and display';

COMMENT ON COLUMN notifications.notification_type IS 
  'UI rendering type: info, success, warning, error, action';

COMMENT ON COLUMN notifications.deleted_at IS 
  'Soft delete timestamp - notification hidden but kept for audit trail';

COMMENT ON COLUMN notifications.marked_read_by IS 
  'User who marked this notification as read (may differ from recipient for shared accounts)';

-- ---------------------------------------------------------------------------
-- PART 5: Update existing notifications with entity_type (data migration)
-- ---------------------------------------------------------------------------

-- Map module to entity_type for existing notifications
UPDATE notifications 
SET entity_type = CASE
  WHEN module LIKE '%Goods Receipt%' OR module LIKE '%GRN%' THEN 'goods_receipt'
  WHEN module LIKE '%Requisition%' THEN 'requisition'
  WHEN module LIKE '%Issue%' OR module LIKE '%Voucher%' THEN 'issue_voucher'
  WHEN module LIKE '%Transfer%' THEN 'transfer'
  WHEN module LIKE '%Return%' THEN 'return'
  WHEN module LIKE '%Disposal%' THEN 'disposal'
  WHEN module LIKE '%Fixed Asset%' THEN 'fixed_asset'
  WHEN module LIKE '%Stock Control%' OR module LIKE '%Stock Take%' THEN 'stock_control'
  WHEN module LIKE '%Gate%' OR module LIKE '%Clearance%' THEN 'gate_clearance'
  WHEN module LIKE '%User%' THEN 'user'
  ELSE 'system'
END
WHERE entity_type IS NULL;

-- Set notification_type based on severity
UPDATE notifications 
SET notification_type = CASE
  WHEN severity = 'Success' THEN 'success'
  WHEN severity = 'Warning' THEN 'warning'
  WHEN severity = 'Critical' THEN 'error'
  ELSE 'info'
END
WHERE notification_type = 'info';

-- Set action_required for approval-related notifications
UPDATE notifications 
SET action_required = true
WHERE (
  message LIKE '%awaiting%approval%' 
  OR message LIKE '%pending%review%'
  OR message LIKE '%requires%action%'
  OR message LIKE '%assigned to you%'
)
AND read_at IS NULL;

-- Set priority based on message content
UPDATE notifications 
SET priority = CASE
  WHEN message LIKE '%urgent%' OR message LIKE '%critical%' THEN 'urgent'
  WHEN message LIKE '%high priority%' OR severity = 'Critical' THEN 'high'
  WHEN message LIKE '%low priority%' THEN 'low'
  ELSE 'normal'
END
WHERE priority = 'normal';

-- ---------------------------------------------------------------------------
-- PART 6: Create function for notification cleanup
-- ---------------------------------------------------------------------------

-- Function to soft-delete old read notifications (keep unread indefinitely)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_old INT DEFAULT 90)
RETURNS INT AS $$
DECLARE
  deleted_count INT;
BEGIN
  UPDATE notifications
  SET deleted_at = now()
  WHERE read_at IS NOT NULL
    AND deleted_at IS NULL
    AND created_at < now() - (days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_notifications IS 
  'Soft-delete read notifications older than specified days (default 90). Unread notifications never auto-deleted.';

-- ---------------------------------------------------------------------------
-- PART 7: Create notification statistics view
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW notification_statistics AS
SELECT 
  n.recipient_id,
  u.name AS user_name,
  u.role AS user_role,
  COUNT(*) AS total_notifications,
  COUNT(*) FILTER (WHERE n.read_at IS NULL) AS unread_count,
  COUNT(*) FILTER (WHERE n.action_required = true AND n.read_at IS NULL) AS action_required_count,
  COUNT(*) FILTER (WHERE n.priority = 'urgent' AND n.read_at IS NULL) AS urgent_count,
  MAX(n.created_at) AS latest_notification,
  AVG(EXTRACT(EPOCH FROM (COALESCE(n.read_at, now()) - n.created_at)) / 3600) AS avg_hours_to_read
FROM notifications n
JOIN users u ON u.id = n.recipient_id
WHERE n.deleted_at IS NULL
  AND n.created_at > now() - INTERVAL '30 days'
GROUP BY n.recipient_id, u.name, u.role;

COMMENT ON VIEW notification_statistics IS 
  'Per-user notification statistics for last 30 days';

-- ---------------------------------------------------------------------------
-- PART 8: Verification query
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  -- Verify all columns were added
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'action_url'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'entity_type'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'action_required'
  ) THEN
    RAISE NOTICE 'Migration 004_enhance_notifications completed successfully';
    RAISE NOTICE 'Notification system enhanced with action URLs, entity types, and priorities';
    RAISE NOTICE 'Created 2 views: user_unread_notifications, user_urgent_notifications';
    RAISE NOTICE 'Created cleanup function: cleanup_old_notifications(days_old)';
  ELSE
    RAISE EXCEPTION 'Migration failed: Required columns not created';
  END IF;
END $$;

