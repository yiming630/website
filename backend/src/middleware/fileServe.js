const express = require('express');
const path = require('path');
const fs = require('fs').promises;

/**
 * 创建文件服务中间件
 * 用于通过HTTP提供本地存储文件的访问
 */
function createFileServeMiddleware() {
  const router = express.Router();
  
  // 获取存储根目录
  const storageRoot = process.env.LOCAL_STORAGE_ROOT || path.join(__dirname, '../../../storage');
  
  /**
   * GET /files/*
   * 提供文件下载服务
   */
  router.get('/files/*', async (req, res) => {
    try {
      // 获取请求的文件路径
      const requestPath = req.params[0];
      
      if (!requestPath) {
        return res.status(400).json({ error: 'File path is required' });
      }
      
      // 构建完整的文件路径
      const filePath = path.join(storageRoot, requestPath);
      
      // 安全检查：确保请求的路径在存储根目录内
      const normalizedPath = path.normalize(filePath);
      if (!normalizedPath.startsWith(path.normalize(storageRoot))) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // 检查文件是否存在
      try {
        const stats = await fs.stat(filePath);
        
        if (!stats.isFile()) {
          return res.status(404).json({ error: 'File not found' });
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          return res.status(404).json({ error: 'File not found' });
        }
        throw error;
      }
      
      // 设置适当的响应头
      const ext = path.extname(filePath).toLowerCase();
      const contentTypes = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.txt': 'text/plain; charset=utf-8',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      
      // 设置缓存头
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1小时缓存
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
      
      // 发送文件
      res.sendFile(normalizedPath);
      
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  /**
   * GET /files
   * 列出存储目录中的文件
   */
  router.get('/files', async (req, res) => {
    try {
      const { prefix = '', limit = 100 } = req.query;
      
      // 构建搜索路径
      const searchPath = path.join(storageRoot, prefix);
      
      // 安全检查
      const normalizedPath = path.normalize(searchPath);
      if (!normalizedPath.startsWith(path.normalize(storageRoot))) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const files = [];
      
      // 递归列出文件
      async function* walk(dir) {
        try {
          const dirents = await fs.readdir(dir, { withFileTypes: true });
          for (const dirent of dirents) {
            const fullPath = path.resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
              yield* walk(fullPath);
            } else {
              yield fullPath;
            }
          }
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
      
      // 收集文件信息
      let count = 0;
      for await (const filePath of walk(searchPath)) {
        if (count >= limit) break;
        
        const relativePath = path.relative(storageRoot, filePath).replace(/\\/g, '/');
        const stats = await fs.stat(filePath);
        
        files.push({
          path: relativePath,
          size: stats.size,
          lastModified: stats.mtime,
          url: `${process.env.PUBLIC_URL_BASE || 'http://localhost:4000/files'}/${relativePath}`
        });
        
        count++;
      }
      
      res.json({
        files,
        count: files.length,
        prefix,
        limit
      });
      
    } catch (error) {
      console.error('Error listing files:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  return router;
}

module.exports = createFileServeMiddleware;