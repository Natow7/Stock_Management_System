# API Reference

## Goods Receipts

### Create Receipt
```http
POST /api/goods-receipts
Content-Type: application/json

{
  "receiptType": "Multi Item",
  "supplierId": "uuid",
  "storeId": "uuid",
  "poReference": "PO-2026-001",
  "deliveryDate": "2026-09-16",
  "deliveryNoteNumber": "DN-123",
  "items": [
    {
      "itemId": "uuid",
      "qty": 10,
      "unitCost": 45000,
      "expiryDate": "2027-12-31"
    }
  ]
}
```

### List Receipts
```http
GET /api/goods-receipts

Response: Array of receipts with items JSON
```

### Evaluate Receipt
```http
POST /api/goods-receipts/:id/evaluate

// Multi-item mode
{
  "itemDecisions": [
    {
      "itemId": "uuid",
      "decision": "Approved",
      "remarks": "Quality acceptable"
    }
  ]
}

// Single-item mode
{
  "decision": "Approved",
  "remarks": "Quality acceptable"
}
```

### Generate GRN
```http
POST /api/goods-receipts/:id/generate-grn

{
  "unitCost": 45000,
  "bin": "A1-SHELF-3"
}
```

## Issue Vouchers

### Create SIV
```http
POST /api/issue-vouchers

{
  "requestorId": "uuid",
  "departmentId": "uuid",
  "items": [
    {
      "itemId": "uuid",
      "requestedQty": 5
    }
  ]
}
```

### Approve Voucher
```http
POST /api/issue-vouchers/:id/approve
```

### Issue Items
```http
POST /api/issue-vouchers/:id/issue
```

## Returns

### Create Return
```http
POST /api/returns

{
  "voucherId": "uuid",
  "itemId": "uuid",
  "qty": 2,
  "reason": "Defective"
}
```

### Evaluate Return
```http
POST /api/returns/:id/evaluate

{
  "condition": "Serviceable",
  "remarks": "Minor scratches, still usable"
}
```

## Gate Clearance

### Verify Exit
```http
POST /api/gate-clearance/verify

{
  "voucherRefNo": "SIV-2026-001"
}
```

## Authentication

All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

Login to get token:
```http
POST /api/auth/login

{
  "email": "user@example.com",
  "password": "passwd"
}
```
