# Security Implementation Guide

This document describes the four critical security measures implemented in the SPMS backend, following OWASP Top 10 guidelines and security best practices.

## Table of Contents

1. [SQL Injection Prevention](#sql-injection-prevention)
2. [Role-Based Authorization](#role-based-authorization)
3. [Credential Protection](#credential-protection)
4. [Brute Force Mitigation](#brute-force-mitigation)
5. [Security Audit](#security-audit)
6. [Configuration](#configuration)

---

## SQL Injection Prevention

**Threat:** Attackers can manipulate SQL queries by injecting malicious code through user input, potentially accessing or modifying unauthorized data.

**Mitigation:** All database queries use **parameterized statements** (prepared statements) where user input is passed as bound parameters, never concatenated into SQL strings.

### Implementation

Every database query follows this pattern:

```javascript
// ✓ CORRECT: Parameterized query
const result = await pool.query(
  `SELECT * FROM users WHERE email = $1 AND status = $2`,
  [email, 'Active']
);

// ✗ WRONG: String concatenation (vulnerable to SQL injection)
const result = await pool.query(
  `SELECT * FROM users WHERE email = '${email}' AND status = 'Active'`
);
```

### Key Points

- **PostgreSQL's parameter binding** (`$1`, `$2`, etc.) ensures data is always treated as data, never as executable SQL.
- This defends against:
  - Straightforward injection attempts
  - Encoding-bypass variants
  - Second-order injection (malicious values stored on one request, interpreted as SQL on another)
- Applied **uniformly** across all controllers and queries

### Files to Review

- All controllers in `src/controllers/`
- Database utility functions in `src/config/db.js`
- Audit script: `scripts/security-audit.js`

---

## Role-Based Authorization

**Threat:** Users can access functionality or data beyond their assigned role by crafting direct API requests.

**Mitigation:** Server-side authorization checks on every protected endpoint using the `requireRole()` middleware factory.

### Implementation

Authorization is enforced at the route level:

```javascript
const requireRole = require('../middleware/requireRole');

// Only administrators can create users
router.post('/users', 
  authenticate, 
  requireRole('Administrator'), 
  asyncHandler(ctrl.create)
);

// Multiple roles can be specified
router.post('/requisitions/:id/decide', 
  authenticate,
  requireRole('Department Head', 'Store Head'),
  asyncHandler(ctrl.decide)
);
```

### Middleware Factory Pattern

The `requireRole()` function returns a middleware that:

1. Verifies the user is authenticated (`req.user` exists)
2. Checks if `req.user.role` matches one of the allowed roles
3. Returns HTTP 403 (Forbidden) if the role check fails
4. Allows the request to proceed to the controller if authorized

```javascript
// src/middleware/requireRole.js
function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Role '${req.user.role}' is not permitted to perform this action.`,
        allowedRoles,
      });
    }
    next();
  };
}
```

### Key Points

- **Server-side enforcement:** Authorization runs on the backend, not just hidden in the UI
- **Uniform application:** Every workflow endpoint is protected
- **Explicit allow-list:** Each route explicitly declares which roles can access it
- **12 system roles** supported (Administrator, Store Head, Stock Clerk, etc.)

### System Roles

1. Administrator
2. Property Administration Officer
3. Store Head
4. Stock Clerk
5. Technical Evaluation Committee
6. Property Registration Officer
7. Department Head
8. Requesting Staff
9. Accountant
10. Disposal Committee
11. Campus Security Officer
12. Issue Voucher Clerk (delegation role)

### Files to Review

- Middleware: `src/middleware/requireRole.js`
- Routes: All files in `src/routes/`
- Role definitions: `src/config/roles.js`

---

## Credential Protection

**Threat:** If the database is compromised, attackers gain access to user credentials and can use them for unauthorized access.

**Mitigation:** Passwords are hashed with **bcrypt** before storage. The database never stores recoverable passwords.

### Implementation

#### Password Hashing (User Creation/Update)

```javascript
const bcrypt = require('bcryptjs');

// Hash password with cost factor of 10
const passwordHash = await bcrypt.hash(password, 10);

await client.query(
  `INSERT INTO users (email, password_hash) VALUES ($1, $2)`,
  [email, passwordHash]
);
```

#### Password Verification (Login)

```javascript
const result = await pool.query(
  `SELECT * FROM users WHERE email = $1`,
  [email]
);
const user = result.rows[0];

// Compare plaintext password against stored hash
const valid = await bcrypt.compare(password, user.password_hash);
if (!valid) {
  throw new ApiError(401, 'Invalid credentials.');
}
```

### Cost Factor Configuration

The bcrypt cost factor is set to **10**, which balances:

- **Security:** High enough to slow down offline cracking attempts
- **Performance:** Fast enough for responsive login experience

```javascript
// Higher cost = more secure but slower
// Cost of 10 = ~100ms per hash on modern hardware
await bcrypt.hash(password, 10);
```

### Key Points

- **One-way hashing:** bcrypt creates irreversible hashes
- **Salt included:** bcrypt automatically generates and stores a unique salt per password
- **No plaintext exposure:** Passwords are hashed immediately upon receipt
- **Comparison without recovery:** `bcrypt.compare()` verifies without reconstructing the original
- **Database compromise protection:** Even with database access, attackers cannot recover working passwords

### Security Properties

1. **At rest:** Database stores only hashes (`password_hash` column)
2. **In transit:** HTTPS (TLS) protects credentials during transmission
3. **In memory:** Plaintext passwords only exist briefly during verification
4. **In logs:** Passwords are never logged (audit logs record events, not credentials)

### Files to Review

- Login: `src/controllers/auth.controller.js`
- User creation: `src/controllers/users.controller.js`
- Password utilities: Look for `bcrypt.hash()` and `bcrypt.compare()` usage

---

## Brute Force Mitigation

**Threat:** Attackers can guess passwords by trying many combinations rapidly (online password guessing).

**Mitigation:** **Rate limiting** tracks failed login attempts and temporarily locks accounts after exceeding a threshold.

### Implementation

#### Database Schema

Two tables track login attempts and account locks:

```sql
-- Track all login attempts
CREATE TABLE login_attempts (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE
);

-- Track temporary account locks
CREATE TABLE account_locks (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  locked_at TIMESTAMPTZ DEFAULT now(),
  locked_until TIMESTAMPTZ NOT NULL,
  reason TEXT DEFAULT 'Too many failed login attempts',
  lock_count INTEGER DEFAULT 1
);
```

#### Rate Limiting Policy

```javascript
const MAX_FAILED_ATTEMPTS = 5;      // Lock after 5 failures
const LOCK_DURATION_MINUTES = 15;   // Lock for 15 minutes
const ATTEMPT_WINDOW_MINUTES = 30;  // Count failures in 30-minute window
```

#### Workflow

1. **Before login attempt:** `checkRateLimit` middleware verifies account is not locked
2. **After failed login:** `recordLoginAttempt(email, false, req)` logs the failure
3. **After successful login:** `clearAccountLock(email)` removes any lock and resets counter
4. **When threshold exceeded:** Account is automatically locked for the configured duration

#### Middleware Application

```javascript
// Rate limiting applied to login endpoint
router.post('/login', checkRateLimit, asyncHandler(ctrl.login));
```

### Key Features

#### Counter Reset on Success

The failure counter resets on successful login, which differentiates:

- **Legitimate user:** Mistypes password a few times, then succeeds → counter clears
- **Attacker:** Sustains continuous failures → counter accumulates → account locks

#### Progressive Lockout

If an attacker waits out the initial lock and resumes guessing:

```javascript
// Lock count increments with each new lock period
UPDATE account_locks 
SET lock_count = lock_count + 1, 
    locked_until = $1
WHERE email = $2
```

#### Warning Headers

Users approaching the limit receive a warning:

```javascript
if (failedAttempts >= MAX_FAILED_ATTEMPTS - 2) {
  res.setHeader('X-Login-Attempts-Remaining', MAX_FAILED_ATTEMPTS - failedAttempts);
}
```

### Cleanup and Maintenance

Old records are cleaned up to prevent unbounded growth:

```javascript
// Run periodically (e.g., daily cron job)
const { cleanupOldRecords } = require('./src/middleware/rateLimiter');

await cleanupOldRecords();
// Removes login attempts older than 24 hours
// Removes expired account locks
```

### Key Points

- **Online guessing defense:** Slows down attackers working through password lists
- **User-friendly:** Short lock duration (15 minutes) balances security and convenience
- **Audit trail:** All attempts logged with IP address and user agent
- **Server-side enforcement:** Cannot be bypassed by direct API calls

### Configuration

Adjust policy in `src/middleware/rateLimiter.js`:

```javascript
const MAX_FAILED_ATTEMPTS = 5;      // Increase for more lenient policy
const LOCK_DURATION_MINUTES = 15;   // Increase for stricter policy
const ATTEMPT_WINDOW_MINUTES = 30;  // Adjust time window
```

### Files to Review

- Middleware: `src/middleware/rateLimiter.js`
- Controller: `src/controllers/auth.controller.js` (integration)
- Routes: `src/routes/auth.routes.js`
- Migration: `db/migrations/005_add_rate_limiting.sql`

---

## Security Audit

Run the automated security audit to verify all measures are properly implemented:

```bash
cd sms-backend
node scripts/security-audit.js
```

### What the Audit Checks

1. **SQL Injection Prevention**
   - Scans all database queries
   - Flags queries using string concatenation or template literals
   - Confirms parameterized queries are used throughout

2. **Role-Based Authorization**
   - Scans all route definitions
   - Identifies routes without authentication/authorization middleware
   - Verifies uniform protection across endpoints

3. **Credential Protection**
   - Checks for bcrypt import and usage
   - Verifies password hashing on storage
   - Verifies password comparison on verification
   - Warns about potential password exposure

4. **Brute Force Mitigation**
   - Verifies rate limiter middleware exists
   - Checks for required functions
   - Confirms rate limiting is applied to login route
   - Checks for database migration

### Sample Output

```
╔════════════════════════════════════════════════════════════════════╗
║           SPMS Backend Security Audit (OWASP Top 10)              ║
╚════════════════════════════════════════════════════════════════════╝

======================================================================
1. SQL INJECTION PREVENTION AUDIT
======================================================================

Total database queries found: 247
✓ All queries use parameterized statements (no SQL injection risk detected)

======================================================================
2. ROLE-BASED AUTHORIZATION AUDIT
======================================================================

Total protected routes found: 89
✓ All routes have server-side authentication/authorization checks

======================================================================
3. CREDENTIAL PROTECTION AUDIT
======================================================================

✓ Passwords are hashed with bcrypt before storage
✓ Password verification uses bcrypt.compare

======================================================================
4. BRUTE FORCE MITIGATION AUDIT
======================================================================

✓ Rate limiter middleware exists
✓ Rate limiting applied to login route
✓ Rate limiting database migration exists

======================================================================
AUDIT SUMMARY
======================================================================

✓ All security measures are properly implemented!

The backend follows OWASP security best practices:
  • SQL Injection Prevention: Parameterized queries
  • Role-Based Authorization: Server-side checks
  • Credential Protection: bcrypt hashing
  • Brute Force Mitigation: Rate limiting
```

---

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=8h

# Rate Limiting (optional, defaults in code)
MAX_FAILED_LOGIN_ATTEMPTS=5
LOGIN_LOCK_DURATION_MINUTES=15
LOGIN_ATTEMPT_WINDOW_MINUTES=30

# bcrypt Cost Factor (optional, default 10)
BCRYPT_COST_FACTOR=10
```

### Database Setup

Run migrations to set up rate limiting tables:

```bash
cd sms-backend
npm run migrate
```

Or manually apply migration:

```bash
psql -d your_database -f db/migrations/005_add_rate_limiting.sql
```

### Scheduled Cleanup

Set up a daily cleanup job to remove old records:

```javascript
// Example: Daily cleanup at 3 AM
const cron = require('node-cron');
const { cleanupOldRecords } = require('./src/middleware/rateLimiter');

cron.schedule('0 3 * * *', async () => {
  console.log('Running rate limiting cleanup...');
  await cleanupOldRecords();
});
```

Or use a system cron job:

```bash
# Add to crontab
0 3 * * * cd /path/to/sms-backend && node -e "require('./src/middleware/rateLimiter').cleanupOldRecords()"
```

---

## Testing Security Measures

### Test SQL Injection Prevention

Try injecting SQL through various inputs:

```bash
# Attempt SQL injection in email field
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com OR 1=1--","password":"test"}'

# Expected: Login fails (injection treated as literal email address)
```

### Test Authorization

Try accessing protected endpoints without proper role:

```bash
# Get token for a Requesting Staff user
TOKEN="eyJhbGc..."

# Try to create a user (requires Administrator role)
curl -X POST http://localhost:4000/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","role":"Stock Clerk"}'

# Expected: HTTP 403 Forbidden
```

### Test Brute Force Protection

Try multiple failed login attempts:

```bash
# Attempt 1-5: Failed logins
for i in {1..5}; do
  curl -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}'
done

# Attempt 6: Account should be locked
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"correctpassword"}'

# Expected: HTTP 429 Too Many Requests
# Message: "Account locked due to too many failed login attempts"
```

### Test Credential Protection

Verify passwords are hashed:

```sql
-- Check database directly
SELECT email, password_hash, role 
FROM users 
WHERE email = 'test@example.com';

-- Expected: password_hash starts with $2a$ or $2b$ (bcrypt format)
-- Example: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

---

## Security Principles Applied

### Defense in Depth

Multiple layers of security work together:

1. **Client-side:** UI validates input, hides unauthorized features
2. **Transport:** HTTPS/TLS encrypts data in transit
3. **Server-side:** Authorization checks enforce access control
4. **Database:** Parameterized queries prevent injection
5. **Storage:** bcrypt hashing protects credentials at rest

### Uniform Application

Security controls are applied uniformly, not selectively:

- **Not selective:** "Important endpoints are protected"
- **Uniform:** "All endpoints are protected"

An attacker needs only one unprotected endpoint to compromise the system.

### Principle of Least Privilege

Users receive minimum permissions needed for their role:

```javascript
// Store clerk can only view and manage inventory
requireRole('Stock Clerk')

// Only administrators can create/modify users
requireRole('Administrator')

// Department heads approve requisitions for their department only
requireRole('Department Head') + scope validation
```

### Audit Trail

All security-relevant events are logged:

- Successful logins
- Failed login attempts
- Authorization failures
- Credential changes
- Account lock events

```javascript
await logAction(client, {
  user: req.user,
  module: 'Authentication',
  action: 'Logged in',
});
```

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/sql-prepare.html)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

## Maintenance Checklist

- [ ] Run security audit regularly (`node scripts/security-audit.js`)
- [ ] Review failed login attempts weekly
- [ ] Monitor account lock incidents
- [ ] Update dependencies monthly (especially bcrypt, jsonwebtoken)
- [ ] Review and update JWT_SECRET periodically
- [ ] Test authorization on new endpoints
- [ ] Audit new database queries for parameterization
- [ ] Schedule cleanup job for old login attempts
- [ ] Review access logs for suspicious patterns
- [ ] Keep bcrypt cost factor appropriate for hardware

---

**Document Version:** 1.0  
**Last Updated:** 2026-09-21  
**Maintained By:** Backend Security Team
