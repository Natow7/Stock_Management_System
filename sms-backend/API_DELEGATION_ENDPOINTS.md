# Delegation Workflow API Endpoints
## Phase 2: Goods Receipt → GRN Generation

**Status:** ✅ Implemented  
**Backend:** Complete  
**Frontend:** Pending

---

## 🔄 **New 3-Step Workflow**

### **Overview:**
```
TEC Evaluates → PRO Approves → Stock Clerk Executes → Store Head Verifies
```

**Old (Wrong):**
```
TEC → PRO generates GRN directly (does everything!)
```

**New (Correct - SoD Compliant):**
```
1. TEC evaluates → Status: "Awaiting PRO Approval"
2. PRO approves → Status: "PRO Approved"  
3. Stock Clerk generates GRN → Status: "Awaiting Store Head Verification"
4. Store Head verifies → Status: "Verified" ✅
```

---

## 📡 **API Endpoints**

### **1. PRO Approval for GRN Generation**

**Endpoint:** `POST /api/goods-receipts/:id/approve-for-grn`

**Authorization:** Property Registration Officer, Administrator

**Request Body:**
```json
{
  "approvalNotes": "Approved for GRN generation. Standard cost applied.",
  "grnNumber": "GRN-2024-001234",  // Optional: auto-generated if not provided
  "unitCost": 100.50                // Optional: uses item default if not provided
}
```

**Success Response (200):**
```json
{
  "receiptId": "uuid",
  "refNo": "GR-2026-014",
  "grnNumber": "GRN-2024-001234",
  "unitCost": 100.50,
  "status": "PRO Approved",
  "message": "Approved for GRN generation. Awaiting Stock Clerk execution."
}
```

**Validation Rules:**
- ✅ Must be Property Registration Officer
- ✅ Receipt status must be "Awaiting PRO Approval" (TEC-approved)
- ✅ GRN number auto-generated if not provided
- ✅ Unit cost uses item default if not provided

**What It Does:**
1. Updates status to "PRO Approved"
2. Records PRO approval (user, timestamp, notes)
3. Creates GRN record with assigned number
4. Notifies Stock Clerks of task assignment
5. Logs action with audit trail

**Error Responses:**
```json
// 403 Forbidden - Not PRO
{
  "error": "Only the Property Registration Officer can approve receipts for GRN generation."
}

// 400 Bad Request - Wrong status
{
  "error": "Receipt is 'Awaiting Evaluation'. Can only approve receipts that are 'Awaiting PRO Approval' (TEC-approved)."
}

// 404 Not Found
{
  "error": "Goods receipt not found."
}
```

---

### **2. Stock Clerk GRN Execution**

**Endpoint:** `POST /api/goods-receipts/:id/execute-grn`

**Authorization:** Stock Clerk, Administrator

**Request Body:**
```json
{
  "unitCost": 100.50,              // Optional: uses PRO-approved cost if not provided
  "bin": "A-01-05",                // Optional: defaults to "RECEIVING"
  "executionNotes": "GRN generated successfully. FIFO lot created, bin card updated."
}
```

**Success Response (200):**
```json
{
  "receiptId": "uuid",
  "refNo": "GR-2026-014",
  "grnNumber": "GRN-2024-001234",
  "bin": "A-01-05",
  "status": "Awaiting Store Head Verification",
  "message": "GRN generated successfully. Stock updated. Awaiting Store Head verification."
}
```

**Validation Rules:**
- ✅ Must be Stock Clerk
- ✅ Receipt status must be "PRO Approved"
- ✅ GRN number must exist (from PRO approval)
- ✅ Bin defaults to "RECEIVING" if not provided

**What It Does:**
1. Creates FIFO cost lot (with expiry date if applicable)
2. Creates/updates bin card entry
3. Updates item location
4. Updates item qty_on_hand
5. Creates stock card entry
6. Updates status to "Awaiting Store Head Verification"
7. Records clerk execution (user, timestamp)
8. Notifies Store Head for verification
9. Logs action with delegation context

**Error Responses:**
```json
// 403 Forbidden - Not Stock Clerk
{
  "error": "Only Stock Clerks can execute GRN generation."
}

// 400 Bad Request - No PRO approval
{
  "error": "Receipt is 'Awaiting PRO Approval'. Can only execute GRN for PRO-approved receipts."
}

// 400 Bad Request - No GRN number
{
  "error": "No GRN number assigned. PRO must approve first."
}
```

---

### **3. Store Head Physical Verification**

**Endpoint:** `POST /api/goods-receipts/:id/verify-physical-stock`

**Authorization:** Store Head, Administrator

**Request Body:**
```json
{
  "physicalCountConfirmed": true,   // Required: must be true
  "verificationNotes": "Physical stock verified. Matches GRN quantity exactly.",
  "discrepancies": null              // Optional: note any discrepancies
}
```

**Success Response (200):**
```json
{
  "receiptId": "uuid",
  "refNo": "GR-2026-014",
  "grnNumber": "GRN-2024-001234",
  "status": "Verified",
  "message": "Physical stock verified successfully. GRN workflow complete."
}
```

**Validation Rules:**
- ✅ Must be Store Head
- ✅ Receipt status must be "Awaiting Store Head Verification"
- ✅ `physicalCountConfirmed` must be `true`

**What It Does:**
1. Updates status to "Verified" (final status)
2. Records Store Head verification (user, timestamp, notes)
3. Notifies PRO and PAO of completion
4. Logs action with delegation context

