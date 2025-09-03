const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../../databases/connection');

class BaiduServices {
  constructor() {
    this.accessKey = process.env.BAIDU_ACCESS_KEY;
    this.secretKey = process.env.BAIDU_SECRET_KEY;
    this.bosEndpoint = process.env.BAIDU_BOS_ENDPOINT || 'bj.bcebos.com';
    this.bosBucket = process.env.BAIDU_BOS_BUCKET;
    this.cdnBaseUrl = process.env.BAIDU_CDN_BASE_URL;
    this.storageClass = process.env.BAIDU_BOS_STORAGE_CLASS || 'STANDARD';
    this.enableMultipart = process.env.BAIDU_ENABLE_MULTIPART === 'true';
    this.multipartThreshold = parseInt(process.env.BAIDU_MULTIPART_THRESHOLD) || 104857600; // 100MB
    this.partSize = parseInt(process.env.BAIDU_MULTIPART_PART_SIZE) || 104857600; // 100MB
  }

  // Enhanced BOS file upload with metadata storage
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
      // Generate file hash for deduplication
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      // Check if file already exists
      const existingFile = await this.findFileByHash(fileHash, userId);
      if (existingFile) {
        return { success: true, fileMetadata: existingFile, isDuplicate: true };
      }

      // Generate unique file key
      const timestamp = Date.now();
      const fileExtension = path.extname(originalFilename).toLowerCase();
      const sanitizedName = this.sanitizeFilename(path.parse(originalFilename).name);
      const storedFilename = `${timestamp}-${sanitizedName}${fileExtension}`;
      const objectKey = `documents/${userId}/${storedFilename}`;

      // Determine upload method based on file size
      let uploadResult;
      if (this.enableMultipart && fileBuffer.length > this.multipartThreshold) {
        uploadResult = await this.multipartUpload(objectKey, fileBuffer, contentType);
      } else {
        uploadResult = await this.simpleUpload(objectKey, fileBuffer, contentType);
      }

