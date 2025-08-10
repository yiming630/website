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
    pool = new Pool(config);
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    pool.on('connect', () => {
      console.log('✅ Database connected successfully');
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
    const result = await query('SELECT 1 as health_check');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
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