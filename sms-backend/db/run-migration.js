/**
 * Migration Runner
 * 
 * Runs SQL migration files against the database
 * Usage: node db/run-migration.js <migration-file>
 */

// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db');

async function runMigration(migrationFile) {
  const client = await pool.connect();
  
  try {
    console.log(`🔄 Running migration: ${migrationFile}`);
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Execute migration
    await client.query(sql);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log(`✅ Migration completed successfully: ${migrationFile}`);
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error(`❌ Migration failed: ${migrationFile}`);
    console.error(error.message);
    throw error;
    
  } finally {
    client.release();
  }
}

// Get migration file from command line
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Please provide a migration file name');
  console.error('Usage: node db/run-migration.js <migration-file>');
  console.error('Example: node db/run-migration.js 001_add_delegation_tracking.sql');
  process.exit(1);
}

// Run migration
runMigration(migrationFile)
  .then(() => {
    console.log('✅ Migration process complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration process failed');
    console.error(error);
    process.exit(1);
  });