      // Create file metadata record
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
        bucketName: this.bosBucket,
        storageRegion: this.bosEndpoint,
        storageClass: this.storageClass,
        visibility,
        sourceLanguage,
        targetLanguage,
        translationStyle,
        specialization,
        fileUrl: uploadResult.publicUrl,
        cdnUrl: uploadResult.cdnUrl
      });

      // Log the upload
      await this.logFileAccess({
        fileMetadataId: fileMetadata.id,
        userId,
        accessType: 'upload',
        accessMethod: 'api'
      });

      return {
        success: true,
        fileMetadata,
        uploadResult,
        isDuplicate: false
      };
    } catch (error) {
      console.error('File upload with metadata error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // Simple upload for smaller files
  async simpleUpload(objectKey, fileBuffer, contentType) {
    const url = `https://${this.bosBucket}.${this.bosEndpoint}/${objectKey}`;
    
    const headers = {
      'Content-Type': contentType,
      'Content-Length': fileBuffer.length,
      'x-bce-storage-class': this.storageClass,
      'Authorization': this.generateBOSAuth('PUT', objectKey, contentType)
    };

    await axios.put(url, fileBuffer, { headers });
    
    return {
      objectKey,
      publicUrl: this.cdnBaseUrl ? `${this.cdnBaseUrl}/${objectKey}` : url,
      cdnUrl: this.cdnBaseUrl ? `${this.cdnBaseUrl}/${objectKey}` : null,
      size: fileBuffer.length
    };
  }

  // Multipart upload for large files
  async multipartUpload(objectKey, fileBuffer, contentType) {
    try {
      // Initialize multipart upload
      const uploadId = await this.initializeMultipartUpload(objectKey, contentType);
      
      // Calculate parts
      const totalSize = fileBuffer.length;
      const partCount = Math.ceil(totalSize / this.partSize);
      const parts = [];

      // Upload parts concurrently
      const uploadPromises = [];
      for (let partNumber = 1; partNumber <= partCount; partNumber++) {
        const start = (partNumber - 1) * this.partSize;
        const end = Math.min(start + this.partSize, totalSize);
        const partData = fileBuffer.slice(start, end);
        
        uploadPromises.push(
          this.uploadPart(objectKey, uploadId, partNumber, partData)
            .then(etag => ({ partNumber, etag }))
        );
      }

      const uploadedParts = await Promise.all(uploadPromises);
      parts.push(...uploadedParts.sort((a, b) => a.partNumber - b.partNumber));

      // Complete multipart upload
      await this.completeMultipartUpload(objectKey, uploadId, parts);

      const url = `https://${this.bosBucket}.${this.bosEndpoint}/${objectKey}`;
      return {
        objectKey,
        publicUrl: this.cdnBaseUrl ? `${this.cdnBaseUrl}/${objectKey}` : url,
        cdnUrl: this.cdnBaseUrl ? `${this.cdnBaseUrl}/${objectKey}` : null,
        size: totalSize
      };
    } catch (error) {
      console.error('Multipart upload error:', error);
      throw new Error('Multipart upload failed');
    }
  }

  // Legacy method maintained for backward compatibility
  async uploadToBOS(fileBuffer, fileName, contentType) {
    try {
      const objectKey = `documents/${Date.now()}-${fileName}`;
      const result = await this.simpleUpload(objectKey, fileBuffer, contentType);
      return {
        objectKey: result.objectKey,
        url: result.publicUrl,
        size: result.size
      };
    } catch (error) {
      console.error('BOS upload error:', error);
      throw new Error('Failed to upload file to BOS');
    }
  }

  async getBOSDownloadUrl(objectKey, expiresIn = 3600, fileMetadataId = null, userId = null) {
    try {
      const url = `https://${this.bosBucket}.${this.bosEndpoint}/${objectKey}`;
      const expires = Math.floor(Date.now() / 1000) + expiresIn;
      
      const signature = this.generateBOSAuth('GET', objectKey, '', expires);
      const downloadUrl = `${url}?authorization=${encodeURIComponent(signature)}&expires=${expires}`;
      
      // Update presigned URL in database if metadata ID provided
      if (fileMetadataId) {
        await db.query(
          'SELECT update_presigned_url($1, $2, $3)',
          [fileMetadataId, downloadUrl, expiresIn]
        );
      }

      // Log the access if user ID provided
      if (fileMetadataId && userId) {
        await this.logFileAccess({
          fileMetadataId,
          userId,
          accessType: 'download',
          accessMethod: 'presigned_url'
        });
      }
      
      return downloadUrl;
    } catch (error) {
      console.error('BOS download URL error:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async deleteFromBOS(objectKey, fileMetadataId = null, userId = null) {
    try {
      const url = `https://${this.bosBucket}.${this.bosEndpoint}/${objectKey}`;
      const headers = {
        'Authorization': this.generateBOSAuth('DELETE', objectKey)
      };

      await axios.delete(url, { headers });
      
      // Soft delete in database if metadata ID provided
      if (fileMetadataId) {
        await db.query('SELECT soft_delete_file($1)', [fileMetadataId]);
        
        // Log the deletion
        if (userId) {
          await this.logFileAccess({
            fileMetadataId,
            userId,
            accessType: 'delete',
            accessMethod: 'api'
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('BOS delete error:', error);
      throw new Error('Failed to delete file from BOS');
    }
  }

  generateBOSAuth(method, objectKey, contentType = '', expires = null) {
    const timestamp = expires || Math.floor(Date.now() / 1000);
    const stringToSign = `${method}\n\n${contentType}\n${timestamp}\n/${this.bosBucket}/${objectKey}`;
    
    const signature = crypto
      .createHmac('sha1', this.secretKey)
      .update(stringToSign)
      .digest('base64');
    
    return `bce-auth-v1/${this.accessKey}/${timestamp}/1800/host/${signature}`;
  }

  // Database helper methods
  async createFileMetadata(metadata) {
    const query = `
      INSERT INTO file_metadata (
        user_id, project_id, original_filename, stored_filename, file_key, file_hash,
        file_type, file_extension, file_size, bucket_name, storage_region, storage_class,
        visibility, source_language, target_language, translation_style, specialization,
        file_url, cdn_url, upload_status, processing_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'completed', 'pending'
      ) RETURNING *
    `;

    const result = await db.query(query, [
      metadata.userId, metadata.projectId, metadata.originalFilename, metadata.storedFilename,
      metadata.fileKey, metadata.fileHash, metadata.fileType, metadata.fileExtension,
      metadata.fileSize, metadata.bucketName, metadata.storageRegion, metadata.storageClass,
      metadata.visibility, metadata.sourceLanguage, metadata.targetLanguage,
      metadata.translationStyle, metadata.specialization, metadata.fileUrl, metadata.cdnUrl
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

  // Utility methods
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 100); // Limit length
  }

  // Multipart upload helper methods
  async initializeMultipartUpload(objectKey, contentType) {
    const url = `https://${this.bosBucket}.${this.bosEndpoint}/${objectKey}?uploads`;
    const headers = {
      'Content-Type': contentType,
      'x-bce-storage-class': this.storageClass,
      'Authorization': this.generateBOSAuth('POST', objectKey, contentType)
    };

    const response = await axios.post(url, '', { headers });
    return response.data.uploadId;
  }

  async uploadPart(objectKey, uploadId, partNumber, partData) {
    const url = `https://${this.bosBucket}.${this.bosEndpoint}/${objectKey}?partNumber=${partNumber}&uploadId=${uploadId}`;
    const headers = {
      'Content-Length': partData.length,
      'Authorization': this.generateBOSAuth('PUT', objectKey)
    };

    const response = await axios.put(url, partData, { headers });
    return response.headers.etag;
  }

  async completeMultipartUpload(objectKey, uploadId, parts) {
    const url = `https://${this.bosBucket}.${this.bosEndpoint}/${objectKey}?uploadId=${uploadId}`;
    const partsXml = parts
      .map(part => `<part><partNumber>${part.partNumber}</partNumber><etag>${part.etag}</etag></part>`)
      .join('');
    const body = `<completeMultipartUpload>${partsXml}</completeMultipartUpload>`;
    
    const headers = {
      'Content-Type': 'application/xml',
      'Authorization': this.generateBOSAuth('POST', objectKey)
    };

    await axios.post(url, body, { headers });
  }

  // File metadata queries
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

  // Glossary-specific methods
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

  // Note: AI Translation moved to OpenRouter service
  // Use openRouterService.js for all AI-related functions

  // IAM Service (simplified)
  async validateUserToken(token) {
    try {
      // In a real implementation, this would validate with Baidu IAM
      // For now, we'll assume the token is valid if it exists
      return { isValid: !!token, user: null };
    } catch (error) {
      console.error('IAM validation error:', error);
      return { isValid: false, error: error.message };
    }
  }

  // Message Queue Service (simplified)
  async publishMessage(queueName, message) {
    try {
      // In a real implementation, this would use Baidu BMQ
      // For now, we'll just log the message
      console.log(`[BMQ] Publishing to ${queueName}:`, message);
      return true;
    } catch (error) {
      console.error('BMQ publish error:', error);
      throw new Error('Failed to publish message');
    }
  }

  async subscribeToQueue(queueName, callback) {
    try {
      // In a real implementation, this would subscribe to Baidu BMQ
      // For now, we'll just log the subscription
      console.log(`[BMQ] Subscribed to ${queueName}`);
      return true;
    } catch (error) {
      console.error('BMQ subscribe error:', error);
      throw new Error('Failed to subscribe to queue');
    }
  }
}

module.exports = new BaiduServices();