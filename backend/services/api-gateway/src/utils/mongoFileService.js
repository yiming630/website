const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');
const crypto = require('crypto');
const path = require('path');
const db = require('../utils/database'); // PostgreSQL connection for metadata

class MongoFileService {
  constructor() {
    this.connectionString = process.env.MONGODB_CONNECTION_STRING;
    this.dbName = process.env.MONGODB_DB_NAME || 'translation_platform';
    this.client = null;
    this.database = null;
    this.gridFSBucket = null;
    this.bucketName = 'documents'; // GridFS collection name
    this.multipartThreshold = parseInt(process.env.MONGO_MULTIPART_THRESHOLD) || 16777216; // 16MB GridFS default
  }

  // Initialize MongoDB connection and GridFS bucket
  async initialize() {
    if (!this.client) {
      try {
        console.log('🔄 Initializing MongoDB GridFS connection...');
        console.log(`📍 Connection String: ${this.connectionString ? 'PROVIDED' : 'MISSING'}`);
        console.log(`📍 Database Name: ${this.dbName}`);
        console.log(`📍 GridFS Bucket: ${this.bucketName}`);
        
        if (!this.connectionString) {
          throw new Error('MONGODB_CONNECTION_STRING is not set in environment variables');
        }

        this.client = new MongoClient(this.connectionString, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        
        console.log('🔗 Connecting to MongoDB...');
        await this.client.connect();
        
        console.log('🗄️ Selecting database...');
        this.database = this.client.db(this.dbName);
        
        console.log('📁 Initializing GridFS bucket...');
        this.gridFSBucket = new GridFSBucket(this.database, {
          bucketName: this.bucketName,
          chunkSizeBytes: 261120, // 255KB chunks
        });
        
        // Test the connection
        await this.client.db('admin').command({ ismaster: true });
        console.log('✅ MongoDB GridFS initialized successfully');
        console.log(`📊 MongoDB Status: Connected to ${this.dbName}`);
      } catch (error) {
        console.error('❌ MongoDB GridFS initialization failed:', error.message);
        console.error('🔍 Error Details:', {
          connectionString: this.connectionString ? 'SET' : 'NOT SET',
          dbName: this.dbName,
          errorCode: error.code,
          errorName: error.name
        });
        throw error;
      }
    }
    return this.gridFSBucket;
  }

  // Enhanced file upload with metadata storage (replacing Baidu BOS)
  async uploadFileWithMetadata(fileData, uploadOptions) {
    const {
      userId,
      projectId = null,
      originalFilename,
      fileBuffer,
      contentType,
      sourceLanguage = null,
      targetLanguage = null,
      translationStyle = null,
      specialization = null,
      visibility = 'private'
    } = uploadOptions;

    try {
      await this.initialize();

      // Generate file hash for deduplication
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      // Check if file already exists in PostgreSQL metadata
      const existingFile = await this.findFileByHash(fileHash, userId);
      if (existingFile) {
        return { success: true, fileMetadata: existingFile, isDuplicate: true };
      }

      // Generate unique file key and metadata
      const timestamp = Date.now();
      const fileExtension = path.extname(originalFilename).toLowerCase();
      const sanitizedName = this.sanitizeFilename(path.parse(originalFilename).name);
      const storedFilename = `${timestamp}-${sanitizedName}${fileExtension}`;
      const objectKey = `documents/${userId}/${storedFilename}`;

      // Upload to MongoDB GridFS
      const gridFSFileId = new ObjectId();
      const uploadResult = await this.uploadToGridFS(gridFSFileId, objectKey, fileBuffer, {
        contentType,
        metadata: {
          userId,
          projectId,
          originalFilename,
          uploadTimestamp: new Date(),
          fileHash,
          visibility
        }
      });

      // Create file metadata record in PostgreSQL
      const fileMetadata = await this.createFileMetadata({
        userId,
        projectId,
        originalFilename,
        storedFilename,
        fileKey: objectKey,
        fileHash,
        fileType: contentType,
        fileExtension: fileExtension.substring(1), // Remove dot
        fileSize: fileBuffer.length,
        bucketName: this.bucketName,
        storageRegion: 'mongodb',
        storageClass: 'gridfs',
        visibility,
        sourceLanguage,
        targetLanguage,
        translationStyle,
        specialization,
        fileUrl: `/api/files/${gridFSFileId}`,
        cdnUrl: null, // No CDN for MongoDB GridFS
        gridfsFileId: gridFSFileId.toString() // Store GridFS file ID
      });

      // Log the upload
      await this.logFileAccess({
        fileMetadataId: fileMetadata.id,
        userId,
        accessType: 'upload',
        accessMethod: 'gridfs'
      });

      return {
        success: true,
        fileMetadata,
        uploadResult,
        isDuplicate: false
      };
    } catch (error) {
      console.error('MongoDB file upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Upload file to MongoDB GridFS
  async uploadToGridFS(fileId, filename, fileBuffer, options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = this.gridFSBucket.openUploadStreamWithId(fileId, filename, {
        contentType: options.contentType,
        metadata: options.metadata
      });

      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error);
        reject(error);
      });

      uploadStream.on('finish', () => {
        resolve({
          gridfsFileId: fileId,
          filename,
          size: fileBuffer.length,
          contentType: options.contentType
        });
      });

      // Write buffer to stream
      uploadStream.write(fileBuffer);
      uploadStream.end();
    });
  }

  // Get download stream for GridFS file
  async getGridFSDownloadStream(gridfsFileId) {
    try {
      await this.initialize();
      const objectId = typeof gridfsFileId === 'string' ? new ObjectId(gridfsFileId) : gridfsFileId;
      return this.gridFSBucket.openDownloadStream(objectId);
    } catch (error) {
      console.error('GridFS download stream error:', error);
      throw new Error('Failed to get download stream');
    }
  }

  // Get file buffer from GridFS (for smaller files)
  async getFileBuffer(gridfsFileId) {
    return new Promise(async (resolve, reject) => {
      try {
        const downloadStream = await this.getGridFSDownloadStream(gridfsFileId);
        const chunks = [];
        
        downloadStream.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        downloadStream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        
        downloadStream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate download URL (returns GridFS file ID for API access)
  async getDownloadUrl(fileMetadata, expiresIn = 3600, userId = null) {
    try {
      if (!fileMetadata.gridfs_file_id && !fileMetadata.gridfsFileId) {
        throw new Error('GridFS file ID not found in metadata');
      }

      const gridfsFileId = fileMetadata.gridfs_file_id || fileMetadata.gridfsFileId;
      const downloadUrl = `/api/files/download/${gridfsFileId}`;
      
      // Update access in PostgreSQL metadata
      if (fileMetadata.id) {
        await db.query(
          'UPDATE file_metadata SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = $1',
          [fileMetadata.id]
        );
      }

      // Log the access if user ID provided
      if (fileMetadata.id && userId) {
        await this.logFileAccess({
          fileMetadataId: fileMetadata.id,
          userId,
          accessType: 'download',
          accessMethod: 'gridfs_url'
        });
      }
      
      return downloadUrl;
    } catch (error) {
      console.error('Download URL generation error:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  // Delete file from GridFS and mark as deleted in PostgreSQL
  async deleteFile(gridfsFileId, fileMetadataId = null, userId = null) {
    try {
      await this.initialize();
      const objectId = typeof gridfsFileId === 'string' ? new ObjectId(gridfsFileId) : gridfsFileId;
      
      // Delete from GridFS
      await this.gridFSBucket.delete(objectId);
      
      // Soft delete in PostgreSQL metadata
      if (fileMetadataId) {
        await db.query(
          'UPDATE file_metadata SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
          [fileMetadataId]
        );
        
        // Log the deletion
        if (userId) {
          await this.logFileAccess({
            fileMetadataId,
            userId,
            accessType: 'delete',
            accessMethod: 'gridfs'
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('GridFS delete error:', error);
      throw new Error('Failed to delete file from GridFS');
    }
  }

  // Legacy method for backward compatibility (replacing uploadToBOS)
  async uploadToStorage(fileBuffer, fileName, contentType) {
    try {
      const gridfsFileId = new ObjectId();
      const objectKey = `documents/${Date.now()}-${fileName}`;
      const result = await this.uploadToGridFS(gridfsFileId, objectKey, fileBuffer, { contentType });
      
      return {
        objectKey: result.filename,
        url: `/api/files/${gridfsFileId}`,
        size: result.size,
        gridfsFileId: gridfsFileId.toString()
      };
    } catch (error) {
      console.error('Storage upload error:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  // PostgreSQL database helper methods (same as original)
  async createFileMetadata(metadata) {
    const query = `
      INSERT INTO file_metadata (
        user_id, project_id, original_filename, stored_filename, file_key, file_hash,
        file_type, file_extension, file_size, bucket_name, storage_region, storage_class,
        visibility, source_language, target_language, translation_style, specialization,
        file_url, cdn_url, upload_status, processing_status, gridfs_file_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'completed', 'pending', $20
      ) RETURNING *
    `;

    const result = await db.query(query, [
      metadata.userId, metadata.projectId, metadata.originalFilename, metadata.storedFilename,
      metadata.fileKey, metadata.fileHash, metadata.fileType, metadata.fileExtension,
      metadata.fileSize, metadata.bucketName, metadata.storageRegion, metadata.storageClass,
      metadata.visibility, metadata.sourceLanguage, metadata.targetLanguage,
      metadata.translationStyle, metadata.specialization, metadata.fileUrl, metadata.cdnUrl,
      metadata.gridfsFileId
    ]);

    return result.rows[0];
  }

  async findFileByHash(fileHash, userId) {
    const query = `
      SELECT * FROM file_metadata 
      WHERE file_hash = $1 AND user_id = $2 AND deleted_at IS NULL
      LIMIT 1
    `;
    const result = await db.query(query, [fileHash, userId]);
    return result.rows[0] || null;
  }

  async logFileAccess(accessData) {
    const query = `
      INSERT INTO file_access_logs (
        file_metadata_id, user_id, access_type, access_method, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await db.query(query, [
      accessData.fileMetadataId,
      accessData.userId,
      accessData.accessType,
      accessData.accessMethod,
      accessData.ipAddress || null,
      accessData.userAgent || null
    ]);
  }

  // File metadata queries (same as original)
  async getFileMetadata(fileId, userId = null) {
    let query = 'SELECT * FROM file_metadata WHERE id = $1 AND deleted_at IS NULL';
    const params = [fileId];
    
    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }
    
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  async getUserFiles(userId, options = {}) {
    const {
      projectId = null,
      fileType = null,
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDir = 'DESC'
    } = options;

    let query = `
      SELECT fm.*, p.name as project_name
      FROM file_metadata fm
      LEFT JOIN projects p ON fm.project_id = p.id
      WHERE fm.user_id = $1 AND fm.deleted_at IS NULL
    `;
    const params = [userId];
    let paramIndex = 2;

    if (projectId) {
      query += ` AND fm.project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
    }

    if (fileType) {
      query += ` AND fm.file_type = $${paramIndex}`;
      params.push(fileType);
      paramIndex++;
    }

    query += ` ORDER BY fm.${orderBy} ${orderDir} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  async getStorageStats(userId = null) {
    const result = await db.query('SELECT * FROM get_file_storage_stats($1)', [userId]);
    return result.rows[0] || {
      total_files: 0,
      total_size_bytes: 0,
      total_size_mb: 0,
      files_by_type: {},
      recent_uploads: 0
    };
  }

  // Glossary methods (same as original)
  async createGlossaryMetadata(glossaryData) {
    const {
      fileMetadataId,
      userId,
      glossaryName,
      description,
      sourceLanguage,
      targetLanguage,
      domain
    } = glossaryData;

    const query = `
      INSERT INTO glossary_files (
        file_metadata_id, user_id, glossary_name, description, 
        source_language, target_language, domain
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await db.query(query, [
      fileMetadataId, userId, glossaryName, description,
      sourceLanguage, targetLanguage, domain
    ]);

    return result.rows[0];
  }

  async getUserGlossaries(userId, options = {}) {
    const {
      sourceLanguage = null,
      targetLanguage = null,
      domain = null,
      isPublic = null,
      limit = 50,
      offset = 0
    } = options;

    let query = `
      SELECT gf.*, fm.original_filename, fm.file_size, fm.created_at as uploaded_at
      FROM glossary_files gf
      JOIN file_metadata fm ON gf.file_metadata_id = fm.id
      WHERE gf.user_id = $1 AND fm.deleted_at IS NULL
    `;
    const params = [userId];
    let paramIndex = 2;

    if (sourceLanguage) {
      query += ` AND gf.source_language = $${paramIndex}`;
      params.push(sourceLanguage);
      paramIndex++;
    }

    if (targetLanguage) {
      query += ` AND gf.target_language = $${paramIndex}`;
      params.push(targetLanguage);
      paramIndex++;
    }

    if (domain) {
      query += ` AND gf.domain = $${paramIndex}`;
      params.push(domain);
      paramIndex++;
    }

    if (isPublic !== null) {
      query += ` AND gf.is_public = $${paramIndex}`;
      params.push(isPublic);
      paramIndex++;
    }

    query += ` ORDER BY gf.last_used_at DESC NULLS LAST, gf.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  // Utility methods
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 100); // Limit length
  }

  // Health check for MongoDB
  async checkHealth() {
    try {
      await this.initialize();
      await this.client.db('admin').command({ ismaster: true });
      return true;
    } catch (error) {
      console.error('MongoDB health check failed:', error);
      return false;
    }
  }

  // Close MongoDB connection
  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.database = null;
      this.gridFSBucket = null;
      console.log('🔌 MongoDB connection closed');
    }
  }

  // Simplified methods for backward compatibility (replacing Baidu services)
  async validateUserToken(token) {
    // For compatibility with existing code
    return { isValid: !!token, user: null };
  }

  async publishMessage(queueName, message) {
    // Placeholder for queue integration
    console.log(`[Queue] Publishing to ${queueName}:`, message);
    return true;
  }

  async subscribeToQueue(queueName, callback) {
    // Placeholder for queue integration
    console.log(`[Queue] Subscribed to ${queueName}`);
    return true;
  }
}

module.exports = new MongoFileService();