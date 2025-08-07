const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const { query, transaction } = require('../../../databases/connection');
const Project = require('../../../shared/models/Project');
const User = require('../../../shared/models/User');
const { requireAuth } = require('../middleware/auth');

const projectResolvers = {
  Query: {
    projects: requireAuth(async (_, { limit = 50, offset = 0 }, { user }) => {
      try {
        const projects = await Project.findByUserId(user.id, limit, offset);
        return projects.map(project => project.toJSON());
      } catch (error) {
        console.error('Error getting projects:', error);
        throw new Error('Failed to fetch projects');
      }
    }),

    project: requireAuth(async (_, { id }, { user }) => {
      try {
        const project = await Project.findById(id, user.id);
        
        if (!project) {
          throw new ForbiddenError('Project not found or access denied');
        }
        
        return project.toJSON();
      } catch (error) {
        console.error('Error getting project:', error);
        throw new Error('Failed to fetch project');
      }
    })
  },

  Mutation: {
    createProject: requireAuth(async (_, { input }, { user }) => {
      try {
        const project = await Project.create(input, user.id);
        return project.toJSON();
      } catch (error) {
        console.error('Error creating project:', error);
        throw new UserInputError(error.message || 'Failed to create project');
      }
    }),

    updateProject: async (_, { id, input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Check if user owns the project
      const projectCheck = await query(
        'SELECT owner_id FROM projects WHERE id = $1',
        [id]
      );
      
      if (projectCheck.rows.length === 0) {
        throw new UserInputError('Project not found');
      }
      
      if (projectCheck.rows[0].owner_id !== user.id) {
        throw new ForbiddenError('Only project owner can update project');
      }
      
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      if (input.name) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(input.name);
      }
      
      if (input.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(input.description);
      }
      
      if (input.color) {
        updateFields.push(`color = $${paramIndex++}`);
        updateValues.push(input.color);
      }
      
      if (input.defaultSettings) {
        updateFields.push(`default_settings = $${paramIndex++}`);
        updateValues.push(JSON.stringify(input.defaultSettings));
      }
      
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);
      
      const result = await query(
        `UPDATE projects SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        updateValues
      );
      
      return result.rows[0];
    },

    deleteProject: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Check if user owns the project
      const projectCheck = await query(
        'SELECT owner_id FROM projects WHERE id = $1',
        [id]
      );
      
      if (projectCheck.rows.length === 0) {
        return false;
      }
      
      if (projectCheck.rows[0].owner_id !== user.id) {
        throw new ForbiddenError('Only project owner can delete project');
      }
      
      const result = await query(
        'DELETE FROM projects WHERE id = $1',
        [id]
      );
      
      return result.rowCount > 0;
    }
  },

  Project: {
    owner: async (parent) => {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [parent.owner_id]
      );
      
      return result.rows[0];
    },
    
    defaultSettings: (parent) => {
      return parent.default_settings ? JSON.parse(parent.default_settings) : {};
    },
    
    documents: async (parent) => {
      const result = await query(
        'SELECT * FROM documents WHERE project_id = $1 ORDER BY updated_at DESC',
        [parent.id]
      );
      
      return result.rows;
    },
    
    collaborators: async (parent) => {
      const result = await query(
        `SELECT u.* FROM users u 
         JOIN project_collaborators pc ON u.id = pc.user_id 
         WHERE pc.project_id = $1`,
        [parent.id]
      );
      
      return result.rows;
    }
  }
};

module.exports = projectResolvers;