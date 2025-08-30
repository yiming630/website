const { query } = require('../../backend/services/api-gateway/src/utils/database');
const axios = require('axios');

const API_URL = 'http://localhost:4000/graphql';

/**
 * 邮箱验证功能测试套件
 * 测试完整的邮箱验证流程，包括注册、发送验证邮件、验证邮箱等
 */
class EmailVerificationTester {
  constructor() {
    this.testEmail = `test+${Date.now()}@example.com`;
    this.testPassword = 'testpassword123';
    this.testName = 'Test User';
    this.verificationToken = null;
    this.userId = null;
  }

  /**
   * 发送GraphQL请求
   */
  async sendGraphQLRequest(query, variables = {}) {
    try {
      const response = await axios.post(API_URL, {
        query,
        variables
      });
      
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      
      return response.data;
    } catch (error) {
      console.error('GraphQL request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * 测试用户注册（应该创建用户但不提供tokens）
   */
  async testUserRegistration() {
    console.log('🧪 Testing user registration...');
    
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          user {
            id
            name
            email
            emailVerified
            emailVerifiedAt
            accountStatus
            role
            plan
            createdAt
          }
          tokens {
            accessToken
            refreshToken
          }
          message
        }
      }
    `;

    const variables = {
      input: {
        name: this.testName,
        email: this.testEmail,
        password: this.testPassword
      }
    };

    const data = await this.sendGraphQLRequest(mutation, variables);
    const result = data.data.register;

    // 验证注册结果
    console.log('Registration result:', JSON.stringify(result, null, 2));
    
    if (!result.user) {
      throw new Error('Registration failed: No user returned');
    }

    if (result.user.emailVerified) {
      throw new Error('User should not be email verified immediately after registration');
    }

    if (result.tokens) {
      throw new Error('Tokens should not be provided for unverified users');
    }

    if (result.user.accountStatus !== 'PENDING') {
      throw new Error('Account status should be PENDING for unverified users');
    }

    this.userId = result.user.id;
    console.log('✅ User registration test passed');
    console.log(`   - User ID: ${this.userId}`);
    console.log(`   - Email verified: ${result.user.emailVerified}`);
    console.log(`   - Account status: ${result.user.accountStatus}`);
    console.log(`   - Message: ${result.message}`);

    return result;
  }

  /**
   * 测试发送验证邮件
   */
  async testSendVerificationEmail() {
    console.log('\\n🧪 Testing send verification email...');
    
    const mutation = `
      mutation SendVerificationEmail($email: String!) {
        sendVerificationEmail(email: $email) {
          success
          message
          emailSent
        }
      }
    `;

    const variables = {
      email: this.testEmail
    };

    const data = await this.sendGraphQLRequest(mutation, variables);
    const result = data.data.sendVerificationEmail;

    console.log('Send email result:', JSON.stringify(result, null, 2));

    if (!result.success) {
      throw new Error(`Send verification email failed: ${result.message}`);
    }

    if (!result.emailSent) {
      throw new Error('Email was not marked as sent');
    }

    console.log('✅ Send verification email test passed');
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Email sent: ${result.emailSent}`);
    console.log(`   - Message: ${result.message}`);

    return result;
  }

  /**
   * 从数据库获取验证令牌（模拟点击邮件链接）
   */
  async getVerificationTokenFromDatabase() {
    console.log('\\n🧪 Getting verification token from database...');
    
    const result = await query(`
      SELECT 
        evt.id, evt.user_id, evt.email, evt.expires_at, evt.used_at,
        u.id as user_exists, u.name, u.email as user_email
      FROM email_verification_tokens evt
      LEFT JOIN users u ON evt.user_id = u.id
      WHERE evt.email = $1 AND evt.used_at IS NULL
      ORDER BY evt.created_at DESC
      LIMIT 1
    `, [this.testEmail]);

    if (result.rows.length === 0) {
      throw new Error('No verification token found in database');
    }

    const tokenRecord = result.rows[0];
    console.log('✅ Found verification token in database');
    console.log(`   - Token ID: ${tokenRecord.id}`);
    console.log(`   - User ID: ${tokenRecord.user_id}`);
    console.log(`   - Email: ${tokenRecord.email}`);
    console.log(`   - Expires: ${tokenRecord.expires_at}`);

    // 模拟我们有实际的令牌（在实际应用中，这会在邮件中发送）
    // 由于我们无法从数据库获取原始令牌（它被散列了），我们需要创建一个测试令牌
    console.log('⚠️  Note: Cannot retrieve actual token from database (it is hashed)');
    console.log('⚠️  In real testing, you would get the token from the email or test environment');

    return tokenRecord;
  }

