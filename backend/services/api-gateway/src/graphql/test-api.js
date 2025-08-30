#!/usr/bin/env node

/**
 * GraphQL API Testing Script
 * ==========================
 * 
 * Tests the GraphQL API endpoints and functionality
 * Run this after starting the backend server to verify everything works
 * 
 * Usage: node backend/graphql/test-api.js
 */

const API_URL = "http://127.0.0.1:4002";

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testAPI() {
  console.log('================================================');
  console.log('   Testing GraphQL API (Local Development)    ');
  console.log('================================================');
  console.log('');

  let passedTests = 0;
  let totalTests = 0;

  // Helper function to make GraphQL requests
  async function graphqlRequest(query, variables = {}) {
    const response = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    });
    return response.json();
  }

  // Helper function to test endpoints
  async function runTest(testName, testFn) {
    totalTests++;
    process.stdout.write(`${totalTests}. ${testName}: `);
    
    try {
      const result = await testFn();
      if (result) {
        console.log(`${colors.green}✅ PASS${colors.reset}`);
        passedTests++;
        return true;
      } else {
        console.log(`${colors.red}❌ FAIL${colors.reset}`);
        return false;
      }
    } catch (error) {
      console.log(`${colors.red}❌ FAIL - ${error.message}${colors.reset}`);
      return false;
    }
  }

  // Test 1: Health Check
  await runTest('Health Check', async () => {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  });

  // Test 2: GraphQL Introspection
  await runTest('GraphQL Introspection', async () => {
    const result = await graphqlRequest('{ __schema { types { name } } }');
    return result.data && result.data.__schema;
  });

  // Test 3: System Stats Query
  await runTest('System Stats Query', async () => {
    const result = await graphqlRequest(`
      query {
        systemStats {
          totalUsers
          totalProjects
          totalDocuments
          activeTranslations
        }
      }
    `);
    
    if (result.data && result.data.systemStats) {
      const stats = result.data.systemStats;
      console.log(`\n     Users: ${stats.totalUsers}, Projects: ${stats.totalProjects}, Documents: ${stats.totalDocuments}`);
      return true;
    }
    return false;
  });

  // Test 4: User Authentication (Sign In)
  let authToken = null;
  await runTest('User Authentication', async () => {
    const result = await graphqlRequest(`
      mutation SignIn($input: SignInInput!) {
        signIn(input: $input) {
          token
          user {
            id
            email
            fullName
            userType
          }
        }
      }
    `, {
      input: {
        email: "test@example.com",
        password: "test123"
      }
    });
    
    if (result.data && result.data.signIn && result.data.signIn.token) {
      authToken = result.data.signIn.token;
      const user = result.data.signIn.user;
      console.log(`\n     Logged in as: ${user.fullName} (${user.email})`);
      return true;
    }
    
    if (result.errors) {
      console.log(`\n     Error: ${result.errors[0].message}`);
    }
    return false;
  });

  // Test 5: Authenticated Query (My Projects)
  if (authToken) {
    await runTest('Authenticated Query (My Projects)', async () => {
      const response = await fetch(`${API_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query: `
            query {
              myProjects {
                id
                name
                status
                sourceLanguage
                targetLanguage
              }
            }
          `
        })
      });
      
      const result = await response.json();
      if (result.data && result.data.myProjects) {
        console.log(`\n     Found ${result.data.myProjects.length} projects`);
        return true;
      }
      return false;
    });

    // Test 6: Create Project Mutation
    await runTest('Create Project Mutation', async () => {
      const response = await fetch(`${API_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query: `
            mutation CreateProject($input: CreateProjectInput!) {
              createProject(input: $input) {
                id
                name
                status
              }
            }
          `,
          variables: {
            input: {
              name: "API Test Project",
              description: "Created by GraphQL API test",
              sourceLanguage: "en",
              targetLanguage: "zh"
            }
          }
        })
      });
      
      const result = await response.json();
      if (result.data && result.data.createProject) {
        console.log(`\n     Created project: ${result.data.createProject.name}`);
        return true;
      }
      return false;
    });
  }

  // Test 7: Error Handling (Invalid Query)
  await runTest('Error Handling', async () => {
    const result = await graphqlRequest('{ invalidField }');
    return result.errors && result.errors.length > 0;
  });

  console.log('');
  console.log('================================================');
  console.log(`${colors.blue}📊 Test Results: ${passedTests}/${totalTests} passed${colors.reset}`);
  console.log('================================================');
  console.log('');
  
  if (passedTests === totalTests) {
    console.log(`${colors.green}✅ All tests passed! GraphQL API is working correctly.${colors.reset}`);
    console.log('');
    console.log(`${colors.blue}📊 GraphQL Playground:${colors.reset} ${API_URL}/graphql`);
    console.log(`${colors.blue}📊 Health Check:${colors.reset} ${API_URL}/health`);
    console.log('');
    console.log(`${colors.blue}📝 Test Credentials:${colors.reset}`);
    console.log('   test@example.com / test123 (translator)');
    console.log('   admin@example.com / admin123 (admin)');
    console.log('   demo@example.com / demo123 (demo)');
  } else {
    console.log(`${colors.red}❌ Some tests failed. Check the backend server and database.${colors.reset}`);
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ with built-in fetch support');
  process.exit(1);
}

// Run tests
testAPI().catch(error => {
  console.error(`${colors.red}❌ Test execution failed:${colors.reset}`, error.message);
  process.exit(1);
});