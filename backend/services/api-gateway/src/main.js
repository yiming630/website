#!/usr/bin/env node

/**
 * Translation Platform - Main Process Manager
 * 
 * This is the main entry point for the entire Translation Platform.
 * It orchestrates the startup of all services and can be managed by PM2.
 * 
 * Services managed:
 * 1. Database connection verification
 * 2. API Gateway (GraphQL Apollo Server)
 * 3. User Service (Authentication & User Management)
 * 4. Frontend (Next.js React App)
 * 
 * Based on: 服务器部署指南.md
 */

const { spawn, fork } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '../../../.env' });

// Service configuration
const SERVICES = {
  'database': {
    name: 'Database Health Check',
    script: 'database/init.js',
    enabled: true,
    checkOnly: true
  },
  'api-gateway': {
    name: 'API Gateway (GraphQL)',
    script: 'services/api-gateway/src/server.js',
    cwd: path.join(__dirname, 'services/api-gateway'),
    port: process.env.API_GATEWAY_PORT || 4000,
    enabled: true,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.API_GATEWAY_PORT || 4000,
      HOST: process.env.HOST || '0.0.0.0',
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_PORT: process.env.DB_PORT || 5432,
      DB_NAME: process.env.DB_NAME || 'translation_platform',
      DB_USER: process.env.DB_USER || 'postgres',
      DB_PASSWORD: process.env.DB_PASSWORD,
      JWT_SECRET: process.env.JWT_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
    }
  },
  'user-service': {
    name: 'User Service',
    script: 'services/user-service/src/server.js',
    cwd: path.join(__dirname, 'services/user-service'),
    port: process.env.USER_SERVICE_PORT || 4001,
    enabled: true,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: process.env.USER_SERVICE_PORT || 4001,
      HOST: process.env.HOST || '0.0.0.0',
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_PORT: process.env.DB_PORT || 5432,
      DB_NAME: process.env.DB_NAME || 'translation_platform',
      DB_USER: process.env.DB_USER || 'postgres',
      DB_PASSWORD: process.env.DB_PASSWORD,
      JWT_SECRET: process.env.JWT_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
    }
  },
  'frontend': {
    name: 'Frontend (Next.js)',
    script: 'start',
    cwd: path.join(__dirname, 'frontend'),
    port: 3000,
    enabled: process.env.ENABLE_FRONTEND !== 'false',
    isNpm: true,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'production',
      PORT: 3000,
      NEXT_PUBLIC_API_URL: `http://localhost:${process.env.API_GATEWAY_PORT || 4000}`,
      NEXT_PUBLIC_GRAPHQL_URL: `http://localhost:${process.env.API_GATEWAY_PORT || 4000}/graphql`
    }
  }
};

// Global state
const processes = new Map();
let shutdownInProgress = false;

/**
 * Logger utility
 */
const logger = {
  info: (service, message) => console.log(`[${new Date().toISOString()}] [${service}] INFO: ${message}`),
  error: (service, message) => console.error(`[${new Date().toISOString()}] [${service}] ERROR: ${message}`),
  warn: (service, message) => console.warn(`[${new Date().toISOString()}] [${service}] WARN: ${message}`),
  success: (service, message) => console.log(`[${new Date().toISOString()}] [${service}] SUCCESS: ${message}`)
};

/**
 * Check if required environment variables are set
 */
function validateEnvironment() {
  const required = ['DB_PASSWORD', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('MAIN', `Missing required environment variables: ${missing.join(', ')}`);
    logger.error('MAIN', 'Please create a .env file with the required variables');
    process.exit(1);
  }
  
  logger.success('MAIN', 'Environment validation passed');
}

/**
 * Check if service files exist
 */
function validateServiceFiles() {
  for (const [serviceId, config] of Object.entries(SERVICES)) {
    if (!config.enabled) continue;
    
    const scriptPath = config.isNpm 
      ? path.join(config.cwd, 'package.json')
      : path.join(__dirname, config.script);
    
    if (!fs.existsSync(scriptPath)) {
      logger.error('MAIN', `Service file not found: ${scriptPath}`);
      process.exit(1);
    }
  }
  
  logger.success('MAIN', 'Service files validation passed');
}

/**
 * Wait for a service to be ready
 */
