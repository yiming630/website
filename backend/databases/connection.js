// Database connection utility
const { Pool } = require('pg');
const config = require('./config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create connection pool
const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.username,
  password: dbConfig.password,
  ssl: dbConfig.ssl,
  max: dbConfig.pool.max,
  min: dbConfig.pool.min,
  idleTimeoutMillis: dbConfig.pool.idle,
  connectionTimeoutMillis: dbConfig.pool.acquire,
});

// Connection event handlers
pool.on('connect', (client) => {
  if (dbConfig.logging) {
    console.log('New client connected:', client.processID);
  }
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (dbConfig.logging) {
      console.log('Executed query:', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Query error:', { text, duration, error: error.message });
    throw error;
  }
};

// Helper function to get a client from pool
const getClient = async () => {
  return await pool.connect();
};

// Helper function to execute transaction
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔌 Database connection pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
};

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection,
  closePool
};