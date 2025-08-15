const { query } = require('../utils/database');

const documentResolvers = {
  Query: {
    // Get document by ID
    document: async (parent, { id }, context) => {
      const user = context.requireAuth();

      try {
        const result = await query(
          'SELECT * FROM documents WHERE id = $1 AND owner_id = $2',
          [id, user.id]
        );

        if (result.rows.length === 0) {
          throw new Error('Document not found or access denied');
        }

        return result.rows[0];
      } catch (error) {
        console.error('Error fetching document:', error);
        throw new Error('Failed to fetch document');
      }
    },

    // Get documents
    documents: async (parent, { projectId, limit = 20, offset = 0 }, context) => {
      const user = context.requireAuth();

      try {
        let queryText = 'SELECT * FROM documents WHERE owner_id = $1';
        let params = [user.id];

        if (projectId) {
          queryText += ' AND project_id = $2';
          params.push(projectId);
        }

        queryText += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
        params.push(limit, offset);

        const result = await query(queryText, params);
        return result.rows;
      } catch (error) {
        console.error('Error fetching documents:', error);
        throw new Error('Failed to fetch documents');
      }
    },

    // Search documents (placeholder)
    searchDocuments: async (parent, { query: searchQuery, projectId }, context) => {
      const user = context.requireAuth();

      try {
        let queryText = 'SELECT * FROM documents WHERE owner_id = $1 AND (title ILIKE $2 OR original_content ILIKE $2)';
        let params = [user.id, `%${searchQuery}%`];

        if (projectId) {
          queryText += ' AND project_id = $3';
          params.push(projectId);
        }

        queryText += ' ORDER BY created_at DESC';

        const result = await query(queryText, params);
        return result.rows;
      } catch (error) {
        console.error('Error searching documents:', error);
        throw new Error('Failed to search documents');
      }
    },

    // Get recent documents
    recentDocuments: async (parent, { limit = 10 }, context) => {
      const user = context.requireAuth();

      try {
        const result = await query(
          'SELECT * FROM documents WHERE owner_id = $1 ORDER BY updated_at DESC LIMIT $2',
          [user.id, limit]
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching recent documents:', error);
        throw new Error('Failed to fetch recent documents');
      }
    }
  },

  Mutation: {
    // Upload/create document
    uploadDocument: async (parent, { input }, context) => {
      const user = context.requireAuth();

      try {
        const result = await query(
          `INSERT INTO documents (
            title, source_language, target_language, translation_style, 
            specialization, file_url, file_size, file_type, project_id, owner_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [
            input.title,
            input.sourceLanguage,
            input.targetLanguage,
            input.translationStyle,
            input.specialization,
            input.fileUrl,
            input.fileSize || null,
            input.fileType || null,
            input.projectId || null,
            user.id
          ]
        );

        return result.rows[0];
      } catch (error) {
        console.error('Error creating document:', error);
        throw new Error('Failed to create document');
      }
    },

    // Delete document
    deleteDocument: async (parent, { id }, context) => {
      const user = context.requireAuth();

      try {
        const result = await query(
          'DELETE FROM documents WHERE id = $1 AND owner_id = $2',
          [id, user.id]
        );

        return result.rowCount > 0;
      } catch (error) {
        console.error('Error deleting document:', error);
        throw new Error('Failed to delete document');
      }
    }
  },

  Subscription: {
    // Translation progress subscription (placeholder)
    translationProgress: {
      subscribe: (parent, { documentId }, context) => {
        // This would typically use a pubsub mechanism
        // For now, returning a mock subscription
        console.log(`Subscribing to translation progress for document: ${documentId}`);
        return null;
      }
    },

    // Document updated subscription (placeholder)
    documentUpdated: {
      subscribe: (parent, { documentId }, context) => {
        console.log(`Subscribing to document updates for document: ${documentId}`);
        return null;
      }
    }
  },

  // Document type resolvers
  Document: {
    // Resolve document owner
    owner: async (document) => {
      try {
        const result = await query(
          'SELECT id, name, email, role, plan FROM users WHERE id = $1',
          [document.owner_id]
        );
        return result.rows[0];
      } catch (error) {
        console.error('Error fetching document owner:', error);
        return null;
      }
    },

    // Resolve document project
    project: async (document) => {
      if (!document.project_id) return null;

      try {
        const result = await query(
          'SELECT * FROM projects WHERE id = $1',
          [document.project_id]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error fetching document project:', error);
        return null;
      }
    },

    // Resolve document collaborators (placeholder)
    collaborators: async (document) => {
      try {
        const result = await query(
          `SELECT u.id, u.name, u.email, u.role, u.plan 
           FROM users u 
           JOIN document_collaborators dc ON u.id = dc.user_id 
           WHERE dc.document_id = $1`,
          [document.id]
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching document collaborators:', error);
        return [];
      }
    },

    // Resolve chat history
    chatHistory: async (document) => {
      try {
        const result = await query(
          'SELECT * FROM chat_messages WHERE document_id = $1 ORDER BY created_at ASC',
          [document.id]
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }
    },

    // Resolve download links (placeholder)
    downloadLinks: async (document) => {
      try {
        const result = await query(
          'SELECT * FROM download_links WHERE document_id = $1 AND expires_at > NOW() ORDER BY created_at DESC',
          [document.id]
        );
        return result.rows;
      } catch (error) {
        console.error('Error fetching download links:', error);
        return [];
      }
    }
  }
};

module.exports = documentResolvers;