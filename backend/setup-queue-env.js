/**
 * Environment Setup Script for Queue Testing
 * This script helps configure the .env file for queue testing
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log(`${colors.bright}${colors.cyan}🔧 Queue System Environment Setup${colors.reset}`);
  console.log('==================================\n');

  // Check if .env exists
  const envPath = path.join(__dirname, '../.env');
  const envBackupPath = path.join(__dirname, '../.env.backup');
  
  if (fs.existsSync(envPath)) {
    console.log(`${colors.yellow}⚠️  .env file already exists${colors.reset}`);
    const overwrite = await question('Do you want to backup and overwrite it? (y/n): ');
    
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
    
    // Backup existing .env
    fs.copyFileSync(envPath, envBackupPath);
    console.log(`${colors.green}✅ Backed up existing .env to .env.backup${colors.reset}`);
  }

  // Queue type selection
  console.log(`\n${colors.bright}Select Queue Type:${colors.reset}`);
  console.log('1. PostgreSQL (Recommended for development)');
  console.log('2. Redis (High performance, requires Redis server)');
  console.log('3. Memory (Testing only, no persistence)');
  
  const queueChoice = await question('Enter your choice (1-3) [default: 1]: ') || '1';
  
  let queueType;
  switch (queueChoice) {
    case '2':
      queueType = 'redis';
      break;
    case '3':
      queueType = 'memory';
      break;
    default:
      queueType = 'postgresql';
  }

  console.log(`\n${colors.bright}Selected: ${queueType}${colors.reset}\n`);

  // Configuration based on queue type
  let envContent = `# Queue System Environment Configuration
# Generated on ${new Date().toISOString()}

# Node Environment
NODE_ENV=development

# Queue Type Configuration
QUEUE_TYPE=${queueType}

`;

  // PostgreSQL Configuration
  if (queueType === 'postgresql') {
    console.log(`${colors.bright}PostgreSQL Configuration:${colors.reset}`);
    
    const pgHost = await question('PostgreSQL Host [localhost]: ') || 'localhost';
    const pgPort = await question('PostgreSQL Port [5432]: ') || '5432';
    const pgDB = await question('PostgreSQL Database [seekhub_database]: ') || 'seekhub_database';
    const pgUser = await question('PostgreSQL User [postgres]: ') || 'postgres';
    const pgPassword = await question('PostgreSQL Password: ');
    
    envContent += `# PostgreSQL Configuration
POSTGRES_HOST=${pgHost}
POSTGRES_PORT=${pgPort}
POSTGRES_DB=${pgDB}
POSTGRES_USER=${pgUser}
POSTGRES_PASSWORD=${pgPassword}

`;
  }

  // Redis Configuration
  if (queueType === 'redis') {
    console.log(`${colors.bright}Redis Configuration:${colors.reset}`);
    
    const redisHost = await question('Redis Host [localhost]: ') || 'localhost';
    const redisPort = await question('Redis Port [6379]: ') || '6379';
    const redisPassword = await question('Redis Password (press Enter if none): ');
    const redisDB = await question('Redis DB [0]: ') || '0';
    
    envContent += `# Redis Configuration
REDIS_HOST=${redisHost}
REDIS_PORT=${redisPort}
REDIS_PASSWORD=${redisPassword}
REDIS_DB=${redisDB}

`;
  } else {
    // Add Redis config with defaults (optional)
    envContent += `# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

`;
  }

  // Queue Features
  console.log(`\n${colors.bright}Queue Features:${colors.reset}`);
  
  const useTextQueue = await question('Enable queue for text translation? (y/n) [y]: ') || 'y';
  const useImprovementQueue = await question('Enable queue for translation improvement? (y/n) [y]: ') || 'y';
  
  envContent += `# Queue Feature Flags
USE_QUEUE_FOR_TEXT_TRANSLATION=${useTextQueue.toLowerCase() === 'y' ? 'true' : 'false'}
USE_QUEUE_FOR_IMPROVEMENT=${useImprovementQueue.toLowerCase() === 'y' ? 'true' : 'false'}

`;

  // API Configuration
  console.log(`\n${colors.bright}API Configuration:${colors.reset}`);
  
  const apiPort = await question('API Gateway Port [4000]: ') || '4000';
  const openRouterKey = await question('OpenRouter API Key (for translations): ');
  
  envContent += `# API Configuration
API_GATEWAY_PORT=${apiPort}
USER_SVC_PORT=4001

# Frontend Configuration
CLIENT_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=dev_jwt_secret_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OpenRouter API (for translation)
OPENROUTER_API_KEY=${openRouterKey}
# Get your API key from https://openrouter.ai/

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug

# File Storage
STORAGE_PATH=./storage
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log(`\n${colors.green}✅ .env file created successfully!${colors.reset}`);

  // Print next steps
  console.log(`\n${colors.bright}${colors.cyan}Next Steps:${colors.reset}`);
  console.log('1. Test services: npm run check');
  console.log('2. Run comprehensive tests: npm run test:all');
  
  if (queueType === 'postgresql') {
    console.log('3. Start PostgreSQL worker: npm run worker:translation');
    console.log('4. Test PostgreSQL queue: npm run test:queue');
  } else if (queueType === 'redis') {
    console.log('3. Start Redis worker: npm run worker:redis');
    console.log('4. Test Redis queue: npm run test:redis');
  }
  
  console.log('\n📚 For detailed instructions, see: QUEUE_TESTING_GUIDE.md');
  
  rl.close();
}

// Run setup
setupEnvironment().catch(error => {
  console.error(`${colors.red}Error during setup:`, error.message, `${colors.reset}`);
  rl.close();
  process.exit(1);
});
