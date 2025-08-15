const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');
const { createGraphQLContext } = require('./middleware/auth');
const { checkHealth, initializePool } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database pool
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

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await checkHealth();
    res.status(200).json({
      status: dbHealthy ? 'healthy' : 'degraded',
      service: 'api-gateway',
      database: dbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'api-gateway',
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
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

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req, res }) => {
    // Create GraphQL context with authentication helpers
    const authContext = await createGraphQLContext(req);
    return {
      ...authContext,
      req,
      res, // Include response for cookie handling
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
  plugins: [
    {
      requestDidStart: async () => ({
        willSendResponse: async ({ response }) => {
          // Add response headers
          if (response.http) {
            response.http.headers.set('Cache-Control', 'no-cache');
          }
        }
      })
    }
  ]
});

// Start Apollo Server
async function startServer() {
  try {
    console.log('🔧 Starting Apollo Server...');
    await server.start();
    console.log('✅ Apollo Server started successfully');
    
    // Apply middleware
    console.log('🔧 Applying GraphQL middleware...');
    server.applyMiddleware({ 
      app,
      path: '/graphql',
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
      }
    });
    console.log('✅ GraphQL middleware applied to /graphql');

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

    // Start Express server
    app.listen(PORT, HOST, () => {
      console.log(`🚀 API Gateway running on http://${HOST}:${PORT}`);
      console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
      console.log(`🔍 GraphQL Playground: http://${HOST}:${PORT}/graphql`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Apollo Server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(console.error);

module.exports = app;
