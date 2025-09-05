const express = require('express');
const multer = require('multer');
const mongoFileService = require('../utils/mongoFileService');
const errorHandler = require('../utils/errorHandler');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 524288000, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Upload single file (quick mode without authentication)
router.post('/upload/quick', upload.single('file'), async (req, res) => {
  try {
    const userId = 'anonymous_' + Date.now();
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Get additional metadata from request body
    const {
      projectId,
      sourceLanguage,
      targetLanguage,
      translationStyle,
      specialization,
      visibility = 'private'
    } = req.body;

    console.log('Quick upload:', {
      filename: file.originalname,
      size: file.size,
      type: file.mimetype,
      sourceLanguage,
      targetLanguage
    });

    // Upload file with metadata
    const uploadResult = await mongoFileService.uploadFileWithMetadata(null, {
      userId: userId,
      projectId: projectId,
      originalFilename: file.originalname,
      fileBuffer: file.buffer,
      contentType: file.mimetype,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      translationStyle: translationStyle,
      specialization: specialization,
      visibility: visibility
    });

    res.json({
      success: uploadResult.success,
      fileMetadata: uploadResult.fileMetadata,
      uploadResult: uploadResult.uploadResult,
      isDuplicate: uploadResult.isDuplicate,
      message: uploadResult.isDuplicate ? 'File already exists' : 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Quick file upload error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 500MB.' });
    }
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Upload single file (authenticated)
router.post('/upload', auth.authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Handle both authenticated and quick mode (anonymous)
    const userId = req.user ? req.user.id : 'anonymous_' + Date.now();
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Get additional metadata from request body
    const {
      projectId,
      sourceLanguage,
      targetLanguage,
      translationStyle,
      specialization,
      visibility = 'private'
    } = req.body;

    // Upload file with metadata
    const uploadResult = await mongoFileService.uploadFileWithMetadata(null, {
      userId: userId,
      projectId: projectId,
      originalFilename: file.originalname,
      fileBuffer: file.buffer,
      contentType: file.mimetype,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      translationStyle: translationStyle,
      specialization: specialization,
      visibility: visibility
    });

    res.json({
      success: uploadResult.success,
      fileMetadata: uploadResult.fileMetadata,
      uploadResult: uploadResult.uploadResult,
      isDuplicate: uploadResult.isDuplicate,
      message: uploadResult.isDuplicate ? 'File already exists' : 'File uploaded successfully'
    });

  } catch (error) {
    console.error('File upload error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 500MB.' });
    }
    const handledError = errorHandler.handle ? errorHandler.handle(error) : { message: error.message };
    res.status(500).json({ error: handledError.message });
  }
});

// Upload multiple files
router.post('/upload-multiple', auth.authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const userId = req.user.id;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadResults = [];
    const {
      projectId,
      sourceLanguage,
      targetLanguage,
      translationStyle,
      specialization,
      visibility = 'private'
    } = req.body;

    // Upload each file
    for (const file of files) {
      try {
        const uploadResult = await mongoFileService.uploadFileWithMetadata(null, {
          userId: userId,
          projectId: projectId,
          originalFilename: file.originalname,
          fileBuffer: file.buffer,
          contentType: file.mimetype,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
          translationStyle: translationStyle,
          specialization: specialization,
          visibility: visibility
        });
        
        uploadResults.push({
          filename: file.originalname,
          ...uploadResult
        });
      } catch (fileError) {
        uploadResults.push({
          filename: file.originalname,
          success: false,
          error: fileError.message
        });
      }
    }

    res.json({
      message: `Processed ${files.length} files`,
      results: uploadResults,
      successCount: uploadResults.filter(r => r.success).length,
      failureCount: uploadResults.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Multiple file upload error:', error);
    const handledError = errorHandler.handle ? errorHandler.handle(error) : { message: error.message };
    res.status(500).json({ error: handledError.message });
  }
});

// Get upload progress (for future enhancement with chunked uploads)
router.get('/upload-status/:uploadId', auth.authenticateToken, async (req, res) => {
  try {
    // This is a placeholder for future chunked upload implementation
    res.json({
      uploadId: req.params.uploadId,
      status: 'completed',
      message: 'Simple uploads complete immediately'
    });
  } catch (error) {
    const handledError = errorHandler.handle ? errorHandler.handle(error) : { message: error.message };
    res.status(500).json({ error: handledError.message });
  }
});

module.exports = router;

