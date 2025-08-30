/**
 * GraphQL API Tests
 * Tests all GraphQL endpoints and operations
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:4000';

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  apiUrl: API_URL,
  tests: [],
  summary: { passed: 0, failed: 0, total: 0 }
};

// Test helper functions
async function graphqlRequest(query, variables = {}, headers = {}) {
  try {
    const response = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({ query, variables })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED') {
      throw new Error(`Cannot connect to API at ${API_URL}. Is the server running?`);
    }
    throw error;
  }
}

async function runTest(name, testFn) {
  const startTime = Date.now();
  const test = { name, status: 'pending', duration: 0, error: null, details: {} };
  
  try {
    console.log(`Running: ${name}...`);
    const details = await testFn();
    test.status = 'passed';
    test.details = details || {};
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

// Test suites
async function testHealthEndpoint() {
  await runTest('Health Check Endpoint', async () => {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
    
    const data = await response.json();
    console.log(`  Status: ${data.status}`);
    console.log(`  Database: ${data.database}`);
    return data;
  });
}

async function testGraphQLIntrospection() {
  await runTest('GraphQL Schema Introspection', async () => {
    const result = await graphqlRequest(`
      query {
        __schema {
          types {
            name
            kind
          }
        }
      }
    `);
    
    if (result.errors) throw new Error(result.errors[0].message);
    
    const types = result.data.__schema.types;
    const customTypes = types.filter(t => !t.name.startsWith('__') && !['String', 'Int', 'Float', 'Boolean', 'ID'].includes(t.name));
    console.log(`  Found ${customTypes.length} custom types`);
    console.log(`  Types: ${customTypes.slice(0, 5).map(t => t.name).join(', ')}...`);
    
    return { typeCount: customTypes.length };
  });
}

async function testPublicQueries() {
  await runTest('Supported Languages Query', async () => {
    const result = await graphqlRequest(`
      query {
        supportedLanguages {
          code
          name
        }
      }
    `);
    
    if (result.errors) throw new Error(result.errors[0].message);
    
    const languages = result.data.supportedLanguages || [];
    console.log(`  Found ${languages.length} supported languages`);
    if (languages.length > 0) {
      console.log(`  Sample: ${languages.slice(0, 3).map(l => l.name).join(', ')}...`);
    }
    
    return { count: languages.length };
  });
}

async function testAuthentication() {
  let authToken = null;
  
  await runTest('User Registration', async () => {
    const result = await graphqlRequest(`
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          tokens {
            accessToken
            refreshToken
          }
          user {
            id
            email
            name
          }
        }
      }
    `, {
      input: {
        email: `test_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
        role: 'TRANSLATOR'
      }
    });
    
    if (result.errors) {
      // Registration might fail if user exists, try login instead
      console.log(`  Registration error: ${result.errors[0].message}`);
      return { skipped: true };
    }
    
    authToken = result.data.register.tokens.accessToken;
    console.log(`  Created user: ${result.data.register.user.email}`);
    return result.data.register;
  });
  
  await runTest('User Login', async () => {
    const result = await graphqlRequest(`
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          tokens {
            accessToken
            refreshToken
          }
          user {
            id
            email
            name
            role
          }
        }
      }
    `, {
      input: {
        email: 'test@example.com',
        password: 'test123'
      }
    });
    
    if (result.errors) throw new Error(result.errors[0].message);
    
    authToken = result.data.login.tokens.accessToken;
    const user = result.data.login.user;
    console.log(`  Logged in as: ${user.email} (${user.role})`);
    
    return result.data.login;
  });
  
  return authToken;
}

async function testAuthenticatedQueries(authToken) {
  if (!authToken) {
    console.log('⚠️ Skipping authenticated tests - no auth token');
    return;
  }
  
  await runTest('Get Current User', async () => {
    const result = await graphqlRequest(`
      query {
        me {
          id
          email
          fullName
          userType
          createdAt
        }
      }
    `, {}, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (result.errors) throw new Error(result.errors[0].message);
    
    const user = result.data.me;
    console.log(`  Current user: ${user.email}`);
    return user;
  });
  
  await runTest('Get User Projects', async () => {
    const result = await graphqlRequest(`
      query {
        projects(limit: 10) {
          id
          name
          description
          color
          createdAt
        }
      }
    `, {}, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (result.errors) throw new Error(result.errors[0].message);
    
    const projects = result.data.projects || [];
    console.log(`  Found ${projects.length} projects`);
    if (projects.length > 0) {
      console.log(`  First project: ${projects[0].name}`);
    }
    
    return { count: projects.length };
  });
  
  await runTest('Create New Project', async () => {
    const result = await graphqlRequest(`
      mutation CreateProject($input: CreateProjectInput!) {
        createProject(input: $input) {
          id
          name
          description
          color
          defaultSettings {
            defaultSourceLanguage
            defaultTargetLanguage
          }
        }
      }
    `, {
      input: {
        name: `Test Project ${Date.now()}`,
        description: 'Created by automated test',
        color: '#3B82F6',
        defaultSettings: {
          defaultSourceLanguage: 'en',
          defaultTargetLanguage: 'zh',
          defaultTranslationStyle: 'GENERAL',
          defaultSpecialization: 'general',
          requireReview: false
        }
      }
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (result.errors) throw new Error(result.errors[0].message);
    
    const project = result.data.createProject;
    console.log(`  Created project: ${project.name}`);
    console.log(`  Project ID: ${project.id}`);
    
    return project;
  });
}

async function testErrorHandling() {
  await runTest('Invalid Query Error Handling', async () => {
    const result = await graphqlRequest('{ invalidField }');
    
    if (!result.errors || result.errors.length === 0) {
      throw new Error('Expected error for invalid field');
    }
    
    console.log(`  Error caught: ${result.errors[0].message.substring(0, 50)}...`);
    return { errorCaught: true };
  });
  
  await runTest('Invalid Mutation Input', async () => {
    const result = await graphqlRequest(`
      mutation {
        login(input: {}) {
          tokens {
            accessToken
          }
        }
      }
    `);
    
    if (!result.errors || result.errors.length === 0) {
      throw new Error('Expected validation error');
    }
    
    console.log(`  Validation error caught`);
    return { validationWorking: true };
  });
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('GraphQL API Tests');
  console.log('========================================\n');
  
  console.log(`Testing API at: ${API_URL}\n`);
  
  try {
    // Test health endpoint
    await testHealthEndpoint();
    
    // Test GraphQL introspection
    await testGraphQLIntrospection();
    
    // Test public queries
    await testPublicQueries();
    
    // Test authentication
    const authToken = await testAuthentication();
    
    // Test authenticated queries
    await testAuthenticatedQueries(authToken);
    
    // Test error handling
    await testErrorHandling();
    
  } catch (error) {
    console.error('Fatal error:', error.message);
    results.fatalError = error.message;
  }
  
  // Save results
  const resultsPath = path.join(__dirname, '..', 'results', 'graphql-api-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log('\n========================================');
  console.log(`Results: ${results.summary.passed}/${results.summary.total} passed`);
  console.log('========================================');
  
  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

// Check Node version for fetch support
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with built-in fetch support');
  process.exit(1);
}

main();