const fs = require('fs').promises;
const path = require('path');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

class LocalFileStorage {
  /**
   * 百度服务器本地文件存储服务
   */
  constructor() {
    // 配置存储根目录
    this.storageRoot = process.env.LOCAL_STORAGE_ROOT || '/data/seekhub/storage';
    this.publicUrlBase = process.env.PUBLIC_URL_BASE || 'http://localhost:4000/files';
    
    // 确保存储目录存在
    this.ensureDirectoryExists(this.storageRoot);
    
    console.log(`本地存储初始化: ${this.storageRoot}`);
  }

  /**
   * 确保目录存在
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`创建目录失败: ${error.message}`);
    }
  }

  /**
   * 获取文件的完整路径
   */
  getFullPath(objectKey) {
    return path.join(this.storageRoot, objectKey);
  }

  /**
   * 保存字符串内容到本地文件系统
   */
  async uploadString(content, objectKey) {
    try {
      const filePath = this.getFullPath(objectKey);
      
      // 创建目录结构
      await this.ensureDirectoryExists(path.dirname(filePath));
      
      // 写入文件
      await fs.writeFile(filePath, content, 'utf8');
      
      // 生成访问URL
      const url = `${this.publicUrlBase}/${objectKey}`;
      console.log(`文件保存成功: ${filePath}`);
      
      return url;
    } catch (error) {
      console.error(`保存文件失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 上传本地文件到存储目录
   */
  async uploadFile(localFilePath, objectKey) {
    try {
      const filePath = this.getFullPath(objectKey);
      
      // 创建目录结构
      await this.ensureDirectoryExists(path.dirname(filePath));
      
      // 复制文件
      await fs.copyFile(localFilePath, filePath);
      
      const url = `${this.publicUrlBase}/${objectKey}`;
      console.log(`文件上传成功: ${filePath}`);
      
      return url;
    } catch (error) {
      console.error(`上传文件失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 上传文件流到存储目录
   */
  async uploadStream(stream, objectKey) {
    try {
      const filePath = this.getFullPath(objectKey);
      
      // 创建目录结构
      await this.ensureDirectoryExists(path.dirname(filePath));
      
      // 创建写入流
      const writeStream = createWriteStream(filePath);
      
      // 管道传输
      await pipeline(stream, writeStream);
      
      const url = `${this.publicUrlBase}/${objectKey}`;
      console.log(`文件流上传成功: ${filePath}`);
      
      return url;
    } catch (error) {
      console.error(`上传文件流失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 从本地文件系统读取字符串内容
   */
  async downloadString(objectKey) {
    try {
      const filePath = this.getFullPath(objectKey);
      
      // 检查文件是否存在
      await fs.access(filePath);
      
      // 读取文件内容
      const content = await fs.readFile(filePath, 'utf8');
      
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`文件不存在: ${objectKey}`);
      }
      console.error(`读取文件失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取文件流
   */
  getFileStream(objectKey) {
    const filePath = this.getFullPath(objectKey);
    return createReadStream(filePath);
  }

  /**
   * 删除本地文件
   */
  async deleteObject(objectKey) {
    try {
      const filePath = this.getFullPath(objectKey);
      
      // 尝试删除文件
      await fs.unlink(filePath);
      console.log(`文件删除成功: ${filePath}`);
      
      // 尝试清理空目录
      try {
        await fs.rmdir(path.dirname(filePath));
      } catch {
        // 目录非空，忽略
      }
      
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // 文件不存在，视为成功
        return true;
      }
      console.error(`删除文件失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 列出指定前缀的所有文件
   */
  async listObjects(prefix = '') {
    try {
      const basePath = this.getFullPath(prefix);
      const files = [];
      
      async function* walk(dir) {
        const dirents = await fs.readdir(dir, { withFileTypes: true });
        for (const dirent of dirents) {
          const res = path.resolve(dir, dirent.name);
          if (dirent.isDirectory()) {
            yield* walk(res);
          } else {
            yield res;
          }
        }
      }
      
      // 检查目录是否存在
      try {
        await fs.access(basePath);
        for await (const filePath of walk(basePath)) {
          const relativePath = path.relative(this.storageRoot, filePath);
          files.push(relativePath.replace(/\\/g, '/'));
        }
      } catch {
        // 目录不存在，返回空数组
      }
      
      return files;
    } catch (error) {
      console.error(`列出文件失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 检查文件是否存在
   */
  async exists(objectKey) {
    try {
      const filePath = this.getFullPath(objectKey);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(objectKey) {
    try {
      const filePath = this.getFullPath(objectKey);
      const stats = await fs.stat(filePath);
      
      return {
        size: stats.size,
        lastModified: stats.mtime,
        isDirectory: stats.isDirectory(),
        url: `${this.publicUrlBase}/${objectKey}`
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
}

module.exports = LocalFileStorage;