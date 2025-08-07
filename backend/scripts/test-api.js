#!/usr/bin/env node

/**
 * API Test Script for Translation Platform
 * Tests GraphQL endpoints and basic functionality
 */

const { ApolloClient, InMemoryCache, gql, createHttpLink } = require('@apollo/client/core');
const fetch = require('cross-fetch');
const WebSocket = require('ws');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:4000/graphql';
const WS_URL = process.env.WS_URL || 'ws://localhost:4000/graphql';

// Create Apollo Client
const client = new ApolloClient({
  link: createHttpLink({
    uri: API_URL,
    fetch
  }),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all'
    },
    query: {
      errorPolicy: 'all'
    }
  }
});

// Test queries and mutations
const HEALTH_CHECK = gql`
  query {
    supportedLanguages {
      code
      name
      nativeName
    }
  }
`;

const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterInput!) {
    register(input: $input) {
      token
      refreshToken
      user {
        id
        name
        email
        role
      }
    }
  }
`;

const LOGIN_USER = gql`
  mutation LoginUser($input: LoginInput!) {
    login(input: $input) {
      token
      refreshToken
      user {
        id
        name
        email
        role
      }
    }
  }
`;

const GET_ME = gql`
  query Me {
    me {
      id
      name
      email
      role
      preferences {
        theme
        defaultSourceLanguage
        defaultTargetLanguage
      }
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      name
      description
      color
      defaultSettings {
        defaultSourceLanguage
        defaultTargetLanguage
        defaultTranslationStyle
        requireReview
      }
    }
  }
