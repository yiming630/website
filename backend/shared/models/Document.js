const { query, transaction } = require('../../databases/connection');
const { v4: uuidv4 } = require('uuid');

class Document {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.status = data.status;
    this.progress = data.progress;
    this.sourceLanguage = data.source_language;
    this.targetLanguage = data.target_language;
    this.translationStyle = data.translation_style;
    this.specialization = data.specialization;
    this.originalContent = data.original_content;
    this.translatedContent = data.translated_content;
    this.fileUrl = data.file_url;
    this.bosObjectKey = data.bos_object_key;
    this.projectId = data.project_id;
    this.ownerId = data.owner_id;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async findById(id, userId = null) {
    try {
      let queryString = 'SELECT * FROM documents WHERE id = $1';
      let queryParams = [id];

      // If userId provided, check if user has access
      if (userId) {
        queryString = `
          SELECT d.* FROM documents d 
          WHERE d.id = $1 
          AND (d.owner_id = $2 
               OR d.id IN (
                 SELECT dc.document_id FROM document_collaborators dc 
                 WHERE dc.user_id = $2
               )
               OR d.project_id IN (
                 SELECT p.id FROM projects p 
                 WHERE p.owner_id = $2 
                 OR p.id IN (
                   SELECT pc.project_id FROM project_collaborators pc 
                   WHERE pc.user_id = $2
                 )
               ))
        `;
        queryParams = [id, userId];
      }

      const result = await query(queryString, queryParams);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Document(result.rows[0]);
    } catch (error) {
      console.error('Error finding document by ID:', error);
      throw new Error('Database error while finding document');
    }
  }

