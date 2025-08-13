const axios = require('axios');
const { query } = require('../utils/database');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4001';

const userResolvers = {
  Query: {
    // Get current user
    me: async (parent, args, context) => {
      const user = context.requireAuth();
      
      try {
        const result = await query(
          'SELECT id, name, email, role, plan, preferences, created_at, last_login FROM users WHERE id = $1',
          [user.id]
        );

        if (result.rows.length === 0) {
          throw new Error('User not found');
        }

        return result.rows[0];
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw new Error('Failed to fetch user profile');
      }
    },

    // Get user by ID (admin only)
    user: async (parent, { id }, context) => {
      context.requireRole('ADMIN');

      try {
        const response = await axios.get(`${USER_SERVICE_URL}/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${context.req.cookies?.['translation-platform-token']}`
          }
        });

        return response.data.user;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('User not found');
        }
        console.error('Error fetching user:', error);
        throw new Error('Failed to fetch user');
      }
    },

    // List users (admin only)
    users: async (parent, { page = 1, limit = 20 }, context) => {
      context.requireRole('ADMIN');

      try {
        const response = await axios.get(`${USER_SERVICE_URL}/users`, {
          params: { page, limit },
          headers: {
            'Authorization': `Bearer ${context.req.cookies?.['translation-platform-token']}`
          }
        });

        return {
          users: response.data.users,
          pagination: response.data.pagination
        };
      } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
      }
    }
  },

  Mutation: {
    // Register new user
    register: async (parent, { input }) => {
      try {
        const response = await axios.post(`${USER_SERVICE_URL}/auth/register`, input);
        return response.data;
      } catch (error) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.message || error.response.data.error);
        }
        console.error('Registration error:', error);
        throw new Error('Registration failed');
      }
    },

    // Login user
    login: async (parent, { input }, context) => {
      try {
        const response = await axios.post(`${USER_SERVICE_URL}/auth/login`, input);
        
        // Set cookie in response (if using HTTP-only cookies)
        if (context.res && response.data.tokens?.accessToken) {
          context.res.cookie('translation-platform-token', response.data.tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 1000 // 1 hour
          });
        }

        return response.data;
      } catch (error) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.message || error.response.data.error);
        }
        console.error('Login error:', error);
        throw new Error('Login failed');
      }
    },

    // Refresh access token
    refreshToken: async (parent, { input }) => {
      try {
        const response = await axios.post(`${USER_SERVICE_URL}/auth/refresh`, input);
        return response.data.tokens;
      } catch (error) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.message || error.response.data.error);
        }
        console.error('Token refresh error:', error);
        throw new Error('Token refresh failed');
      }
    },

    // Logout user
    logout: async (parent, { refreshToken }, context) => {
      try {
        const response = await axios.post(`${USER_SERVICE_URL}/auth/logout`, { refreshToken });
        
        // Clear cookie
        if (context.res) {
          context.res.clearCookie('translation-platform-token');
        }

        return {
          message: response.data.message || 'Logout successful',
          success: true
        };
      } catch (error) {
        console.error('Logout error:', error);
        // Even if logout fails, clear the cookie
        if (context.res) {
          context.res.clearCookie('translation-platform-token');
        }
        return {
          message: 'Logout successful',
          success: true
        };
      }
    },

    // Update user profile
    updateProfile: async (parent, { input }, context) => {
      const user = context.requireAuth();

      try {
        const response = await axios.put(`${USER_SERVICE_URL}/users/me`, input, {
          headers: {
            'Authorization': `Bearer ${context.req.cookies?.['translation-platform-token']}`
          }
        });

        return response.data.user;
      } catch (error) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.message || error.response.data.error);
        }
        console.error('Profile update error:', error);
        throw new Error('Failed to update profile');
      }
    },

    // Update user preferences
    updatePreferences: async (parent, { input }, context) => {
      const user = context.requireAuth();

      try {
        const response = await axios.put(`${USER_SERVICE_URL}/users/me/preferences`, {
          preferences: input
        }, {
          headers: {
            'Authorization': `Bearer ${context.req.cookies?.['translation-platform-token']}`
          }
        });

        // Return updated user with new preferences
        const userResult = await query(
          'SELECT id, name, email, role, plan, preferences, created_at, last_login FROM users WHERE id = $1',
          [user.id]
        );

        return userResult.rows[0];
      } catch (error) {
        if (error.response?.data?.error) {
          throw new Error(error.response.data.message || error.response.data.error);
        }
        console.error('Preferences update error:', error);
        throw new Error('Failed to update preferences');
      }
    }
  },

  // User type resolvers
  User: {
    // Resolve user's projects
    projects: async (user, args, context) => {
      try {
        const result = await query(
          'SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC',
          [user.id]
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching user projects:', error);
        return [];
      }
    },

    // Resolve user's documents
    documents: async (user, args, context) => {
      try {
        const result = await query(
          'SELECT * FROM documents WHERE owner_id = $1 ORDER BY created_at DESC',
          [user.id]
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching user documents:', error);
        return [];
      }
    },

    // Parse preferences JSON
    preferences: (user) => {
      try {
        return user.preferences || {};
      } catch (error) {
        return {};
      }
    }
  }
};

module.exports = userResolvers;