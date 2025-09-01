/**
 * Environment Configuration Loader
 * Loads .portenv first, then .env with port variables resolved
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .portenv first
const portEnvPath = path.resolve(__dirname, '.portenv');
if (fs.existsSync(portEnvPath)) {
  const portEnvResult = dotenv.config({ path: portEnvPath });
  if (portEnvResult.error) {
    console.warn('⚠️  Warning: Failed to load .portenv:', portEnvResult.error.message);
  } else {
    console.log('✅ Loaded port configuration from .portenv');
  }
} else {
  console.warn('⚠️  Warning: .portenv file not found');
}

// Load .env (will use port variables from .portenv)
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envResult = dotenv.config({ path: envPath });
  if (envResult.error) {
    console.error('❌ Error: Failed to load .env:', envResult.error.message);
    process.exit(1);
  } else {
    console.log('✅ Loaded environment configuration from .env');
  }
} else {
  console.error('❌ Error: .env file not found');
  process.exit(1);
}

// Export a function to load environment for other scripts
module.exports = function loadEnvironment() {
  // Port configuration is already loaded
  return {
    ports: {
      frontend: process.env.FRONTEND_PORT,
      apiGateway: process.env.API_GATEWAY_PORT,
      userService: process.env.USER_SERVICE_PORT,
      documentService: process.env.DOCUMENT_SERVICE_PORT,
      postgres: process.env.POSTGRES_PORT,
      redis: process.env.REDIS_PORT,
    },
    loaded: true
  };
};

// Log loaded port configuration if running directly
if (require.main === module) {
  console.log('\n📋 Port Configuration:');
  console.log('  Frontend:', process.env.FRONTEND_PORT);
  console.log('  API Gateway:', process.env.API_GATEWAY_PORT);
  console.log('  User Service:', process.env.USER_SERVICE_PORT);
  console.log('  Document Service:', process.env.DOCUMENT_SERVICE_PORT);
  console.log('  PostgreSQL:', process.env.POSTGRES_PORT);
  console.log('  Redis:', process.env.REDIS_PORT);
  console.log('  MailHog SMTP:', process.env.MAILHOG_SMTP_PORT);
  console.log('  MailHog Web:', process.env.MAILHOG_WEB_PORT);
}