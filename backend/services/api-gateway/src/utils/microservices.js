const axios = require('axios');

class MicroservicesClient {
  constructor() {
    this.documentService = process.env.DOCUMENT_SERVICE_URL || 'http://document-service:5000';
    this.collaborationService = process.env.COLLABORATION_SERVICE_URL || 'http://collaboration-service:4001';
    this.fileProcessingService = process.env.FILE_PROCESSING_SERVICE_URL || 'http://file-processing-service:5001';
    this.notificationService = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:5002';
  }

  // Document Service Integration
  async processDocument(documentId, options = {}) {
    try {
      const response = await axios.post(`${this.documentService}/process`, {
        documentId,
        ...options
      }, {
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      console.error('Document service error:', error.message);
      throw new Error('Document processing failed');
    }
  }

  async getDocumentStatus(documentId) {
    try {
      const response = await axios.get(`${this.documentService}/status/${documentId}`, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('Document status error:', error.message);
      throw new Error('Failed to get document status');
    }
  }

  async retranslateDocument(documentId, options = {}) {
    try {
      const response = await axios.post(`${this.documentService}/retranslate`, {
        documentId,
        ...options
      }, {
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      console.error('Document retranslation error:', error.message);
      throw new Error('Document retranslation failed');
    }
  }

  // Collaboration Service Integration
  async joinDocumentSession(documentId, userId, userInfo) {
    try {
      const response = await axios.post(`${this.collaborationService}/join`, {
        documentId,
        userId,
        userInfo
      }, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('Collaboration join error:', error.message);
      throw new Error('Failed to join document session');
    }
  }

  async leaveDocumentSession(documentId, userId) {
    try {
      const response = await axios.post(`${this.collaborationService}/leave`, {
        documentId,
        userId
      }, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('Collaboration leave error:', error.message);
      throw new Error('Failed to leave document session');
    }
  }

  async updateUserCursor(documentId, userId, cursorData) {
    try {
      const response = await axios.post(`${this.collaborationService}/cursor`, {
        documentId,
        userId,
        cursorData
      }, {
        timeout: 5000
      });
      
      return response.data;
    } catch (error) {
      console.error('Cursor update error:', error.message);
      // Don't throw error for cursor updates as they're not critical
      return false;
    }
  }

  // File Processing Service Integration
  async parseDocument(fileData, fileType) {
    try {
      const response = await axios.post(`${this.fileProcessingService}/parse`, {
        fileData: fileData.toString('base64'),
        fileType
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
      
      return response.data;
    } catch (error) {
      console.error('File processing error:', error.message);
      throw new Error('Document parsing failed');
    }
  }

  async generateDownloadLinks(documentId, formats) {
    try {
      const response = await axios.post(`${this.fileProcessingService}/generate-links`, {
        documentId,
        formats
      }, {
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      console.error('Download links generation error:', error.message);
      throw new Error('Failed to generate download links');
    }
  }

  // Notification Service Integration
  async sendNotification(userId, notification) {
    try {
      const response = await axios.post(`${this.notificationService}/send`, {
        userId,
        ...notification
      }, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('Notification error:', error.message);
      // Don't throw error for notifications as they're not critical
      return false;
    }
  }

  async sendDocumentNotification(documentId, type, recipients) {
    try {
      const response = await axios.post(`${this.notificationService}/document`, {
        documentId,
        type,
        recipients
      }, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('Document notification error:', error.message);
      // Don't throw error for notifications as they're not critical
      return false;
    }
  }

  // Health checks
  async checkServiceHealth() {
    const services = {
      document: this.documentService,
      collaboration: this.collaborationService,
      fileProcessing: this.fileProcessingService,
      notification: this.notificationService
    };

    const health = {};

    for (const [name, url] of Object.entries(services)) {
      try {
        const response = await axios.get(`${url}/health`, { timeout: 5000 });
        health[name] = {
          status: 'healthy',
          responseTime: response.headers['x-response-time'] || 'unknown'
        };
      } catch (error) {
        health[name] = {
          status: 'unhealthy',
          error: error.message
        };
      }
    }

    return health;
  }
}

module.exports = new MicroservicesClient(); 