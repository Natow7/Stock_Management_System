# Delegation Workflow Testing Guide
## Phase 2: Goods Receipt → GRN Generation

**Status:** Ready for Testing  
**Date:** September 11, 2026

---

## 🎯 **Testing Objectives**

Verify that the 3-step delegation workflow works correctly:
1. ✅ PRO can approve TEC-approved receipts for GRN generation
2. ✅ Stock Clerk can execute GRN generation (FIFO, bin cards, stock update)
3. ✅ Store Head can verify physical stock
4. ✅ Authorization rules enforced (no role can skip steps)
5. ✅ Audit trail captured correctly

---

## 🔐 **Test User Setup**

You'll need JWT tokens for these test users:

```javascript
// From seed data
const testUsers = {
  pro: {
    email: "pro@example.com",
    password: "password",
    role: "Property Registration Officer"
  },
  clerk: {
    email: "clerk@example.com", 
    password: "password",
    role: "Stock Clerk"
  },
  storeHead: {
    email: "storehead@example.com",
    password: "password", 
    role: "Store Head"
  },
  tec: {
    email: "tec@example.com",
    password: "password",
    role: "Technical Evaluation Committee"
  }
};
```

---

## 📝 **Test Scenario: Complete Workflow**

### **Preconditions:**
1. Backend server running on http://localhost:4000
2. Database seeded with test data
3. At least one goods receipt in "Awaiting Evaluation" status

---

## 🧪 **Test Steps**

### **STEP 0: Get JWT Tokens**

```bash
# Login as each user and capture tokens
export PRO_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pro@example.com","password":"password"}' \
  | jq -r '.token')

export CLERK_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"clerk@example.com","password":"password"}' \
  | jq -r '.token')

export STOREHEAD_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"storehead@example.com","password":"password"}' \
  | jq -r '.token')

export TEC_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tec@example.com","password":"password"}' \
  | jq -r '.token')

echo "PRO Token: $PRO_TOKEN"
echo "Clerk Token: $CLERK_TOKEN"
echo "Store Head Token: $STOREHEAD_TOKEN"
echo "TEC Token: $TEC_TOKEN"
```

---

### **STEP 1: Create Test Goods Receipt**

```bash
# Create a goods receipt (as Stock Clerk or Store Head)
curl -X POST http://localhost:4000/api/goods-receipts \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "SUPPLIER_UUID_HERE",
    "storeId": "STORE_UUID_HERE",
    "itemId": "ITEM_UUID_HERE",
    "qty": 100,
    "poReference": "PO-2026-TEST-001",
    "expiryDate": "2027-12-31"
  }'

# Save the receipt ID from response
export RECEIPT_ID="COPY_ID_FROM_RESPONSE"
```

**Expected Result:**
- ✅ Status 201 Created
- ✅ Receipt status: "Awaiting Evaluation"
- ✅ Notification sent to TEC

---

### **STEP 2: TEC Evaluation (Existing Endpoint)**

```bash
# TEC approves the receipt
curl -X POST http://localhost:4000/api/goods-receipts/$RECEIPT_ID/evaluate \
  -H "Authorization: Bearer $TEC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "Approved",
    "remarks": "Quality inspection passed. Item meets specifications."
  }'
```

**Expected Result:**
- ✅ Status 200 OK
- ✅ Receipt status changed: "Awaiting Evaluation" → "Awaiting PRO Approval" *(NEW BEHAVIOR)*
- ✅ Notification sent to PRO (not Store Head anymore)

---

### **STEP 3: PRO Approval (NEW ENDPOINT)**

```bash
# PRO approves for GRN generation
curl -X POST http://localhost:4000/api/goods-receipts/$RECEIPT_ID/approve-for-grn \
  -H "Authorization: Bearer $PRO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalNotes": "Approved for GRN generation. Standard cost applied.",
    "unitCost": 150.00,
    "grnNumber": "GRN-2026-TEST-001"
  }'
```

**Expected Result:**
```json
{
  "receiptId": "uuid",
  "refNo": "GR-2026-XXX",
  "grnNumber": "GRN-2026-TEST-001",
  "unitCost": 150.00,
  "status": "PRO Approved",
  "message": "Approved for GRN generation. Awaiting Stock Clerk execution."
}
```

