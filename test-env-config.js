/**
 * 环境变量配置测试脚本
 * 验证所有必需的环境变量是否正确配置
 */

const path = require('path');
const fs = require('fs');

// 加载环境变量
require('dotenv').config({ path: '.env.dev' });

// 定义必需的环境变量
const requiredEnvVars = {
  // 数据库配置
  database: [
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
    'POSTGRES_PORT'
  ],
  // 认证配置
  auth: [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN'
  ],
  // 服务配置
  services: [
    'API_GATEWAY_PORT',
    'CLIENT_ORIGIN',
    'NODE_ENV'
  ],
  // OpenRouter配置
  openrouter: [
    'OPENROUTER_API_KEY',
    'OPENROUTER_MODEL',
    'OPENROUTER_BASE_URL'
  ],
  // 本地存储配置
  storage: [
    'LOCAL_STORAGE_ROOT',
    'PUBLIC_URL_BASE'
  ],
  // 翻译服务配置
  translation: [
    'TRANSLATION_SERVICE_URL',
    'TRANSLATION_TIMEOUT',
    'MAX_CONCURRENT_TRANSLATIONS'
  ]
};

// 检查环境变量的函数
function checkEnvVars() {
  console.log('========================================');
  console.log('环境变量配置检查');
  console.log('========================================\n');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // 检查每个类别的环境变量
  for (const [category, vars] of Object.entries(requiredEnvVars)) {
    console.log(`\n[${category.toUpperCase()}]`);
    
    for (const varName of vars) {
      const value = process.env[varName];
      
      if (!value || value === '') {
        console.log(`❌ ${varName}: 未配置`);
        hasErrors = true;
      } else if (value.includes('your_') || value.includes('change_this') || value === 'your_openrouter_api_key_here') {
        console.log(`⚠️  ${varName}: 使用默认值，请更新为实际值`);
        console.log(`   当前值: ${value.substring(0, 50)}...`);
        hasWarnings = true;
      } else {
        // 对敏感信息进行脱敏显示
        let displayValue = value;
        if (varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('KEY')) {
          displayValue = value.substring(0, 4) + '****' + value.substring(value.length - 4);
        }
        console.log(`✅ ${varName}: ${displayValue}`);
      }
    }
  }
  
  // 检查文件和目录
  console.log('\n\n[文件系统检查]');
  
  // 检查存储目录
  const storageRoot = process.env.LOCAL_STORAGE_ROOT;
  if (storageRoot) {
    if (fs.existsSync(storageRoot)) {
      console.log(`✅ 存储目录存在: ${storageRoot}`);
    } else {
      console.log(`⚠️  存储目录不存在: ${storageRoot}`);
      console.log('   将在首次使用时自动创建');
    }
  }
  
  // 检查临时文件目录
  const tempDir = process.env.TEMP_FILES_DIR;
  if (tempDir) {
    if (fs.existsSync(tempDir)) {
      console.log(`✅ 临时目录存在: ${tempDir}`);
    } else {
      console.log(`⚠️  临时目录不存在: ${tempDir}`);
    }
  }
  
  // 检查输出目录
  const outputDir = process.env.DOCX_OUTPUT_DIR;
  if (outputDir) {
    if (fs.existsSync(outputDir)) {
      console.log(`✅ 输出目录存在: ${outputDir}`);
    } else {
      console.log(`⚠️  输出目录不存在: ${outputDir}`);
    }
  }
  
  // 总结
  console.log('\n\n========================================');
  console.log('检查结果总结');
  console.log('========================================');
  
  if (hasErrors) {
    console.log('\n❌ 发现错误：有必需的环境变量未配置');
    console.log('   请检查并更新 .env.dev 文件');
  } else if (hasWarnings) {
    console.log('\n⚠️  发现警告：某些环境变量使用默认值');
    console.log('   建议更新为实际值，特别是 API 密钥');
  } else {
    console.log('\n✅ 所有环境变量配置正确！');
  }
  
  // 显示当前环境
  console.log(`\n当前环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`配置文件: .env.dev`);
  
  return !hasErrors;
}

// 额外的配置建议
function showRecommendations() {
  console.log('\n\n========================================');
  console.log('配置建议');
  console.log('========================================');
  
  console.log('\n1. OpenRouter API Key:');
  console.log('   - 访问 https://openrouter.ai/keys 获取 API 密钥');
  console.log('   - 更新 OPENROUTER_API_KEY 的值');
  
  console.log('\n2. 安全性:');
  console.log('   - 生产环境必须使用强密码和密钥');
  console.log('   - 使用命令生成安全密钥: openssl rand -hex 32');
  console.log('   - 不要将包含实际密钥的 .env 文件提交到版本控制');
  
  console.log('\n3. 目录结构:');
  console.log('   - 确保所有配置的目录都有适当的读写权限');
  console.log('   - 生产环境建议使用绝对路径');
  
  console.log('\n4. 端口配置:');
  console.log('   - 确保配置的端口没有被其他服务占用');
  console.log('   - 生产环境可能需要配置反向代理');
}

// 运行检查
const isValid = checkEnvVars();
showRecommendations();

// 退出码
process.exit(isValid ? 0 : 1);