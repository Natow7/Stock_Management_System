const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool, withTransaction } = require("../config/db");
const { logAction } = require("../utils/audit");
const { ApiError } = require("../middleware/errorHandler");
const {
  recordLoginAttempt,
  clearAccountLock,
} = require("../middleware/rateLimiter");

/**
 * Login endpoint with integrated brute force protection.
 * 
 * Security measures implemented:
 * 1. Parameterized queries prevent SQL injection
 * 2. bcrypt comparison protects credentials at rest
 * 3. Rate limiting tracks failed attempts (via rateLimiter middleware)
 * 4. Audit logging records all authentication events
 * 
 * The password is never stored or logged in plaintext. bcrypt's comparison
 * function works directly with the hash, so even this comparison step never
 * reconstructs the original password.
 */
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password)
    throw new ApiError(400, "Email and password are required.");

  // Use parameterized query to prevent SQL injection. User input (email)
  // is passed as a bound parameter ($1), never concatenated into the SQL string.
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  const user = result.rows[0];

  if (!user || user.status !== "Active") {
    // Record failed attempt before throwing error
    await recordLoginAttempt(email, false, req);
    throw new ApiError(401, "Invalid credentials or inactive account.");
  }

  // bcrypt.compare() handles the hash comparison securely. The plaintext
  // password is compared against the stored hash without ever recovering
  // the original password from the hash.
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    // Record failed attempt for rate limiting
    await recordLoginAttempt(email, false, req);
    throw new ApiError(401, "Invalid credentials.");
  }

  // Successful login: clear any account locks and record the success
  await clearAccountLock(email);
  await recordLoginAttempt(email, true, req);

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    storeId: user.store_id,
    department: user.department,
  };

  // JWT signed with secret from environment variable
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });

  await withTransaction((client) =>
    logAction(client, {
      user: payload,
      module: "Authentication",
      action: "Logged in",
    }),
  );

  res.json({ token, user: payload });
}

async function logout(req, res) {
  // JWTs are stateless: the client discards the token. We still record the
  // action for the audit trail.
  await withTransaction((client) =>
    logAction(client, {
      user: req.user,
      module: "Authentication",
      action: "Logged out",
    }),
  );
  res.json({ message: "Logged out." });
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, logout, me };
