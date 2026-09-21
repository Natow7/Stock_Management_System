-- ============================================================================
-- Migration 005: Add Rate Limiting for Brute Force Protection
-- ============================================================================
-- This migration adds the infrastructure needed to track failed login attempts
-- and temporarily lock accounts when they exceed a threshold. This defends
-- against online password guessing by forcing attackers to slow down.
-- ============================================================================

-- Table to track failed login attempts per user
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index for efficient lookups by email and time
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time 
  ON login_attempts(email, attempted_at DESC);

-- Table to track temporary account locks
CREATE TABLE IF NOT EXISTS account_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Too many failed login attempts',
  lock_count INTEGER NOT NULL DEFAULT 1
);

-- Index for checking active locks
CREATE INDEX IF NOT EXISTS idx_account_locks_email_until 
  ON account_locks(email, locked_until);

-- Function to clean up old login attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts() 
RETURNS void AS $$
BEGIN
  DELETE FROM login_attempts 
  WHERE attempted_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks() 
RETURNS void AS $$
BEGIN
  DELETE FROM account_locks 
  WHERE locked_until < now();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE login_attempts IS 'Tracks all login attempts (successful and failed) for rate limiting and security auditing';
COMMENT ON TABLE account_locks IS 'Tracks temporary account locks imposed after repeated failed authentication attempts';
COMMENT ON FUNCTION cleanup_old_login_attempts IS 'Removes login attempt records older than 24 hours to prevent unbounded growth';
COMMENT ON FUNCTION cleanup_expired_locks IS 'Removes account locks that have expired';
