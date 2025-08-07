/**
 * Real-time Collaboration Service
 * Handles WebSocket connections for document collaboration
 */

require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Redis = require('redis');

// Import database connection
const { query, testConnection, closePool } = require('../../databases/connection');

// Configure logging
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Redis client for managing real-time state
let redisClient;
if (process.env.REDIS_URL) {
  redisClient = Redis.createClient({
    url: process.env.REDIS_URL
  });
  
  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });
  
  redisClient.on('connect', () => {
    logger.info('Connected to Redis');
  });
}

// Express app setup
const app = express();
const httpServer = createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'collaboration-service',
    connections: io.engine.clientsCount
  });
});

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Authentication middleware for Socket.io
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No authentication token provided');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user information from database
    const result = await query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    socket.user = result.rows[0];
    socket.userId = result.rows[0].id;
    
    logger.info(`User ${socket.user.email} connected`);
    next();
  } catch (error) {
    logger.error('Authentication failed:', error.message);
    next(new Error('Authentication failed'));
  }
});

// Document access verification
async function verifyDocumentAccess(userId, documentId) {
  try {
    const result = await query(
      `SELECT d.id FROM documents d 
       LEFT JOIN document_collaborators dc ON d.id = dc.document_id 
       WHERE d.id = $1 AND (d.owner_id = $2 OR dc.user_id = $2)`,
      [documentId, userId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Document access verification failed:', error);
    return false;
  }
}

// Connection state management
const documentSessions = new Map(); // documentId -> Set of socketIds
const userCursors = new Map(); // documentId -> Map(userId -> cursorPosition)
const documentVersions = new Map(); // documentId -> version number

// Socket connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id} for user ${socket.user.email}`);

  // Join document room
  socket.on('join-document', async (data) => {
    try {
      const { documentId } = data;
      
      if (!documentId) {
        socket.emit('error', { message: 'Document ID is required' });
        return;
      }

      // Verify access to document
      const hasAccess = await verifyDocumentAccess(socket.userId, documentId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to document' });
        return;
      }

      // Leave any previous document rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // Join the document room
      socket.join(`document:${documentId}`);
      socket.currentDocumentId = documentId;

      // Track user in document session
      if (!documentSessions.has(documentId)) {
        documentSessions.set(documentId, new Set());
      }
      documentSessions.get(documentId).add(socket.id);

      // Initialize cursor tracking for document
      if (!userCursors.has(documentId)) {
        userCursors.set(documentId, new Map());
      }

      // Get current document content and collaborators
      const documentResult = await query('SELECT * FROM documents WHERE id = $1', [documentId]);
      const collaboratorsResult = await query(
        `SELECT u.id, u.name, u.email FROM users u 
         JOIN document_collaborators dc ON u.id = dc.user_id 
         WHERE dc.document_id = $1 
         UNION 
         SELECT u.id, u.name, u.email FROM users u 
         JOIN documents d ON u.id = d.owner_id 
         WHERE d.id = $1`,
        [documentId]
      );

      // Send current document state
      socket.emit('document-joined', {
        documentId,
        document: documentResult.rows[0],
        collaborators: collaboratorsResult.rows,
        activeUsers: Array.from(documentSessions.get(documentId)).length,
        version: documentVersions.get(documentId) || 0
      });

      // Notify other users in the document
      socket.to(`document:${documentId}`).emit('user-joined', {
        user: {
          id: socket.user.id,
          name: socket.user.name,
          email: socket.user.email
        },
        timestamp: new Date().toISOString()
      });

      // Store user presence in Redis if available
      if (redisClient) {
        try {
          await redisClient.setEx(`presence:${documentId}:${socket.userId}`, 300, JSON.stringify({
            userId: socket.userId,
            userName: socket.user.name,
            lastSeen: new Date().toISOString(),
            socketId: socket.id
          }));
        } catch (redisError) {
          logger.error('Redis presence update failed:', redisError);
        }
      }

      logger.info(`User ${socket.user.email} joined document ${documentId}`);
    } catch (error) {
      logger.error('Join document error:', error);
      socket.emit('error', { message: 'Failed to join document' });
    }
  });

  // Handle document content changes
  socket.on('content-change', async (data) => {
    try {
      const { documentId, changes, version, selectionStart, selectionEnd } = data;
      
      if (!socket.currentDocumentId || socket.currentDocumentId !== documentId) {
        socket.emit('error', { message: 'Not joined to this document' });
        return;
      }

      // Verify document access
      const hasAccess = await verifyDocumentAccess(socket.userId, documentId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to document' });
        return;
      }

      // Check version conflict
      const currentVersion = documentVersions.get(documentId) || 0;
      if (version !== undefined && version < currentVersion) {
        socket.emit('version-conflict', {
          currentVersion,
          yourVersion: version
        });
        return;
      }

      // Update document in database
      const updateResult = await query(
        'UPDATE documents SET translated_content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [changes.content, documentId]
      );

      if (updateResult.rows.length === 0) {
        socket.emit('error', { message: 'Document update failed' });
        return;
      }

      // Increment version
      const newVersion = currentVersion + 1;
      documentVersions.set(documentId, newVersion);

      // Broadcast changes to other users in the document
      socket.to(`document:${documentId}`).emit('content-updated', {
        documentId,
        changes,
        version: newVersion,
        userId: socket.userId,
        userName: socket.user.name,
        timestamp: new Date().toISOString(),
        selection: { start: selectionStart, end: selectionEnd }
      });

      // Confirm the change to the sender
      socket.emit('content-change-confirmed', {
        version: newVersion,
        timestamp: new Date().toISOString()
      });

      logger.info(`Content updated in document ${documentId} by user ${socket.user.email}`);
    } catch (error) {
      logger.error('Content change error:', error);
      socket.emit('error', { message: 'Failed to update content' });
    }
  });

  // Handle cursor position updates
  socket.on('cursor-position', (data) => {
    try {
      const { documentId, position } = data;
      
      if (!socket.currentDocumentId || socket.currentDocumentId !== documentId) {
        return;
      }

      // Update cursor position in memory
      if (userCursors.has(documentId)) {
        userCursors.get(documentId).set(socket.userId, {
          position,
          userId: socket.userId,
          userName: socket.user.name,
          timestamp: new Date().toISOString()
        });

        // Broadcast cursor position to other users
        socket.to(`document:${documentId}`).emit('cursor-updated', {
          userId: socket.userId,
          userName: socket.user.name,
          position,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Cursor position update error:', error);
    }
  });

  // Handle selection updates
  socket.on('selection-change', (data) => {
    try {
      const { documentId, selection } = data;
      
      if (!socket.currentDocumentId || socket.currentDocumentId !== documentId) {
        return;
      }

      // Broadcast selection to other users
      socket.to(`document:${documentId}`).emit('selection-updated', {
        userId: socket.userId,
        userName: socket.user.name,
        selection,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Selection update error:', error);
    }
  });

  // Handle comments
  socket.on('add-comment', async (data) => {
    try {
      const { documentId, content, position } = data;
      
      if (!socket.currentDocumentId || socket.currentDocumentId !== documentId) {
        socket.emit('error', { message: 'Not joined to this document' });
        return;
      }

      // Verify document access
      const hasAccess = await verifyDocumentAccess(socket.userId, documentId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to document' });
        return;
      }

      // Save comment to database
      const commentResult = await query(
        `INSERT INTO comments (document_id, author_id, content, position) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [documentId, socket.userId, content, JSON.stringify(position)]
      );

      const comment = commentResult.rows[0];

      // Get author information
      const authorResult = await query('SELECT * FROM users WHERE id = $1', [socket.userId]);
      const author = authorResult.rows[0];

      // Broadcast new comment to all users in the document
      io.to(`document:${documentId}`).emit('comment-added', {
        comment: {
          ...comment,
          author: {
            id: author.id,
            name: author.name,
            email: author.email
          },
          position: JSON.parse(comment.position)
        },
        timestamp: new Date().toISOString()
      });

      logger.info(`Comment added to document ${documentId} by user ${socket.user.email}`);
    } catch (error) {
      logger.error('Add comment error:', error);
      socket.emit('error', { message: 'Failed to add comment' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async (reason) => {
    try {
      logger.info(`Socket disconnected: ${socket.id} for user ${socket.user.email}, reason: ${reason}`);

      // Remove from document sessions
      if (socket.currentDocumentId) {
        const documentId = socket.currentDocumentId;
        
        // Remove from session tracking
        if (documentSessions.has(documentId)) {
          documentSessions.get(documentId).delete(socket.id);
          
          // Clean up empty sessions
          if (documentSessions.get(documentId).size === 0) {
            documentSessions.delete(documentId);
            userCursors.delete(documentId);
          }
        }

        // Remove cursor tracking
        if (userCursors.has(documentId)) {
          userCursors.get(documentId).delete(socket.userId);
        }

        // Notify other users
        socket.to(`document:${documentId}`).emit('user-left', {
          user: {
            id: socket.user.id,
            name: socket.user.name,
            email: socket.user.email
          },
          timestamp: new Date().toISOString()
        });

        // Remove presence from Redis
        if (redisClient) {
          try {
            await redisClient.del(`presence:${documentId}:${socket.userId}`);
          } catch (redisError) {
            logger.error('Redis presence cleanup failed:', redisError);
          }
        }
      }
    } catch (error) {
      logger.error('Disconnect handling error:', error);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    logger.error(`Socket error for user ${socket.user.email}:`, error);
  });
});

// Cleanup intervals
setInterval(() => {
  // Clean up inactive document sessions
  documentSessions.forEach((sockets, documentId) => {
    if (sockets.size === 0) {
      documentSessions.delete(documentId);
      userCursors.delete(documentId);
      documentVersions.delete(documentId);
    }
  });
}, 30000); // Every 30 seconds

// Server startup
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Connect to Redis if configured
    if (redisClient) {
      await redisClient.connect();
    }

    const PORT = process.env.PORT || 4001;
    const HOST = process.env.HOST || '0.0.0.0';

    httpServer.listen(PORT, HOST, () => {
      logger.info(`🚀 Collaboration service running on http://${HOST}:${PORT}`);
      logger.info(`📊 Health check at http://${HOST}:${PORT}/health`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async () => {
  logger.info('🛑 Shutting down collaboration service...');
  
  // Close Socket.io server
  io.close(() => {
    logger.info('📡 Socket.io server closed');
  });
  
  // Close HTTP server
  httpServer.close(() => {
    logger.info('🔌 HTTP server closed');
  });
  
  // Close database connections
  await closePool();
  
  // Close Redis connection
  if (redisClient) {
    await redisClient.quit();
    logger.info('🔴 Redis connection closed');
  }
  
  logger.info('✅ Graceful shutdown completed');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
