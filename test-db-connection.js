const { Pool } = require('pg');
require('dotenv').config();

// Test database connection with different configurations
async function testConnection() {
  console.log('🧪 Testing database connection...');
  console.log('Environment variables:');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_NAME:', process.env.DB_NAME);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');

  // Configuration from environment
  const configs = [
    {
      name: 'Environment Config',
      config: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'translation_platform',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      }
    },
    {
      name: 'Trust Authentication',
      config: {
        host: '127.0.0.1',
        port: 5432,
        database: process.env.DB_NAME || 'translation_platform',
        user: process.env.DB_USER || 'postgres',
        // No password - rely on trust authentication
      }
    },
    {
      name: 'Default Database (postgres)',
      config: {
        host: '127.0.0.1',
        port: 5432,
        database: 'postgres',  // Connect to default postgres database
        user: process.env.DB_USER || 'postgres',
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n🔍 Testing: ${name}`);
    console.log('Config:', { ...config, password: config.password ? '[HIDDEN]' : undefined });
    
    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT version(), current_database()');
      console.log(`✅ ${name} - SUCCESS`);
      console.log('   PostgreSQL version:', result.rows[0].version.split(' ')[0]);
      console.log('   Current database:', result.rows[0].current_database);
      
      // Check if our target database exists
      const dbCheckResult = await client.query(
        "SELECT datname FROM pg_database WHERE datname = $1", 
        [process.env.DB_NAME || 'translation_platform']
      );
      
      if (dbCheckResult.rows.length > 0) {
        console.log(`   ✅ Target database '${process.env.DB_NAME || 'translation_platform'}' exists`);
      } else {
        console.log(`   ⚠️  Target database '${process.env.DB_NAME || 'translation_platform'}' does not exist`);
      }
      
      client.release();
      await pool.end();
      
      // If this config works, use it to create the database if needed
      if (dbCheckResult.rows.length === 0 && config.database === 'postgres') {
        console.log(`   🔧 Creating database '${process.env.DB_NAME || 'translation_platform'}'...`);
        const createPool = new Pool(config);
        const createClient = await createPool.connect();
        
        try {
          await createClient.query(`CREATE DATABASE "${process.env.DB_NAME || 'translation_platform'}"`);
          console.log(`   ✅ Database '${process.env.DB_NAME || 'translation_platform'}' created successfully`);
        } catch (createErr) {
          if (createErr.code === '42P04') {
            console.log(`   ✅ Database '${process.env.DB_NAME || 'translation_platform'}' already exists`);
          } else {
            console.log(`   ❌ Failed to create database:`, createErr.message);
          }
        }
        
        createClient.release();
        await createPool.end();
      }
      
      break; // If successful, don't try other configs
      
    } catch (error) {
      console.log(`❌ ${name} - FAILED`);
      console.log('   Error:', error.message);
      await pool.end();
    }
  }
  
  console.log('\n🏁 Database connection test completed');
}

testConnection().catch(console.error);