const fs = require('fs');
const path = require('path');
const { query, initializePool, closePool } = require('./src/utils/database');

async function runMigration(migrationFile) {
  console.log(`🚀 Running migration: ${migrationFile}`);
  
  try {
    // Initialize database connection
    await initializePool();
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../../databases/migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await query(migrationSQL);
    
    console.log(`✅ Migration ${migrationFile} completed successfully!`);
    
  } catch (error) {
    console.error(`❌ Migration ${migrationFile} failed:`, error.message);
    throw error;
  } finally {
    await closePool();
  }
}

// Run specific migration
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Please specify migration file: node run-migration.js <filename>');
  process.exit(1);
}

runMigration(migrationFile)
  .then(() => {
    console.log('Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });