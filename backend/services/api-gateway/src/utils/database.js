const { Pool } = require('pg');

let pool;

// Database connection configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'translation_platform_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Initialize connection pool
function initializePool() {
  if (!pool) {
    console.log('🔄 Initializing PostgreSQL connection pool...');
    console.log('📍 PostgreSQL Configuration:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Password: ${config.password ? 'PROVIDED' : 'MISSING'}`);
    console.log(`   Max Connections: ${config.max}`);
    
    pool = new Pool(config);
    
    pool.on('error', (err) => {
      console.error('❌ PostgreSQL unexpected error on idle client:', err.message);
      console.error('🔍 Error Details:', {
        code: err.code,
        severity: err.severity,
        detail: err.detail
      });
      process.exit(-1);
    });

    pool.on('connect', (client) => {
      console.log('✅ PostgreSQL client connected to pool');
    });

    pool.on('acquire', () => {
      console.log('🔗 PostgreSQL client acquired from pool');
    });

    pool.on('remove', () => {
      console.log('➖ PostgreSQL client removed from pool');
    });
  }
  return pool;
}

// Get database pool instance
function getPool() {
  if (!pool) {
    return initializePool();
  }
  return pool;
}

// Execute a query
async function query(text, params) {
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Check database health
async function checkHealth() {
  try {
    console.log('🏥 Checking PostgreSQL health...');
    const result = await query('SELECT 1 as health_check, current_database() as db_name, version() as db_version');
    if (result.rows.length > 0) {
      console.log('✅ PostgreSQL health check passed');
      console.log(`📊 Database: ${result.rows[0].db_name}`);
      console.log(`📊 Version: ${result.rows[0].db_version.split(',')[0]}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ PostgreSQL health check failed:', error.message);
    console.error('🔍 Error Details:', {
      code: error.code,
      severity: error.severity,
      detail: error.detail,
      hint: error.hint
    });
    return false;
  }
}

// Close all connections
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('🔌 Database pool closed');
  }
}

module.exports = {
  initializePool,
  getPool,
  query,
  checkHealth,
  closePool
};