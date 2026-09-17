-- Migration: Add return tracking to issue vouchers and requisitions
-- Run: psql -d spms_db -f migrations/add_return_tracking_columns.sql

-- Add return tracking columns to issue_vouchers
ALTER TABLE issue_vouchers 
ADD COLUMN IF NOT EXISTS returned_qty NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_qty NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS has_returns BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS return_notes TEXT;

-- Calculate net_qty for existing vouchers (qty - returned_qty)
UPDATE issue_vouchers SET net_qty = qty WHERE net_qty IS NULL;

-- Add comment
COMMENT ON COLUMN issue_vouchers.returned_qty IS 'Total quantity returned via SRNs';
COMMENT ON COLUMN issue_vouchers.net_qty IS 'Net quantity issued after returns (qty - returned_qty)';
COMMENT ON COLUMN issue_vouchers.has_returns IS 'Flag indicating if any materials were returned';
COMMENT ON COLUMN issue_vouchers.return_notes IS 'Notes about returns (SRN references)';

-- Add return tracking columns to store_requisitions
ALTER TABLE store_requisitions 
ADD COLUMN IF NOT EXISTS returned_qty NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_qty NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS has_returns BOOLEAN DEFAULT false;

-- Calculate net_qty for existing requisitions
UPDATE store_requisitions SET net_qty = qty WHERE net_qty IS NULL;

-- Add comment
COMMENT ON COLUMN store_requisitions.returned_qty IS 'Total quantity returned from this requisition';
COMMENT ON COLUMN store_requisitions.net_qty IS 'Net quantity received after returns (qty - returned_qty)';
COMMENT ON COLUMN store_requisitions.has_returns IS 'Flag indicating if any materials were returned';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_issue_vouchers_has_returns ON issue_vouchers(has_returns) WHERE has_returns = true;
CREATE INDEX IF NOT EXISTS idx_store_requisitions_has_returns ON store_requisitions(has_returns) WHERE has_returns = true;
