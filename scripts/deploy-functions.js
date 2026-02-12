#!/usr/bin/env node

/**
 * 云函数部署脚本
 * 用于部署云函数和公共层到 CloudBase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 读取配置
const configPath = path.join(__dirname, '../cloudfunctions/cloudbaserc.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ 配置文件不存在:', configPath);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('📦 开始部署云函数...');
console.log(`🌐 环境ID: ${config.envId}`);

// 检查是否已登录
try {
  execSync('tcb', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ CloudBase CLI 未安装或未找到');
  console.log('💡 请先安装: npm install -g @cloudbase/cli');
  console.log('💡 然后登录: tcb login');
  process.exit(1);
}

// 部署步骤
async function deploy() {
  try {
    // 1. 先安装公共层依赖
    console.log('\n📥 步骤 1/4: 安装公共层依赖...');
    const commonPath = path.join(__dirname, '../cloudfunctions/layers/common');
    process.chdir(commonPath);
    execSync('npm install --production', { stdio: 'inherit' });
    
    // 2. 部署公共层
    console.log('\n🚀 步骤 2/4: 部署公共层...');
    const layerPath = path.join(__dirname, '../cloudfunctions/layers/common');
    execSync(`tcb fn layer publish common ${layerPath} --envId ${config.envId}`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    // 3. 安装测试云函数依赖
    console.log('\n📥 步骤 3/4: 安装测试云函数依赖...');
    const testPath = path.join(__dirname, '../cloudfunctions/test');
    process.chdir(testPath);
    execSync('npm install --production', { stdio: 'inherit' });
    
    // 4. 部署测试云函数
    console.log('\n🚀 步骤 4/4: 部署测试云函数...');
    const funcConfig = config.functions[0];
    const envVars = Object.entries(funcConfig.envVariables || {})
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
    
    execSync(
      `tcb fn deploy test ${testPath} --envId ${config.envId} --runtime ${funcConfig.runtime} --timeout ${funcConfig.timeout} --env ${envVars}`,
      { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      }
    );
    
    console.log('\n✅ 部署完成！');
    console.log('\n📝 测试方法:');
    console.log('1. 在小程序中调用: wx.cloud.callFunction({ name: "test", data: { action: "ping" } })');
    console.log('2. 在控制台测试: 云开发控制台 -> 云函数 -> test -> 测试');
    
  } catch (error) {
    console.error('\n❌ 部署失败:', error.message);
    process.exit(1);
  }
}

deploy();












