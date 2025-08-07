const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const { query, transaction } = require('../../../databases/connection');
const User = require('../../../shared/models/User');
const AuthUtils = require('../../../shared/utils/auth');
const { requireAuth } = require('../middleware/auth');

const userResolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [user.id]
      );
      
      return result.rows[0];
    }
  },

  Mutation: {
    register: async (_, { input }) => {
      const { name, email, password, role = 'READER' } = input;

      // Validate input
      if (!AuthUtils.validateEmail(email)) {
        throw new UserInputError('Invalid email format');
      }

      if (!AuthUtils.validatePassword(password)) {
        throw new UserInputError('Password must be at least 8 characters long and contain letters and numbers');
      }

      try {
        // Create user
        const newUser = await User.create({
          name,
          email,
          password,
          role
        });

        // Generate tokens
        const tokens = AuthUtils.generateTokens(newUser);

        return AuthUtils.createAuthResponse(newUser.toJSON(), tokens);
      } catch (error) {
        console.error('Registration error:', error);
        throw new UserInputError(error.message || 'Registration failed');
      }
    },

    login: async (_, { input }) => {
      const { email, password } = input;

      try {
        // Validate user credentials
        const user = await User.validatePassword(email, password);
        
        if (!user) {
          throw new AuthenticationError('Invalid email or password');
        }

        // Generate tokens
        const tokens = AuthUtils.generateTokens(user);

        return AuthUtils.createAuthResponse(user.toJSON(), tokens);
      } catch (error) {
        console.error('Login error:', error);
        throw new AuthenticationError(error.message || 'Login failed');
      }
    },

    refreshToken: async (_, { refreshToken }) => {
      try {
        const decoded = AuthUtils.verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          throw new AuthenticationError('User not found');
        }

        // Generate new tokens
        const tokens = AuthUtils.generateTokens(user);

        return AuthUtils.createAuthResponse(user.toJSON(), tokens);
      } catch (error) {
        console.error('Refresh token error:', error);
        throw new AuthenticationError('Invalid refresh token');
      }
    },

    logout: async (_, __, { user }) => {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return true
      return true;
    },

    updateUserPreferences: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      const result = await query(
        'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [JSON.stringify(input), user.id]
      );
      
      return result.rows[0];
    }
  },

  User: {
    preferences: (parent) => {
      return parent.preferences ? JSON.parse(parent.preferences) : {};
    },
    
    projects: async (parent) => {
      const result = await query(
        `SELECT p.* FROM projects p 
         LEFT JOIN project_collaborators pc ON p.id = pc.project_id 
         WHERE p.owner_id = $1 OR pc.user_id = $1
         ORDER BY p.updated_at DESC`,
        [parent.id]
      );
      
      return result.rows;
    },
    
    documents: async (parent) => {
      const result = await query(
        `SELECT d.* FROM documents d 
         LEFT JOIN document_collaborators dc ON d.id = dc.document_id 
         WHERE d.owner_id = $1 OR dc.user_id = $1
         ORDER BY d.updated_at DESC`,
        [parent.id]
      );
      
      return result.rows;
    }
  }
};

module.exports = userResolvers;