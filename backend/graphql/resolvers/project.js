/**
 * Project Resolvers
 * Handles project-related queries and mutations
 */

const projectResolvers = {
  Query: {
    project: async (_, { id }, { requireAuth, db }) => {
      const user = requireAuth();
      
      const result = await db.query(
        'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Project not found');
      }
      
      return result.rows[0];
    },

    projects: async (_, { status }, { db }) => {
      let query = 'SELECT * FROM projects';
      const params = [];
      
      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await db.query(query, params);
      return result.rows;
    },

    myProjects: async (_, __, { requireAuth, db }) => {
      const user = requireAuth();
      
      const result = await db.query(
        'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
        [user.id]
      );
      
      return result.rows;
    }
  },

  Mutation: {
    createProject: async (_, { input }, { requireAuth, db }) => {
      const user = requireAuth();
      const { name, description, sourceLanguage, targetLanguage } = input;
      
      const result = await db.query(
        `INSERT INTO projects (user_id, name, description, source_language, target_language, status)
         VALUES ($1, $2, $3, $4, $5, 'draft')
         RETURNING *`,
        [user.id, name, description, sourceLanguage, targetLanguage]
      );
      
      return result.rows[0];
    },

    updateProject: async (_, { id, input }, { requireAuth, db }) => {
      const user = requireAuth();
      
      // Check ownership
      const ownership = await db.query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [id, user.id]
      );
      
      if (ownership.rows.length === 0) {
        throw new Error('Project not found or access denied');
      }
      
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (input.name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(input.name);
      }
      
      if (input.description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(input.description);
      }
      
      if (input.status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(input.status);
        
        if (input.status === 'completed') {
          updates.push(`completed_at = NOW()`);
        }
      }
      
      if (input.sourceLanguage !== undefined) {
        updates.push(`source_language = $${paramCount++}`);
        values.push(input.sourceLanguage);
      }
      
      if (input.targetLanguage !== undefined) {
        updates.push(`target_language = $${paramCount++}`);
        values.push(input.targetLanguage);
      }
      
      if (updates.length === 0) {
        throw new Error('No updates provided');
      }
      
      values.push(id);
      
      const result = await db.query(
        `UPDATE projects 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      
      return result.rows[0];
    },

    deleteProject: async (_, { id }, { requireAuth, db }) => {
      const user = requireAuth();
      
      const result = await db.query(
        'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, user.id]
      );
      
      return result.rows.length > 0;
    }
  },

  // Field resolvers for Project type
  Project: {
    sourceLanguage: (parent) => parent.source_language,
    targetLanguage: (parent) => parent.target_language,
    createdAt: (parent) => parent.created_at,
    updatedAt: (parent) => parent.updated_at,
    completedAt: (parent) => parent.completed_at,
    
    user: async (parent, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [parent.user_id]
      );
      return result.rows[0];
    },
    
    documents: async (parent, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM documents WHERE project_id = $1 ORDER BY created_at DESC',
        [parent.id]
      );
      return result.rows;
    }
  }
};

module.exports = projectResolvers;