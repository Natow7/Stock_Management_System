-- ============================================================================
-- Migration: Add Delegation Tracking for Business Logic Fixes
-- Phase 1: Database Foundation
-- 
-- Purpose: Add fields to track approval-then-execution workflow
--          Implements Segregation of Duties (SoD) compliance
--
-- Pattern: Senior Officer APPROVES → Clerk EXECUTES → Supervisor VERIFIES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. GOODS RECEIPTS: PRO Approval → Stock Clerk Execution → Store Head Verification
-- ---------------------------------------------------------------------------

-- Add PRO approval tracking
ALTER TABLE goods_receipts 
  ADD COLUMN IF NOT EXISTS pro_approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS pro_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pro_approval_notes TEXT;

-- Add Stock Clerk execution tracking
ALTER TABLE goods_receipts 
  ADD COLUMN IF NOT EXISTS grn_generated_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS grn_generated_at TIMESTAMPTZ;

-- Add Store Head verification tracking
ALTER TABLE goods_receipts 
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Update status enum to include new workflow states
ALTER TABLE goods_receipts DROP CONSTRAINT IF EXISTS goods_receipts_status_check;
ALTER TABLE goods_receipts ADD CONSTRAINT goods_receipts_status_check
  CHECK (status IN (
    'Awaiting Evaluation',           -- Initial state (Stock Clerk records)
    'Approved',                       -- TEC approved (existing)
    'Rejected',                       -- TEC rejected (existing)
    'Awaiting PRO Approval',         -- NEW: TEC approved, needs PRO review
    'PRO Approved',                  -- NEW: PRO approved, ready for clerk to generate GRN
    'GRN Generated',                 -- Clerk generated GRN (existing)
    'Awaiting Store Head Verification', -- NEW: GRN generated, needs Store Head verification
    'Verified'                       -- NEW: Store Head verified, finalized
  ));

-- Add index for workflow queries
CREATE INDEX IF NOT EXISTS idx_goods_receipts_workflow 
  ON goods_receipts(status, pro_approved_by, grn_generated_by, verified_by);

-- ---------------------------------------------------------------------------
-- 2. ISSUE VOUCHERS: Store Head Assignment → Stock Clerk Execution → Store Head Verification
-- ---------------------------------------------------------------------------

-- Add Store Head assignment tracking
ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS assigned_to_clerk UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assignment_instructions TEXT;

-- Add Stock Clerk execution tracking
ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS executed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_notes TEXT;

-- Add Store Head physical verification tracking
ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS physical_verified_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS physical_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS physical_verification_notes TEXT;

-- Update status enum to include new workflow states
ALTER TABLE issue_vouchers DROP CONSTRAINT IF EXISTS issue_vouchers_status_check;
ALTER TABLE issue_vouchers ADD CONSTRAINT issue_vouchers_status_check
  CHECK (status IN (
    'Draft',                         -- Initial state (existing)
    'Pending Department Head',       -- Needs Dept Head approval (existing)
    'Pending Store Head',            -- Needs Store Head approval (existing)
    'Approved',                      -- Store Head approved (existing)
    'Assigned to Clerk',             -- NEW: Store Head assigned to clerk for execution
    'Pending Finalization',          -- Clerk is working on it (existing, repurposed)
    'Finalized',                     -- Clerk finished FIFO/bin cards (existing, repurposed)
    'Awaiting Physical Verification', -- NEW: Needs Store Head to verify physical materials
    'Issued'                         -- Store Head verified, materials issued (existing)
  ));

-- Add index for workflow queries
CREATE INDEX IF NOT EXISTS idx_issue_vouchers_workflow 
  ON issue_vouchers(status, assigned_to_clerk, executed_by, physical_verified_by);

-- ---------------------------------------------------------------------------
-- 3. MATERIAL_TRANSFERS: PAO Approval → Source Clerk → Source Store Head → Dest Clerk → Dest Store Head → PAO Confirmation
-- ---------------------------------------------------------------------------

