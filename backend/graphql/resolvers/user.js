/**
 * User Resolvers
 * Handles user-related queries and mutations
 */

const { hashPassword, comparePassword } = require('../../utils/auth');

const userResolvers = {
  Query: {
    user: async (_, { id }, { db }) => {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return result.rows[0];
    },

    users: async (_, __, { requireAdmin, db }) => {
      requireAdmin();
      
      const result = await db.query(
        'SELECT * FROM users ORDER BY created_at DESC'
      );
      
      return result.rows;
    }
  },

  Mutation: {
    updateProfile: async (_, { fullName, avatarUrl, preferences }, { requireAuth, db }) => {
      const user = requireAuth();
      
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (fullName !== undefined) {
        updates.push(`full_name = $${paramCount++}`);
        values.push(fullName);
      }
      
      if (avatarUrl !== undefined) {
        updates.push(`avatar_url = $${paramCount++}`);
        values.push(avatarUrl);
      }
      
      if (preferences !== undefined) {
        updates.push(`preferences = $${paramCount++}`);
        values.push(JSON.stringify(preferences));
      }
      
      if (updates.length === 0) {
        throw new Error('No updates provided');
      }
      
      values.push(user.id);
      
      const result = await db.query(
        `UPDATE users 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      
      return result.rows[0];
    },

    changePassword: async (_, { oldPassword, newPassword }, { requireAuth, db }) => {
      const user = requireAuth();
      
      // Get current password hash
      const result = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id]
      );
      
      // Verify old password
      const validPassword = await comparePassword(oldPassword, result.rows[0].password_hash);
      if (!validPassword) {
        throw new Error('Invalid current password');
      }
      
      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);
      
      // Update password
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, user.id]
      );
      
      return true;
    }
  },

  // Field resolvers for User type
  User: {
    fullName: (parent) => parent.full_name,
    userType: (parent) => parent.user_type,
    avatarUrl: (parent) => parent.avatar_url,
    createdAt: (parent) => parent.created_at,
    updatedAt: (parent) => parent.updated_at,
    lastLogin: (parent) => parent.last_login,
    isActive: (parent) => parent.is_active,
    
    projects: async (parent, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
        [parent.id]
      );
      return result.rows;
    }
  }
};

module.exports = userResolvers;