**Error Responses:**
```json
// 403 Forbidden - Not Store Head
{
  "error": "Only Store Heads can verify physical stock."
}

// 400 Bad Request - Not confirmed
{
  "error": "Must confirm physical count matches GRN quantity."
}

// 400 Bad Request - Wrong status
{
  "error": "Receipt is 'PRO Approved'. Can only verify receipts that are 'Awaiting Store Head Verification'."
}
```

---

## 📊 **Status Flow**

```
Awaiting Evaluation (Stock Clerk records)
        ↓
    [TEC evaluates]
        ↓
Awaiting PRO Approval (TEC approved)
        ↓
    [PRO approves - NEW ENDPOINT]
        ↓
PRO Approved (Ready for clerk)
        ↓
    [Stock Clerk executes - NEW ENDPOINT]
        ↓
Awaiting Store Head Verification (GRN generated, stock updated)
        ↓
    [Store Head verifies - NEW ENDPOINT]
        ↓
Verified ✅ (Workflow complete)
```

---

## 🔐 **Authorization Matrix**

| Endpoint | PRO | Stock Clerk | Store Head | Admin |
|----------|-----|-------------|------------|-------|
| POST /evaluate | ❌ | ❌ | ❌ | ✅ |
| POST /approve-for-grn | ✅ | ❌ | ❌ | ✅ |
| POST /execute-grn | ❌ | ✅ | ❌ | ✅ |
| POST /verify-physical-stock | ❌ | ❌ | ✅ | ✅ |

*Note: Administrator has access to all endpoints for troubleshooting*

---

## 📝 **Database Fields Tracked**

### **goods_receipts Table:**

**PRO Approval:**
- `pro_approved_by` - UUID of PRO who approved
- `pro_approved_at` - Timestamp of approval
- `pro_approval_notes` - PRO's notes

**Clerk Execution:**
- `grn_generated_by` - UUID of Stock Clerk who executed
- `grn_generated_at` - Timestamp of execution

**Store Head Verification:**
- `verified_by` - UUID of Store Head who verified
- `verified_at` - Timestamp of verification
- `verification_notes` - Store Head's notes

---

## 🧪 **Testing Endpoints**

### **Test with cURL:**

```bash
# 1. PRO Approval
curl -X POST http://localhost:4000/api/goods-receipts/{id}/approve-for-grn \
  -H "Authorization: Bearer {jwt-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "approvalNotes": "Approved for GRN generation",
    "unitCost": 100.00
  }'

# 2. Stock Clerk Execution
curl -X POST http://localhost:4000/api/goods-receipts/{id}/execute-grn \
  -H "Authorization: Bearer {jwt-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "bin": "A-01-05",
    "executionNotes": "GRN generated successfully"
  }'

# 3. Store Head Verification
curl -X POST http://localhost:4000/api/goods-receipts/{id}/verify-physical-stock \
  -H "Authorization: Bearer {jwt-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "physicalCountConfirmed": true,
    "verificationNotes": "Physical stock verified"
  }'
```

---

## 🔍 **Querying Workflow Views**

The migration created helper views for easy workflow tracking:

```sql
-- View 1: See all goods receipts workflow status
SELECT * FROM vw_goods_receipt_workflow 
WHERE pending_action_by_role IS NOT NULL
ORDER BY created_at DESC;

-- View 2: Get receipts pending PRO approval
SELECT * FROM vw_goods_receipt_workflow
WHERE status = 'Awaiting PRO Approval';

-- View 3: Get receipts assigned to clerks
SELECT * FROM vw_goods_receipt_workflow
WHERE status = 'PRO Approved';

-- View 4: Get receipts awaiting Store Head verification
SELECT * FROM vw_goods_receipt_workflow
WHERE status = 'Awaiting Store Head Verification';
```

---

## ⚠️ **Migration Notes**

### **Backward Compatibility:**

The old endpoint still exists for backward compatibility:
```
POST /api/goods-receipts/:id/generate-grn (Deprecated)
```

**This will be removed in a future version.** Use the new 3-step workflow instead.

### **Modified Behavior:**

**TEC Evaluation endpoint (`POST /:id/evaluate`):**
- **OLD:** Set status to "Approved" after TEC approval
- **NEW:** Set status to "Awaiting PRO Approval" after TEC approval
- **Impact:** PRO can no longer directly generate GRN, must use new workflow

---

## 🎯 **Benefits**

✅ **Segregation of Duties** - No single person approves AND executes  
✅ **Clear Accountability** - Every step tracked with user and timestamp  
✅ **Fraud Prevention** - Approval and execution separated  
✅ **Audit Trail** - Complete delegation chain visible  
✅ **Real-world Alignment** - Matches actual university practices  

---

## 📈 **Next Steps**

### **Frontend Implementation** (Week 3)
1. PRO Dashboard - Show pending approvals
2. Stock Clerk Dashboard - Show assigned GRN tasks
3. Store Head Dashboard - Show pending verifications
4. Update UI to use new endpoints

### **Testing** (Week 3)
1. Unit tests for each endpoint
2. Integration tests for complete workflow
3. E2E tests from TEC to verification

---

**Last Updated:** Just Now  
**Status:** ✅ Backend Complete, Frontend Pending  
**Files Modified:**
- `src/controllers/goodsReceipts.controller.js`
- `src/routes/goodsReceipts.routes.js`
