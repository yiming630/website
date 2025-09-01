const fs = require('fs');
const path = require('path');
const { query } = require('./database');

async function runContactMigration() {
  console.log('🚀 Running contact management migration...');
  
  try {
    // Read the contact migration file
    const migrationPath = path.join(__dirname, '../../../../databases/migrations/002_add_contact_management.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await query(migrationSQL);
    
    console.log('✅ Contact management migration completed successfully!');
    
    // Test the migration by checking if tables exist
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'contact%'
    `);
    
    console.log('📋 Created contact tables:', tablesResult.rows.map(row => row.table_name));
    
    return true;
  } catch (error) {
    console.error('❌ Contact migration failed:', error.message);
    throw error;
  }
}

module.exports = { runContactMigration };