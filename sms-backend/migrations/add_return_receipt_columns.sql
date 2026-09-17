-- Add columns for Stock Clerk physical receipt confirmation and enhanced approval
ALTER TABLE store_return_notes
ADD COLUMN IF NOT EXISTS received_qty NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS received_condition VARCHAR(50),
ADD COLUMN IF NOT EXISTS receipt_remarks TEXT,
ADD COLUMN IF NOT EXISTS received_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS decided_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS decision_signature JSONB,
ADD COLUMN IF NOT EXISTS decision_role VARCHAR(100);

-- Add comments
COMMENT ON COLUMN store_return_notes.received_qty IS 'Actual quantity received by Stock Clerk during physical receipt';
COMMENT ON COLUMN store_return_notes.received_condition IS 'Physical condition verified by Stock Clerk upon receipt';
COMMENT ON COLUMN store_return_notes.receipt_remarks IS 'Stock Clerk notes during physical receipt';
COMMENT ON COLUMN store_return_notes.received_by IS 'Stock Clerk who physically received the material';
COMMENT ON COLUMN store_return_notes.received_at IS 'Timestamp when Stock Clerk confirmed physical receipt';
COMMENT ON COLUMN store_return_notes.decided_at IS 'Timestamp when final decision was made';
COMMENT ON COLUMN store_return_notes.decision_signature IS 'Digital signature JSON: {fullName, timestamp, ipAddress}';
COMMENT ON COLUMN store_return_notes.decision_role IS 'Role of the approver (PAO or Store Head) to track who decided first';
