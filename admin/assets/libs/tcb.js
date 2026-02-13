/**
 * CloudBase JS SDK for Browser
 * 本地版本 - 重新导出 npm 包的内容
 * 
 * 注意：这是一个简化版本，完整功能请使用 CDN：
 * <script src="https://unpkg.com/@cloudbase/js-sdk/cloudbase.full.js"></script>
 */

// 由于 CloudBase SDK 需要完整的构建文件，建议使用以下方案之一：

// 方案1：使用 unpkg CDN（推荐）
// <script src="https://unpkg.com/@cloudbase/js-sdk"></script>

// 方案2：使用 jsdelivr CDN
// <script src="https://cdn.jsdelivr.net/npm/@cloudbase/js-sdk"></script>

// 方案3：如果必须使用本地文件，请手动下载完整的 UMD 构建文件

console.error('❌ tcb.js 本地文件不可用，请使用 CDN 版本');
console.log('推荐使用：https://unpkg.com/@cloudbase/js-sdk');

// 临时占位，防止后续脚本报错
window.cloudbase = {
  init: function() {
    console.error('CloudBase SDK 未正确加载，请使用 CDN 版本');
    return {};
  }
};
