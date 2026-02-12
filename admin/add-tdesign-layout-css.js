const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');

// 需要添加的TDesign布局CSS
const tdesignLayoutCSS = `
    /* TDesign 布局样式 - 必需！*/
    .t-layout {
      height: 100vh;
    }
    
    .t-layout__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px;
      background: #fff;
      border-bottom: 1px solid #dcdcdc;
    }
    
    .t-layout__sider {
      background: #fff;
      border-right: 1px solid #dcdcdc;
      width: 240px !important;
      flex-shrink: 0;
    }
    
    .t-layout__content {
      padding: 24px;
      overflow-y: auto;
      background: #f5f5f5;
    }
`;

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

console.log(`找到 ${htmlFiles.length} 个HTML文件，开始添加TDesign布局CSS...\n`);

htmlFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否已有TDesign布局CSS
    if (content.includes('.t-layout__sider') || content.includes('TDesign 布局样式')) {
      console.log(`⏭️  ${path.relative(__dirname, filePath)} - 已有布局CSS，跳过`);
      skipCount++;
      return;
    }
    
    // 检查是否有<t-aside>或<t-layout>标签（说明需要添加CSS）
    if (!content.includes('<t-aside') && !content.includes('<t-layout')) {
      console.log(`⚠️  ${path.relative(__dirname, filePath)} - 未找到TDesign布局组件，跳过`);
      skipCount++;
      return;
    }
    
    // 在</style>之前插入TDesign布局CSS
    const styleEndTag = '</style>';
    if (content.includes(styleEndTag)) {
      // 找到最后一个</style>标签的位置
      const lastStyleEndIndex = content.lastIndexOf(styleEndTag);
      
      // 插入CSS
      content = content.substring(0, lastStyleEndIndex) + 
                tdesignLayoutCSS + '\n  ' +
                content.substring(lastStyleEndIndex);
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${path.relative(__dirname, filePath)} - 成功添加TDesign布局CSS`);
      successCount++;
    } else {
      console.log(`⚠️  ${path.relative(__dirname, filePath)} - 未找到<style>标签，跳过`);
      skipCount++;
    }
    
  } catch (error) {
    console.error(`❌ ${path.relative(__dirname, filePath)} - 错误: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n处理完成!`);
console.log(`✅ 成功: ${successCount}`);
console.log(`⏭️  跳过: ${skipCount}`);
console.log(`❌ 错误: ${errorCount}`);