function waitForService(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkPort() {
      const net = require('net');
      const socket = new net.Socket();
      
      socket.setTimeout(1000);
      socket.connect(port, 'localhost', () => {
        socket.destroy();
        resolve();
      });
      
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Service on port ${port} did not start within ${timeout}ms`));
        } else {
          setTimeout(checkPort, 1000);
        }
      });
    }
    
    checkPort();
  });
}

/**
 * Start a single service
 */
async function startService(serviceId, config) {
  return new Promise((resolve, reject) => {
    logger.info(serviceId, `Starting ${config.name}...`);
    
    let child;
    const options = {
      cwd: config.cwd || __dirname,
      env: { ...process.env, ...config.env },
      stdio: ['inherit', 'pipe', 'pipe']
    };
    
    if (config.isNpm) {
      // For npm scripts
      child = spawn('npm', ['run', config.script], options);
    } else if (config.checkOnly) {
      // For one-time checks (like database init)
      child = fork(path.join(__dirname, config.script), [], options);
    } else {
      // For Node.js services
      child = fork(path.join(__dirname, config.script), [], options);
    }
    
    // Store process reference
    processes.set(serviceId, { child, config });
    
    // Handle output
    if (child.stdout) {
      child.stdout.on('data', (data) => {
        const message = data.toString().trim();
        if (message) logger.info(serviceId, message);
      });
    }
    
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        const message = data.toString().trim();
        if (message) logger.error(serviceId, message);
      });
    }
    
    // Handle process events
    child.on('error', (error) => {
      logger.error(serviceId, `Failed to start: ${error.message}`);
      reject(error);
    });
    
    child.on('exit', (code, signal) => {
      processes.delete(serviceId);
      
      if (shutdownInProgress) {
        logger.info(serviceId, 'Stopped gracefully');
        return;
      }
      
      if (code === 0) {
        logger.success(serviceId, 'Completed successfully');
        if (config.checkOnly) {
          resolve();
        }
      } else {
        logger.error(serviceId, `Exited with code ${code}, signal ${signal}`);
        if (!config.checkOnly) {
          // Restart after delay
          setTimeout(() => {
            if (!shutdownInProgress) {
              logger.info(serviceId, 'Restarting...');
              startService(serviceId, config);
            }
          }, 5000);
        }
      }
    });
    
    // For services with ports, wait for them to be ready
    if (config.port && !config.checkOnly) {
      waitForService(config.port, 60000)
        .then(() => {
          logger.success(serviceId, `Service ready on port ${config.port}`);
          resolve();
        })
        .catch((error) => {
          logger.error(serviceId, `Service failed to start: ${error.message}`);
          reject(error);
        });
    } else if (!config.checkOnly) {
      // For services without specific ports, wait a bit then resolve
      setTimeout(() => {
        logger.success(serviceId, 'Service started');
        resolve();
      }, 2000);
    }
  });
}

/**
 * Start all services in order
 */
async function startAllServices() {
  logger.info('MAIN', 'Starting Translation Platform...');
  
  // Start services in dependency order
  const serviceOrder = ['database', 'user-service', 'api-gateway', 'frontend'];
  
  for (const serviceId of serviceOrder) {
    const config = SERVICES[serviceId];
    if (!config || !config.enabled) {
      logger.info('MAIN', `Skipping ${serviceId} (disabled)`);
      continue;
    }
    
    try {
      await startService(serviceId, config);
      
      // Add delay between services
      if (!config.checkOnly) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      logger.error('MAIN', `Failed to start ${serviceId}: ${error.message}`);
      
      // For critical services, exit
      if (serviceId === 'database' || serviceId === 'api-gateway') {
        logger.error('MAIN', 'Critical service failed, shutting down');
        process.exit(1);
      }
    }
  }
  
  // Show startup summary
  const runningServices = Array.from(processes.keys());
  logger.success('MAIN', `Translation Platform started successfully!`);
  logger.info('MAIN', `Running services: ${runningServices.join(', ')}`);
  
  // Show service URLs
  if (SERVICES['api-gateway'].enabled) {
    logger.info('MAIN', `GraphQL API: http://localhost:${SERVICES['api-gateway'].port}/graphql`);
    logger.info('MAIN', `API Health: http://localhost:${SERVICES['api-gateway'].port}/health`);
  }
  if (SERVICES['frontend'].enabled) {
    logger.info('MAIN', `Frontend: http://localhost:3000`);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(signal) {
  if (shutdownInProgress) return;
  shutdownInProgress = true;
  
  logger.info('MAIN', `Received ${signal}, shutting down gracefully...`);
  
  // Stop all services
  const stopPromises = Array.from(processes.entries()).map(([serviceId, { child }]) => {
    return new Promise((resolve) => {
      logger.info(serviceId, 'Stopping...');
      
      // Send SIGTERM
      child.kill('SIGTERM');
      
      // Force kill after timeout
      const forceKillTimer = setTimeout(() => {
        logger.warn(serviceId, 'Force killing...');
        child.kill('SIGKILL');
        resolve();
      }, 10000);
      
      child.on('exit', () => {
        clearTimeout(forceKillTimer);
        resolve();
      });
    });
  });
  
  await Promise.all(stopPromises);
  logger.success('MAIN', 'All services stopped');
  process.exit(0);
}

/**
 * Health check endpoint (for monitoring)
 */
function setupHealthCheck() {
  const http = require('http');
  
  const healthServer = http.createServer((req, res) => {
    if (req.url === '/health') {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {}
      };
      
      for (const [serviceId, { config }] of processes) {
        health.services[serviceId] = {
          name: config.name,
          status: 'running',
          port: config.port
        };
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health, null, 2));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
  
  const healthPort = process.env.HEALTH_PORT || 8080;
  healthServer.listen(healthPort, () => {
    logger.info('MAIN', `Health check available at http://localhost:${healthPort}/health`);
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    // Handle process signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGHUP', () => shutdown('SIGHUP'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('MAIN', `Uncaught exception: ${error.message}`);
      logger.error('MAIN', error.stack);
      shutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('MAIN', `Unhandled rejection at: ${promise}, reason: ${reason}`);
      shutdown('UNHANDLED_REJECTION');
    });
    
    // Validate environment and files
    validateEnvironment();
    validateServiceFiles();
    
    // Setup health check
    setupHealthCheck();
    
    // Start all services
    await startAllServices();
    
    // Keep the process alive
    logger.info('MAIN', 'Translation Platform is running. Press Ctrl+C to stop.');
    
  } catch (error) {
    logger.error('MAIN', `Startup failed: ${error.message}`);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main();
}

module.exports = { main, startService, shutdown };