**Verify in Database:**
```sql
SELECT 
  ref_no,
  status,
  pro_approved_by,
  pro_approved_at,
  pro_approval_notes
FROM goods_receipts 
WHERE id = 'RECEIPT_ID';

-- Should show:
-- status: 'PRO Approved'
-- pro_approved_by: PRO's user ID
-- pro_approved_at: current timestamp
-- pro_approval_notes: 'Approved for GRN generation...'

SELECT grn_number, generated_by 
FROM grns 
WHERE goods_receipt_id = 'RECEIPT_ID';

-- Should show:
-- grn_number: 'GRN-2026-TEST-001'
-- generated_by: PRO's user ID
```

---

### **STEP 4: Stock Clerk GRN Execution (NEW ENDPOINT)**

```bash
# Stock Clerk generates GRN (executes the work)
curl -X POST http://localhost:4000/api/goods-receipts/$RECEIPT_ID/execute-grn \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bin": "A-01-05",
    "executionNotes": "GRN generated successfully. FIFO lot created, bin card updated."
  }'
```

**Expected Result:**
```json
{
  "receiptId": "uuid",
  "refNo": "GR-2026-XXX",
  "grnNumber": "GRN-2026-TEST-001",
  "bin": "A-01-05",
  "status": "Awaiting Store Head Verification",
  "message": "GRN generated successfully. Stock updated. Awaiting Store Head verification."
}
```

**Verify in Database:**
```sql
-- Check goods_receipts
SELECT 
  ref_no,
  status,
  grn_generated_by,
  grn_generated_at
FROM goods_receipts 
WHERE id = 'RECEIPT_ID';

-- Should show:
-- status: 'Awaiting Store Head Verification'
-- grn_generated_by: Clerk's user ID
-- grn_generated_at: current timestamp

-- Check FIFO lot created
SELECT * FROM fifo_lots 
WHERE source_reference = 'GRN-2026-TEST-001';

-- Should show new lot with:
-- qty: 100
-- unit_cost: 150.00
-- expiry_date: 2027-12-31

-- Check bin card entry
SELECT bc.bin, bce.direction, bce.reference, bce.qty
FROM bin_card_entries bce
JOIN bin_cards bc ON bc.id = bce.bin_card_id
WHERE bce.reference = 'GRN-2026-TEST-001';

-- Should show:
-- bin: 'A-01-05'
-- direction: 'Inbound'
-- reference: 'GRN-2026-TEST-001'
-- qty: 100

-- Check item location updated
SELECT bin FROM item_locations 
WHERE item_id = 'ITEM_UUID_HERE' 
  AND store_id = 'STORE_UUID_HERE';

-- Should show:
-- bin: 'A-01-05'

-- Check stock updated
SELECT qty_on_hand FROM items 
WHERE id = 'ITEM_UUID_HERE';

-- Should show increased quantity
```

---

### **STEP 5: Store Head Verification (NEW ENDPOINT)**

```bash
# Store Head verifies physical stock
curl -X POST http://localhost:4000/api/goods-receipts/$RECEIPT_ID/verify-physical-stock \
  -H "Authorization: Bearer $STOREHEAD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "physicalCountConfirmed": true,
    "verificationNotes": "Physical stock verified. Matches GRN quantity exactly. No discrepancies found."
  }'
```

**Expected Result:**
```json
{
  "receiptId": "uuid",
  "refNo": "GR-2026-XXX",
  "grnNumber": "GRN-2026-TEST-001",
  "status": "Verified",
  "message": "Physical stock verified successfully. GRN workflow complete."
}
```

**Verify in Database:**
```sql
SELECT 
  ref_no,
  status,
  verified_by,
  verified_at,
  verification_notes
FROM goods_receipts 
WHERE id = 'RECEIPT_ID';

-- Should show:
-- status: 'Verified'
-- verified_by: Store Head's user ID
-- verified_at: current timestamp
-- verification_notes: 'Physical stock verified...'
```

---

## ⚠️ **Negative Test Cases**

### **Test 1: Stock Clerk Cannot Approve (Authorization)**

```bash
# Try to approve as Stock Clerk (should fail)
curl -X POST http://localhost:4000/api/goods-receipts/$RECEIPT_ID/approve-for-grn \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalNotes": "Trying to approve as clerk"
  }'
```

**Expected Result:**
```json
{
  "error": "Only the Property Registration Officer can approve receipts for GRN generation."
}
```
Status: 403 Forbidden

---

### **Test 2: Cannot Skip Steps (Status Validation)**

```bash
# Try to execute GRN before PRO approval (should fail)
curl -X POST http://localhost:4000/api/goods-receipts/$RECEIPT_ID/execute-grn \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bin": "A-01-05"
  }'
```

