# Business Workflows

## 1. Goods Receipt Workflow
**Flow:** Store Head → TEC → PRO → Stock Clerk → Store Head

1. **Store Head** records incoming delivery (single or multi-item)
2. **TEC** evaluates quality (approve/reject per item)
3. **PRO** approves for stock entry
4. **Stock Clerk** generates GRN (Model 19)
5. **Store Head** verifies physical receipt

**Status Flow:**
- Awaiting Evaluation → Awaiting PRO Approval / Partially Approved / Rejected
- PRO Approved → GRN Generated → Verified

## 2. Stock Issue Workflow
**Flow:** Department → PAO → Stock Clerk → Security

1. **Department Head** creates requisition
2. **PAO** approves requisition
3. **Stock Clerk** issues SIV (Stock Issue Voucher)
4. **Security Officer** verifies gate clearance

## 3. Returns Workflow
**Flow:** Department → TEC → Approval → Stock Entry

1. **Department** submits return request
2. **TEC** evaluates condition (Serviceable/Damaged)
3. **Store Head/PAO** approves
4. **Stock Clerk** restocks or marks for disposal

## 4. Inter-Store Transfer
**Flow:** Source Store → Transport → Destination Store

1. **Source Store** releases items
2. **Transport** moves items
3. **Destination Store** receives and confirms

## 5. Asset Disposal
**Flow:** Store Head → PAO → Approval → Write-off

1. **Store Head** flags obsolete/damaged items
2. **PAO** reviews and approves disposal
3. **Administrator** completes write-off
