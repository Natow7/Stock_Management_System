#!/usr/bin/env node
const { pool } = require('../src/config/db');

async function debugRoles() {
  try {
    console.log('\n🔍 Checking all user roles...\n');
    
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        email, 
        role,
        LENGTH(role) as role_length,
        status
      FROM users
      ORDER BY role
    `);

    console.log('Found', result.rows.length, 'users:\n');
    
    result.rows.forEach(user => {
      const hasExtraChars = user.role.length !== user.role.trim().length;
      console.log(`${user.name} <${user.email}>`);
      console.log(`  Role: "${user.role}" (length: ${user.role_length})`);
      console.log(`  Status: ${user.status}`);
      
      if (hasExtraChars) {
        console.log(`  ⚠️  WARNING: Role has extra whitespace!`);
      }
      
      // Show hex for Stock Clerk roles
      if (user.role.toLowerCase().includes('clerk')) {
        console.log(`  Hex: ${Buffer.from(user.role).toString('hex')}`);
      }
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugRoles();