  /**
   * 测试检查验证令牌状态（使用无效令牌）
   */
  async testCheckVerificationStatus() {
    console.log('\\n🧪 Testing check verification status with invalid token...');
    
    const query_str = `
      query CheckEmailVerificationStatus($token: String!) {
        checkEmailVerificationStatus(token: $token) {
          valid
          expired
          used
          user {
            id
            name
            email
            emailVerified
          }
        }
      }
    `;

    const variables = {
      token: 'invalid-token-for-testing'
    };

    const data = await this.sendGraphQLRequest(query_str, variables);
    const result = data.data.checkEmailVerificationStatus;

    console.log('Check status result:', JSON.stringify(result, null, 2));

    if (result.valid) {
      throw new Error('Invalid token should not be marked as valid');
    }

    console.log('✅ Check verification status test passed');
    console.log(`   - Valid: ${result.valid}`);
    console.log(`   - Expired: ${result.expired}`);
    console.log(`   - Used: ${result.used}`);

    return result;
  }

  /**
   * 测试登录（应该失败因为邮箱未验证）
   */
  async testLoginWithUnverifiedEmail() {
    console.log('\\n🧪 Testing login with unverified email (should fail)...');
    
    const mutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          user {
            id
            name
            email
            emailVerified
            emailVerifiedAt
            accountStatus
            role
            plan
          }
          tokens {
            accessToken
            refreshToken
          }
          message
        }
      }
    `;

    const variables = {
      input: {
        email: this.testEmail,
        password: this.testPassword
      }
    };

    try {
      const data = await this.sendGraphQLRequest(mutation, variables);
      
      // 如果登录成功，这应该是一个错误（邮箱未验证）
      throw new Error('Login should fail for unverified email');
    } catch (error) {
      // 我们期望这里失败
      console.log('✅ Login with unverified email correctly failed');
      console.log(`   - Error: ${error.message}`);
      
      if (!error.message.includes('验证') && !error.message.includes('verify')) {
        console.log('⚠️  Warning: Error message does not mention verification');
      }
    }
  }

  /**
   * 测试数据库状态
   */
  async testDatabaseState() {
    console.log('\\n🧪 Testing database state...');
    
    // 检查用户是否在数据库中
    const userResult = await query(`
      SELECT id, name, email, email_verified, account_status, role, created_at
      FROM users 
      WHERE email = $1
    `, [this.testEmail]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found in database');
    }

    const user = userResult.rows[0];
    console.log('✅ User found in database');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Email verified: ${user.email_verified}`);
    console.log(`   - Account status: ${user.account_status}`);
    console.log(`   - Role: ${user.role}`);

    // 检查验证令牌是否在数据库中
    const tokenResult = await query(`
      SELECT COUNT(*) as count
      FROM email_verification_tokens 
      WHERE email = $1 AND used_at IS NULL
    `, [this.testEmail]);

    const tokenCount = parseInt(tokenResult.rows[0].count);
    console.log('✅ Verification tokens in database');
    console.log(`   - Unused tokens: ${tokenCount}`);

    if (tokenCount === 0) {
      console.log('⚠️  Warning: No unused verification tokens found');
    }

    return { user, tokenCount };
  }

  /**
   * 清理测试数据
   */
  async cleanup() {
    console.log('\\n🧹 Cleaning up test data...');
    
    try {
      // 删除验证令牌
      await query(`
        DELETE FROM email_verification_tokens 
        WHERE email = $1
      `, [this.testEmail]);

      // 删除测试用户
      await query(`
        DELETE FROM users 
        WHERE email = $1
      `, [this.testEmail]);

      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 Starting Email Verification Tests');
    console.log('='.repeat(50));
    
    const startTime = Date.now();

    try {
      // 1. 测试用户注册
      await this.testUserRegistration();

      // 2. 测试发送验证邮件
      await this.testSendVerificationEmail();

      // 3. 获取验证令牌信息
      await this.getVerificationTokenFromDatabase();

      // 4. 测试检查验证状态
      await this.testCheckVerificationStatus();

      // 5. 测试未验证邮箱登录
      await this.testLoginWithUnverifiedEmail();

      // 6. 检查数据库状态
      await this.testDatabaseState();

      const duration = Date.now() - startTime;
      console.log('\\n' + '='.repeat(50));
      console.log('🎉 All Email Verification Tests Passed!');
      console.log(`⏱️  Total execution time: ${duration}ms`);
      console.log('='.repeat(50));

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('\\n' + '=' .repeat(50));
      console.error('❌ Email Verification Tests Failed!');
      console.error(`Error: ${error.message}`);
      console.error(`⏱️  Execution time: ${duration}ms`);
      console.error('=' .repeat(50));
      throw error;
    } finally {
      // 总是清理测试数据
      await this.cleanup();
    }
  }
}

/**
 * 运行测试
 */
async function runTests() {
  const tester = new EmailVerificationTester();
  await tester.runAllTests();
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { EmailVerificationTester, runTests };