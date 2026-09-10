# Stock Management System - Database Schema Knowledge

## Core Tables Overview

### users
- Stores all system users with role-based access
- Fields: id, username, email, password_hash, role, department_id, store_id
- Roles: STORE_HEAD, STOCK_CLERK, REQUISITIONER, DEPARTMENT_HEAD, RAO, DEP, TECHNICIAN

### items
- Master inventory items catalog
- Links to categories, suppliers, stores
- Tracks: description, unit, reorder_level, current_stock, unit_price
- Item types: CONSUMABLE, ASSET

### stock_cards
- Complete transaction history for all stock movements
- Every receipt, issue, transfer, or adjustment creates an entry
- Fields: item_id, transaction_type, quantity, balance_after, reference_type, reference_id

### requisitions
- Purchase or internal requisitions
- Multi-stage approval workflow: PENDING → DEPT_APPROVED → RAO_APPROVED → DEP_APPROVED → COMPLETED
- Links to requisition_items for line items

### goods_receipts
- Records incoming stock (purchases, donations, transfers-in)
- Links to suppliers and requisitions (if purchase order)
- Updates stock_cards and item quantities

### issue_vouchers
- Records outgoing stock to departments/users
- Links to approved requisitions
- Updates stock_cards and item quantities

### transfers
- Stock movements between stores/locations
- Creates stock_card entries for both source and destination

### fixed_assets
- Tracks non-consumable assets
- Includes: asset_tag, cost, depreciation, location, condition
- Status: ACTIVE, UNDER_REPAIR, DISPOSED

### bin_cards
- Physical location tracking within stores
- Records: bin_location, quantity, last_counted_date

## Key Relationships
- items → categories (many-to-one)
- items → suppliers (many-to-one)
- items → stores (many-to-one)
- requisitions → users (requester)
- requisitions → requisition_items (one-to-many)
- goods_receipts → suppliers (many-to-one)
- issue_vouchers → requisitions (many-to-one)
- stock_cards → items (many-to-one)

## Transaction Patterns

### Stock Receipt Flow
1. Create goods_receipt record
2. Create stock_card entry (RECEIPT type)
3. Update items.current_stock (increment)
4. Update bin_cards if bin location specified

### Stock Issue Flow
1. Verify approved requisition exists
2. Create issue_voucher record
3. Create stock_card entry (ISSUE type)
4. Update items.current_stock (decrement)
5. Update requisition status to COMPLETED

### Stock Transfer Flow
1. Create transfer record
2. Create stock_card entry for source (TRANSFER_OUT)
3. Create stock_card entry for destination (TRANSFER_IN)
4. Update items.current_stock for both locations

## Important Constraints
- current_stock cannot go negative
- Requisitions must be approved before issuing stock
- All stock movements must maintain audit trail
- Fixed assets require proper disposal approval

## Query Patterns
- Always join with users for created_by/updated_by info
- Use aggregate functions for stock reports
- Filter by store_id for multi-store operations
- Use date ranges for period-based reports
