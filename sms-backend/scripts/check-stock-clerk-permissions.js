#!/usr/bin/env node
/**
 * Diagnostic script to check Stock Clerk permissions
 * Run: node scripts/check-stock-clerk-permissions.js
 */

const { pool } = require('../src/config/db');

async function checkStockClerkPermissions() {
  console.log('\n🔍 Checking Stock Clerk Permissions...\n');

  try {
    // 1. Check all Stock Clerk users
    const clerks = await pool.query(
      `SELECT id, name, email, role, status FROM users WHERE role LIKE '%Clerk%'`
    );

    console.log('📋 Stock Clerk Users:');
    if (clerks.rows.length === 0) {
      console.log('  ❌ No Stock Clerk users found!');
    } else {
      clerks.rows.forEach(clerk => {
        console.log(`  - ${clerk.name} (${clerk.email})`);
        console.log(`    Role: "${clerk.role}" | Status: ${clerk.status}`);
        
        // Check for extra spaces or special characters
        const roleLength = clerk.role.length;
        const expectedLength = 'Stock Clerk'.length;
        if (roleLength !== expectedLength) {
          console.log(`    ⚠️  WARNING: Role length ${roleLength} != expected ${expectedLength}`);
          console.log(`    Raw bytes: ${Buffer.from(clerk.role).toString('hex')}`);
        }
      });
    }

    // 2. Check exact role match
    const exactMatch = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role = 'Stock Clerk' AND status = 'Active'`
    );
    console.log(`\n✓ Exact "Stock Clerk" matches: ${exactMatch.rows[0].count}`);

    // 3. Check goods receipt permissions
    console.log('\n📦 Goods Receipt Route Permissions:');
    console.log('  Allowed roles for POST /goods-receipts:');
    console.log('    - Store Head');
    console.log('    - Stock Clerk  ✓');
    console.log('    - Administrator');

    // 4. Check if any goods receipts exist
    const receipts = await pool.query(
      `SELECT COUNT(*) FROM goods_receipts WHERE created_by IN (
        SELECT id FROM users WHERE role = 'Stock Clerk'
      )`
    );
    console.log(`\n📊 Existing goods receipts created by Stock Clerks: ${receipts.rows[0].count}`);

    console.log('\n✅ Diagnostic complete!\n');
    console.log('💡 If you see mismatches, the issue is likely:');
    console.log('   1. Extra spaces in role name (check raw bytes above)');
    console.log('   2. User status is not "Active"');
    console.log('   3. JWT token has wrong role (re-login to refresh)');
    console.log('   4. Database connection using wrong database\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkStockClerkPermissions();
