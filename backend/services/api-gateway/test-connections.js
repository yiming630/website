#!/usr/bin/env node

// Test script to debug all connections and services
// Run with: node test-connections.js

require('dotenv').config({ path: '../../../.env' });

const { checkHealth: checkPostgreSQL } = require('./src/utils/database');
const mongoFileService = require('./src/utils/mongoFileService');
const healthChecker = require('./src/utils/healthCheck');

console.log('🧪 CONNECTION TEST SCRIPT');
console.log('=' .repeat(50));
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
console.log('📍 Current directory:', process.cwd());
console.log('=' .repeat(50));

async function testConnections() {
  console.log('\n🔍 TESTING ALL CONNECTIONS...\n');

  // Test 1: Environment Variables
  console.log('1️⃣ TESTING ENVIRONMENT VARIABLES');
  console.log('-'.repeat(30));
  
  const envVars = {
    'DB_HOST': process.env.DB_HOST,
    'DB_PORT': process.env.DB_PORT,
    'DB_NAME': process.env.DB_NAME,
    'DB_USER': process.env.DB_USER,
    'DB_PASSWORD': process.env.DB_PASSWORD ? '***PROVIDED***' : 'MISSING',
    'JWT_SECRET': process.env.JWT_SECRET ? '***PROVIDED***' : 'MISSING',
    'MONGODB_CONNECTION_STRING': process.env.MONGODB_CONNECTION_STRING ? '***PROVIDED***' : 'MISSING',
    'MONGODB_DB_NAME': process.env.MONGODB_DB_NAME,
    'CORS_ORIGIN': process.env.CORS_ORIGIN,
    'API_GATEWAY_PORT': process.env.API_GATEWAY_PORT
  };

  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`   ${status} ${key}: ${value || 'NOT SET'}`);
  });

  // Test 2: PostgreSQL Connection
  console.log('\n2️⃣ TESTING POSTGRESQL CONNECTION');
  console.log('-'.repeat(30));
  
  try {
    console.log('🔗 Attempting PostgreSQL connection...');
    const pgHealthy = await checkPostgreSQL();
    if (pgHealthy) {
      console.log('✅ PostgreSQL connection: SUCCESS');
    } else {
      console.log('❌ PostgreSQL connection: FAILED');
    }
  } catch (error) {
    console.log('❌ PostgreSQL connection error:', error.message);
    console.log('🔍 Error details:', {
      code: error.code,
      severity: error.severity,
      detail: error.detail
    });
  }

  // Test 3: MongoDB Connection
  console.log('\n3️⃣ TESTING MONGODB CONNECTION');
  console.log('-'.repeat(30));
  
  try {
    console.log('🔗 Attempting MongoDB connection...');
    await mongoFileService.initialize();
    console.log('✅ MongoDB connection: SUCCESS');
    
    // Test GridFS
    console.log('📁 Testing GridFS bucket...');
    const bucket = mongoFileService.gridFSBucket;
    if (bucket) {
      console.log('✅ GridFS bucket: SUCCESS');
      
      // List some files (if any)
      const cursor = bucket.find({}).limit(5);
      const files = await cursor.toArray();
      console.log(`📊 GridFS files found: ${files.length}`);
      if (files.length > 0) {
        files.forEach((file, i) => {
          console.log(`   ${i+1}. ${file.filename} (${file.length} bytes)`);
        });
      }
    } else {
      console.log('❌ GridFS bucket: FAILED');
    }
  } catch (error) {
    console.log('❌ MongoDB connection error:', error.message);
    console.log('🔍 Error details:', error);
  }

  // Test 4: GraphQL Schema and Resolvers
  console.log('\n4️⃣ TESTING GRAPHQL SCHEMA & RESOLVERS');
  console.log('-'.repeat(30));
  
  try {
    const typeDefs = require('./src/schema/typeDefs');
    const resolvers = require('./src/resolvers');
    
    console.log('✅ TypeDefs loaded successfully');
    console.log('✅ Resolvers loaded successfully');
    
    // Count resolvers
    const queryResolvers = Object.keys(resolvers.Query || {});
    const mutationResolvers = Object.keys(resolvers.Mutation || {});
    
    console.log(`📊 Query resolvers: ${queryResolvers.length}`);
    console.log('   Available queries:', queryResolvers.join(', '));
    
    console.log(`📊 Mutation resolvers: ${mutationResolvers.length}`);
    console.log('   Available mutations:', mutationResolvers.join(', '));
    
  } catch (error) {
    console.log('❌ GraphQL schema/resolvers error:', error.message);
  }

  // Test 5: File Upload Service
  console.log('\n5️⃣ TESTING FILE UPLOAD SERVICE');
  console.log('-'.repeat(30));
  
  try {
    // Create a small test buffer
    const testBuffer = Buffer.from('Hello, this is a test file!');
    const testOptions = {
      userId: 'test-user-123',
      projectId: null,
      originalFilename: 'test-file.txt',
      fileBuffer: testBuffer,
      contentType: 'text/plain',
      sourceLanguage: 'en',
      targetLanguage: 'zh',
      visibility: 'private'
    };

    console.log('📤 Testing file upload (dry run)...');
    console.log('   File size:', testBuffer.length, 'bytes');
    console.log('   Content type:', testOptions.contentType);
    console.log('   User ID:', testOptions.userId);
    
    // Don't actually upload, just test the service initialization
    await mongoFileService.initialize();
    console.log('✅ File upload service: INITIALIZED');
    
  } catch (error) {
    console.log('❌ File upload service error:', error.message);
  }

  // Test 6: Comprehensive Health Check
  console.log('\n6️⃣ RUNNING COMPREHENSIVE HEALTH CHECK');
  console.log('-'.repeat(30));
  
  try {
    const healthResults = await healthChecker.checkAllServices();
    console.log(`🏥 Overall health: ${healthResults.overall.toUpperCase()}`);
    
    Object.entries(healthResults.services).forEach(([service, status]) => {
      const emoji = status.status === 'healthy' ? '✅' : status.status === 'degraded' ? '⚠️' : '❌';
      console.log(`   ${emoji} ${service}: ${status.status} ${status.responseTime || ''}`);
    });
    
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🧪 CONNECTION TEST COMPLETED');
  console.log('='.repeat(50));
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted. Cleaning up...');
  try {
    await mongoFileService.close();
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
  process.exit(0);
});

// Run the tests
testConnections()
  .then(() => {
    console.log('✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });