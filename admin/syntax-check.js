/**
 * 检查所有 admin 页面中 <script> 块的 JS 语法
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const adminDir = __dirname;

const pages = [
  'pages/dashboard.html',
  'pages/user/list.html',
  'pages/user/referee.html',
  'pages/user/referee-logs.html',
  'pages/order/list.html',
  'pages/order/refund.html',
  'pages/order/withdraw-audit.html',
  'pages/order/mall-goods.html',
  'pages/course/list.html',
  'pages/course/schedule.html',
  'pages/course/appointment.html',
  'pages/course/case.html',
  'pages/course/material.html',
  'pages/ambassador/list.html',
  'pages/ambassador/application-audit.html',
  'pages/ambassador/activity.html',
  'pages/ambassador/contract.html',
  'pages/system/admin.html',
  'pages/system/config.html',
  'pages/system/banner.html',
  'pages/system/announcement.html',
  'pages/system/feedback.html',
  'pages/system/notification.html',
  'pages/system/level-config.html',
];

var errors = 0;

pages.forEach(function(f) {
  var fullPath = path.join(adminDir, f);
  if (!fs.existsSync(fullPath)) { console.log('MISSING:', f); return; }

  var html = fs.readFileSync(fullPath, 'utf8');

  // 提取所有 <script> 块（排除 src 引用）
  var scriptRe = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g;
  var match;
  var scriptIdx = 0;

  while ((match = scriptRe.exec(html)) !== null) {
    scriptIdx++;
    var code = match[1].trim();
    if (!code) continue;
    try {
      new vm.Script(code);
    } catch (e) {
      console.log('SYNTAX ERROR in ' + f + ' (script #' + scriptIdx + '):');
      console.log('  ' + e.message);
      errors++;
    }
  }

  // 检查关键结构
  var hasSidebarTag  = html.includes('<sidebar-menu');
  var hasCompReg     = html.includes('SidebarNavigation.SidebarMenu');
  var hasSidebarNav  = html.includes('sidebar-navigation.js');

  var issues = [];
  if (!hasSidebarTag)  issues.push('no <sidebar-menu>');
  if (!hasCompReg)     issues.push('SidebarMenu not registered');
  if (!hasSidebarNav)  issues.push('sidebar-navigation.js not loaded');

  if (issues.length) {
    console.log('WARN ' + f + ': ' + issues.join(', '));
  } else {
    // no issues
  }
});

if (errors === 0) {
  console.log('All ' + pages.length + ' pages: no syntax errors, sidebar OK');
} else {
  console.log('\nTotal syntax errors: ' + errors);
}
