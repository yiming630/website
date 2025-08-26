/**
 * Simple PM2 Configuration for Translation Platform
 * This provides a minimal configuration to get your app running
 */

module.exports = {
  apps: [
    {
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
        
        // Database (Update these with your actual values)
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'translation_platform',
        DB_USER: 'postgres',
        DB_PASSWORD: 'your_password', // CHANGE THIS
        
        // JWT Secrets (Update these for security)
        JWT_SECRET: 'development_jwt_secret_change_in_production',
        JWT_REFRESH_SECRET: 'development_refresh_secret_change_too',
        JWT_EXPIRES_IN: '1h',
        JWT_REFRESH_EXPIRES_IN: '7d',
        
        // Other required variables
        CORS_ORIGIN: 'http://localhost:3000',
        CLIENT_ORIGIN: 'http://localhost:3000',
        LOG_LEVEL: 'info'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080,
        HEALTH_PORT: 8080,
        API_GATEWAY_PORT: 4000,
        USER_SERVICE_PORT: 4001,
        ENABLE_FRONTEND: 'true',
        
        // Database (Update these with your actual production values)
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'translation_platform',
        DB_USER: 'postgres',
        DB_PASSWORD: 'CHANGE_THIS_STRONG_PASSWORD', // CHANGE THIS
        
        // JWT Secrets (MUST change these in production)
        JWT_SECRET: 'CHANGE_THIS_TO_STRONG_SECRET_KEY',
        JWT_REFRESH_SECRET: 'CHANGE_THIS_TO_DIFFERENT_STRONG_SECRET',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '30d',
        
        // Other required variables
        CORS_ORIGIN: 'https://your-domain.com',
        CLIENT_ORIGIN: 'https://your-domain.com',
        LOG_LEVEL: 'info'
      },
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};

