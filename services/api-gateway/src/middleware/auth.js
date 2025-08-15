const jwt = require('jsonwebtoken');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4001';

// Authenticate user from JWT token
async function authenticateUser(req) {
  try {
    // Extract token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.[process.env.COOKIE_NAME || 'translation-platform-token'];
    
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return null; // No token provided
    }

    // Verify token locally first (for performance)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // If local verification succeeds, we still want to verify with user service
      // to ensure user still exists and get fresh user data
      const response = await axios.get(`${USER_SERVICE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });

      if (response.data.valid) {
        return response.data.user;
      }
      
      return null;
    } catch (localError) {
      // If local verification fails, still try with user service
      // in case the token is valid but we have different secrets
      console.log('Local JWT verification failed, trying user service:', localError.message);
    }

    // Fallback: verify with user service
    try {
      const response = await axios.get(`${USER_SERVICE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });

      if (response.data.valid) {
        return response.data.user;
      }
    } catch (serviceError) {
      console.log('User service verification failed:', serviceError.message);
    }

    return null;

  } catch (error) {
    console.error('Authentication error:', error.message);
    return null;
  }
}

// Middleware to require authentication
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }
  next();
}

// Middleware to require specific role
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

// Helper function to check if user has permission
function hasPermission(user, requiredRole) {
  if (!user) return false;
  
  const roleHierarchy = {
    'READER': 1,
    'TRANSLATOR': 2,
    'ADMIN': 3,
    'ENTERPRISE': 4
  };

  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

// GraphQL context helper
async function createGraphQLContext(req) {
  const user = await authenticateUser(req);
  
  return {
    user,
    req,
    isAuthenticated: !!user,
    hasPermission: (role) => hasPermission(user, role),
    requireAuth: () => {
      if (!user) {
        throw new Error('Authentication required');
      }
      return user;
    },
    requireRole: (role) => {
      if (!user) {
        throw new Error('Authentication required');
      }
      if (!hasPermission(user, role)) {
        throw new Error(`Access denied. Required role: ${role}`);
      }
      return user;
    }
  };
}

module.exports = {
  authenticateUser,
  requireAuth,
  requireRole,
  hasPermission,
  createGraphQLContext
};