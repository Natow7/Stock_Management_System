#!/usr/bin/env node
/**
 * Security Audit Script
 * 
 * Verifies that all four OWASP security measures are properly implemented:
 * 1. SQL Injection Prevention (parameterized queries)
 * 2. Role-Based Authorization (server-side checks)
 * 3. Credential Protection (bcrypt hashing)
 * 4. Brute Force Mitigation (rate limiting)
 * 
 * Run this script to audit the security posture of the backend API.
 */

const fs = require("fs");
const path = require("path");

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
  log(`\n${"=".repeat(70)}`, colors.cyan);
  log(message, colors.cyan);
  log("=".repeat(70), colors.cyan);
}

// Recursively find all JavaScript files in a directory
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== "node_modules") {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith(".js")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Check for SQL injection vulnerabilities
function auditSqlInjection() {
  header("1. SQL INJECTION PREVENTION AUDIT");

  const srcDir = path.join(__dirname, "..", "src");
  const files = findJsFiles(srcDir);

  let totalQueries = 0;
  let vulnerableQueries = 0;
  const vulnerabilities = [];

  // Dangerous patterns that suggest SQL injection risk
  const dangerousPatterns = [
    /pool\.query\([^,]*\$\{[^}]*\}/g, // Template literal in query
    /pool\.query\([^,]*\+[^)]*\)/g, // String concatenation in query
    /client\.query\([^,]*\$\{[^}]*\}/g,
    /client\.query\([^,]*\+[^)]*\)/g,
  ];

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");

    // Count parameterized queries (safe pattern)
    const safeQueryPattern = /(?:pool|client)\.query\(/g;
    const safeMatches = content.match(safeQueryPattern) || [];
    totalQueries += safeMatches.length;

    // Check for dangerous patterns
    lines.forEach((line, index) => {
      dangerousPatterns.forEach((pattern) => {
        if (pattern.test(line)) {
          vulnerableQueries++;
          vulnerabilities.push({
            file: path.relative(srcDir, file),
            line: index + 1,
            code: line.trim(),
          });
        }
      });
    });
  });

  log(`\nTotal database queries found: ${totalQueries}`, colors.blue);

  if (vulnerableQueries === 0) {
    log(
      "✓ All queries use parameterized statements (no SQL injection risk detected)",
      colors.green
    );
  } else {
    log(
      `✗ Found ${vulnerableQueries} potential SQL injection vulnerabilities:`,
      colors.red
    );
    vulnerabilities.forEach((vuln) => {
      log(`  ${vuln.file}:${vuln.line}`, colors.yellow);
      log(`    ${vuln.code}`, colors.reset);
    });
  }

  return vulnerableQueries === 0;
}

// Check role-based authorization on routes
function auditAuthorization() {
  header("2. ROLE-BASED AUTHORIZATION AUDIT");

  const routesDir = path.join(__dirname, "..", "src", "routes");
  const files = findJsFiles(routesDir);

  let totalProtectedRoutes = 0;
  let unprotectedRoutes = 0;
  const issues = [];

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");

    // Check if authenticate middleware is imported
    const hasAuthImport = /require.*authenticate/.test(content);
    const hasRoleImport = /require.*requireRole/.test(content);

    // Find all route definitions
    const routePattern =
      /router\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g;
    let match;

    while ((match = routePattern.exec(content)) !== null) {
      const method = match[1];
      const route = match[2];
      const lineIndex = content.substring(0, match.index).split("\n").length;
      const routeLine = lines[lineIndex - 1];

      // Skip public routes
      if (route === "/login" || route === "/") {
        continue;
      }

      totalProtectedRoutes++;

      // Check if route has authentication or authorization
      const hasAuth =
        /authenticate/.test(routeLine) ||
        /requireRole/.test(routeLine) ||
        /router\.use\(authenticate\)/.test(content);

      if (!hasAuth) {
        unprotectedRoutes++;
        issues.push({
          file: path.relative(path.join(__dirname, ".."), file),
          route: `${method.toUpperCase()} ${route}`,
          line: lineIndex,
        });
      }
    }
  });

  log(`\nTotal protected routes found: ${totalProtectedRoutes}`, colors.blue);

  if (unprotectedRoutes === 0) {
    log(
      "✓ All routes have server-side authentication/authorization checks",
      colors.green
    );
  } else {
    log(
      `✗ Found ${unprotectedRoutes} routes without proper authorization:`,
      colors.red
    );
    issues.forEach((issue) => {
      log(`  ${issue.file}:${issue.line} - ${issue.route}`, colors.yellow);
    });
  }

  return unprotectedRoutes === 0;
}

