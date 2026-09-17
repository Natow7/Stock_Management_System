-- Migration: Add Gate Clearance Pre-Approval System
-- Purpose: Allow Store Head to request Security Officer pre-approval before voucher finalization
-- Date: 2026-09-13
-- Related: PENDING_TASKS.md - Security Officer Phase 1

-- ---------------------------------------------------------------------------
-- PART 1: Create gate_clearance_requests table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gate_clearance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to issue voucher
  issue_voucher_id UUID NOT NULL REFERENCES issue_vouchers(id) ON DELETE CASCADE,
  
  -- Request details
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Collector information
  collector_name TEXT NOT NULL,
  collector_id_number TEXT NOT NULL,
  collector_phone TEXT NOT NULL,
  collector_department TEXT,
  vehicle_registration TEXT,
  
  -- Scheduled pickup
  scheduled_pickup_date DATE NOT NULL,
  scheduled_pickup_time TIME NOT NULL,
  pickup_justification TEXT,
  
  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'Pending' 
    CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Collected', 'Cancelled')),
  
  -- Security Officer decision
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  security_notes TEXT,
  
  -- Collection tracking
  collected_at TIMESTAMPTZ,
  collection_verified_by UUID REFERENCES users(id),
  actual_collector_name TEXT,
  discrepancy_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- PART 2: Add gate clearance tracking to issue_vouchers
-- ---------------------------------------------------------------------------

-- Add gate clearance requirement flag
ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS requires_gate_clearance BOOLEAN DEFAULT true;

-- Add gate clearance status tracking
ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS gate_clearance_requested BOOLEAN DEFAULT false;

ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS gate_clearance_approved BOOLEAN DEFAULT false;

ALTER TABLE issue_vouchers 
  ADD COLUMN IF NOT EXISTS gate_clearance_request_id UUID REFERENCES gate_clearance_requests(id);

-- ---------------------------------------------------------------------------
-- PART 3: Update existing gate_clearances table (if needed)
-- ---------------------------------------------------------------------------

-- The old gate_clearances table was for POST-finalization clearance
-- We keep it for backward compatibility but add reference to new pre-approval
ALTER TABLE gate_clearances 
  ADD COLUMN IF NOT EXISTS clearance_request_id UUID REFERENCES gate_clearance_requests(id);

-- ---------------------------------------------------------------------------
-- PART 4: Indexes for performance
-- ---------------------------------------------------------------------------

-- Partial unique index: only one active clearance request per voucher
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_clearance_per_voucher 
  ON gate_clearance_requests(issue_voucher_id) 
  WHERE status IN ('Pending', 'Approved');

CREATE INDEX IF NOT EXISTS idx_clearance_requests_status 
  ON gate_clearance_requests(status, scheduled_pickup_date);

CREATE INDEX IF NOT EXISTS idx_clearance_requests_voucher 
  ON gate_clearance_requests(issue_voucher_id);

CREATE INDEX IF NOT EXISTS idx_clearance_requests_security 
  ON gate_clearance_requests(status, approved_by);

CREATE INDEX IF NOT EXISTS idx_vouchers_clearance_status 
  ON issue_vouchers(gate_clearance_requested, gate_clearance_approved);

-- ---------------------------------------------------------------------------
-- PART 5: Update audit_logs to track clearance workflow
-- ---------------------------------------------------------------------------

-- Add clearance-related action types
COMMENT ON TABLE gate_clearance_requests IS 
  'Pre-approval requests from Store Head to Security Officer for gate clearance before voucher finalization';

COMMENT ON COLUMN gate_clearance_requests.status IS 
  'Pending: Awaiting Security approval | Approved: Security approved | Rejected: Security rejected | Collected: Materials picked up | Cancelled: Request cancelled';

COMMENT ON COLUMN gate_clearance_requests.collector_id_number IS 
  'National ID, Employee ID, or other official identification number';

COMMENT ON COLUMN gate_clearance_requests.scheduled_pickup_date IS 
  'Date when materials will be collected (for Security scheduling)';

COMMENT ON COLUMN gate_clearance_requests.pickup_justification IS 
  'Why materials need to leave the compound (project needs, delivery, etc.)';

COMMENT ON COLUMN issue_vouchers.requires_gate_clearance IS 
  'If true, voucher cannot be finalized without Security pre-approval';

