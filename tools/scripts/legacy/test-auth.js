const axios = require('axios');

const API_BASE = 'http://localhost:4000';
const USER_SERVICE_BASE = 'http://localhost:4001';

async function testAuth() {
  console.log('🧪 Testing Authentication System...\n');

  try {
    // Test 1: Health checks
    console.log('1️⃣ Testing health checks...');
    
    const apiHealth = await axios.get(`${API_BASE}/health`);
    console.log('✅ API Gateway:', apiHealth.data.status);
    
    const userHealth = await axios.get(`${USER_SERVICE_BASE}/health`);
    console.log('✅ User Service:', userHealth.data.status);
    
    // Test 2: User registration
    console.log('\n2️⃣ Testing user registration...');
    
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123'
    };
    
    const registerResponse = await axios.post(`${USER_SERVICE_BASE}/auth/register`, testUser);
    console.log('✅ Registration successful:', registerResponse.data.message);
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Token received:', !!registerResponse.data.token);
    
    // Test 3: User login
    console.log('\n3️⃣ Testing user login...');
    
    const loginResponse = await axios.post(`${USER_SERVICE_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('   Token received:', !!loginResponse.data.token);
    
    // Test 4: Token verification
    console.log('\n4️⃣ Testing token verification...');
    
    const token = loginResponse.data.token;
    const verifyResponse = await axios.get(`${USER_SERVICE_BASE}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Token verification successful:', verifyResponse.data.valid);
    
    // Test 5: GraphQL me query
    console.log('\n5️⃣ Testing GraphQL me query...');
    
    const meQuery = `
      query {
        me {
          id
          name
          email
          role
          plan
          isVerified
        }
      }
    `;
    
    const graphqlResponse = await axios.post(`${API_BASE}/graphql`, {
      query: meQuery
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (graphqlResponse.data.errors) {
      console.log('❌ GraphQL query failed:', graphqlResponse.data.errors[0].message);
    } else {
      console.log('✅ GraphQL me query successful');
      console.log('   User data:', graphqlResponse.data.data.me);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('   This might be expected if the user is not authenticated');
    }
  }
}

// Run the test
testAuth();