-- Add source store execution tracking
ALTER TABLE material_transfers 
  ADD COLUMN IF NOT EXISTS source_clerk_dispatched_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS source_clerk_dispatched_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_dispatch_notes TEXT;

-- Add source Store Head verification
ALTER TABLE material_transfers 
  ADD COLUMN IF NOT EXISTS source_head_verified_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS source_head_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_verification_notes TEXT;

-- Add destination store execution tracking
ALTER TABLE material_transfers 
  ADD COLUMN IF NOT EXISTS dest_clerk_received_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS dest_clerk_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dest_receipt_notes TEXT;

-- Add destination Store Head verification
ALTER TABLE material_transfers 
  ADD COLUMN IF NOT EXISTS dest_head_verified_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS dest_head_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dest_verification_notes TEXT;

-- Add PAO final confirmation tracking
ALTER TABLE material_transfers 
  ADD COLUMN IF NOT EXISTS pao_confirmed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS pao_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pao_confirmation_notes TEXT;

-- Update status enum to include new workflow states
ALTER TABLE material_transfers DROP CONSTRAINT IF EXISTS material_transfers_status_check;
ALTER TABLE material_transfers ADD CONSTRAINT material_transfers_status_check
  CHECK (status IN (
    'Pending PAO',                   -- Needs PAO approval (existing)
    'Approved',                      -- PAO approved policy (existing, repurposed)
    'Assigned to Source Clerk',      -- NEW: Ready for source clerk to dispatch
    'Dispatched',                    -- NEW: Source clerk dispatched materials
    'Source Verified',               -- NEW: Source Store Head verified dispatch
    'In Transit',                    -- NEW: Materials in transit to destination
    'Arrived',                       -- NEW: Destination clerk received materials
    'Dest Verified',                 -- NEW: Destination Store Head verified receipt
    'Pending PAO Confirmation',      -- NEW: Both sides verified, needs PAO final confirmation
    'Completed',                     -- PAO confirmed, transfer complete (existing)
    'Rejected'                       -- Rejected (existing)
  ));

-- Add index for workflow queries
CREATE INDEX IF NOT EXISTS idx_material_transfers_workflow 
  ON material_transfers(
    status, 
    source_clerk_dispatched_by, 
    source_head_verified_by,
    dest_clerk_received_by,
    dest_head_verified_by,
    pao_confirmed_by
  );

-- ---------------------------------------------------------------------------
-- 4. AUDIT LOGS: Track delegation chain
-- ---------------------------------------------------------------------------

-- Add delegation context to audit logs
ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS delegated_from UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS action_role TEXT;

COMMENT ON COLUMN audit_logs.delegated_from IS 'Who approved/assigned this task (if action was delegated)';
COMMENT ON COLUMN audit_logs.action_role IS 'Role context: Approver, Executor, Verifier';

-- Add index for delegation queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_delegation 
  ON audit_logs(delegated_from, action_role);

-- ---------------------------------------------------------------------------
-- 5. Create helper view for workflow status
-- ---------------------------------------------------------------------------

-- View: Goods Receipt Workflow Status
CREATE OR REPLACE VIEW vw_goods_receipt_workflow AS
SELECT 
  gr.id,
  gr.ref_no,
  gr.status,
  gr.recorded_by AS clerk_recorded,
  te.evaluator_id AS tec_evaluator,
  te.evaluated_at AS tec_evaluated_at,
  gr.pro_approved_by,
  gr.pro_approved_at,
  gr.grn_generated_by,
  gr.grn_generated_at,
  gr.verified_by AS store_head_verified,
  gr.verified_at AS store_head_verified_at,
  -- Show who needs to act next
  CASE 
    WHEN gr.status = 'Awaiting Evaluation' THEN 'TEC'
    WHEN gr.status = 'Awaiting PRO Approval' THEN 'PRO'
    WHEN gr.status = 'PRO Approved' THEN 'Stock Clerk'
    WHEN gr.status = 'Awaiting Store Head Verification' THEN 'Store Head'
    ELSE NULL
  END AS pending_action_by_role
