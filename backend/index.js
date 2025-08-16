/**
 * GraphQL API Server
 * Translation Platform Backend
 */

const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const http = require('http');
const cors = require('cors');
const { json } = require('body-parser');
require('dotenv').config({ path: '../.env.local' });

const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const { createContext } = require('./middleware/context');
const db = require('../database/connection');

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          console.log('🚀 Server starting up...');
        },
        async requestDidStart() {
          return {
            async willSendResponse(requestContext) {
              // Log queries in development
              if (process.env.NODE_ENV === 'development') {
                const { query, variables } = requestContext.request;
                if (query && !query.includes('IntrospectionQuery')) {
                  console.log('GraphQL Query:', query.substring(0, 100));
                }
              }
            }
          };
        }
      }
    ],
    formatError: (err) => {
      // Log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('GraphQL Error:', err);
      }
      
      // Don't expose internal errors to client in production
      if (process.env.NODE_ENV === 'production' && err.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return new Error('Internal server error');
      }
      
      return err;
    }
  });

  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    cors({
      origin: process.env.NEXT_PUBLIC_API_URL?.replace('/graphql', '') || 'http://localhost:3000',
      credentials: true
    }),
    json({ limit: '50mb' }),
    expressMiddleware(server, {
      context: createContext
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: db.getPoolStats()
    });
  });

  // Test database connection
  const dbConnected = await db.testConnection();
  if (!dbConnected) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }

  const PORT = process.env.API_PORT || 4000;
  
  await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
  
  console.log(`🚀 GraphQL Server ready at http://127.0.0.1:${PORT}/graphql`);
  console.log(`📊 Health check at http://127.0.0.1:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}

// Start server
startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});