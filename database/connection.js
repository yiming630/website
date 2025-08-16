/**
 * Database Connection Module - LOCAL TESTING
 * ===========================================
 * 
 * This module provides a reusable PostgreSQL connection pool for the application.
 * It's designed for local development and testing purposes.
 * 
 * Features:
 * ---------
 * - Connection pooling for better performance
 * - Automatic reconnection on connection loss
 * - Query logging in development mode
 * - Connection health checks
 * 
 * Usage:
 * ------
 * const db = require('./database/connection');
 * 
 * // Simple query
 * const users = await db.query('SELECT * FROM users');
 * 
 * // Parameterized query (prevents SQL injection)
 * const user = await db.query(
 *   'SELECT * FROM users WHERE email = $1',
 *   ['test@example.com']
 * );
 * 
 * // Transaction example
 * const client = await db.getClient();
 * try {
 *   await client.query('BEGIN');
 *   await client.query('INSERT INTO ...');
 *   await client.query('UPDATE ...');
 *   await client.query('COMMIT');
 * } catch (e) {
 *   await client.query('ROLLBACK');
 *   throw e;
 * } finally {
 *   client.release();
 * }
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Validate environment
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  console.error('Please check your .env.local file');
  process.exit(1);
}

// Create connection pool with configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: 2000,
});

// Log pool errors (connection failures, etc.)
pool.on('error', (err, client) => {
  console.error('Unexpected database error on idle client', err);
});

// Log when a new client is connected
pool.on('connect', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 New database client connected');
  }
});

// Log when a client is removed
pool.on('remove', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Database client removed');
  }
});

/**
 * Execute a query with optional parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    
    // Log slow queries in development
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development' && duration > 100) {
      console.log('⚠️  Slow query detected:', {
        duration: `${duration}ms`,
        query: text.substring(0, 100),
        rows: res.rowCount
      });
    }
    
    return res;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}

/**
 * Get a client from the pool for transactions
 * Remember to release the client when done!
 * @returns {Promise<Object>} Database client
 */
async function getClient() {
  const client = await pool.connect();
  
  // Add a query method that logs in development
  const originalQuery = client.query.bind(client);
  
  if (process.env.NODE_ENV === 'development') {
    client.query = async (...args) => {
      const start = Date.now();
      const result = await originalQuery(...args);
      const duration = Date.now() - start;
      
      if (duration > 100) {
        console.log(`⚠️  Slow transaction query (${duration}ms)`);
      }
      
      return result;
    };
  }
  
  return client;
}

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connected
 */
async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connected at:', result.rows[0].current_time);
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
}

/**
 * Get pool statistics
 * @returns {Object} Pool statistics
 */
function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

/**
 * Gracefully shutdown the connection pool
 * Call this when shutting down the application
 */
async function shutdown() {
  console.log('📊 Closing database connections...');
  await pool.end();
  console.log('✅ Database connections closed');
}

// Handle process termination
process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

module.exports = {
  query,
  getClient,
  testConnection,
  getPoolStats,
  shutdown,
  pool, // Export pool for advanced usage
};