FROM goods_receipts gr
LEFT JOIN technical_evaluations te ON te.entity_type = 'goods_receipt' AND te.entity_id = gr.id;

-- View: Issue Voucher Workflow Status
CREATE OR REPLACE VIEW vw_issue_voucher_workflow AS
SELECT 
  iv.id,
  iv.ref_no,
  iv.status,
  iv.assigned_to_clerk,
  iv.assigned_at,
  iv.executed_by,
  iv.executed_at,
  iv.physical_verified_by,
  iv.physical_verified_at,
  -- Show who needs to act next
  CASE 
    WHEN iv.status = 'Pending Department Head' THEN 'Department Head'
    WHEN iv.status = 'Pending Store Head' THEN 'Store Head (Approval)'
    WHEN iv.status = 'Assigned to Clerk' THEN 'Stock Clerk'
    WHEN iv.status = 'Awaiting Physical Verification' THEN 'Store Head (Verification)'
    ELSE NULL
  END AS pending_action_by_role
FROM issue_vouchers iv;

-- View: Transfer Workflow Status
CREATE OR REPLACE VIEW vw_transfer_workflow AS
SELECT 
  t.id,
  t.ref_no,
  t.status,
  t.source_clerk_dispatched_by,
  t.source_clerk_dispatched_at,
  t.source_head_verified_by,
  t.source_head_verified_at,
  t.dest_clerk_received_by,
  t.dest_clerk_received_at,
  t.dest_head_verified_by,
  t.dest_head_verified_at,
  t.pao_confirmed_by,
  t.pao_confirmed_at,
  -- Show who needs to act next
  CASE 
    WHEN t.status = 'Pending PAO' THEN 'PAO (Approval)'
    WHEN t.status = 'Assigned to Source Clerk' THEN 'Source Store Clerk'
    WHEN t.status = 'Dispatched' THEN 'Source Store Head'
    WHEN t.status = 'In Transit' THEN 'Destination Store Clerk'
    WHEN t.status = 'Arrived' THEN 'Destination Store Head'
    WHEN t.status = 'Pending PAO Confirmation' THEN 'PAO (Confirmation)'
    ELSE NULL
  END AS pending_action_by_role
FROM material_transfers t;

-- ---------------------------------------------------------------------------
-- COMMENTS for documentation
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN goods_receipts.pro_approved_by IS 'PRO who approved for GRN generation (Phase 1: Approval)';
COMMENT ON COLUMN goods_receipts.grn_generated_by IS 'Stock Clerk who generated GRN (Phase 2: Execution)';
COMMENT ON COLUMN goods_receipts.verified_by IS 'Store Head who verified physical stock (Phase 3: Verification)';

COMMENT ON COLUMN issue_vouchers.assigned_to_clerk IS 'Stock Clerk assigned to finalize voucher';
COMMENT ON COLUMN issue_vouchers.executed_by IS 'Stock Clerk who executed FIFO and bin cards';
COMMENT ON COLUMN issue_vouchers.physical_verified_by IS 'Store Head who verified physical materials';

COMMENT ON COLUMN material_transfers.source_clerk_dispatched_by IS 'Source store clerk who dispatched materials';
COMMENT ON COLUMN material_transfers.source_head_verified_by IS 'Source Store Head who verified dispatch';
COMMENT ON COLUMN material_transfers.dest_clerk_received_by IS 'Destination store clerk who received materials';
COMMENT ON COLUMN material_transfers.dest_head_verified_by IS 'Destination Store Head who verified receipt';
COMMENT ON COLUMN material_transfers.pao_confirmed_by IS 'PAO who confirmed completed transfer';

-- ---------------------------------------------------------------------------
-- Migration complete
-- ---------------------------------------------------------------------------

-- Log migration
-- INSERT INTO audit_logs (user_id, entity_type, entity_id, action, details)
-- VALUES (
--   (SELECT id FROM users WHERE role = 'Administrator' LIMIT 1),
--   'system',
--   NULL,
--   'Migration',
--   'Applied delegation tracking fields for SoD compliance (Phase 1: Database Foundation)'
-- );
