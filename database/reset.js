#!/usr/bin/env node

/**
 * Database Reset Script - LOCAL TESTING ONLY
 * ==========================================
 * 
 * WARNING: This script will completely destroy and recreate the database!
 * 
 * Purpose:
 * --------
 * This script is designed for local development and testing purposes only.
 * It provides a clean way to reset your database to a known state during development.
 * 
 * What it does:
 * -------------
 * 1. Drops ALL tables in the database (destroys all data)
 * 2. Drops all functions and triggers
 * 3. Recreates the entire schema from schema.sql
 * 4. Leaves you with a clean, empty database
 * 
 * Usage:
 * ------
 * node database/reset.js
 * 
 * Or if added to package.json scripts:
 * npm run db:reset
 * 
 * Safety Features:
 * ----------------
 * - 3-second delay before execution (press Ctrl+C to cancel)
 * - Only works with local database (checks DATABASE_URL)
 * - Clear warning messages
 * 
 * After running this script:
 * --------------------------
 * - All user data will be gone
 * - All projects will be deleted
 * - All documents will be removed
 * - All translations will be lost
 * - You'll need to run db:init to create test data
 * 
 * NEVER RUN THIS IN PRODUCTION!
 * ==============================
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Safety check - ensure we're only running on localhost
if (!process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1')) {
  console.error('🚨 ERROR: This script can only be run on local databases!');
  console.error('Database URL must contain "localhost" or "127.0.0.1"');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function resetDatabase() {
  try {
    await client.connect();
    
    console.log('========================================');
    console.log('   DATABASE RESET - LOCAL TESTING ONLY  ');
    console.log('========================================');
    console.log('');
    console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!');
    console.log('');
    console.log('Database: ' + process.env.DB_NAME);
    console.log('Host: ' + process.env.DB_HOST);
    console.log('');
    console.log('The following will be destroyed:');
    console.log('  • All user accounts');
    console.log('  • All projects');
    console.log('  • All documents and translations');
    console.log('  • All chat messages');
    console.log('  • All session data');
    console.log('');
    console.log('Press Ctrl+C NOW to cancel, or wait 3 seconds to continue...');
    console.log('');
    
    // Countdown
    for (let i = 3; i > 0; i--) {
      process.stdout.write(`  ${i}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n');
    
    // Drop all tables with cascade to handle dependencies
    console.log('🗑️  Step 1: Dropping all existing tables...');
    await client.query(`
      -- Drop all tables in reverse dependency order
      DROP TABLE IF EXISTS user_sessions CASCADE;
      DROP TABLE IF EXISTS translation_segments CASCADE;
      DROP TABLE IF EXISTS chat_messages CASCADE;
      DROP TABLE IF EXISTS translation_jobs CASCADE;
      DROP TABLE IF EXISTS documents CASCADE;
      DROP TABLE IF EXISTS projects CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      
      -- Drop functions
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
      
      -- Drop extensions (will be recreated)
      DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
    `);
    console.log('   ✓ All tables dropped');
    
    // Read and execute schema
    console.log('\n📝 Step 2: Creating fresh database schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    console.log('   ✓ Schema created successfully');
    
    // Verify the reset
    console.log('\n🔍 Step 3: Verifying database structure...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('   Created tables:');
    tables.rows.forEach(row => {
      console.log(`     • ${row.table_name}`);
    });
    
    console.log('\n========================================');
    console.log('✅ DATABASE RESET COMPLETE!');
    console.log('========================================');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run "node database/init.js" to add test data');
    console.log('2. Or start developing with a clean database');
    console.log('');
    console.log('Test credentials (after running init.js):');
    console.log('  Email: test@example.com');
    console.log('  Password: test123');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERROR: Failed to reset database');
    console.error('');
    console.error('Error details:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('');
      console.error('Is PostgreSQL running? Try:');
      console.error('  brew services start postgresql@16');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the reset
resetDatabase();