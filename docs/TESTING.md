# Testing Guide

## Multi-Item Goods Receipt Test

### Step 1: Create Receipt (Store Head)
1. Login: `storehead@example.com / passwd`
2. Go to **Goods Receipts**
3. Click **"Record New Receipt"**
4. Select **"Multi-Item Delivery"**
5. Fill form:
   - Supplier: Office Supplies Ltd
   - Store: Main Store
   - PO Reference: PO-TEST-001
   - Delivery Date: Today
6. Add items:
   - Laptop Dell XPS, Qty: 10, Cost: 45000
   - Mouse Wireless, Qty: 20, Cost: 500
   - Keyboard Mechanical, Qty: 15, Cost: 1500
7. Submit

### Step 2: Evaluate (TEC)
1. Logout → Login: `yonas.tec@university.edu / passwd`
2. Find receipt, click **"Evaluate"**
3. **Per-item evaluation table appears**
4. Make decisions:
   - Laptop: ✓ Approved
   - Mouse: ✗ Rejected (wrong model)
   - Keyboard: ✓ Approved
5. Submit → Status becomes **"Partially Approved"**

### Step 3: PRO Approval
1. Logout → Login: `pro@example.com / passwd`
2. Review approved items
3. Approve for GRN generation

### Step 4: Generate GRN (Stock Clerk)
1. Logout → Login: `clerk@example.com / passwd`
2. Generate GRN for approved items only
3. Download Model 19 PDF

## Expected Results
- ✅ Multi-item receipt created
- ✅ Per-item evaluation UI shows
- ✅ Status: "Partially Approved" (mixed results)
- ✅ Evaluation < 100ms (optimized)
- ✅ Only approved items get GRN

## Troubleshooting
**Port in use:** `lsof -ti:4000 | xargs kill -9`  
**DB error:** Check PostgreSQL is running  
**Frontend blank:** Clear cache (Ctrl+Shift+R)
