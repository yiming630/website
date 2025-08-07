require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import GraphQL schema and resolvers
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./resolvers');

// Import middleware
const { createContext, onConnect } = require('./middleware/auth');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import database connection
const { testConnection, closePool } = require('../../databases/connection');

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Create Express app
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }));

  // Compression middleware
  app.use(compression());

  // Rate limiting
  app.use('/graphql', generalLimiter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api-gateway'
    });
  });

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    context: createContext,
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
    plugins: [
      // Custom plugin for error logging
      {
        requestDidStart() {
          return {
            didEncounterErrors(requestContext) {
              console.error('GraphQL errors:', requestContext.errors);
            }
          };
        }
      }
    ]
  });

  // Start Apollo Server
  await server.start();

  // Apply Apollo GraphQL middleware
  server.applyMiddleware({ 
    app, 
    path: '/graphql',
    cors: false // We handle CORS above
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
    host: process.env.WEBSOCKET_HOST || '0.0.0.0'  // Bind to all interfaces
  });

  // Use the WebSocket server for GraphQL subscriptions
  const serverCleanup = useServer({
    schema,
    context: async (ctx, msg, args) => {
      // For subscription context
      return onConnect(ctx.connectionParams, ctx.extra.socket, ctx);
    },
    onConnect: async (ctx) => {
      console.log('WebSocket client connected');
      return onConnect(ctx.connectionParams, ctx.extra.socket, ctx);
    },
    onDisconnect: () => {
      console.log('WebSocket client disconnected');
    }
  }, wsServer);

  // Server configuration
  const PORT = process.env.PORT || 4000;
  const HOST = process.env.HOST || '0.0.0.0';

  // Start the server
  httpServer.listen(PORT, HOST, () => {
    console.log(`🚀 GraphQL server ready at http://${HOST}:${PORT}${server.graphqlPath}`);
    console.log(`🔗 WebSocket server ready at ws://${HOST}:${PORT}${server.graphqlPath}`);
    console.log(`📊 Health check at http://${HOST}:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('🛑 Shutting down gracefully...');
    
    // Stop accepting new connections
    serverCleanup.dispose();
    
    // Close HTTP server
    httpServer.close(() => {
      console.log('🔌 HTTP server closed');
    });
    
    // Close database connections
    await closePool();
    
    // Stop Apollo Server
    await server.stop();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  };

  // Handle shutdown signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown();
  });
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});