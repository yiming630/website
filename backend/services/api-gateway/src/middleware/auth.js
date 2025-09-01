const jwt = require('jsonwebtoken');
const { query } = require('../utils/database');

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

    // Verify token with JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get fresh user data from database
      const userResult = await query(`
        SELECT 
          id, name, email, role, plan, preferences, 
          email_verified, email_verified_at, account_status,
          created_at, last_login
        FROM users 
        WHERE id = $1 AND account_status IN ('pending', 'active')
      `, [decoded.userId]);

      if (userResult.rows.length === 0) {
        return null; // User not found or not active
      }

      const user = userResult.rows[0];
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.email_verified,
        emailVerifiedAt: user.email_verified_at,
        accountStatus: user.account_status.toUpperCase(),
        role: user.role,
        plan: user.plan,
        preferences: user.preferences || {},
        createdAt: user.created_at,
        lastLogin: user.last_login
      };
      
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError.message);
      return null;
    }

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