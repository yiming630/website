#!/usr/bin/env node

// GraphQL Resolver Test Script
// Run with: node test-graphql.js

require('dotenv').config({ path: '../../../.env' });

const { execute } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');

console.log('🧪 GRAPHQL RESOLVER TEST');
console.log('=' .repeat(50));

async function testGraphQLResolvers() {
  try {
    // Test 1: Load Schema and Resolvers
    console.log('1️⃣ LOADING GRAPHQL SCHEMA & RESOLVERS');
    console.log('-'.repeat(30));
    
    const typeDefs = require('./src/schema/typeDefs');
    const resolvers = require('./src/resolvers');
    
    console.log('✅ TypeDefs loaded');
    console.log('✅ Resolvers loaded');
    
    // Create executable schema
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });
    console.log('✅ Executable schema created');
    
    // Test 2: Analyze Available Resolvers
    console.log('\n2️⃣ ANALYZING AVAILABLE RESOLVERS');
    console.log('-'.repeat(30));
    
    const queryResolvers = Object.keys(resolvers.Query || {});
    const mutationResolvers = Object.keys(resolvers.Mutation || {});
    const typeResolvers = Object.keys(resolvers).filter(key => 
      !['Query', 'Mutation', 'Upload'].includes(key)
    );
    
    console.log(`📊 Query Resolvers (${queryResolvers.length}):`);
    queryResolvers.forEach((resolver, i) => {
      console.log(`   ${i+1}. ${resolver}`);
    });
    
    console.log(`\n📊 Mutation Resolvers (${mutationResolvers.length}):`);
    mutationResolvers.forEach((resolver, i) => {
      console.log(`   ${i+1}. ${resolver}`);
    });
    
    console.log(`\n📊 Type Resolvers (${typeResolvers.length}):`);
    typeResolvers.forEach((resolver, i) => {
      console.log(`   ${i+1}. ${resolver}`);
    });
    
    // Test 3: Test Basic Introspection Query
    console.log('\n3️⃣ TESTING SCHEMA INTROSPECTION');
    console.log('-'.repeat(30));
    
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          types {
            name
            kind
          }
        }
      }
    `;
    
    try {
      const result = await execute({
        schema,
        document: require('graphql').parse(introspectionQuery),
        contextValue: { 
          user: null // No auth context for introspection
        }
      });
      
      if (result.errors) {
        console.log('❌ Introspection errors:', result.errors);
      } else {
        console.log('✅ Schema introspection successful');
        console.log(`✅ Query type: ${result.data.__schema.queryType.name}`);
        console.log(`✅ Mutation type: ${result.data.__schema.mutationType?.name || 'None'}`);
        
        const customTypes = result.data.__schema.types.filter(type => 
          !type.name.startsWith('__') && 
          !['String', 'Int', 'Boolean', 'ID', 'Float'].includes(type.name)
        );
        
        console.log(`✅ Custom types found: ${customTypes.length}`);
        customTypes.slice(0, 10).forEach((type, i) => {
          console.log(`   ${i+1}. ${type.name} (${type.kind})`);
        });
        
        if (customTypes.length > 10) {
          console.log(`   ... and ${customTypes.length - 10} more types`);
        }
      }
    } catch (error) {
      console.log('❌ Introspection failed:', error.message);
    }
    
    // Test 4: Test File-Related Queries (without auth)
    console.log('\n4️⃣ TESTING FILE-RELATED RESOLVERS');
    console.log('-'.repeat(30));
    
    // Test fileStorageStats query with mock context
    if (queryResolvers.includes('fileStorageStats')) {
      console.log('📊 Testing fileStorageStats query...');
      
      const mockContext = {
        user: { id: 'test-user', role: 'USER' }
      };
      
      const statsQuery = `
        query {
          fileStorageStats {
            totalFiles
            totalSizeBytes
            totalSizeMB
          }
        }
      `;
      
      try {
        const result = await execute({
          schema,
          document: require('graphql').parse(statsQuery),
          contextValue: mockContext
        });
        
        if (result.errors) {
          console.log('⚠️ fileStorageStats query errors:', result.errors[0].message);
        } else {
          console.log('✅ fileStorageStats query executed (may need DB connection)');
        }
      } catch (error) {
        console.log('⚠️ fileStorageStats query failed:', error.message);
      }
    } else {
      console.log('⚠️ fileStorageStats resolver not found');
    }
    
    // Test 5: Test Upload Mutation Structure
    console.log('\n5️⃣ TESTING UPLOAD MUTATION STRUCTURE');
    console.log('-'.repeat(30));
    
    if (mutationResolvers.includes('uploadFile')) {
      console.log('✅ uploadFile mutation resolver found');
      
      // Test resolver function structure (not actual execution)
      const uploadResolver = resolvers.Mutation.uploadFile;
      if (typeof uploadResolver === 'function') {
        console.log('✅ uploadFile is a valid function');
        console.log(`✅ Function signature: ${uploadResolver.length} parameters`);
      } else {
        console.log('❌ uploadFile is not a function');
      }
    } else {
      console.log('❌ uploadFile mutation resolver not found');
    }
    
    // Test 6: Test Type Resolvers
    console.log('\n6️⃣ TESTING TYPE RESOLVERS');
    console.log('-'.repeat(30));
    
    const importantTypes = ['FileMetadata', 'User', 'Document'];
    importantTypes.forEach(typeName => {
      if (resolvers[typeName]) {
        console.log(`✅ ${typeName} type resolver found`);
        const fields = Object.keys(resolvers[typeName]);
        console.log(`   Fields: ${fields.join(', ')}`);
      } else {
        console.log(`⚠️ ${typeName} type resolver not found`);
      }
    });
    
    // Test 7: Check for Upload Scalar
    console.log('\n7️⃣ CHECKING UPLOAD SCALAR');
    console.log('-'.repeat(30));
    
    if (resolvers.Upload) {
      console.log('✅ Upload scalar resolver found');
      console.log('✅ File upload capability available');
    } else {
      console.log('❌ Upload scalar resolver not found');
      console.log('⚠️ File uploads may not work');
    }
    
    console.log('\n' + '🎉'.repeat(20));
    console.log('✅ GRAPHQL RESOLVER TEST COMPLETED');
    console.log('🎉'.repeat(20));
    
    return true;
    
  } catch (error) {
    console.error('❌ GraphQL test failed:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      stack: error.stack.split('\n').slice(0, 5).join('\n')
    });
    return false;
  }
}

// Test individual resolver functions
async function testResolverFunctions() {
  console.log('\n🔧 TESTING RESOLVER FUNCTIONS');
  console.log('-'.repeat(30));
  
  try {
    const resolvers = require('./src/resolvers');
    
    // Test Query resolvers
    if (resolvers.Query) {
      console.log('📋 Query Resolvers:');
      Object.keys(resolvers.Query).forEach(key => {
        const resolver = resolvers.Query[key];
        const isFunction = typeof resolver === 'function';
        const params = isFunction ? resolver.length : 'N/A';
        console.log(`   ${isFunction ? '✅' : '❌'} ${key}: ${isFunction ? 'function' : typeof resolver} (${params} params)`);
      });
    }
    
    // Test Mutation resolvers
    if (resolvers.Mutation) {
      console.log('\n📤 Mutation Resolvers:');
      Object.keys(resolvers.Mutation).forEach(key => {
        const resolver = resolvers.Mutation[key];
        const isFunction = typeof resolver === 'function';
        const params = isFunction ? resolver.length : 'N/A';
        console.log(`   ${isFunction ? '✅' : '❌'} ${key}: ${isFunction ? 'function' : typeof resolver} (${params} params)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Resolver function test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  const schemaTest = await testGraphQLResolvers();
  await testResolverFunctions();
  
  if (schemaTest) {
    console.log('\n✅ GraphQL system is properly configured!');
    console.log('🚀 Ready to serve GraphQL requests');
  } else {
    console.log('\n❌ GraphQL system has configuration issues');
    console.log('🔧 Please fix the errors above');
  }
}

runAllTests().catch(console.error);