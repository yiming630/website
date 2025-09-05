const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4002;

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// Mock database for file metadata
const fileDatabase = [];
let fileIdCounter = 1;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      postgresql: 'mocked',
      mongodb: 'mocked',
      filestorage: 'mocked'
    }
  });
});

// GraphQL endpoint (mock)
app.post('/graphql', (req, res) => {
  const { query } = req.body;
  
  if (query.includes('__typename')) {
    res.json({ data: { __typename: 'Query' } });
  } else if (query.includes('translateText')) {
    res.json({
      data: {
        translateText: {
          originalText: 'Hello world',
          translatedText: '你好世界',
          sourceLanguage: 'en',
          targetLanguage: 'zh'
        }
      }
    });
  } else {
    res.json({ data: null });
  }
});

// File upload endpoint
app.post('/api/files/upload', upload.single('file'), (req, res) => {
  console.log('\n📁 File Upload Request Received');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  if (!req.file) {
    console.log('❌ No file provided');
    return res.status(400).json({ 
      error: 'No file provided',
      success: false 
    });
  }

  const { sourceLanguage, targetLanguage, translationStyle, visibility } = req.body;
  
  console.log('File Info:');
  console.log('  - Name:', req.file.originalname);
  console.log('  - Size:', req.file.size, 'bytes');
  console.log('  - Type:', req.file.mimetype);
  console.log('  - Source Language:', sourceLanguage);
  console.log('  - Target Language:', targetLanguage);
  console.log('  - Style:', translationStyle);
  
  // Create mock file metadata
  const fileMetadata = {
    fileId: `file_${fileIdCounter++}`,
    userId: req.headers.authorization ? 'authenticated_user' : 'anonymous',
    originalFilename: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    sourceLanguage: sourceLanguage || 'en',
    targetLanguage: targetLanguage || 'zh',
    translationStyle: translationStyle || 'GENERAL',
    visibility: visibility || 'private',
    uploadedAt: new Date().toISOString(),
    status: 'uploaded',
    gridfsId: `gridfs_${Date.now()}`
  };
  
  // Store in mock database
  fileDatabase.push(fileMetadata);
  
  // Save file to temp directory (optional)
  const tempDir = path.join(__dirname, 'temp_uploads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const filePath = path.join(tempDir, `${fileMetadata.fileId}_${req.file.originalname}`);
  fs.writeFileSync(filePath, req.file.buffer);
  console.log('✅ File saved to:', filePath);
  
  // Return success response
  const response = {
    success: true,
    message: 'File uploaded successfully',
    fileMetadata: fileMetadata,
    uploadResult: {
      gridfsId: fileMetadata.gridfsId,
      fileUrl: `/api/files/download/${fileMetadata.fileId}`
    },
    isDuplicate: false
  };
  
  console.log('✅ Upload successful:', response);
  res.json(response);
});

// File download endpoint
app.get('/api/files/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  const file = fileDatabase.find(f => f.fileId === fileId);
  
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.json({
    fileId: file.fileId,
    filename: file.originalFilename,
    message: 'This is a mock download endpoint'
  });
});

// List all uploaded files
app.get('/api/files', (req, res) => {
  res.json({
    files: fileDatabase,
    total: fileDatabase.length
  });
});

// PostgreSQL metadata test endpoint
app.get('/api/test/metadata', (req, res) => {
  const mockMetadata = {
    tables: [
      {
        name: 'users',
        columns: ['id', 'name', 'email', 'password', 'role', 'created_at'],
        rowCount: 5
      },
      {
        name: 'documents',
        columns: ['id', 'title', 'status', 'source_language', 'target_language', 'created_at'],
        rowCount: 12
      },
      {
        name: 'projects',
        columns: ['id', 'name', 'description', 'owner_id', 'created_at'],
        rowCount: 3
      }
    ],
    functions: {
      getDocumentMetadata: {
        parameters: ['document_id'],
        returns: 'json',
        example: {
          id: 1,
          title: 'Sample Document',
          metadata: {
            pages: 10,
            words: 5000,
            language: 'en'
          }
        }
      },
      updateTranslationProgress: {
        parameters: ['document_id', 'progress'],
        returns: 'boolean'
      }
    },
    statistics: {
      totalDocuments: 12,
      totalTranslations: 8,
      activeProjects: 3,
      averageTranslationTime: '15 minutes'
    }
  };
  
  res.json({
    success: true,
    metadata: mockMetadata,
    message: 'PostgreSQL metadata functions are working'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🎉 Mock Backend Server Running!
================================
🚀 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
🔍 GraphQL: http://localhost:${PORT}/graphql
📁 Upload: http://localhost:${PORT}/api/files/upload
📄 Files: http://localhost:${PORT}/api/files
🗃️ Metadata: http://localhost:${PORT}/api/test/metadata
================================

✅ CORS enabled for all origins
✅ File upload ready (100MB limit)
✅ Mock database ready

To test:
1. Open test-upload.html in browser
2. Or use: npm run test:upload
3. Or use curl commands
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});