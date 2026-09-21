const { pool } = require("../config/db");
const { ApiError } = require("./errorHandler");

/**
 * Rate Limiting Configuration
 * 
 * These constants define the brute force mitigation policy:
 * - MAX_FAILED_ATTEMPTS: Number of consecutive failures before locking
 * - LOCK_DURATION_MINUTES: How long an account stays locked
 * - ATTEMPT_WINDOW_MINUTES: Time window for counting failures
 * 
 * A cost high enough to be genuinely slow for an attacker is also slow for
 * every legitimate user, so the lockout is short (15 minutes) to balance
 * security against user inconvenience.
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;
const ATTEMPT_WINDOW_MINUTES = 30;

/**
 * Records a login attempt in the database for rate limiting tracking.
 * 
 * This function is called after every authentication attempt, whether
 * successful or not. The record includes the outcome, timestamp, and
 * client metadata for security auditing.
 * 
 * @param {string} email - User's email address
 * @param {boolean} success - Whether the login succeeded
 * @param {object} req - Express request object (for IP and user agent)
 */
async function recordLoginAttempt(email, success, req) {
  const ipAddress = req.ip || req.connection?.remoteAddress || null;
  const userAgent = req.get("user-agent") || null;

  await pool.query(
    `INSERT INTO login_attempts (email, success, ip_address, user_agent, attempted_at)
     VALUES ($1, $2, $3, $4, now())`,
    [email, success, ipAddress, userAgent]
  );
}

/**
 * Checks if an account is currently locked due to excessive failed attempts.
 * 
 * Returns the lock record if the account is locked and the lock is still
 * active (locked_until is in the future). Returns null if no active lock
 * exists.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<object|null>} Lock record or null
 */
async function getActiveLock(email) {
  const result = await pool.query(
    `SELECT * FROM account_locks 
     WHERE email = $1 AND locked_until > now()`,
    [email]
  );

  return result.rows[0] || null;
}

/**
 * Counts recent failed login attempts for a given email address.
 * 
 * Only counts attempts within the configured time window (default 30 minutes)
 * that occurred after the most recent successful login, if any. This ensures
 * a successful login clears the counter, which is what separates a legitimate
 * user mistyping a password from an attacker working through a list.
 * 
 * @param {string} email - User's email address
 * @returns {Promise<number>} Count of recent failed attempts
 */
async function countRecentFailedAttempts(email) {
  // Find the most recent successful login to reset the counter
  const lastSuccessResult = await pool.query(
    `SELECT attempted_at FROM login_attempts 
     WHERE email = $1 AND success = true 
     ORDER BY attempted_at DESC LIMIT 1`,
    [email]
  );

  const lastSuccess = lastSuccessResult.rows[0]?.attempted_at;

  // Count failed attempts since last success or within the time window
  let query;
  let params;

  if (lastSuccess) {
    // Count failures after the last successful login
    query = `SELECT COUNT(*) as count FROM login_attempts 
             WHERE email = $1 AND success = false AND attempted_at > $2`;
    params = [email, lastSuccess];
  } else {
    // No successful login recorded, count within time window
    query = `SELECT COUNT(*) as count FROM login_attempts 
             WHERE email = $1 AND success = false 
             AND attempted_at > now() - INTERVAL '${ATTEMPT_WINDOW_MINUTES} minutes'`;
    params = [email];
  }

  const result = await pool.query(query, params);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Creates or updates an account lock after too many failed attempts.
 * 
 * If the account is already locked, extends the lock duration and increments
 * the lock count. This prevents an attacker from simply waiting out the
 * initial lock period.
 * 
 * @param {string} email - User's email address
 */
async function lockAccount(email) {
  const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);

  // Try to update existing lock first (increment lock count)
  const updateResult = await pool.query(
    `UPDATE account_locks 
     SET locked_at = now(), 
         locked_until = $1, 
         lock_count = lock_count + 1
     WHERE email = $2
     RETURNING id`,
    [lockUntil, email]
  );

  // If no existing lock, create a new one
  if (updateResult.rows.length === 0) {
    await pool.query(
      `INSERT INTO account_locks (email, locked_at, locked_until, lock_count)
       VALUES ($1, now(), $2, 1)
       ON CONFLICT (email) 
       DO UPDATE SET locked_at = now(), locked_until = $2, lock_count = account_locks.lock_count + 1`,
      [email, lockUntil]
    );
  }
}

/**
 * Removes the account lock after a successful login.
 * 
 * This is called when a user successfully authenticates, clearing any
 * previous lock state and resetting the failure counter.
 * 
 * @param {string} email - User's email address
 */
async function clearAccountLock(email) {
  await pool.query(
    `DELETE FROM account_locks WHERE email = $1`,
    [email]
  );
}

/**
 * Middleware to check rate limiting before processing login requests.
 * 
 * This is applied to the /login endpoint and rejects requests if:
 * 1. The account is currently locked due to previous failed attempts
 * 2. The number of recent failed attempts exceeds the threshold
 * 
 * The middleware runs on the server, so an unauthorized request crafted
 * directly against the API is rejected just the same as one blocked in
 * the interface.
 */
async function checkRateLimit(req, res, next) {
  const { email } = req.body;

  if (!email) {
    return next(); // Let the controller handle missing email
  }

  try {
    // Check if account is currently locked
    const activeLock = await getActiveLock(email);
    if (activeLock) {
      const minutesRemaining = Math.ceil(
        (new Date(activeLock.locked_until) - new Date()) / 60000
      );

      throw new ApiError(
        429,
        `Account temporarily locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s).`
      );
    }

    // Check if we're approaching the limit
    const failedAttempts = await countRecentFailedAttempts(email);
    
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      // Lock the account
      await lockAccount(email);
      
      throw new ApiError(
        429,
        `Account locked due to too many failed login attempts. Please try again in ${LOCK_DURATION_MINUTES} minutes.`
      );
    }

    // If we're at the warning threshold, add a header (but allow the attempt)
    if (failedAttempts >= MAX_FAILED_ATTEMPTS - 2) {
      res.setHeader(
        "X-Login-Attempts-Remaining",
        MAX_FAILED_ATTEMPTS - failedAttempts
      );
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Log unexpected errors but don't block login attempts
    console.error("Rate limiting check failed:", error);
    next();
  }
}

/**
 * Cleanup function to remove old records and prevent unbounded growth.
 * 
 * Should be called periodically (e.g., via a scheduled job) to:
 * - Remove login attempts older than 24 hours
 * - Remove expired account locks
 */
async function cleanupOldRecords() {
  try {
    await pool.query(`SELECT cleanup_old_login_attempts()`);
    await pool.query(`SELECT cleanup_expired_locks()`);
    console.log("Rate limiting cleanup completed successfully");
  } catch (error) {
    console.error("Rate limiting cleanup failed:", error);
  }
}

module.exports = {
  checkRateLimit,
  recordLoginAttempt,
  clearAccountLock,
  lockAccount,
  cleanupOldRecords,
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MINUTES,
};
