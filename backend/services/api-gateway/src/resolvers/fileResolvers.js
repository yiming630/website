const mongoFileService = require('../utils/mongoFileService');
const errorHandler = require('../utils/errorHandler');
const db = require('../utils/database');
const crypto = require('crypto');

const fileResolvers = {
  // Modern file upload will be handled via REST endpoint, not GraphQL scalar

  // Type resolvers
  FileMetadata: {
    user: async (parent) => {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [parent.user_id || parent.userId]);
      return result.rows[0];
    },
    project: async (parent) => {
      if (!parent.project_id && !parent.projectId) return null;
      const result = await db.query('SELECT * FROM projects WHERE id = $1', [parent.project_id || parent.projectId]);
      return result.rows[0];
    },
    glossaryMetadata: async (parent) => {
      const result = await db.query(
        'SELECT * FROM glossary_files WHERE file_metadata_id = $1',
        [parent.id]
      );
      return result.rows[0];
    },
    shares: async (parent) => {
      const result = await db.query(
        'SELECT * FROM file_shares WHERE file_metadata_id = $1 AND is_active = true',
        [parent.id]
      );
      return result.rows;
    },
    accessLogs: async (parent, args) => {
      const limit = args.limit || 10;
      const result = await db.query(
        'SELECT * FROM file_access_logs WHERE file_metadata_id = $1 ORDER BY accessed_at DESC LIMIT $2',
        [parent.id, limit]
      );
      return result.rows;
    }
  },

  GlossaryFile: {
    fileMetadata: async (parent) => {
      const result = await db.query('SELECT * FROM file_metadata WHERE id = $1', [parent.file_metadata_id]);
      return result.rows[0];
    },
    user: async (parent) => {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return result.rows[0];
    }
  },

  FileShare: {
    fileMetadata: async (parent) => {
      const result = await db.query('SELECT * FROM file_metadata WHERE id = $1', [parent.file_metadata_id]);
      return result.rows[0];
    },
    sharedByUser: async (parent) => {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [parent.shared_by]);
      return result.rows[0];
    },
    sharedWithUser: async (parent) => {
      if (!parent.shared_with) return null;
      const result = await db.query('SELECT * FROM users WHERE id = $1', [parent.shared_with]);
      return result.rows[0];
    }
  },

  FileAccessLog: {
    fileMetadata: async (parent) => {
      const result = await db.query('SELECT * FROM file_metadata WHERE id = $1', [parent.file_metadata_id]);
      return result.rows[0];
    },
    user: async (parent) => {
      if (!parent.user_id) return null;
      const result = await db.query('SELECT * FROM users WHERE id = $1', [parent.user_id]);
      return result.rows[0];
    }
  },

  Query: {
    fileMetadata: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const fileMetadata = await mongoFileService.getFileMetadata(args.id, user.id);
        if (!fileMetadata) {
          throw new Error('File not found or access denied');
        }

        return fileMetadata;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    userFiles: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const options = args.options || {};
        const files = await mongoFileService.getUserFiles(user.id, {
          projectId: options.projectId,
          fileType: options.fileType,
          limit: options.limit || 50,
          offset: options.offset || 0,
          orderBy: options.orderBy || 'created_at',
          orderDir: options.orderDirection || 'DESC'
        });

        return files;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    fileStorageStats: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const stats = await mongoFileService.getStorageStats(user.id);
        return stats;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    fileDownloadUrl: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const fileMetadata = await mongoFileService.getFileMetadata(args.fileId, user.id);
        if (!fileMetadata) {
          throw new Error('File not found or access denied');
        }

        const downloadUrl = await mongoFileService.getDownloadUrl(
          fileMetadata,
          args.expiresIn || 3600,
          user.id
        );

        return downloadUrl;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    glossaryFile: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const result = await db.query(
          `SELECT gf.*, fm.original_filename, fm.file_size 
           FROM glossary_files gf
           JOIN file_metadata fm ON gf.file_metadata_id = fm.id
           WHERE gf.id = $1 AND (gf.user_id = $2 OR gf.is_public = true)
           AND fm.deleted_at IS NULL`,
          [args.id, user.id]
        );

        return result.rows[0];
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    userGlossaries: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const options = args.options || {};
        const glossaries = await mongoFileService.getUserGlossaries(user.id, options);

        return glossaries;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    publicGlossaries: async (parent, args, context) => {
      try {
        const options = args.options || {};
        const query = `
          SELECT gf.*, fm.original_filename, fm.file_size, fm.created_at as uploaded_at,
                 u.name as user_name
          FROM glossary_files gf
          JOIN file_metadata fm ON gf.file_metadata_id = fm.id
          JOIN users u ON gf.user_id = u.id
          WHERE gf.is_public = true AND fm.deleted_at IS NULL
          ORDER BY gf.last_used_at DESC NULLS LAST, gf.created_at DESC
          LIMIT $1 OFFSET $2
        `;

        const result = await db.query(query, [
          options.limit || 50,
          options.offset || 0
        ]);

        return result.rows;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    fileShares: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        // Check if user owns the file
        const fileMetadata = await mongoFileService.getFileMetadata(args.fileId, user.id);
        if (!fileMetadata) {
          throw new Error('File not found or access denied');
        }

        const result = await db.query(
          'SELECT * FROM file_shares WHERE file_metadata_id = $1 AND is_active = true ORDER BY created_at DESC',
          [args.fileId]
        );

        return result.rows;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    sharedWithMe: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const result = await db.query(
          `SELECT fs.*, fm.original_filename, fm.file_type, fm.file_size,
                  u.name as shared_by_name
           FROM file_shares fs
           JOIN file_metadata fm ON fs.file_metadata_id = fm.id
           JOIN users u ON fs.shared_by = u.id
           WHERE fs.shared_with = $1 AND fs.is_active = true
           AND (fs.expires_at IS NULL OR fs.expires_at > CURRENT_TIMESTAMP)
           ORDER BY fs.created_at DESC
           LIMIT $2 OFFSET $3`,
          [user.id, args.limit || 50, args.offset || 0]
        );

        return result.rows;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    fileAccessLogs: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        // Check if user owns the file
        const fileMetadata = await mongoFileService.getFileMetadata(args.fileId, user.id);
        if (!fileMetadata) {
          throw new Error('File not found or access denied');
        }

        const result = await db.query(
          'SELECT * FROM file_access_logs WHERE file_metadata_id = $1 ORDER BY accessed_at DESC LIMIT $2',
          [args.fileId, args.limit || 100]
        );

        return result.rows;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    }
  },

  Mutation: {
    // NOTE: File upload is now handled via REST endpoint /api/files/upload
    // This mutation is kept for metadata operations only
    uploadFileMetadata: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const { input } = args;
        
        // This mutation only handles metadata creation
        // The actual file upload happens via REST endpoint
        const fileMetadata = await mongoFileService.createFileMetadata({
          userId: user.id,
          projectId: input.projectId,
          originalFilename: input.filename,
          contentType: input.contentType,
          fileSize: input.fileSize,
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          translationStyle: input.translationStyle,
          specialization: input.specialization,
          visibility: input.visibility || 'private'
        });

        return {
          success: true,
          fileMetadata: fileMetadata,
          message: 'File metadata created successfully. Use REST endpoint for file upload.'
        };
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    deleteFile: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const fileMetadata = await mongoFileService.getFileMetadata(args.fileId, user.id);
        if (!fileMetadata) {
          throw new Error('File not found or access denied');
        }

        await mongoFileService.deleteFile(fileMetadata.gridfs_file_id, fileMetadata.id, user.id);
        return true;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    updateFileMetadata: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const fileMetadata = await mongoFileService.getFileMetadata(args.fileId, user.id);
        if (!fileMetadata) {
          throw new Error('File not found or access denied');
        }

        const query = `
          UPDATE file_metadata 
          SET metadata = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2 AND user_id = $3
          RETURNING *
        `;

        const result = await db.query(query, [args.metadata, args.fileId, user.id]);
        return result.rows[0];
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    createGlossary: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const { input } = args;

        // Verify file exists and user owns it
        const fileMetadata = await mongoFileService.getFileMetadata(input.fileMetadataId, user.id);
        if (!fileMetadata) {
          throw new Error('File not found or access denied');
        }

        const glossary = await mongoFileService.createGlossaryMetadata({
          fileMetadataId: input.fileMetadataId,
          userId: user.id,
          glossaryName: input.glossaryName,
          description: input.description,
          sourceLanguage: input.sourceLanguage,
          targetLanguage: input.targetLanguage,
          domain: input.domain
        });

        return glossary;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    updateGlossary: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const { input } = args;

        const query = `
          UPDATE glossary_files 
          SET glossary_name = $1, description = $2, source_language = $3, 
              target_language = $4, domain = $5, updated_at = CURRENT_TIMESTAMP
          WHERE id = $6 AND user_id = $7
          RETURNING *
        `;

        const result = await db.query(query, [
          input.glossaryName,
          input.description,
          input.sourceLanguage,
          input.targetLanguage,
          input.domain,
          args.id,
          user.id
        ]);

        if (result.rows.length === 0) {
          throw new Error('Glossary not found or access denied');
        }

        return result.rows[0];
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    deleteGlossary: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const result = await db.query(
          'DELETE FROM glossary_files WHERE id = $1 AND user_id = $2',
          [args.id, user.id]
        );

        return result.rowCount > 0;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    shareFile: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const { input } = args;

        // Verify file exists and user owns it
        const fileMetadata = await mongoFileService.getFileMetadata(input.fileMetadataId, user.id);
        if (!fileMetadata) {
          throw new Error('File not found or access denied');
        }

        // Generate share token for public links
        let shareToken = null;
        if (input.shareType === 'public_link') {
          shareToken = crypto.randomBytes(32).toString('hex');
        }

        const query = `
          INSERT INTO file_shares (
            file_metadata_id, shared_by, shared_with, share_type, recipient_email, share_token,
            can_view, can_download, can_edit, can_comment, can_share,
            expires_at, max_downloads, max_views
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `;

        const result = await db.query(query, [
          input.fileMetadataId,
          user.id,
          input.sharedWith,
          input.shareType,
          input.recipientEmail,
          shareToken,
          input.permissions.canView,
          input.permissions.canDownload,
          input.permissions.canEdit,
          input.permissions.canComment,
          input.permissions.canShare,
          input.expiresAt,
          input.maxDownloads,
          input.maxViews
        ]);

        return result.rows[0];
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    updateFileShare: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const { permissions } = args;

        const query = `
          UPDATE file_shares 
          SET can_view = $1, can_download = $2, can_edit = $3, can_comment = $4, can_share = $5,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $6 AND shared_by = $7
          RETURNING *
        `;

        const result = await db.query(query, [
          permissions.canView,
          permissions.canDownload,
          permissions.canEdit,
          permissions.canComment,
          permissions.canShare,
          args.shareId,
          user.id
        ]);

        if (result.rows.length === 0) {
          throw new Error('File share not found or access denied');
        }

        return result.rows[0];
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    revokeFileShare: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const query = `
          UPDATE file_shares 
          SET is_active = false, revoked_at = CURRENT_TIMESTAMP, revoked_by = $1
          WHERE id = $2 AND shared_by = $1
        `;

        const result = await db.query(query, [user.id, args.shareId]);
        return result.rowCount > 0;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    generateDownloadUrl: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        const fileMetadata = await mongoFileService.getFileMetadata(args.fileId, user.id);
        if (!fileMetadata) {
          throw new Error('File not found or access denied');
        }

        const downloadUrl = await mongoFileService.getDownloadUrl(
          fileMetadata,
          args.expiresIn || 3600,
          user.id
        );

        return downloadUrl;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    },

    trackFileAccess: async (parent, args, context) => {
      try {
        const { user } = context;
        if (!user) throw new Error('Authentication required');

        await mongoFileService.logFileAccess({
          fileMetadataId: args.fileId,
          userId: user.id,
          accessType: args.accessType,
          accessMethod: 'api'
        });

        return true;
      } catch (error) {
        throw errorHandler.handleError(error);
      }
    }
  }
};

module.exports = fileResolvers;