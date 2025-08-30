/**
 * GraphQL Context Middleware
 * Handles authentication and provides context to resolvers
 */

const jwt = require('jsonwebtoken');
const db = require('../../database/connection');

async function createContext({ req }) {
  // Get the user token from headers
  const token = req.headers.authorization?.replace('Bearer ', '') || '';
  
  let user = null;
  
  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const result = await db.query(
        'SELECT id, email, full_name, user_type, is_active FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      
      if (result.rows.length > 0) {
        user = {
          id: result.rows[0].id,
          email: result.rows[0].email,
          fullName: result.rows[0].full_name,
          userType: result.rows[0].user_type,
          isActive: result.rows[0].is_active
        };
      }
    } catch (error) {
      // Invalid token, user remains null
      if (process.env.NODE_ENV === 'development') {
        console.log('Invalid token:', error.message);
      }
    }
  }
  
  return {
    user,
    db,
    req,
    // Helper functions
    requireAuth: () => {
      if (!user) {
        throw new Error('Authentication required');
      }
      return user;
    },
    requireAdmin: () => {
      if (!user || user.userType !== 'admin') {
        throw new Error('Admin access required');
      }
      return user;
    }
  };
}

module.exports = { createContext };