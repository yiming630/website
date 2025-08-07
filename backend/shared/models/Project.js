const { query, transaction } = require('../../databases/connection');
const { v4: uuidv4 } = require('uuid');

class Project {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.color = data.color;
    this.ownerId = data.owner_id;
    this.defaultSettings = data.default_settings;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async findById(id, userId = null) {
    try {
      let queryString = 'SELECT * FROM projects WHERE id = $1';
      let queryParams = [id];

      // If userId provided, check if user has access
      if (userId) {
        queryString = `
          SELECT p.* FROM projects p 
          WHERE p.id = $1 
          AND (p.owner_id = $2 
               OR p.id IN (
                 SELECT pc.project_id FROM project_collaborators pc 
                 WHERE pc.user_id = $2
               ))
        `;
        queryParams = [id, userId];
      }

      const result = await query(queryString, queryParams);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Project(result.rows[0]);
    } catch (error) {
      console.error('Error finding project by ID:', error);
      throw new Error('Database error while finding project');
    }
  }

  static async findByUserId(userId, limit = 20, offset = 0) {
    try {
      const result = await query(
        `SELECT p.* FROM projects p 
         WHERE p.owner_id = $1 
         OR p.id IN (
           SELECT pc.project_id FROM project_collaborators pc 
           WHERE pc.user_id = $1
         )
         ORDER BY p.updated_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows.map(row => new Project(row));
    } catch (error) {
      console.error('Error finding projects by user ID:', error);
      throw new Error('Database error while finding projects');
    }
  }

  static async create(projectData, ownerId) {
    return await transaction(async (client) => {
      try {
        const {
          name,
          description,
          color = '#3B82F6',
          defaultSettings,
          collaboratorEmails = []
        } = projectData;

        // Create project
        const projectResult = await client.query(
          `INSERT INTO projects (name, description, color, owner_id, default_settings)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [name, description, color, ownerId, JSON.stringify(defaultSettings)]
        );

        const project = new Project(projectResult.rows[0]);

        // Add collaborators if provided
        if (collaboratorEmails.length > 0) {
          await project.addCollaborators(collaboratorEmails, client);
        }

        return project;
      } catch (error) {
        console.error('Error creating project:', error);
        throw new Error('Database error while creating project');
      }
    });
  }

  static async update(id, projectData, userId) {
    try {
      // Check if user has permission to update
      const project = await this.findById(id, userId);
      if (!project) {
        throw new Error('Project not found or access denied');
      }

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.keys(projectData).forEach(key => {
        if (projectData[key] !== undefined) {
          if (key === 'defaultSettings') {
            updateFields.push(`default_settings = $${paramIndex}`);
            values.push(JSON.stringify(projectData[key]));
          } else {
            updateFields.push(`${key} = $${paramIndex}`);
            values.push(projectData[key]);
          }
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const result = await query(
        `UPDATE projects SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      return new Project(result.rows[0]);
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Database error while updating project');
    }
  }

  static async delete(id, userId) {
    try {
      // Check if user is owner
      const result = await query(
        'DELETE FROM projects WHERE id = $1 AND owner_id = $2 RETURNING id',
        [id, userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Database error while deleting project');
    }
  }

  async getDocuments() {
    try {
      const result = await query(
        'SELECT * FROM documents WHERE project_id = $1 ORDER BY updated_at DESC',
        [this.id]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting project documents:', error);
      throw new Error('Database error while getting documents');
    }
  }

  async getCollaborators() {
    try {
      const result = await query(
        `SELECT u.id, u.name, u.email, u.role, pc.permissions, pc.added_at
         FROM users u
         JOIN project_collaborators pc ON u.id = pc.user_id
         WHERE pc.project_id = $1
         ORDER BY pc.added_at DESC`,
        [this.id]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting project collaborators:', error);
      throw new Error('Database error while getting collaborators');
    }
  }

  async getOwner() {
    try {
      const result = await query(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [this.ownerId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting project owner:', error);
      throw new Error('Database error while getting owner');
    }
  }

  async addCollaborators(emails, client = null) {
    const executeQuery = client ? (text, params) => client.query(text, params) : query;

    try {
      const results = [];
      
      for (const email of emails) {
        // Find user by email
        const userResult = await executeQuery(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id;
          
          // Add as collaborator if not already added
          try {
            await executeQuery(
              `INSERT INTO project_collaborators (project_id, user_id, permissions)
               VALUES ($1, $2, $3)
               ON CONFLICT (project_id, user_id) DO NOTHING`,
              [this.id, userId, JSON.stringify({
                canView: true,
                canComment: true,
                canEdit: false,
                canShare: false
              })]
            );
            results.push({ email, status: 'added' });
          } catch (error) {
            results.push({ email, status: 'error', message: error.message });
          }
        } else {
          results.push({ email, status: 'user_not_found' });
        }
      }

      return results;
    } catch (error) {
      console.error('Error adding collaborators:', error);
      throw new Error('Database error while adding collaborators');
    }
  }

  async removeCollaborator(userId) {
    try {
      const result = await query(
        'DELETE FROM project_collaborators WHERE project_id = $1 AND user_id = $2 RETURNING *',
        [this.id, userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw new Error('Database error while removing collaborator');
    }
  }

  async hasUserAccess(userId) {
    try {
      const result = await query(
        `SELECT 1 FROM projects p
         WHERE p.id = $1 
         AND (p.owner_id = $2 
              OR p.id IN (
                SELECT pc.project_id FROM project_collaborators pc 
                WHERE pc.user_id = $2
              ))`,
        [this.id, userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking user access:', error);
      throw new Error('Database error while checking access');
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      color: this.color,
      defaultSettings: this.defaultSettings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Project;
