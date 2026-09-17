# System Architecture

## Tech Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **Icons:** Lucide React
- **PDF:** jsPDF, pdfmake
- **State:** Context API
- **Routing:** React Router v6

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Database:** PostgreSQL
- **Auth:** JWT
- **PDF:** PDFKit

### Database Design

**Key Tables:**
- `users` - User accounts and roles
- `items` - Inventory catalog
- `stores` - Store locations
- `goods_receipts` - Receipt headers
- `goods_receipt_items` - Receipt line items (multi-item support)
- `issue_vouchers` - SIV headers
- `issue_voucher_items` - SIV line items
- `bin_cards` - Stock movements (FIFO)
- `returns` - Return requests
- `transfers` - Inter-store transfers
- `fixed_assets` - Asset registry

**Multi-Item Support:**
```sql
goods_receipts (header)
  ├── receipt_type: 'Single Item' | 'Multi Item' | 'Donation' | 'Transfer'
  └── goods_receipt_items (lines)
      ├── tec_decision: 'Approved' | 'Rejected'
      ├── pro_approved: boolean
      └── grn_generated: boolean
```

## Performance Optimizations

### TEC Evaluation (Multi-Item)
**Before:** 105 queries for 100 items  
**After:** 5 queries (90%+ improvement)

**Optimization Techniques:**
1. Bulk UPDATE with PostgreSQL UNNEST
2. Single query for receipt + items
3. CTE (Common Table Expression) for UPDATE + SELECT
4. Client-side decision counting

### Query Example
```sql
-- Bulk update all items in one query
UPDATE goods_receipt_items gri
SET tec_decision = updates.decision,
    tec_remarks = updates.remarks
FROM (
  SELECT 
    unnest($1::uuid[]) as item_id,
    unnest($2::text[]) as decision,
    unnest($3::text[]) as remarks
) AS updates
WHERE gri.receipt_id = $4 
  AND gri.item_id = updates.item_id
```

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing (bcrypt)
- SQL injection prevention (parameterized queries)
- XSS protection
- CORS configuration

## Deployment

### Production Build
```bash
# Frontend
cd sms-frontend
npm run build
# Output: dist/

# Backend
cd sms-backend
npm start
# Uses PM2 or systemd for process management
```

### Environment Variables
```env
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/sms_db
JWT_SECRET=your-secret-key
PORT=4000

# Frontend (.env)
VITE_API_URL=http://localhost:4000
```

## Key Features

1. **Multi-item receipts** with per-item evaluation
2. **FIFO inventory** tracking with bin cards
3. **Workflow automation** with status-based routing
4. **PDF generation** for official forms (Model 19, 20)
5. **Audit logging** for all transactions
6. **Notification system** for workflow events
7. **Gate clearance** integration
8. **Return tracking** with quality evaluation
