/**
 * Database Connection Tests
 * Tests PostgreSQL connection and basic operations
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

// Database configuration
const dbConfig = {
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'translation_platform',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  connectionTimeoutMillis: 5000
};

async function runTest(name, testFn) {
  const startTime = Date.now();
  const test = { name, status: 'pending', duration: 0, error: null };
  
  try {
    console.log(`Running: ${name}...`);
    await testFn();
    test.status = 'passed';
    results.summary.passed++;
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    test.status = 'failed';
    test.error = error.message;
    results.summary.failed++;
    console.log(`❌ ${name} - FAILED: ${error.message}`);
  } finally {
    test.duration = Date.now() - startTime;
    results.tests.push(test);
    results.summary.total++;
  }
}

async function testDatabaseConnection() {
  const pool = new Pool(dbConfig);
  
  await runTest('Database Connection', async () => {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    if (!result.rows[0]) throw new Error('No response from database');
  });

  await runTest('Database Version Check', async () => {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    client.release();
    console.log(`  Database: ${result.rows[0].version.split(',')[0]}`);
  });

  await runTest('Tables Existence Check', async () => {
    const client = await pool.connect();
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    client.release();
    
    const tables = result.rows.map(r => r.table_name);
    console.log(`  Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Check for expected tables
    const expectedTables = ['users', 'projects', 'documents'];
    const missingTables = expectedTables.filter(t => !tables.includes(t));
    if (missingTables.length > 0) {
      console.log(`  ⚠️ Missing tables: ${missingTables.join(', ')}`);
    }
  });

  await runTest('User Table Query', async () => {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM users');
      console.log(`  Users count: ${result.rows[0].count}`);
    } catch (error) {
      if (error.code === '42P01') {
        throw new Error('Users table does not exist');
      }
      throw error;
    } finally {
      client.release();
    }
  });

  await runTest('Connection Pool Test', async () => {
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(pool.query('SELECT $1::int AS number', [i]));
    }
    const results = await Promise.all(promises);
    if (results.length !== 5) throw new Error('Pool test failed');
  });

  await pool.end();
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('Database Connection Tests');
  console.log('========================================\n');
  
  console.log(`Testing database at: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}\n`);
  
  try {
    await testDatabaseConnection();
  } catch (error) {
    console.error('Fatal error:', error.message);
    results.fatalError = error.message;
  }
  
  // Save results
  const resultsPath = path.join(__dirname, '..', 'results', 'database-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log('\n========================================');
  console.log(`Results: ${results.summary.passed}/${results.summary.total} passed`);
  console.log('========================================');
  
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

// Check for required modules
if (!fs.existsSync(path.join(__dirname, '..', '..', 'backend', 'services', 'api-gateway', 'node_modules', 'pg'))) {
  console.error('❌ PostgreSQL client not installed. Run: npm install pg');
  process.exit(1);
}

main();