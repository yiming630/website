const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { execute, subscribe } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load centralized port configuration first, then environment variables
require('dotenv').config({ path: '../../../.portenv' });
require('dotenv').config({ path: '../../../.env' });

const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');
const { createGraphQLContext } = require('./middleware/auth');
const { checkHealth, initializePool } = require('./utils/database');
const healthChecker = require('./utils/healthCheck');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || process.env.PORT || 4002; // Use centralized port config
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database pool
console.log('🚀 Starting API Gateway Server...');
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Port: ${PORT}`);
console.log(`🔧 Host: ${HOST}`);
initializePool();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Contact database initialization route
const initContactRoute = require('./routes/init-contact');
app.use('/api', initContactRoute);

// File download routes for GridFS
const fileDownloadRoute = require('./routes/fileDownload');
app.use('/api/files', fileDownloadRoute);

// Health check endpoints
app.get('/health', async (req, res) => {
  try {
    const quickHealth = await healthChecker.quickCheck();
    res.json(quickHealth);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed health check endpoint
app.get('/health/detailed', async (req, res) => {
  try {
    const detailedHealth = await healthChecker.checkAllServices();
    const statusCode = detailedHealth.overall === 'healthy' ? 200 : 
                       detailedHealth.overall === 'degraded' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway - Translation Platform',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      graphql: '/graphql'
    }
  });
});

// Start Apollo Server with WebSocket support
async function startServer() {
  try {
    console.log('🔧 Starting Apollo Server with WebSocket support...');
    
    // Run comprehensive health check on startup
    console.log('\n' + '='.repeat(60));
    console.log('🔍 RUNNING STARTUP DIAGNOSTICS');
    console.log('='.repeat(60));
    
    const healthResults = await healthChecker.checkAllServices();
    
    if (healthResults.overall === 'unhealthy') {
      console.error('❌ Critical services are unhealthy. Server may not function properly.');
      console.error('🔧 Please check your configuration and try again.');
    } else if (healthResults.overall === 'degraded') {
      console.warn('⚠️  Some services are degraded. Server will start but functionality may be limited.');
    } else {
      console.log('✅ All services are healthy. Ready to start server.');
    }
    
    console.log('='.repeat(60) + '\n');
    
    // Create HTTP server
    const httpServer = createServer(app);
    
    // Create executable schema
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });
    
    // Create Apollo Server
    const server = new ApolloServer({
      schema,
      context: async ({ req }) => {
        // Create GraphQL context with authentication helpers
        const authContext = await createGraphQLContext(req);
        return {
          ...authContext,
          req,
        };
      },
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          path: error.path
        };
      },
    });
    
    await server.start();
    console.log('✅ Apollo Server started successfully');
    
    // Apply Apollo middleware
    server.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
      }
    });
    console.log('✅ GraphQL middleware applied to /graphql');

    // Start HTTP server first
    const httpServerInstance = httpServer.listen(PORT, HOST, () => {
      console.log('\n' + '🎉'.repeat(20));
      console.log('✅ API GATEWAY SERVER STARTED SUCCESSFULLY');
      console.log('🎉'.repeat(20));
      console.log(`🚀 Server: http://${HOST}:${PORT}`);
      console.log(`📊 Health Check: http://${HOST}:${PORT}/health`);
      console.log(`🔍 Detailed Health: http://${HOST}:${PORT}/health/detailed`);
      console.log(`🔍 GraphQL Playground: http://${HOST}:${PORT}${server.graphqlPath}`);
      console.log(`📁 File Downloads: http://${HOST}:${PORT}/api/files/download/{id}`);
      console.log('🎉'.repeat(20) + '\n');
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

      // Create WebSocket server after HTTP server is listening
      try {
        const wsServer = new WebSocketServer({
          server: httpServerInstance,
          path: '/graphql',
        });

        // Setup WebSocket server for GraphQL subscriptions
        const serverCleanup = useServer({
          schema,
          execute,
          subscribe,
          context: async (ctx, msg, args) => {
            // Get auth context for WebSocket connections
            const authContext = await createGraphQLContext(ctx.extra.request);
            return {
              ...authContext,
              connectionParams: ctx.connectionParams,
            };
          },
        }, wsServer);

        console.log(`🔌 WebSocket subscriptions: ws://${HOST}:${PORT}${server.graphqlPath}`);

        // Store cleanup for SIGTERM handler
        process.serverCleanup = serverCleanup;
      } catch (wsError) {
        console.warn(`⚠️  WebSocket server failed to start: ${wsError.message}`);
        console.log(`📝 HTTP GraphQL endpoint is still available`);
      }
    });

    // Add error handling middleware AFTER Apollo middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    });

    // 404 handler - MUST be last
    app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
      });
    });

    // Cleanup on server shutdown
    process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      if (process.serverCleanup) {
        await process.serverCleanup.dispose();
      }
      httpServer.close(() => {
        console.log('✅ Server closed');
      });
    });

  } catch (error) {
    console.error('❌ Failed to start Apollo Server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  console.error('❌ Server startup error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});