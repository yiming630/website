const LocalFileStorage = require('./localFileStorage');
const path = require('path');
const fs = require('fs').promises;

// 设置默认环境变量（如果没有配置）
process.env.LOCAL_STORAGE_ROOT = process.env.LOCAL_STORAGE_ROOT || path.join(__dirname, '../../../storage');
process.env.PUBLIC_URL_BASE = process.env.PUBLIC_URL_BASE || 'http://localhost:4000/files';

async function testLocalFileStorage() {
  console.log('开始测试本地文件存储服务...\n');
  
  const storage = new LocalFileStorage();
  
  try {
    // 测试1: 上传字符串内容
    console.log('测试1: 上传字符串内容');
    const testContent = '这是一个测试文本内容，包含中文字符。\nThis is a test content with English.';
    const testKey = 'test/documents/test-string.txt';
    
    const uploadUrl = await storage.uploadString(testContent, testKey);
    console.log(`✓ 字符串上传成功，URL: ${uploadUrl}`);
    
    // 测试2: 读取字符串内容
    console.log('\n测试2: 读取字符串内容');
    const downloadedContent = await storage.downloadString(testKey);
    
    if (downloadedContent === testContent) {
      console.log('✓ 内容读取成功，内容一致');
    } else {
      console.log('✗ 内容不一致');
    }
    
    // 测试3: 创建测试文件并上传
    console.log('\n测试3: 上传本地文件');
    const testFilePath = path.join(__dirname, 'test-upload.json');
    const testFileContent = JSON.stringify({
      name: 'Test Document',
      type: 'PDF',
      pages: 10,
      timestamp: new Date().toISOString()
    }, null, 2);
    
    await fs.writeFile(testFilePath, testFileContent);
    
    const fileKey = 'test/documents/test-file.json';
    const fileUrl = await storage.uploadFile(testFilePath, fileKey);
    console.log(`✓ 文件上传成功，URL: ${fileUrl}`);
    
    // 清理测试文件
    await fs.unlink(testFilePath);
    
    // 测试4: 检查文件是否存在
    console.log('\n测试4: 检查文件存在性');
    const exists1 = await storage.exists(fileKey);
    const exists2 = await storage.exists('non-existent-file.txt');
    
    console.log(`✓ 存在的文件: ${exists1 ? '找到' : '未找到'}`);
    console.log(`✓ 不存在的文件: ${exists2 ? '找到' : '未找到'}`);
    
    // 测试5: 获取文件信息
    console.log('\n测试5: 获取文件信息');
    const fileInfo = await storage.getFileInfo(fileKey);
    
    if (fileInfo) {
      console.log('✓ 文件信息:');
      console.log(`  - 大小: ${fileInfo.size} bytes`);
      console.log(`  - 最后修改: ${fileInfo.lastModified}`);
      console.log(`  - URL: ${fileInfo.url}`);
    }
    
    // 测试6: 列出文件
    console.log('\n测试6: 列出所有测试文件');
    const files = await storage.listObjects('test');
    
    console.log(`✓ 找到 ${files.length} 个文件:`);
    files.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    // 测试7: 删除文件
    console.log('\n测试7: 删除文件');
    const deleted1 = await storage.deleteObject(testKey);
    const deleted2 = await storage.deleteObject(fileKey);
    
    console.log(`✓ 删除 ${testKey}: ${deleted1 ? '成功' : '失败'}`);
    console.log(`✓ 删除 ${fileKey}: ${deleted2 ? '成功' : '失败'}`);
    
    // 验证删除
    const filesAfter = await storage.listObjects('test');
    console.log(`✓ 删除后剩余文件: ${filesAfter.length}`);
    
    // 测试8: 错误处理
    console.log('\n测试8: 错误处理');
    try {
      await storage.downloadString('non-existent-file.txt');
    } catch (error) {
      console.log(`✓ 正确捕获错误: ${error.message}`);
    }
    
    console.log('\n所有测试完成！');
    
  } catch (error) {
    console.error('\n测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
testLocalFileStorage().catch(console.error);