`;

// Test functions
async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  try {
    const result = await client.query({
      query: HEALTH_CHECK
    });
    
    if (result.data.supportedLanguages && result.data.supportedLanguages.length > 0) {
      console.log('✅ Health check passed:', result.data.supportedLanguages.length, 'languages supported');
      return true;
    } else {
      console.log('❌ Health check failed: No languages returned');
      return false;
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log('👤 Testing user registration...');
  try {
    const testUser = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      role: 'TRANSLATOR'
    };
    
    const result = await client.mutate({
      mutation: REGISTER_USER,
      variables: { input: testUser }
    });
    
    if (result.data.register.token && result.data.register.user) {
      console.log('✅ User registration passed:', result.data.register.user.email);
      return result.data.register;
    } else {
      console.log('❌ User registration failed: No token or user returned');
      return null;
    }
  } catch (error) {
    console.log('❌ User registration failed:', error.message);
    return null;
  }
}

async function testUserLogin(email, password) {
  console.log('🔐 Testing user login...');
  try {
    const result = await client.mutate({
      mutation: LOGIN_USER,
      variables: { 
        input: { email, password }
      }
    });
    
    if (result.data.login.token) {
      console.log('✅ User login passed:', result.data.login.user.email);
      return result.data.login;
    } else {
      console.log('❌ User login failed: No token returned');
      return null;
    }
  } catch (error) {
    console.log('❌ User login failed:', error.message);
    return null;
  }
}

async function testAuthenticatedQuery(token) {
  console.log('🔒 Testing authenticated query...');
  try {
    // Create authenticated client
    const authClient = new ApolloClient({
      link: createHttpLink({
        uri: API_URL,
        headers: {
          authorization: `Bearer ${token}`
        },
        fetch
      }),
      cache: new InMemoryCache()
    });
    
    const result = await authClient.query({
      query: GET_ME
    });
    
    if (result.data.me) {
      console.log('✅ Authenticated query passed:', result.data.me.email);
      return result.data.me;
    } else {
      console.log('❌ Authenticated query failed: No user data returned');
      return null;
    }
  } catch (error) {
    console.log('❌ Authenticated query failed:', error.message);
    return null;
  }
}

async function testProjectCreation(token) {
  console.log('📁 Testing project creation...');
  try {
    const authClient = new ApolloClient({
      link: createHttpLink({
        uri: API_URL,
        headers: {
          authorization: `Bearer ${token}`
        },
        fetch
      }),
      cache: new InMemoryCache()
    });
    
    const projectInput = {
      name: `Test Project ${Date.now()}`,
      description: 'A test project for API validation',
      color: '#FF6B6B',
      defaultSettings: {
        defaultSourceLanguage: 'en',
        defaultTargetLanguage: 'zh-CN',
        defaultTranslationStyle: 'BUSINESS',
        defaultSpecialization: 'business',
        requireReview: false
      }
    };
    
    const result = await authClient.mutate({
      mutation: CREATE_PROJECT,
      variables: { input: projectInput }
    });
    
    if (result.data.createProject) {
      console.log('✅ Project creation passed:', result.data.createProject.name);
      return result.data.createProject;
    } else {
      console.log('❌ Project creation failed: No project returned');
      return null;
    }
  } catch (error) {
    console.log('❌ Project creation failed:', error.message);
    return null;
  }
}

async function testWebSocketConnection(token) {
  console.log('🔌 Testing WebSocket connection...');
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(WS_URL, 'graphql-ws', {
        headers: {
          'Sec-WebSocket-Protocol': 'graphql-ws'
        }
      });
      
      let connected = false;
      
      ws.on('open', () => {
        console.log('🔗 WebSocket opened');
        
        // Send connection init
        ws.send(JSON.stringify({
          type: 'connection_init',
          payload: {
            authorization: `Bearer ${token}`
          }
        }));
      });
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('📨 WebSocket message:', message.type);
        
        if (message.type === 'connection_ack') {
          connected = true;
          console.log('✅ WebSocket connection passed');
          ws.close();
          resolve(true);
        } else if (message.type === 'connection_error') {
          console.log('❌ WebSocket connection failed:', message.payload);
          ws.close();
          resolve(false);
        }
      });
      
      ws.on('error', (error) => {
        console.log('❌ WebSocket error:', error.message);
        resolve(false);
      });
      
      ws.on('close', () => {
        if (!connected) {
          console.log('❌ WebSocket closed without successful connection');
          resolve(false);
        }
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!connected) {
          console.log('❌ WebSocket connection timeout');
          ws.close();
          resolve(false);
        }
      }, 5000);
      
    } catch (error) {
      console.log('❌ WebSocket connection failed:', error.message);
      resolve(false);
    }
  });
}

async function testDocumentServiceHealth() {
  console.log('📄 Testing Document Service health...');
  try {
    const response = await fetch('http://localhost:8000/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Document Service health check passed:', data.service);
      return true;
    } else {
      console.log('❌ Document Service health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Document Service health check failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting API tests for Translation Platform\n');
  
  const results = {
    healthCheck: false,
    userRegistration: false,
    userLogin: false,
    authenticatedQuery: false,
    projectCreation: false,
    webSocketConnection: false,
    documentServiceHealth: false
  };
  
  let authToken = null;
  let testUser = null;
  
  // 1. Test health check
  results.healthCheck = await testHealthCheck();
  console.log('');
  
  // 2. Test user registration
  const registrationResult = await testUserRegistration();
  if (registrationResult) {
    results.userRegistration = true;
    testUser = {
      email: registrationResult.user.email,
      password: 'testpassword123'
    };
    authToken = registrationResult.token;
  }
  console.log('');
  
  // 3. Test user login (if registration failed, skip)
  if (testUser) {
    const loginResult = await testUserLogin(testUser.email, testUser.password);
    if (loginResult) {
      results.userLogin = true;
      authToken = loginResult.token; // Use fresh token
    }
  }
  console.log('');
  
  // 4. Test authenticated query
  if (authToken) {
    const userResult = await testAuthenticatedQuery(authToken);
    if (userResult) {
      results.authenticatedQuery = true;
    }
  }
  console.log('');
  
  // 5. Test project creation
  if (authToken) {
    const projectResult = await testProjectCreation(authToken);
    if (projectResult) {
      results.projectCreation = true;
    }
  }
  console.log('');
  
  // 6. Test WebSocket connection
  if (authToken) {
    results.webSocketConnection = await testWebSocketConnection(authToken);
  }
  console.log('');
  
  // 7. Test Document Service
  results.documentServiceHealth = await testDocumentServiceHealth();
  console.log('');
  
  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
    console.log(`${status} - ${testName}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('');
  console.log(`🎯 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! API is ready for use.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testHealthCheck,
  testUserRegistration,
  testUserLogin,
  testAuthenticatedQuery,
  testProjectCreation,
  testWebSocketConnection,
  testDocumentServiceHealth
};
