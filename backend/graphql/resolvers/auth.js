/**
 * Authentication Resolvers
 * Handles user authentication and authorization
 */

const { generateToken, hashPassword, comparePassword } = require('../../utils/auth');

const authResolvers = {
  Query: {
    me: async (_, __, { user, db }) => {
      if (!user) return null;
      
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [user.id]
      );
      
      return result.rows[0];
    }
  },

  Mutation: {
    signUp: async (_, { input }, { db }) => {
      const { email, password, fullName, userType = 'translator' } = input;
      
      // Check if user exists
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existing.rows.length > 0) {
        throw new Error('Email already registered');
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create user
      const result = await db.query(
        `INSERT INTO users (email, password_hash, full_name, user_type, preferences)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [email, passwordHash, fullName, userType, JSON.stringify({ theme: 'light' })]
      );
      
      const user = result.rows[0];
      const token = generateToken(user.id);
      
      return {
        token,
        user: {
          ...user,
          fullName: user.full_name,
          userType: user.user_type,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLogin: user.last_login
        }
      };
    },

    signIn: async (_, { input }, { db }) => {
      const { email, password } = input;
      
      // Get user
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = true',
        [email]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }
      
      const user = result.rows[0];
      
      // Check password
      const validPassword = await comparePassword(password, user.password_hash);
      if (!validPassword) {
        throw new Error('Invalid credentials');
      }
      
      // Update last login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );
      
      const token = generateToken(user.id);
      
      return {
        token,
        user: {
          ...user,
          fullName: user.full_name,
          userType: user.user_type,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLogin: new Date()
        }
      };
    },

    signOut: async (_, __, { user, db }) => {
      if (!user) return false;
      
      // In a real app, you might want to invalidate the token here
      // For now, we'll just return true
      return true;
    },

    refreshToken: async (_, __, { requireAuth, db }) => {
      const user = requireAuth();
      
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [user.id]
      );
      
      const newToken = generateToken(user.id);
      
      return {
        token: newToken,
        user: {
          ...result.rows[0],
          fullName: result.rows[0].full_name,
          userType: result.rows[0].user_type,
          isActive: result.rows[0].is_active,
          createdAt: result.rows[0].created_at,
          updatedAt: result.rows[0].updated_at,
          lastLogin: result.rows[0].last_login
        }
      };
    }
  }
};

module.exports = authResolvers;