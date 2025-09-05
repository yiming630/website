#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs SQL migrations in order
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'translation_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
};

// Create migrations table to track applied migrations
const createMigrationsTable = `
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT NOW()
  );
`;

async function runMigrations() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Starting database migrations...');
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`🏠 Host: ${dbConfig.host}:${dbConfig.port}`);
    
    // Create migrations tracking table
    await pool.query(createMigrationsTable);
    console.log('✅ Migrations table ready');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    if (sqlFiles.length === 0) {
      console.log('📭 No migration files found');
      return;
    }
    
    console.log(`📋 Found ${sqlFiles.length} migration files`);
    
    // Check which migrations have been applied
    const appliedResult = await pool.query('SELECT filename FROM migrations');
    const appliedMigrations = new Set(appliedResult.rows.map(r => r.filename));
    
    // Run pending migrations
    let migrationsRun = 0;
    for (const file of sqlFiles) {
      if (appliedMigrations.has(file)) {
        console.log(`⏭️  Skipping ${file} (already applied)`);
        continue;
      }
      
      console.log(`🚀 Running migration: ${file}`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Start transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Run migration
        await client.query(sql);
        
        // Record migration
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        
        await client.query('COMMIT');
        console.log(`✅ Migration ${file} completed`);
        migrationsRun++;
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration ${file} failed:`, error.message);
        throw error;
      } finally {
        client.release();
      }
    }
    
    if (migrationsRun === 0) {
      console.log('✅ All migrations are up to date');
    } else {
      console.log(`✅ Successfully ran ${migrationsRun} migrations`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations().then(() => {
  console.log('🎉 Migration process completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});