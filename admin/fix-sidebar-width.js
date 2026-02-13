const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');

// 需要修复的CSS规则
const wrongCSS = `.t-layout__sider {
      background: #fff;
      border-right: 1px solid #dcdcdc;
    }`;

const correctCSS = `.t-layout__sider {
      background: #fff;
      border-right: 1px solid #dcdcdc;
      width: 240px !important;
      flex-shrink: 0;
    }`;

// 备选：没有t-layout__sider的情况（使用.t-aside）
const wrongCSSAlt = `.t-aside {
      background: #fff;
      border-right: 1px solid #dcdcdc;
    }`;

const correctCSSAlt = `.t-layout__sider {
      background: #fff;
      border-right: 1px solid #dcdcdc;
      width: 240px !important;
      flex-shrink: 0;
    }`;

// 还需要修复其他TDesign类名
const wrongHeader = `.t-header {`;
const correctHeader = `.t-layout__header {`;

const wrongContent = `.t-content {`;
const correctContent = `.t-layout__content {`;

// 递归查找所有HTML文件
function findHTMLFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findHTMLFiles(fullPath));
    } else if (item.endsWith('.html') && !item.includes('test')) {
      files.push(fullPath);
    }
  });
  
  return files;
}

const htmlFiles = findHTMLFiles(pagesDir);
let successCount = 0;
let skipCount = 0;
let errorCount = 0;

console.log(`找到 ${htmlFiles.length} 个HTML文件，开始修复...\n`);

htmlFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;
    
    // 修复 .t-layout__sider 样式
    if (content.includes(wrongCSS)) {
      content = content.replace(wrongCSS, correctCSS);
      modified = true;
      console.log(`✅ ${path.relative(__dirname, filePath)} - 修复 .t-layout__sider`);
    }
    // 修复 .t-aside 样式（改为.t-layout__sider）
    else if (content.includes(wrongCSSAlt)) {
      content = content.replace(wrongCSSAlt, correctCSSAlt);
      modified = true;
      console.log(`✅ ${path.relative(__dirname, filePath)} - 修复 .t-aside → .t-layout__sider`);
    }
    
    // 修复其他TDesign类名
    if (content.includes(wrongHeader)) {
      content = content.replace(new RegExp(wrongHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correctHeader);
      modified = true;
    }
    
    if (content.includes(wrongContent)) {
      content = content.replace(new RegExp(wrongContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), correctContent);
      modified = true;
    }
    
    // 保存文件
    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      successCount++;
    } else if (!modified) {
      // 检查是否已经修复过
      if (content.includes('width: 240px !important') || content.includes('.t-layout__sider')) {
        console.log(`⏭️  ${path.relative(__dirname, filePath)} - 已修复，跳过`);
        skipCount++;
      } else {
        console.log(`⚠️  ${path.relative(__dirname, filePath)} - 未找到需要修复的CSS`);
        skipCount++;
      }
    }
    
  } catch (error) {
    console.error(`❌ ${path.relative(__dirname, filePath)} - 错误: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n修复完成!`);
console.log(`✅ 成功: ${successCount}`);
console.log(`⏭️  跳过: ${skipCount}`);
console.log(`❌ 错误: ${errorCount}`);




