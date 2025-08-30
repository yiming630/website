const { query } = require('../utils/database');

const projectResolvers = {
  Query: {
    // Get projects for current user
    projects: async (parent, { limit = 20, offset = 0 }, context) => {
      const user = context.requireAuth();

      try {
        const result = await query(
          'SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
          [user.id, limit, offset]
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching projects:', error);
        throw new Error('Failed to fetch projects');
      }
    },

    // Get project by ID
    project: async (parent, { id }, context) => {
      const user = context.requireAuth();

      try {
        const result = await query(
          'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
          [id, user.id]
        );

        if (result.rows.length === 0) {
          throw new Error('Project not found or access denied');
        }

        return result.rows[0];
      } catch (error) {
        console.error('Error fetching project:', error);
        throw new Error('Failed to fetch project');
      }
    }
  },

  Mutation: {
    // Create new project
    createProject: async (parent, { input }, context) => {
      const user = context.requireAuth();

      try {
        const result = await query(
          'INSERT INTO projects (name, description, color, owner_id, default_settings) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [
            input.name,
            input.description || null,
            input.color || '#3B82F6',
            user.id,
            JSON.stringify(input.defaultSettings)
          ]
        );

        return result.rows[0];
      } catch (error) {
        console.error('Error creating project:', error);
        throw new Error('Failed to create project');
      }
    },

    // Update project
    updateProject: async (parent, { id, input }, context) => {
      const user = context.requireAuth();

      try {
        const result = await query(
          'UPDATE projects SET name = $1, description = $2, color = $3, default_settings = $4, updated_at = NOW() WHERE id = $5 AND owner_id = $6 RETURNING *',
          [
            input.name,
            input.description || null,
            input.color || '#3B82F6',
            JSON.stringify(input.defaultSettings),
            id,
            user.id
          ]
        );

        if (result.rows.length === 0) {
          throw new Error('Project not found or access denied');
        }

        return result.rows[0];
      } catch (error) {
        console.error('Error updating project:', error);
        throw new Error('Failed to update project');
      }
    },

    // Delete project
    deleteProject: async (parent, { id }, context) => {
      const user = context.requireAuth();

      try {
        const result = await query(
          'DELETE FROM projects WHERE id = $1 AND owner_id = $2',
          [id, user.id]
        );

        return result.rowCount > 0;
      } catch (error) {
        console.error('Error deleting project:', error);
        throw new Error('Failed to delete project');
      }
    }
  },

  // Project type resolvers
  Project: {
    // Resolve project owner
    owner: async (project) => {
      try {
        const result = await query(
          'SELECT id, name, email, role, plan FROM users WHERE id = $1',
          [project.owner_id]
        );
        return result.rows[0];
      } catch (error) {
        console.error('Error fetching project owner:', error);
        return null;
      }
    },

    // Resolve project documents
    documents: async (project) => {
      try {
        const result = await query(
          'SELECT * FROM documents WHERE project_id = $1 ORDER BY created_at DESC',
          [project.id]
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching project documents:', error);
        return [];
      }
    },

    // Resolve project collaborators (placeholder for future implementation)
    collaborators: async (project) => {
      try {
        const result = await query(
          `SELECT u.id, u.name, u.email, u.role, u.plan 
           FROM users u 
           JOIN project_collaborators pc ON u.id = pc.user_id 
           WHERE pc.project_id = $1`,
          [project.id]
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching project collaborators:', error);
        return [];
      }
    },

    // Parse default settings JSON
    defaultSettings: (project) => {
      try {
        return project.default_settings || {};
      } catch (error) {
        return {};
      }
    }
  }
};

module.exports = projectResolvers;