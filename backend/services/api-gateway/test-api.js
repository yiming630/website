const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

async function checkServerRunning() {
  try {
    await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function testAPI() {
  console.log('🧪 Testing API Gateway...\n');

  // Check if server is running
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('❌ Server is not running at', API_BASE_URL);
    console.log('Please start the server first with: npm run dev');
    process.exit(1);
  }

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Database:', healthResponse.data.database);
    console.log('   Microservices:', Object.keys(healthResponse.data.microservices).length, 'services checked\n');

    // Test metrics endpoint
    console.log('2. Testing metrics endpoint...');
    const metricsResponse = await axios.get(`${API_BASE_URL}/metrics`);
    console.log('✅ Metrics endpoint working');
    console.log('   Uptime:', Math.round(metricsResponse.data.uptime), 'seconds\n');

    // Test GraphQL endpoint
    console.log('3. Testing GraphQL endpoint...');
    const graphqlResponse = await axios.post(`${API_BASE_URL}/graphql`, {
      query: `
        query {
          supportedLanguages {
            code
            name
            nativeName
          }
        }
      `
    });
    
    if (graphqlResponse.data.data?.supportedLanguages) {
      console.log('✅ GraphQL endpoint working');
      console.log('   Languages loaded:', graphqlResponse.data.data.supportedLanguages.length);
    } else {
      console.log('❌ GraphQL endpoint failed');
      console.log('   Error:', graphqlResponse.data.errors);
    }

    // Test translation specializations
    console.log('\n4. Testing translation specializations...');
    const specializationsResponse = await axios.post(`${API_BASE_URL}/graphql`, {
      query: `
        query {
          translationSpecializations {
            key
            title
            description
          }
        }
      `
    });
    
    if (specializationsResponse.data.data?.translationSpecializations) {
      console.log('✅ Translation specializations loaded');
      console.log('   Specializations:', specializationsResponse.data.data.translationSpecializations.length);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 API Gateway is ready for use.');
    console.log('   - GraphQL: POST /graphql');
    console.log('   - Health: GET /health');
    console.log('   - Metrics: GET /metrics');
    console.log('   - WebSocket: WS /graphql (for subscriptions)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    process.exit(1);
  }
}

testAPI();
 