/**
 * 批量升级返回按钮组件
 * 
 * 功能：
 * 1. 将所有 page-header__back 替换为使用 back-button 组件（data-back="auto"）
 * 2. 在所有页面底部添加 back-button.js 引入
 * 3. 跳过已经更新过的页面
 */

const fs = require('fs');
const path = require('path');

// 配置
const PAGES_DIR = path.join(__dirname, '../pages');
const BACKUP_DIR = path.join(__dirname, '../backup');
const DRY_RUN = false; // 设为 true 时只预览，不实际修改文件

// 统计信息
const stats = {
  total: 0,
  updated: 0,
  skipped: 0,
  errors: 0
};

/**
 * 递归获取所有 HTML 文件
 */
function getAllHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllHtmlFiles(fullPath));
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 计算相对路径层级
 */
function getRelativePath(filePath) {
  const relativePath = path.relative(PAGES_DIR, filePath);
  const depth = relativePath.split(path.sep).length - 1;
  return '../'.repeat(depth + 1);
}

/**
 * 升级单个文件
 */
function upgradeFile(filePath) {
  stats.total++;
  
  const relativePath = path.relative(PAGES_DIR, filePath);
  console.log(`\n处理: ${relativePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // 检查是否已经添加了 back-button.js
    const hasBackButtonScript = content.includes('back-button.js');
    
    // 检查是否有需要替换的返回按钮
    const hasOldBackButton = /<a[^>]*class="page-header__back"[^>]*>/.test(content);
    
    if (!hasOldBackButton && hasBackButtonScript) {
      console.log('  ✅ 已经是最新版本，跳过');
      stats.skipped++;
      return;
    }
    
    // 1. 替换返回按钮
    if (hasOldBackButton) {
      // 匹配各种形式的返回按钮
      const backButtonPattern = /<a\s+href="[^"]*"\s+class="page-header__back"[^>]*>←<\/a>/g;
      
      const matches = content.match(backButtonPattern);
      if (matches) {
        console.log(`  找到 ${matches.length} 个返回按钮`);
        content = content.replace(
          backButtonPattern,
          '<div class="back-button" data-back="auto"></div>'
        );
        modified = true;
        console.log('  ✓ 替换返回按钮为自动返回组件');
      }
    }
    
    // 2. 添加 JavaScript 引入
    if (!hasBackButtonScript) {
      const relPath = getRelativePath(filePath);
      const scriptTag = `\n  <!-- 返回按钮组件脚本 -->\n  <script src="${relPath}components/back-button.js"></script>`;
      
      if (content.includes('</body>')) {
        content = content.replace('</body>', `${scriptTag}\n</body>`);
        modified = true;
        console.log('  ✓ 添加 back-button.js 引入');
      }
    }
    
    // 3. 保存文件
    if (modified) {
      if (!DRY_RUN) {
        // 创建备份
        if (!fs.existsSync(BACKUP_DIR)) {
          fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        const backupPath = path.join(BACKUP_DIR, path.basename(filePath));
        fs.copyFileSync(filePath, backupPath);
        
        // 写入修改后的内容
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log('  ✅ 文件已更新');
      } else {
        console.log('  ⚠️  预览模式：文件未实际修改');
      }
      stats.updated++;
    } else {
      console.log('  ℹ️  无需修改');
      stats.skipped++;
    }
    
  } catch (error) {
    console.error(`  ❌ 错误: ${error.message}`);
    stats.errors++;
  }
}

/**
 * 主函数
 */
function main() {
  console.log('========================================');
  console.log('  批量升级返回按钮组件');
  console.log('========================================');
  console.log(`模式: ${DRY_RUN ? '预览（不修改文件）' : '实际修改'}`);
  console.log(`目录: ${PAGES_DIR}`);
  
  const files = getAllHtmlFiles(PAGES_DIR);
  console.log(`\n找到 ${files.length} 个 HTML 文件\n`);
  
  files.forEach(upgradeFile);
  
  console.log('\n========================================');
  console.log('  升级完成');
  console.log('========================================');
  console.log(`总计: ${stats.total}`);
  console.log(`已更新: ${stats.updated}`);
  console.log(`已跳过: ${stats.skipped}`);
  console.log(`错误: ${stats.errors}`);
  
  if (DRY_RUN) {
    console.log('\n⚠️  这是预览模式，文件未实际修改');
    console.log('要实际修改文件，请将脚本中的 DRY_RUN 设为 false');
  }
}

// 运行
main();



































