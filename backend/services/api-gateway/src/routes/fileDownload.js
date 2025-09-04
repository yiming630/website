const express = require('express');
const mongoFileService = require('../utils/mongoFileService');
const errorHandler = require('../utils/errorHandler');
const auth = require('../middleware/auth');

const router = express.Router();

// Download file from GridFS by file ID
router.get('/download/:gridfsFileId', auth.authenticateToken, async (req, res) => {
  try {
    const { gridfsFileId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this file through PostgreSQL metadata
    const fileMetadata = await mongoFileService.getFileMetadata(null, userId);
    
    // Alternative: Find file by GridFS ID (requires a query update in mongoFileService)
    const fileRecord = await mongoFileService.database.query(
      'SELECT * FROM file_metadata WHERE gridfs_file_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [gridfsFileId, userId]
    );

    if (!fileRecord.rows || fileRecord.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    const fileData = fileRecord.rows[0];

    // Get file stream from GridFS
    const downloadStream = await mongoFileService.getGridFSDownloadStream(gridfsFileId);
    
    // Set appropriate headers
    res.setHeader('Content-Type', fileData.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.original_filename}"`);
    
    if (fileData.file_size) {
      res.setHeader('Content-Length', fileData.file_size);
    }

    // Log file access
    await mongoFileService.logFileAccess({
      fileMetadataId: fileData.id,
      userId,
      accessType: 'download',
      accessMethod: 'direct_stream',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Pipe file stream to response
    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      console.error('GridFS download stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });

  } catch (error) {
    console.error('File download error:', error);
    const handledError = errorHandler.handleError(error);
    res.status(500).json({ error: handledError.message });
  }
});

// Get file info without downloading
router.get('/info/:gridfsFileId', auth.authenticateToken, async (req, res) => {
  try {
    const { gridfsFileId } = req.params;
    const userId = req.user.id;

    const fileRecord = await mongoFileService.database.query(
      'SELECT * FROM file_metadata WHERE gridfs_file_id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [gridfsFileId, userId]
    );

    if (!fileRecord.rows || fileRecord.rows.length === 0) {
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    const fileData = fileRecord.rows[0];
    
    res.json({
      id: fileData.id,
      originalFilename: fileData.original_filename,
      fileType: fileData.file_type,
      fileSize: fileData.file_size,
      createdAt: fileData.created_at,
      gridfsFileId: fileData.gridfs_file_id
    });

  } catch (error) {
    console.error('File info error:', error);
    const handledError = errorHandler.handleError(error);
    res.status(500).json({ error: handledError.message });
  }
});

module.exports = router;