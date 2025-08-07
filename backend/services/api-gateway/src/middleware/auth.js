const jwt = require('jsonwebtoken');
const User = require('../../../shared/models/User');
const AuthUtils = require('../../../shared/utils/auth');

const authenticateToken = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return null;
    }
    
    const decoded = AuthUtils.verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    
    if (user) {
      // Update last login
      await User.updateLastLogin(user.id);
    }
    
    return user;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

const createContext = async ({ req, connection }) => {
  // For WebSocket connections
  if (connection) {
    return connection.context;
  }
  
  // For HTTP requests
  const user = await authenticateToken(req);
  
  return {
    user,
    isAuthenticated: !!user,
    req,
    ip: req.ip || req.connection.remoteAddress
  };
};

// WebSocket authentication
const onConnect = async (connectionParams, webSocket, context) => {
  try {
    if (!connectionParams?.authorization) {
      // Allow anonymous connections for public documents
      return { user: null, isAuthenticated: false };
    }

    const decoded = AuthUtils.validateWebSocketAuth(connectionParams);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new Error('User not found');
    }

    console.log(`WebSocket authenticated for user: ${user.email}`);
    return {
      user,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('WebSocket authentication error:', error.message);
    throw new Error('Authentication failed');
  }
};

const requireAuth = (resolver) => {
  return (parent, args, context, info) => {
    if (!context.isAuthenticated) {
      throw new Error('Authentication required');
    }
    return resolver(parent, args, context, info);
  };
};

const requireRole = (requiredRole) => {
  return (resolver) => {
    return (parent, args, context, info) => {
      if (!context.isAuthenticated) {
        throw new Error('Authentication required');
      }

      if (!AuthUtils.hasRole(context.user, requiredRole)) {
        throw new Error('Insufficient permissions');
      }

      return resolver(parent, args, context, info);
    };
  };
};

const requirePermission = (action) => {
  return (resolver) => {
    return (parent, args, context, info) => {
      if (!context.isAuthenticated) {
        throw new Error('Authentication required');
      }

      if (!AuthUtils.checkPermissions(context.user, null, action)) {
        throw new Error('Insufficient permissions');
      }

      return resolver(parent, args, context, info);
    };
  };
};

module.exports = {
  authenticateToken,
  createContext,
  onConnect,
  requireAuth,
  requireRole,
  requirePermission
};