-- ---------------------------------------------------------------------------
-- PART 6: Create view for Security Officer dashboard
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW security_clearance_dashboard AS
SELECT 
  gcr.id AS clearance_request_id,
  gcr.status AS clearance_status,
  gcr.scheduled_pickup_date,
  gcr.scheduled_pickup_time,
  gcr.collector_name,
  gcr.collector_id_number,
  gcr.collector_phone,
  gcr.vehicle_registration,
  gcr.pickup_justification,
  gcr.requested_at,
  
  -- Voucher details
  iv.id AS voucher_id,
  iv.ref_no AS voucher_ref,
  iv.status AS voucher_status,
  
  -- Store details
  s.name AS store_name,
  
  -- Requester details
  u_req.name AS requested_by_name,
  u_req.email AS requested_by_email,
  
  -- Approval details
  u_app.name AS approved_by_name,
  gcr.approved_at,
  gcr.rejection_reason,
  gcr.security_notes,
  
  -- Time tracking
  EXTRACT(EPOCH FROM (gcr.scheduled_pickup_date + gcr.scheduled_pickup_time - now())) / 3600 AS hours_until_pickup,
  EXTRACT(EPOCH FROM (now() - gcr.requested_at)) / 3600 AS hours_since_request
  
FROM gate_clearance_requests gcr
JOIN issue_vouchers iv ON gcr.issue_voucher_id = iv.id
JOIN stores s ON iv.store_id = s.id
JOIN users u_req ON gcr.requested_by = u_req.id
LEFT JOIN users u_app ON gcr.approved_by = u_app.id
ORDER BY 
  CASE gcr.status
    WHEN 'Pending' THEN 1
    WHEN 'Approved' THEN 2
    ELSE 3
  END,
  gcr.scheduled_pickup_date,
  gcr.scheduled_pickup_time;

-- ---------------------------------------------------------------------------
-- PART 7: Create view for Store Head clearance tracking
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW store_head_clearance_tracking AS
SELECT 
  iv.id AS voucher_id,
  iv.ref_no AS voucher_ref,
  iv.status AS voucher_status,
  iv.gate_clearance_requested,
  iv.gate_clearance_approved,
  
  -- Clearance request details
  gcr.id AS clearance_request_id,
  gcr.status AS clearance_status,
  gcr.scheduled_pickup_date,
  gcr.collector_name,
  gcr.requested_at,
  gcr.approved_at,
  gcr.approved_by,
  gcr.rejection_reason,
  
  -- Store details
  s.name AS store_name,
  
  -- Can finalize?
  CASE
    WHEN NOT iv.requires_gate_clearance THEN true
    WHEN iv.gate_clearance_approved THEN true
    ELSE false
  END AS can_finalize,
  
  -- Status indicators
  CASE
    WHEN gcr.status = 'Pending' THEN 'Awaiting Security Approval'
    WHEN gcr.status = 'Approved' THEN 'Approved - Can Finalize'
    WHEN gcr.status = 'Rejected' THEN 'Rejected - Revise and Resubmit'
    WHEN NOT iv.requires_gate_clearance THEN 'No Clearance Required'
    WHEN NOT iv.gate_clearance_requested THEN 'Clearance Not Requested'
    ELSE 'Unknown'
  END AS clearance_action_needed
  
FROM issue_vouchers iv
JOIN stores s ON iv.store_id = s.id
LEFT JOIN gate_clearance_requests gcr ON iv.gate_clearance_request_id = gcr.id
WHERE iv.status = 'Approved' -- Only show approved vouchers awaiting finalization
ORDER BY 
  iv.gate_clearance_approved ASC,
  gcr.scheduled_pickup_date ASC;

-- ---------------------------------------------------------------------------
-- PART 8: Sample data for testing (optional - comment out in production)
-- ---------------------------------------------------------------------------

-- This section can be uncommented for development/testing

/*
-- Insert test clearance request (requires actual voucher IDs from your database)
INSERT INTO gate_clearance_requests (
  issue_voucher_id,
  requested_by,
  collector_name,
  collector_id_number,
  collector_phone,
  scheduled_pickup_date,
  scheduled_pickup_time,
  pickup_justification,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000000'::UUID, -- Replace with actual voucher ID
  '00000000-0000-0000-0000-000000000000'::UUID, -- Replace with Store Head user ID
  'John Doe',
  'ID123456',
  '+251911234567',
  CURRENT_DATE + INTERVAL '1 day',
  '14:00:00',
  'Delivering materials to Department X for project Y',
  'Pending'
);
*/

-- ---------------------------------------------------------------------------
-- Migration complete
-- ---------------------------------------------------------------------------

-- Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gate_clearance_requests') THEN
    RAISE EXCEPTION 'Migration failed: gate_clearance_requests table not created';
  END IF;
  
  RAISE NOTICE 'Migration 002_add_gate_clearance_requests completed successfully';
  RAISE NOTICE 'Security Officer pre-approval workflow is now available';
END $$;