// Check credential protection
function auditCredentialProtection() {
  header("3. CREDENTIAL PROTECTION AUDIT");

  const authController = path.join(
    __dirname,
    "..",
    "src",
    "controllers",
    "auth.controller.js"
  );
  const usersController = path.join(
    __dirname,
    "..",
    "src",
    "controllers",
    "users.controller.js"
  );

  let passed = true;

  // Check if bcrypt is used
  [authController, usersController].forEach((file) => {
    if (!fs.existsSync(file)) {
      log(`✗ Controller not found: ${file}`, colors.red);
      passed = false;
      return;
    }

    const content = fs.readFileSync(file, "utf8");
    const filename = path.basename(file);

    // Check for bcrypt import
    if (!/require.*bcrypt/.test(content)) {
      log(`✗ bcrypt not imported in ${filename}`, colors.red);
      passed = false;
      return;
    }

    // Check for bcrypt.hash usage (password storage) - only in users controller
    if (filename === "users.controller.js" && !/bcrypt\.(hash|hashSync)\(/.test(content)) {
      log(
        `✗ bcrypt.hash not used in ${filename} for password storage`,
        colors.red
      );
      passed = false;
      return;
    }

    // Check for bcrypt.compare usage (password verification) - only in auth controller
    if (
      filename === "auth.controller.js" &&
      !/bcrypt\.(compare|compareSync)\(/.test(content)
    ) {
      log(
        `✗ bcrypt.compare not used in ${filename} for password verification`,
        colors.red
      );
      passed = false;
      return;
    }

    // Check that passwords are not logged or returned
    if (/console\.log.*password(?!_hash)/.test(content)) {
      log(
        `⚠ Warning: Possible password logging in ${filename}`,
        colors.yellow
      );
    }

    if (/"password":\s*\w+(?!\.)/.test(content) && !/password_hash/.test(content)) {
      log(
        `⚠ Warning: Password might be exposed in API response in ${filename}`,
        colors.yellow
      );
    }
  });

  if (passed) {
    log(
      "\n✓ Passwords are hashed with bcrypt before storage",
      colors.green
    );
    log("✓ Password verification uses bcrypt.compare", colors.green);
  }

  return passed;
}

// Check brute force protection
function auditBruteForceProtection() {
  header("4. BRUTE FORCE MITIGATION AUDIT");

  const rateLimiterPath = path.join(
    __dirname,
    "..",
    "src",
    "middleware",
    "rateLimiter.js"
  );
  const authRoutesPath = path.join(
    __dirname,
    "..",
    "src",
    "routes",
    "auth.routes.js"
  );
  const migrationPath = path.join(
    __dirname,
    "..",
    "db",
    "migrations",
    "005_add_rate_limiting.sql"
  );

  let passed = true;

  // Check if rate limiter middleware exists
  if (!fs.existsSync(rateLimiterPath)) {
    log("✗ Rate limiter middleware not found", colors.red);
    passed = false;
  } else {
    log("✓ Rate limiter middleware exists", colors.green);

    const content = fs.readFileSync(rateLimiterPath, "utf8");

    // Check for key functions
    const requiredFunctions = [
      "recordLoginAttempt",
      "checkRateLimit",
      "countRecentFailedAttempts",
      "lockAccount",
    ];

    requiredFunctions.forEach((func) => {
      if (!content.includes(func)) {
        log(`✗ Missing function: ${func}`, colors.red);
        passed = false;
      }
    });
  }

  // Check if rate limiting is applied to login route
  if (!fs.existsSync(authRoutesPath)) {
    log("✗ Auth routes file not found", colors.red);
    passed = false;
  } else {
    const content = fs.readFileSync(authRoutesPath, "utf8");

    if (!/checkRateLimit/.test(content)) {
      log("✗ Rate limiting not applied to login route", colors.red);
      passed = false;
    } else {
      log("✓ Rate limiting applied to login route", colors.green);
    }
  }

  // Check if database migration exists
  if (!fs.existsSync(migrationPath)) {
    log("✗ Rate limiting database migration not found", colors.yellow);
    log("  Migration needs to be run to enable rate limiting", colors.yellow);
  } else {
    log("✓ Rate limiting database migration exists", colors.green);
  }

  return passed;
}

// Main audit function
function runSecurityAudit() {
  log("\n", colors.reset);
  log("╔════════════════════════════════════════════════════════════════════╗", colors.cyan);
  log("║           SPMS Backend Security Audit (OWASP Top 10)              ║", colors.cyan);
  log("╚════════════════════════════════════════════════════════════════════╝", colors.cyan);

  const results = {
    sqlInjection: auditSqlInjection(),
    authorization: auditAuthorization(),
    credentialProtection: auditCredentialProtection(),
    bruteForce: auditBruteForceProtection(),
  };

  header("AUDIT SUMMARY");

  const allPassed = Object.values(results).every((r) => r === true);

  if (allPassed) {
    log("\n✓ All security measures are properly implemented!", colors.green);
    log(
      "\nThe backend follows OWASP security best practices:",
      colors.green
    );
    log("  • SQL Injection Prevention: Parameterized queries", colors.green);
    log("  • Role-Based Authorization: Server-side checks", colors.green);
    log("  • Credential Protection: bcrypt hashing", colors.green);
    log("  • Brute Force Mitigation: Rate limiting", colors.green);
  } else {
    log(
      "\n✗ Some security measures need attention. Review the details above.",
      colors.red
    );
  }

  log("\n");

  // Exit with non-zero code if any checks failed
  process.exit(allPassed ? 0 : 1);
}

// Run the audit
runSecurityAudit();
