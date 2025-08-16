const axios = require('axios');
const crypto = require('crypto');

class BaiduServices {
  constructor() {
    this.accessKey = process.env.BAIDU_ACCESS_KEY;
    this.secretKey = process.env.BAIDU_SECRET_KEY;
    this.bosEndpoint = process.env.BAIDU_BOS_ENDPOINT;
    this.bosBucket = process.env.BAIDU_BOS_BUCKET;
    this.cdnBaseUrl = process.env.BAIDU_CDN_BASE_URL;
  }

  // BOS (Object Storage) Service
  async uploadToBOS(fileBuffer, fileName, contentType) {
    try {
      const objectKey = `documents/${Date.now()}-${fileName}`;
      const url = `https://${this.bosBucket}.${this.bosEndpoint}/${objectKey}`;
      
      const headers = {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length,
        'Authorization': this.generateBOSAuth('PUT', objectKey, contentType)
      };

      await axios.put(url, fileBuffer, { headers });
      
      return {
        objectKey,
        url: `${this.cdnBaseUrl}/${objectKey}`,
        size: fileBuffer.length
      };
    } catch (error) {
      console.error('BOS upload error:', error);
      throw new Error('Failed to upload file to BOS');
    }
  }

  async getBOSDownloadUrl(objectKey, expiresIn = 3600) {
    try {
      const url = `https://${this.bosBucket}.${this.bosEndpoint}/${objectKey}`;
      const expires = Math.floor(Date.now() / 1000) + expiresIn;
      
      const signature = this.generateBOSAuth('GET', objectKey, '', expires);
      
      return `${url}?authorization=${encodeURIComponent(signature)}&expires=${expires}`;
    } catch (error) {
      console.error('BOS download URL error:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  async deleteFromBOS(objectKey) {
    try {
      const url = `https://${this.bosBucket}.${this.bosEndpoint}/${objectKey}`;
      const headers = {
        'Authorization': this.generateBOSAuth('DELETE', objectKey)
      };

      await axios.delete(url, { headers });
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