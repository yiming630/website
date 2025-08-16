/**
 * Document Resolvers
 * Handles document-related queries and mutations
 */

const documentResolvers = {
  Query: {
    document: async (_, { id }, { requireAuth, db }) => {
      const user = requireAuth();
      
      const result = await db.query(
        `SELECT d.* FROM documents d
         JOIN projects p ON d.project_id = p.id
         WHERE d.id = $1 AND p.user_id = $2`,
        [id, user.id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Document not found');
      }
      
      return result.rows[0];
    },

    documents: async (_, { projectId }, { requireAuth, db }) => {
      const user = requireAuth();
      
      // Verify project ownership
      const ownership = await db.query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [projectId, user.id]
      );
      
      if (ownership.rows.length === 0) {
        throw new Error('Project not found or access denied');
      }
      
      const result = await db.query(
        'SELECT * FROM documents WHERE project_id = $1 ORDER BY created_at DESC',
        [projectId]
      );
      
      return result.rows;
    },

    translationSegments: async (_, { documentId }, { requireAuth, db }) => {
      const user = requireAuth();
      
      // Verify document access
      const access = await db.query(
        `SELECT d.id FROM documents d
         JOIN projects p ON d.project_id = p.id
         WHERE d.id = $1 AND p.user_id = $2`,
        [documentId, user.id]
      );
      
      if (access.rows.length === 0) {
        throw new Error('Document not found or access denied');
      }
      
      const result = await db.query(
        'SELECT * FROM translation_segments WHERE document_id = $1 ORDER BY segment_index',
        [documentId]
      );
      
      return result.rows;
    },

    chatMessages: async (_, { documentId }, { requireAuth, db }) => {
      const user = requireAuth();
      
      // Verify document access
      const access = await db.query(
        `SELECT d.id FROM documents d
         JOIN projects p ON d.project_id = p.id
         WHERE d.id = $1 AND p.user_id = $2`,
        [documentId, user.id]
      );
      
      if (access.rows.length === 0) {
        throw new Error('Document not found or access denied');
      }
      
      const result = await db.query(
        'SELECT * FROM chat_messages WHERE document_id = $1 ORDER BY created_at',
        [documentId]
      );
      
      return result.rows;
    }
  },

  Mutation: {
    createDocument: async (_, { input }, { requireAuth, db }) => {
      const user = requireAuth();
      const { projectId, filename, fileType, content } = input;
      
      // Verify project ownership
      const ownership = await db.query(
        'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
        [projectId, user.id]
      );
      
      if (ownership.rows.length === 0) {
        throw new Error('Project not found or access denied');
      }
      
      // Calculate word count (simple approximation)
      const wordCount = content ? content.split(/\s+/).length : 0;
      
      const result = await db.query(
        `INSERT INTO documents (
          project_id, original_filename, file_type, 
          original_content, status, word_count, file_size_bytes
        )
         VALUES ($1, $2, $3, $4, 'uploaded', $5, $6)
         RETURNING *`,
        [projectId, filename, fileType, content, wordCount, content ? content.length : 0]
      );
      
      return result.rows[0];
    },

    updateDocument: async (_, { id, input }, { requireAuth, db }) => {
      const user = requireAuth();
      
      // Check ownership
      const ownership = await db.query(
        `SELECT d.id FROM documents d
         JOIN projects p ON d.project_id = p.id
         WHERE d.id = $1 AND p.user_id = $2`,
        [id, user.id]
      );
      
      if (ownership.rows.length === 0) {
        throw new Error('Document not found or access denied');
      }
      
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (input.translatedContent !== undefined) {
        updates.push(`translated_content = $${paramCount++}`);
        values.push(input.translatedContent);
      }
      
      if (input.status !== undefined) {
        updates.push(`status = $${paramCount++}`);
        values.push(input.status);
        
        if (input.status === 'completed') {
          updates.push(`processed_at = NOW()`);
        }
      }
      
      if (input.metadata !== undefined) {
        updates.push(`metadata = $${paramCount++}`);
        values.push(JSON.stringify(input.metadata));
      }
      
      if (updates.length === 0) {
        throw new Error('No updates provided');
      }
      
      values.push(id);
      
      const result = await db.query(
        `UPDATE documents 
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );
      
      return result.rows[0];
    },

    deleteDocument: async (_, { id }, { requireAuth, db }) => {
      const user = requireAuth();
      
      const result = await db.query(
        `DELETE FROM documents d
         USING projects p
         WHERE d.project_id = p.id 
         AND d.id = $1 
         AND p.user_id = $2
         RETURNING d.id`,
        [id, user.id]
      );
      
      return result.rows.length > 0;
    },

    startTranslation: async (_, { documentId }, { requireAuth, db }) => {
      const user = requireAuth();
      
      // Verify document access
      const access = await db.query(
        `SELECT d.* FROM documents d
         JOIN projects p ON d.project_id = p.id
         WHERE d.id = $1 AND p.user_id = $2`,
        [documentId, user.id]
      );
      
      if (access.rows.length === 0) {
        throw new Error('Document not found or access denied');
      }
      
      // Create translation job
      const result = await db.query(
        `INSERT INTO translation_jobs (
          document_id, status, progress_percentage, 
          ai_model, total_tokens_used, translation_settings
        )
         VALUES ($1, 'pending', 0, $2, 0, '{}')
         RETURNING *`,
        [documentId, process.env.GEMINI_MODEL || 'gemini-1.5-pro']
      );
      
      // Update document status
      await db.query(
        'UPDATE documents SET status = $1 WHERE id = $2',
        ['processing', documentId]
      );
      
      return result.rows[0];
    },

    sendChatMessage: async (_, { input }, { requireAuth, db }) => {
      const user = requireAuth();
      const { documentId, content } = input;
      
      // Verify document access
      const access = await db.query(
        `SELECT d.id FROM documents d
         JOIN projects p ON d.project_id = p.id
         WHERE d.id = $1 AND p.user_id = $2`,
        [documentId, user.id]
      );
      
      if (access.rows.length === 0) {
        throw new Error('Document not found or access denied');
      }
      
      // Insert chat message
      const result = await db.query(
        `INSERT INTO chat_messages (
          document_id, user_id, role, content, tokens_used
        )
         VALUES ($1, $2, 'user', $3, 0)
         RETURNING *`,
        [documentId, user.id, content]
      );
      
      // In a real app, you would call the AI service here
      // and create an assistant response
      
      return result.rows[0];
    },

    clearChatHistory: async (_, { documentId }, { requireAuth, db }) => {
      const user = requireAuth();
      
      // Verify document access
      const access = await db.query(
        `SELECT d.id FROM documents d
         JOIN projects p ON d.project_id = p.id
         WHERE d.id = $1 AND p.user_id = $2`,
        [documentId, user.id]
      );
      
      if (access.rows.length === 0) {
        throw new Error('Document not found or access denied');
      }
      
      await db.query(
        'DELETE FROM chat_messages WHERE document_id = $1',
        [documentId]
      );
      
      return true;
    }
  },

  // Field resolvers for Document type
  Document: {
    originalFilename: (parent) => parent.original_filename,
    fileType: (parent) => parent.file_type,
    fileSizeBytes: (parent) => parent.file_size_bytes,
    storagePath: (parent) => parent.storage_path,
    originalContent: (parent) => parent.original_content,
    translatedContent: (parent) => parent.translated_content,
    wordCount: (parent) => parent.word_count,
    pageCount: (parent) => parent.page_count,
    createdAt: (parent) => parent.created_at,
    updatedAt: (parent) => parent.updated_at,
    processedAt: (parent) => parent.processed_at,
    
    project: async (parent, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM projects WHERE id = $1',
        [parent.project_id]
      );
      return result.rows[0];
    },
    
    translationJob: async (parent, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM translation_jobs WHERE document_id = $1 ORDER BY created_at DESC LIMIT 1',
        [parent.id]
      );
      return result.rows[0] || null;
    },
    
    chatMessages: async (parent, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM chat_messages WHERE document_id = $1 ORDER BY created_at',
        [parent.id]
      );
      return result.rows;
    }
  }
};

module.exports = documentResolvers;