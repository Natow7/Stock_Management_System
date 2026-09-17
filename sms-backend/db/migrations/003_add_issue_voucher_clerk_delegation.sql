-- Migration: Add Issue Voucher Clerk Delegation
-- Purpose: Enable Store Head to assign voucher finalization to Stock Clerk, then verify work
-- Date: 2026-09-14
-- Related: PENDING_TASKS.md - Phase 3: Clerk Execution for Issue Vouchers

-- ---------------------------------------------------------------------------
-- PART 1: Add assignment fields
-- ---------------------------------------------------------------------------

-- Store Head assigns voucher to clerk
ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS assigned_to_clerk UUID REFERENCES users(id);

ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS assignment_instructions TEXT;

-- ---------------------------------------------------------------------------
-- PART 2: Add execution tracking fields
-- ---------------------------------------------------------------------------

-- Clerk executes finalization (FIFO + bin cards)
ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS executed_by UUID REFERENCES users(id);

ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ;

-- JSON structure: {lots_selected: [{lot_id, qty, bin_card_id}...], total_qty: N, execution_notes: "..."}
ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS fifo_execution_details JSONB;

-- ---------------------------------------------------------------------------
-- PART 3: Add verification tracking fields
-- ---------------------------------------------------------------------------

-- Store Head verifies physical materials match system
ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);

ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Discrepancy handling
ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS physical_discrepancy BOOLEAN DEFAULT false;

ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS discrepancy_details TEXT;

-- ---------------------------------------------------------------------------
-- PART 4: Create indexes for performance
-- ---------------------------------------------------------------------------

-- Find vouchers assigned to specific clerk
CREATE INDEX IF NOT EXISTS idx_issue_vouchers_assigned_clerk 
  ON issue_vouchers(assigned_to_clerk, status) 
  WHERE assigned_to_clerk IS NOT NULL;

-- Find vouchers executed by specific clerk
CREATE INDEX IF NOT EXISTS idx_issue_vouchers_executed_by 
  ON issue_vouchers(executed_by, executed_at) 
  WHERE executed_by IS NOT NULL;

-- Find vouchers awaiting verification
CREATE INDEX IF NOT EXISTS idx_issue_vouchers_pending_verification 
  ON issue_vouchers(status, verified_by) 
  WHERE status = 'Awaiting Verification';

-- Track discrepancies
CREATE INDEX IF NOT EXISTS idx_issue_vouchers_discrepancies 
  ON issue_vouchers(physical_discrepancy, verified_at) 
  WHERE physical_discrepancy = true;

-- ---------------------------------------------------------------------------
-- PART 5: Add column comments for documentation
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN issue_vouchers.assigned_to_clerk IS 
  'Stock Clerk assigned by Store Head to execute voucher finalization (FIFO + bin cards)';

COMMENT ON COLUMN issue_vouchers.assignment_instructions IS 
  'Special instructions from Store Head to clerk (e.g., "Use older stock first", "Check expiry dates")';

COMMENT ON COLUMN issue_vouchers.fifo_execution_details IS 
  'JSON: {lots_selected: [{lot_id, qty, bin_card_id, expiry_date}...], total_qty, bin_cards_updated: [...], execution_notes}';

COMMENT ON COLUMN issue_vouchers.verified_by IS 
  'Store Head who physically verified materials match system records before marking "Issued"';

COMMENT ON COLUMN issue_vouchers.physical_discrepancy IS 
  'True if Store Head found mismatch between physical count and system during verification';

COMMENT ON COLUMN issue_vouchers.discrepancy_details IS 
  'Description of what did not match (quantity, quality, wrong item, etc.)';

-- ---------------------------------------------------------------------------
-- PART 6: Create view for clerk assigned tasks
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW clerk_assigned_vouchers AS
SELECT 
  iv.id,
  iv.ref_no,
  iv.status,
  iv.qty,
  iv.assigned_to_clerk,
  iv.assigned_at,
  iv.assignment_instructions,
  i.code AS item_code,
  i.name AS item_name,
  i.unit AS item_unit,
  s.name AS store_name,
  u_assigned.name AS assigned_clerk_name,
  u_created.name AS created_by_name,
  req.department AS requesting_department,
  EXTRACT(EPOCH FROM (now() - iv.assigned_at)) / 3600 AS hours_since_assignment
FROM issue_vouchers iv
JOIN items i ON iv.item_id = i.id
JOIN stores s ON iv.store_id = s.id
LEFT JOIN users u_assigned ON iv.assigned_to_clerk = u_assigned.id
LEFT JOIN users u_created ON iv.created_by = u_created.id
LEFT JOIN store_requisitions req ON iv.requisition_id = req.id
WHERE iv.assigned_to_clerk IS NOT NULL
  AND iv.status IN ('Assigned to Clerk', 'Clerk Executing');

COMMENT ON VIEW clerk_assigned_vouchers IS 
  'Stock Clerk dashboard view: vouchers assigned for finalization';

-- ---------------------------------------------------------------------------
-- PART 7: Create view for Store Head verification queue
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW vouchers_pending_verification AS
SELECT 
  iv.id,
  iv.ref_no,
  iv.status,
  iv.qty,
  iv.executed_by,
  iv.executed_at,
  iv.fifo_execution_details,
  iv.assignment_instructions,
  i.code AS item_code,
  i.name AS item_name,
  i.unit AS item_unit,
  s.name AS store_name,
  u_executed.name AS executed_by_name,
  u_executed.email AS executed_by_email,
  req.department AS requesting_department,
  req.requested_by AS requester_id,
  u_requester.name AS requester_name,
  EXTRACT(EPOCH FROM (now() - iv.executed_at)) / 3600 AS hours_awaiting_verification
FROM issue_vouchers iv
JOIN items i ON iv.item_id = i.id
JOIN stores s ON iv.store_id = s.id
JOIN users u_executed ON iv.executed_by = u_executed.id
LEFT JOIN store_requisitions req ON iv.requisition_id = req.id
LEFT JOIN users u_requester ON req.requested_by = u_requester.id
WHERE iv.status = 'Awaiting Verification';

COMMENT ON VIEW vouchers_pending_verification IS 
  'Store Head dashboard view: vouchers executed by clerk, awaiting physical verification';

-- ---------------------------------------------------------------------------
-- PART 8: Verification query
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  -- Verify all columns were added
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issue_vouchers' 
    AND column_name = 'assigned_to_clerk'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issue_vouchers' 
    AND column_name = 'executed_by'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issue_vouchers' 
    AND column_name = 'verified_by'
  ) THEN
    RAISE NOTICE 'Migration 003_add_issue_voucher_clerk_delegation completed successfully';
    RAISE NOTICE 'Issue voucher clerk delegation workflow is now available';
    RAISE NOTICE 'New workflow: Store Head assigns → Clerk executes → Store Head verifies';
  ELSE
    RAISE EXCEPTION 'Migration failed: Required columns not created';
  END IF;
END $$;
