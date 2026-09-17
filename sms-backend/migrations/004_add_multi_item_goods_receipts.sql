-- Migration: Add Multi-Item Goods Receipt Support
-- Date: 2026-09-15
-- Purpose: Enable recording multiple items in a single goods receipt (real-world delivery scenario)

-- ============================================================================
-- STEP 1: Add fields to goods_receipts (header table)
-- ============================================================================

-- Add receipt type to distinguish single vs multi-item
ALTER TABLE goods_receipts 
ADD COLUMN receipt_type TEXT NOT NULL DEFAULT 'Single Item'
CHECK (receipt_type IN ('Single Item', 'Multi Item', 'Donation', 'Transfer'));

-- Add delivery information
ALTER TABLE goods_receipts 
ADD COLUMN delivery_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE goods_receipts 
ADD COLUMN delivery_note_number TEXT;

ALTER TABLE goods_receipts 
ADD COLUMN total_items INTEGER DEFAULT 1;

-- Add header-level remarks (overall delivery notes)
ALTER TABLE goods_receipts 
ADD COLUMN delivery_remarks TEXT;

-- Make item_id and qty nullable (will be in line items for multi-item receipts)
ALTER TABLE goods_receipts 
ALTER COLUMN item_id DROP NOT NULL;

ALTER TABLE goods_receipts 
ALTER COLUMN qty DROP NOT NULL;

-- ============================================================================
-- STEP 2: Create goods_receipt_items table (line items)
-- ============================================================================

CREATE TABLE goods_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  qty NUMERIC(14, 2) NOT NULL CHECK (qty > 0),
  unit_cost NUMERIC(14, 2),
  expiry_date DATE,
  
  -- TEC evaluation per item
  tec_decision TEXT CHECK (tec_decision IN ('Approved', 'Rejected', NULL)),
  tec_remarks TEXT,
  tec_evaluated_at TIMESTAMPTZ,
  tec_evaluated_by UUID REFERENCES users(id),
  
  -- PRO approval per item
  pro_approved BOOLEAN DEFAULT false,
  pro_unit_cost NUMERIC(14, 2),
  pro_bin_location TEXT,
  pro_remarks TEXT,
  
  -- GRN execution per item
  grn_generated BOOLEAN DEFAULT false,
  grn_lot_id UUID,
  grn_generated_at TIMESTAMPTZ,
  grn_generated_by UUID REFERENCES users(id),
  
  -- Physical verification per item
  verified BOOLEAN DEFAULT false,
  physical_qty NUMERIC(14, 2),
  verification_remarks TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

CREATE INDEX idx_goods_receipt_items_receipt_id ON goods_receipt_items(receipt_id);
CREATE INDEX idx_goods_receipt_items_item_id ON goods_receipt_items(item_id);
CREATE INDEX idx_goods_receipt_items_tec_decision ON goods_receipt_items(tec_decision);
CREATE INDEX idx_goods_receipt_items_grn_generated ON goods_receipt_items(grn_generated);
CREATE INDEX idx_goods_receipt_items_verified ON goods_receipt_items(verified);

-- ============================================================================
-- STEP 4: Create views for easy querying
-- ============================================================================

-- View: Receipts with item count
CREATE OR REPLACE VIEW goods_receipts_with_items AS
SELECT 
  gr.*,
  COUNT(gri.id) as item_count,
  COUNT(CASE WHEN gri.tec_decision = 'Approved' THEN 1 END) as approved_items,
  COUNT(CASE WHEN gri.tec_decision = 'Rejected' THEN 1 END) as rejected_items,
  COUNT(CASE WHEN gri.grn_generated = true THEN 1 END) as grn_generated_items,
  COUNT(CASE WHEN gri.verified = true THEN 1 END) as verified_items
FROM goods_receipts gr
LEFT JOIN goods_receipt_items gri ON gr.id = gri.receipt_id
GROUP BY gr.id;

-- View: Pending TEC evaluation items
CREATE OR REPLACE VIEW pending_tec_evaluation_items AS
SELECT 
  gri.*,
  gr.ref_no as receipt_ref_no,
  gr.supplier_id,
  gr.store_id,
  gr.po_reference,
  gr.delivery_date,
  i.name as item_name,
  i.code as item_code,
  s.name as supplier_name
FROM goods_receipt_items gri
JOIN goods_receipts gr ON gri.receipt_id = gr.id
JOIN items i ON gri.item_id = i.id
JOIN suppliers s ON gr.supplier_id = s.id
WHERE gri.tec_decision IS NULL
  AND gr.status = 'Pending Evaluation'
ORDER BY gri.created_at ASC;

-- ============================================================================
-- STEP 5: Migrate existing single-item receipts to new structure
-- ============================================================================

-- For existing receipts with item_id, create corresponding line items
INSERT INTO goods_receipt_items (
  receipt_id,
  item_id,
  qty,
  unit_cost,
  expiry_date,
  tec_decision,
  tec_remarks,
  created_at
)
SELECT 
  id as receipt_id,
  item_id,
  qty,
  NULL as unit_cost,
  expiry_date,
  CASE 
    WHEN status = 'Rejected' THEN 'Rejected'
    WHEN status IN ('Awaiting PRO Approval', 'PRO Approved', 'Awaiting Store Head Verification', 'Verified') THEN 'Approved'
    ELSE NULL
  END as tec_decision,
  NULL as tec_remarks,
  created_at
FROM goods_receipts
WHERE item_id IS NOT NULL;

-- Update total_items count for migrated receipts
UPDATE goods_receipts 
SET total_items = 1,
    receipt_type = 'Single Item'
WHERE item_id IS NOT NULL;

-- ============================================================================
-- STEP 6: Add trigger to auto-update total_items count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_receipt_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE goods_receipts 
    SET total_items = (
      SELECT COUNT(*) 
      FROM goods_receipt_items 
      WHERE receipt_id = NEW.receipt_id
    )
    WHERE id = NEW.receipt_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE goods_receipts 
    SET total_items = (
      SELECT COUNT(*) 
      FROM goods_receipt_items 
      WHERE receipt_id = OLD.receipt_id
    )
    WHERE id = OLD.receipt_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_receipt_item_count
AFTER INSERT OR DELETE ON goods_receipt_items
FOR EACH ROW EXECUTE FUNCTION update_receipt_item_count();

-- ============================================================================
-- STEP 7: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE goods_receipt_items IS 'Line items for multi-item goods receipts. Each row represents one item in a delivery.';
COMMENT ON COLUMN goods_receipts.receipt_type IS 'Single Item: Legacy/simple receipts. Multi Item: Modern batch receipts. Donation: No PO. Transfer: Inter-store.';
COMMENT ON COLUMN goods_receipts.total_items IS 'Auto-calculated count of line items. Always 1 for Single Item type.';
COMMENT ON VIEW pending_tec_evaluation_items IS 'All receipt line items awaiting TEC inspection, with joined context data.';

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Check migration success
SELECT 
  'Migration Complete' as status,
  (SELECT COUNT(*) FROM goods_receipts) as total_receipts,
  (SELECT COUNT(*) FROM goods_receipt_items) as total_line_items,
  (SELECT COUNT(*) FROM goods_receipts WHERE receipt_type = 'Single Item') as single_item_receipts,
  (SELECT COUNT(*) FROM goods_receipts WHERE receipt_type = 'Multi Item') as multi_item_receipts;
