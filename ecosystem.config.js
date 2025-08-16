/**
 * PM2 Ecosystem Configuration for Translation Platform
 * 
 * This configuration file defines how PM2 should manage the Translation Platform
 * in different environments (development, staging, production).
 * 
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 start ecosystem.config.js --env development
 * 
 * Based on: 服务器部署指南.md
 */

module.exports = {
  apps: [
    {
      // Main application - orchestrates all services
      name: 'translation-platform',
      script: './main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8080,
        HEALTH_PORT: 8080,
        API_GATEWAY_PORT: 4000,
        USER_SERVICE_PORT: 4001,
        ENABLE_FRONTEND: 'true',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'translation_platform_dev',
        DB_USER: 'postgres',
        CORS_ORIGIN: 'http://localhost:3000'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
        HEALTH_PORT: 8080,
        API_GATEWAY_PORT: 4000,
        USER_SERVICE_PORT: 4001,
        ENABLE_FRONTEND: 'true',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'translation_platform',
        DB_USER: 'postgres',
        CORS_ORIGIN: 'https://your-domain.com'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 8080,
        HEALTH_PORT: 8080,
        API_GATEWAY_PORT: 4000,
        USER_SERVICE_PORT: 4001,
        ENABLE_FRONTEND: 'true',
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'translation_platform_staging',
        DB_USER: 'postgres',
        CORS_ORIGIN: 'https://staging.your-domain.com'
      },
      // Logging configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Monitoring
      monitoring: false,
      // Advanced PM2 features
      min_uptime: '10s',
      max_restarts: 10,
      exec_timeout: 0,
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Health check
      health_check_grace_period: 30000
    }
  ],

  // Alternative: Individual service management (commented out)
  // Uncomment if you prefer to manage services separately
  /*
  apps: [
    {
      name: 'api-gateway',
      script: './services/api-gateway/src/server.js',
      cwd: './services/api-gateway',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'user-service',
      script: './services/user-service/src/server.js',
      cwd: './services/user-service',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 4001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4001
      }
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '800M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ],
  */

  // Deployment configuration
  deploy: {
    production: {
      user: 'admin',
      host: ['your-server-ip'],
      ref: 'origin/master',
      repo: 'https://github.com/yourusername/translation-platform.git',
      path: '/home/admin/translation-platform',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      ssh_options: 'StrictHostKeyChecking=no'
    },
    staging: {
      user: 'admin',
      host: ['staging-server-ip'],
      ref: 'origin/develop',
      repo: 'https://github.com/yourusername/translation-platform.git',
      path: '/home/admin/translation-platform-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging'
    }
  }
};