**Expected Result:**
```json
{
  "error": "Receipt is 'Awaiting PRO Approval'. Can only execute GRN for PRO-approved receipts."
}
```
Status: 400 Bad Request

---

### **Test 3: Must Confirm Physical Count**

```bash
# Try to verify without confirming (should fail)
curl -X POST http://localhost:4000/api/goods-receipts/$RECEIPT_ID/verify-physical-stock \
  -H "Authorization: Bearer $STOREHEAD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "physicalCountConfirmed": false,
    "verificationNotes": "Not confirmed"
  }'
```

**Expected Result:**
```json
{
  "error": "Must confirm physical count matches GRN quantity."
}
```
Status: 400 Bad Request

---

### **Test 4: PRO Cannot Execute GRN (Segregation of Duties)**

```bash
# Try to execute as PRO (should fail)
curl -X POST http://localhost:4000/api/goods-receipts/$RECEIPT_ID/execute-grn \
  -H "Authorization: Bearer $PRO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bin": "A-01-05"
  }'
```

**Expected Result:**
```json
{
  "error": "Only Stock Clerks can execute GRN generation."
}
```
Status: 403 Forbidden

---

## 📊 **Verification Checklist**

After running the complete workflow, verify:

- [ ] **Status Progression:** Awaiting Evaluation → Awaiting PRO Approval → PRO Approved → Awaiting Store Head Verification → Verified
- [ ] **Database Tracking:**
  - [ ] `pro_approved_by`, `pro_approved_at`, `pro_approval_notes` populated
  - [ ] `grn_generated_by`, `grn_generated_at` populated
  - [ ] `verified_by`, `verified_at`, `verification_notes` populated
- [ ] **Stock Updates:**
  - [ ] FIFO lot created with correct qty, unit cost, expiry date
  - [ ] Bin card entry created (Inbound, correct reference)
  - [ ] Item location updated to correct bin
  - [ ] Item qty_on_hand increased by receipt qty
- [ ] **Notifications:**
  - [ ] TEC notified after receipt creation
  - [ ] PRO notified after TEC approval
  - [ ] Stock Clerk notified after PRO approval
  - [ ] Store Head notified after GRN execution
  - [ ] PRO/PAO notified after Store Head verification
- [ ] **Audit Logs:**
  - [ ] All 5 actions logged (create, evaluate, approve, execute, verify)
  - [ ] Delegation context visible in action descriptions
- [ ] **Authorization:**
  - [ ] Only PRO can approve for GRN
  - [ ] Only Stock Clerk can execute GRN
  - [ ] Only Store Head can verify
  - [ ] Cannot skip workflow steps

---

## 🔍 **Query Workflow View**

```sql
-- See complete workflow status
SELECT * FROM vw_goods_receipt_workflow 
WHERE ref_no = 'GR-2026-XXX';

-- Expected output:
-- ref_no: GR-2026-XXX
-- status: Verified
-- tec_evaluated_by: TEC user's name
-- pro_approved_by: PRO user's name
-- grn_generated_by: Clerk's name
-- verified_by: Store Head's name
-- pending_action_by_role: NULL (complete)
```

---

## ✅ **Success Criteria**

**Phase 2 Backend is complete when:**

1. ✅ All 3 new endpoints work correctly
2. ✅ Authorization enforced at each step
3. ✅ Complete audit trail captured
4. ✅ Stock updates executed correctly (FIFO, bin cards, item locations)
5. ✅ Notifications sent to correct roles at each step
6. ✅ Cannot skip workflow steps (status validation)
7. ✅ Database fields populated correctly
8. ✅ Old workflow still works (backward compatibility)

---

## 📈 **Next Steps After Backend Testing**

1. **Frontend Implementation** (Week 3):
   - PRO Dashboard with pending approvals list
   - Stock Clerk Dashboard with assigned GRN tasks
   - Store Head Dashboard with pending verifications
   - Update existing GRN generation UI to use new workflow

2. **Integration Testing**:
   - E2E tests covering complete workflow
   - Role-based UI tests
   - Performance testing with multiple concurrent workflows

3. **Documentation**:
   - User training materials
   - Process flow diagrams
   - Video walkthrough

---

**Last Updated:** September 11, 2026  
**Status:** Ready for Testing  
**Backend Files:**
- ✅ `src/controllers/goodsReceipts.controller.js` - 3 new functions added
- ✅ `src/routes/goodsReceipts.routes.js` - 3 new routes added
- ✅ `db/migrations/001_add_delegation_tracking.sql` - Migration applied
