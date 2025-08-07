const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const { query, transaction } = require('../../../databases/connection');
const { PubSub, withFilter } = require('graphql-subscriptions');

const pubsub = new PubSub();

const documentResolvers = {
  Query: {
    document: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      const result = await query(
        `SELECT d.* FROM documents d 
         LEFT JOIN document_collaborators dc ON d.id = dc.document_id 
         WHERE d.id = $1 AND (d.owner_id = $2 OR dc.user_id = $2)`,
        [id, user.id]
      );
      
      if (result.rows.length === 0) {
        throw new ForbiddenError('Document not found or access denied');
      }
      
      return result.rows[0];
    },

    searchDocuments: async (_, { query: searchQuery, projectId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      let queryText = `
        SELECT DISTINCT d.* FROM documents d 
        LEFT JOIN document_collaborators dc ON d.id = dc.document_id 
        WHERE (d.owner_id = $1 OR dc.user_id = $1)
        AND (d.title ILIKE $2 OR d.original_content ILIKE $2 OR d.translated_content ILIKE $2)
      `;
      
      const params = [user.id, `%${searchQuery}%`];
      
      if (projectId) {
        queryText += ` AND d.project_id = $3`;
        params.push(projectId);
      }
      
      queryText += ` ORDER BY d.updated_at DESC LIMIT 50`;
      
      const result = await query(queryText, params);
      return result.rows;
    },

    recentDocuments: async (_, { limit = 10 }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      const result = await query(
        `SELECT DISTINCT d.* FROM documents d 
         LEFT JOIN document_collaborators dc ON d.id = dc.document_id 
         WHERE d.owner_id = $1 OR dc.user_id = $1
         ORDER BY d.updated_at DESC
         LIMIT $2`,
        [user.id, limit]
      );
      
      return result.rows;
    },

    documentDownloadLinks: async (_, { documentId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Check access to document
      const docResult = await query(
        `SELECT d.id FROM documents d 
         LEFT JOIN document_collaborators dc ON d.id = dc.document_id 
         WHERE d.id = $1 AND (d.owner_id = $2 OR dc.user_id = $2)`,
        [documentId, user.id]
      );
      
      if (docResult.rows.length === 0) {
        throw new ForbiddenError('Document not found or access denied');
      }
      
      const result = await query(
        'SELECT * FROM download_links WHERE document_id = $1 AND expires_at > NOW() ORDER BY created_at DESC',
        [documentId]
      );
      
      return result.rows;
    }
  },

  Mutation: {
    uploadDocument: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      const {
        fileName,
        fileSize,
        sourceLanguage,
        targetLanguage,
        translationStyle,
        specialization,
        projectId,
        outputFormats,
        autoStart,
        bosObjectKey
      } = input;
      
      return await transaction(async (client) => {
        // Create document
        const result = await client.query(
          `INSERT INTO documents 
           (title, source_language, target_language, translation_style, specialization, 
            project_id, owner_id, bos_object_key, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING *`,
          [
            fileName,
            sourceLanguage,
            targetLanguage,
            translationStyle,
            specialization,
            projectId,
            user.id,
            bosObjectKey,
            'PROCESSING'
          ]
        );
        
        const document = result.rows[0];
        
        // TODO: Start document processing if autoStart is true
        if (autoStart) {
          // Queue document for processing
          // This would typically send a message to a message queue
          // For now, we'll just update the status
          await client.query(
            'UPDATE documents SET status = $1 WHERE id = $2',
            ['TRANSLATING', document.id]
          );
        }
        
        return document;
      });
    },

    updateDocumentContent: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      const { documentId, content, editType } = input;
      
      // Check access to document
      const docResult = await query(
        `SELECT d.* FROM documents d 
         LEFT JOIN document_collaborators dc ON d.id = dc.document_id 
         WHERE d.id = $1 AND (d.owner_id = $2 OR dc.user_id = $2)`,
        [documentId, user.id]
      );
      
      if (docResult.rows.length === 0) {
        throw new ForbiddenError('Document not found or access denied');
      }
      
      const document = docResult.rows[0];
      
      // Update content based on edit type
      let updateField = 'translated_content';
      if (editType === 'original') {
        updateField = 'original_content';
      }
      
      const result = await query(
        `UPDATE documents SET ${updateField} = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [content, documentId]
      );
      
      const updatedDocument = result.rows[0];
      
      // Publish document update
      pubsub.publish('DOCUMENT_UPDATED', {
        documentUpdated: updatedDocument,
        documentId
      });
      
      return updatedDocument;
    },

    retranslateDocument: async (_, { documentId, targetLanguage, translationStyle }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Check access to document
      const docResult = await query(
        `SELECT d.* FROM documents d 
         LEFT JOIN document_collaborators dc ON d.id = dc.document_id 
         WHERE d.id = $1 AND (d.owner_id = $2 OR dc.user_id = $2)`,
        [documentId, user.id]
      );
      
      if (docResult.rows.length === 0) {
        throw new ForbiddenError('Document not found or access denied');
      }
      
      const updateFields = ['status = $1', 'progress = $2', 'updated_at = NOW()'];
      const updateValues = ['TRANSLATING', 0];
      let paramIndex = 3;
      
      if (targetLanguage) {
        updateFields.push(`target_language = $${paramIndex++}`);
        updateValues.push(targetLanguage);
      }
      
      if (translationStyle) {
        updateFields.push(`translation_style = $${paramIndex++}`);
        updateValues.push(translationStyle);
      }
      
      updateValues.push(documentId);
      
      const result = await query(
        `UPDATE documents SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        updateValues
      );
      
      // TODO: Queue for retranslation
      
      return result.rows[0];
    },

    deleteDocument: async (_, { id }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Check if user owns the document
      const docCheck = await query(
        'SELECT owner_id FROM documents WHERE id = $1',
        [id]
      );
      
      if (docCheck.rows.length === 0) {
        return false;
      }
      
      if (docCheck.rows[0].owner_id !== user.id) {
        throw new ForbiddenError('Only document owner can delete document');
      }
      
      const result = await query(
        'DELETE FROM documents WHERE id = $1',
        [id]
      );
      
      return result.rowCount > 0;
    },

    shareDocument: async (_, { documentId, userEmail, permissions }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Check if user owns the document
      const docCheck = await query(
        'SELECT owner_id FROM documents WHERE id = $1',
        [documentId]
      );
      
      if (docCheck.rows.length === 0) {
        throw new UserInputError('Document not found');
      }
      
      if (docCheck.rows[0].owner_id !== user.id) {
        throw new ForbiddenError('Only document owner can share document');
      }
      
      // Find user to share with
      const userResult = await query(
        'SELECT id FROM users WHERE email = $1',
        [userEmail]
      );
      
      if (userResult.rows.length === 0) {
        throw new UserInputError('User not found');
      }
      
      const collaboratorId = userResult.rows[0].id;
      
      // Add or update collaborator
      await query(
        `INSERT INTO document_collaborators (document_id, user_id, permissions) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (document_id, user_id) 
         DO UPDATE SET permissions = $3, added_at = NOW()`,
        [documentId, collaboratorId, JSON.stringify(permissions)]
      );
      
      return true;
    }
  },

  Subscription: {
    translationProgress: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['TRANSLATION_PROGRESS']),
        (payload, variables) => {
          return payload.translationProgress.documentId === variables.documentId;
        }
      )
    },

    documentUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['DOCUMENT_UPDATED']),
        (payload, variables) => {
          return payload.documentId === variables.documentId;
        }
      )
    }
  },

  Document: {
    owner: async (parent) => {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [parent.owner_id]
      );
      
      return result.rows[0];
    },
    
    project: async (parent) => {
      if (!parent.project_id) return null;
      
      const result = await query(
        'SELECT * FROM projects WHERE id = $1',
        [parent.project_id]
      );
      
      return result.rows[0];
    },
    
    collaborators: async (parent) => {
      const result = await query(
        `SELECT u.* FROM users u 
         JOIN document_collaborators dc ON u.id = dc.user_id 
         WHERE dc.document_id = $1`,
        [parent.id]
      );
      
      return result.rows;
    },
    
    downloadLinks: async (parent) => {
      const result = await query(
        'SELECT * FROM download_links WHERE document_id = $1 AND expires_at > NOW() ORDER BY created_at DESC',
        [parent.id]
      );
      
      return result.rows;
    },
    
    comments: async (parent) => {
      const result = await query(
        'SELECT * FROM comments WHERE document_id = $1 ORDER BY created_at ASC',
        [parent.id]
      );
      
      return result.rows;
    },
    
    chatHistory: async (parent) => {
      const result = await query(
        'SELECT * FROM chat_messages WHERE document_id = $1 ORDER BY created_at ASC',
        [parent.id]
      );
      
      return result.rows;
    }
  }
};

module.exports = documentResolvers;