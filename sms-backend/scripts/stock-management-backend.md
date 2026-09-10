# Stock Management System - Backend Development Skill

## Project Context
This is a Stock Management System backend built with Node.js, Express, and PostgreSQL. The system manages inventory, requisitions, goods receipts, issue vouchers, transfers, and fixed assets for a university store.

## Architecture
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (running in Docker)
- **Authentication**: JWT-based with role-based access control (RBAC)
- **API Style**: RESTful with consistent error handling

## Key Roles & Permissions
1. **STORE_HEAD**: Full store management access
2. **STOCK_CLERK**: Stock operations (receipts, issues, bin cards)
3. **REQUISITIONER**: Create and view requisitions
4. **DEPARTMENT_HEAD**: Approve department requisitions
5. **RAO**: Approve requisitions, review reports
6. **DEP**: Final approval for high-value items
7. **TECHNICIAN**: Technical equipment management

## Coding Standards

### File Organization
```
src/
├── config/        # Database and configuration
├── middleware/    # Auth, error handling, async wrapper
├── controllers/   # Business logic
├── routes/        # API route definitions
└── app.js         # Express app setup
```

### Controller Pattern
```javascript
// Use asyncHandler for all async routes
const asyncHandler = require('../middleware/asyncHandler');

exports.functionName = asyncHandler(async (req, res) => {
  const { param } = req.body;
  const userId = req.user.id; // From authenticate middleware
  
  // Validate input
  if (!param) {
    return res.status(400).json({ error: 'Param is required' });
  }
  
  // Business logic with transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // ... operations
    await client.query('COMMIT');
    res.status(200).json({ data });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});
```

### Route Pattern
```javascript
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const controller = require('../controllers/module.controller');

// Public routes (if any)
router.post('/public', controller.publicFunction);

// Protected routes
router.use(authenticate);
router.get('/', requireRole(['STORE_HEAD', 'STOCK_CLERK']), controller.getAll);
router.post('/', requireRole(['STORE_HEAD']), controller.create);

module.exports = router;
```

### Database Queries
- Always use parameterized queries: `$1, $2, $3`
- Use transactions for multi-step operations
- Always release database clients in `finally` blocks
- Use proper error handling and rollback on failures

### Response Format
```javascript
// Success
res.status(200).json({ data: result });

// Created
res.status(201).json({ id: newId, message: 'Created successfully' });

// Error
res.status(400).json({ error: 'Descriptive error message' });
```

## Key Features to Remember
- All stock movements must update `stock_cards` table
- Requisitions follow a multi-stage approval workflow
- Bin cards track physical location movements
- Fixed assets have depreciation tracking
- Audit logs track all critical operations
- Notifications are generated for pending approvals

## When Adding New Features
1. Check existing patterns in similar controllers
2. Ensure proper role-based access control
3. Add database transactions where needed
4. Update audit logs for critical operations
5. Follow the established error handling pattern
6. Test with different user roles

## Database Connection
- Pool is imported from `../config/db`
- Always use `pool.connect()` for transactions
- Single queries can use `pool.query()` directly

## Testing Approach
- Use provided test accounts (see db/seed.js)
- Test each role's permissions
- Verify transaction rollbacks work
- Check audit log entries are created