  static async findByUserId(userId, limit = 20, offset = 0) {
    try {
      const result = await query(
        `SELECT d.* FROM documents d 
         WHERE d.owner_id = $1 
         OR d.id IN (
           SELECT dc.document_id FROM document_collaborators dc 
           WHERE dc.user_id = $1
         )
         OR d.project_id IN (
           SELECT p.id FROM projects p 
           WHERE p.owner_id = $1 
           OR p.id IN (
             SELECT pc.project_id FROM project_collaborators pc 
             WHERE pc.user_id = $1
           )
         )
         ORDER BY d.updated_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      return result.rows.map(row => new Document(row));
    } catch (error) {
      console.error('Error finding documents by user ID:', error);
      throw new Error('Database error while finding documents');
    }
  }

  static async searchDocuments(searchQuery, userId, projectId = null) {
    try {
      let queryString = `
        SELECT d.* FROM documents d 
        WHERE (d.title ILIKE $1 OR d.original_content ILIKE $1 OR d.translated_content ILIKE $1)
        AND (d.owner_id = $2 
             OR d.id IN (
               SELECT dc.document_id FROM document_collaborators dc 
               WHERE dc.user_id = $2
             )
             OR d.project_id IN (
               SELECT p.id FROM projects p 
               WHERE p.owner_id = $2 
               OR p.id IN (
                 SELECT pc.project_id FROM project_collaborators pc 
                 WHERE pc.user_id = $2
               )
             ))
      `;
      let queryParams = [`%${searchQuery}%`, userId];

      if (projectId) {
        queryString += ' AND d.project_id = $3';
        queryParams.push(projectId);
      }

      queryString += ' ORDER BY d.updated_at DESC LIMIT 50';

      const result = await query(queryString, queryParams);
      return result.rows.map(row => new Document(row));
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error('Database error while searching documents');
    }
  }

  static async getRecentDocuments(userId, limit = 10) {
    try {
      const result = await query(
        `SELECT d.* FROM documents d 
         WHERE d.owner_id = $1 
         OR d.id IN (
           SELECT dc.document_id FROM document_collaborators dc 
           WHERE dc.user_id = $1
         )
         OR d.project_id IN (
           SELECT p.id FROM projects p 
           WHERE p.owner_id = $1 
           OR p.id IN (
             SELECT pc.project_id FROM project_collaborators pc 
             WHERE pc.user_id = $1
           )
         )
         ORDER BY d.updated_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows.map(row => new Document(row));
    } catch (error) {
      console.error('Error getting recent documents:', error);
      throw new Error('Database error while getting recent documents');
    }
  }

  static async create(documentData, ownerId) {
    try {
      const {
        fileName,
        fileSize,
        sourceLanguage,
        targetLanguage,
        translationStyle,
        specialization,
        projectId,
        bosObjectKey,
        outputFormats = [],
        autoStart = false
      } = documentData;

      const result = await query(
        `INSERT INTO documents (
          title, status, progress, source_language, target_language,
          translation_style, specialization, bos_object_key, project_id, owner_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          fileName,
          autoStart ? 'PROCESSING' : 'TRANSLATING',
          0,
          sourceLanguage,
          targetLanguage,
          translationStyle,
          specialization,
          bosObjectKey,
          projectId,
          ownerId
        ]
      );

      const document = new Document(result.rows[0]);

      // Create download links for requested formats
      if (outputFormats.length > 0) {
        await document.createDownloadLinks(outputFormats);
      }

      return document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Database error while creating document');
    }
  }

  static async update(id, documentData, userId) {
    try {
      // Check if user has permission to update
      const document = await this.findById(id, userId);
      if (!document) {
        throw new Error('Document not found or access denied');
      }

      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      // Build dynamic update query
      Object.keys(documentData).forEach(key => {
        if (documentData[key] !== undefined) {
          const dbKey = key === 'sourceLanguage' ? 'source_language' :
                       key === 'targetLanguage' ? 'target_language' :
                       key === 'translationStyle' ? 'translation_style' :
                       key === 'originalContent' ? 'original_content' :
                       key === 'translatedContent' ? 'translated_content' :
                       key === 'fileUrl' ? 'file_url' :
                       key === 'bosObjectKey' ? 'bos_object_key' :
                       key === 'projectId' ? 'project_id' : key;
          
          updateFields.push(`${dbKey} = $${paramIndex}`);
          values.push(documentData[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);
      const result = await query(
        `UPDATE documents SET ${updateFields.join(', ')}, updated_at = NOW()
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      return new Document(result.rows[0]);
    } catch (error) {
      console.error('Error updating document:', error);
      throw new Error('Database error while updating document');
    }
  }

  static async updateProgress(id, progress, status = null) {
    try {
      let queryString = 'UPDATE documents SET progress = $1';
      let queryParams = [progress];
      let paramIndex = 2;

      if (status) {
        queryString += `, status = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
      }

      queryString += `, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`;
      queryParams.push(id);

      const result = await query(queryString, queryParams);
      
      if (result.rows.length === 0) {
        throw new Error('Document not found');
      }

      return new Document(result.rows[0]);
    } catch (error) {
      console.error('Error updating document progress:', error);
      throw new Error('Database error while updating progress');
    }
  }

  static async delete(id, userId) {
    try {
      // Only allow owner to delete
      const result = await query(
        'DELETE FROM documents WHERE id = $1 AND owner_id = $2 RETURNING id',
        [id, userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Database error while deleting document');
    }
  }

  async getProject() {
    if (!this.projectId) return null;

    try {
      const result = await query(
        'SELECT * FROM projects WHERE id = $1',
        [this.projectId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting document project:', error);
      throw new Error('Database error while getting project');
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
      console.error('Error getting document owner:', error);
      throw new Error('Database error while getting owner');
    }
  }

  async getCollaborators() {
    try {
      const result = await query(
        `SELECT u.id, u.name, u.email, u.role, dc.permissions, dc.added_at
         FROM users u
         JOIN document_collaborators dc ON u.id = dc.user_id
         WHERE dc.document_id = $1
         ORDER BY dc.added_at DESC`,
        [this.id]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting document collaborators:', error);
      throw new Error('Database error while getting collaborators');
    }
  }

  async getChatHistory() {
    try {
      const result = await query(
        'SELECT * FROM chat_messages WHERE document_id = $1 ORDER BY created_at ASC',
        [this.id]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw new Error('Database error while getting chat history');
    }
  }

  async getDownloadLinks() {
    try {
      const result = await query(
        'SELECT * FROM download_links WHERE document_id = $1 AND expires_at > NOW() ORDER BY created_at DESC',
        [this.id]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting download links:', error);
      throw new Error('Database error while getting download links');
    }
  }

  async createDownloadLinks(formats) {
    try {
      const links = [];
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      for (const format of formats) {
        const result = await query(
          `INSERT INTO download_links (document_id, format, url, file_size, expires_at)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            this.id,
            format,
            `/api/documents/${this.id}/download/${format}`, // Placeholder URL
            0, // Will be updated when file is generated
            expiresAt
          ]
        );
        links.push(result.rows[0]);
      }

      return links;
    } catch (error) {
      console.error('Error creating download links:', error);
      throw new Error('Database error while creating download links');
    }
  }

  async addCollaborator(userId, permissions) {
    try {
      await query(
        `INSERT INTO document_collaborators (document_id, user_id, permissions)
         VALUES ($1, $2, $3)
         ON CONFLICT (document_id, user_id) 
         DO UPDATE SET permissions = $3, added_at = NOW()`,
        [this.id, userId, JSON.stringify(permissions)]
      );

      return true;
    } catch (error) {
      console.error('Error adding document collaborator:', error);
      throw new Error('Database error while adding collaborator');
    }
  }

  async hasUserAccess(userId) {
    try {
      const result = await query(
        `SELECT 1 FROM documents d
         WHERE d.id = $1 
         AND (d.owner_id = $2 
              OR d.id IN (
                SELECT dc.document_id FROM document_collaborators dc 
                WHERE dc.user_id = $2
              )
              OR d.project_id IN (
                SELECT p.id FROM projects p 
                WHERE p.owner_id = $2 
                OR p.id IN (
                  SELECT pc.project_id FROM project_collaborators pc 
                  WHERE pc.user_id = $2
                )
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
      title: this.title,
      status: this.status,
      progress: this.progress,
      sourceLanguage: this.sourceLanguage,
      targetLanguage: this.targetLanguage,
      translationStyle: this.translationStyle,
      specialization: this.specialization,
      originalContent: this.originalContent,
      translatedContent: this.translatedContent,
      fileUrl: this.fileUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Document;
