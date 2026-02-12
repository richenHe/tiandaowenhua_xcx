# 天道文化 - Web 后台管理系统

> 基于 TDesign + CloudBase 的轻量级后台管理系统

## 📁 项目结构

```
admin/
├── index.html                  # 主页面（包含布局和菜单）
├── login.html                  # 登录页
├── playground.html             # TDesign 组件展示
├── assets/
│   ├── css/
│   │   └── tokens.css          # 全局基础样式
│   ├── js/
│   │   ├── config.js           # 系统配置
│   │   └── admin-api.js        # API 封装（调用云函数）
│   └── images/
└── README.md                   # 项目说明
```

---

## 🚀 快速开始

### 1. 本地预览

所有依赖已下载到本地（`assets/libs/`），直接打开 HTML 即可：

```bash
# 方式 1：直接打开
admin/login.html

# 方式 2：VS Code Live Server
# 安装 Live Server 插件
# 右键 login.html → Open with Live Server

# 方式 3：Python HTTP Server
cd admin
python -m http.server 8080
# 访问 http://localhost:8080/login.html
```

**优势**：
- ✅ 无需网络连接（库文件已本地化）
- ✅ 快速加载（所有资源从本地加载）
- ✅ 稳定可靠（不依赖外部 CDN）

---

### 2. 部署到 CloudBase 静态托管

**使用 MCP 工具部署：**

```javascript
// 上传整个 admin 目录
await mcp_cloudbase_uploadFiles({
  localPath: 'D:\\project\\cursor\\work\\xcx\\admin',
  cloudPath: 'admin/',
  isDirectory: true
});
```

**部署成功后访问：**

```
https://cloud1-0gnn3mn17b581124.tcb.qcloud.la/admin/login.html
```

**注意**：
- 📦 总文件大小约 2MB（包含所有库文件）
- ⚡ 国内访问速度快（CloudBase 服务器）
- 🔒 无需外部依赖，更安全稳定

---

## 🎨 技术栈

| 技术 | 版本 | 大小 | 引入方式 | 说明 |
|------|------|------|---------|------|
| **Vue 3** | 3.4.21 | 147 KB | 本地文件 | 前端框架 |
| **TDesign Vue** | 1.9.7 | 1.15 MB | 本地文件 | UI 组件库 |
| **CloudBase SDK** | latest | 306 KB | 本地文件 | 云开发 SDK |

**技术特点：**
- ✅ **零构建**：无需 npm install、无需打包工具
- ✅ **零依赖**：所有库文件已下载到本地
- ✅ **零网络**：离线环境也能正常开发
- ✅ **快速部署**：直接上传 HTML 文件即可
- ✅ **稳定可靠**：不受外部 CDN 影响

---

## 📋 功能清单

### 已完成

- [x] 登录页（JWT Token 鉴权）
- [x] 主页面布局（顶部导航 + 侧边菜单 + 内容区）
- [x] 数据概览（统计数据展示）
- [x] TDesign 组件展示（Playground）
- [x] API 封装（调用云函数）

### 待开发（由 Claude Code 实现）

- [ ] 用户管理页面（学员列表、详情）
- [ ] 订单管理页面（订单列表、详情、退款）
- [ ] 提现审核页面
- [ ] 课程管理页面（课程列表、创建、编辑）
- [ ] 预约管理页面（预约列表、批量签到）
- [ ] 大使管理页面（大使列表、详情）
- [ ] 申请审核页面（大使申请审核）

---

## 🔑 登录说明

### 默认账号

```
用户名：admin
密码：123456
```

### 鉴权流程

1. **登录**：调用 `system.login` 接口获取 JWT Token
2. **Token 存储**：保存在 `localStorage`
3. **后续请求**：自动携带 `jwtToken` 参数
4. **Token 过期**：自动跳转登录页

**Token 有效期：24小时**

---

## 📡 API 调用示例

### 基础使用

```javascript
// 登录
await AdminAPI.login('admin', '123456');

// 获取用户列表
const users = await AdminAPI.getUserList(1, 20);

// 获取统计数据
const stats = await AdminAPI.getStatistics();
```

### 错误处理

```javascript
try {
  const result = await AdminAPI.getUserList(1, 20);
  console.log('成功:', result);
} catch (error) {
  console.error('失败:', error.message);
  // 401 错误会自动跳转登录页
}
```

---

## 🎯 云函数接口

### 已支持的管理端接口

| 模块 | 云函数 | 接口数量 | 说明 |
|------|--------|---------|------|
| 用户管理 | `user` | 4个 | 学员列表、详情、推荐人管理 |
| 订单管理 | `order` | 4个 | 订单列表、详情、退款、提现审核 |
| 课程管理 | `course` | 20个 | 课程、排期、预约、案例、资料 |
| 大使管理 | `ambassador` | 15个 | 大使、申请、活动、合约 |
| 系统管理 | `system` | 21个 | 统计、管理员、配置、公告、反馈 |

**完整接口文档**：参见 `后台/后台管理接口文档.md`

---

## 📦 TDesign 组件使用

### 常用组件

```html
<!-- 按钮 -->
<t-button theme="primary">主要按钮</t-button>

<!-- 输入框 -->
<t-input v-model="value" placeholder="请输入"></t-input>

<!-- 表格 -->
<t-table :data="tableData" :columns="columns"></t-table>

<!-- 卡片 -->
<t-card title="标题">内容</t-card>

<!-- 消息提示 -->
<script>
TDesign.MessagePlugin.success('操作成功');
</script>
```

### 完整组件列表

访问 `playground.html` 查看所有组件示例

---

## 🛠️ 开发建议

### 1. 创建新页面

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <!-- 引入 TDesign CSS -->
  <link rel="stylesheet" href="https://unpkg.com/tdesign-vue-next/dist/tdesign.min.css">
  <link rel="stylesheet" href="./assets/css/tokens.css">
</head>
<body>
  <div id="app">
    <!-- 你的页面内容 -->
  </div>

  <!-- 引入依赖 -->
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://unpkg.com/tdesign-vue-next/dist/tdesign.min.js"></script>
  <script src="https://web.sdk.qcloud.com/tcb/latest/tcb.js"></script>
  <script src="./assets/js/config.js"></script>
  <script src="./assets/js/admin-api.js"></script>
  
  <script>
    const { createApp } = Vue;
    // 你的 Vue 代码
  </script>
</body>
</html>
```

### 2. 调用 API

```javascript
// 在 admin-api.js 中已封装好所有接口
// 直接调用即可

async function loadData() {
  try {
    const data = await AdminAPI.getUserList(1, 20);
    // 处理数据
  } catch (error) {
    TDesign.MessagePlugin.error(error.message);
  }
}
```

### 3. 使用 TDesign 组件

```javascript
// TDesign 已通过 CDN 全局引入
// 直接在模板中使用即可

app.use(TDesign);
```

---

## 📝 注意事项

### 1. Token 管理

- Token 存储在 `localStorage`
- 有效期 24 小时
- 过期自动跳转登录页

### 2. 路由方式

- 使用 HTML 文件跳转（简单直接）
- 无需配置路由库
- 适合轻量级后台

### 3. 样式规范

- 直接使用 TDesign 组件样式
- 无需自定义太多 CSS
- 保持界面统一性

---

## 🔗 相关文档

- [TDesign Vue 官方文档](https://tdesign.tencent.com/vue-next/overview)
- [CloudBase 官方文档](https://docs.cloudbase.net/)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [后台管理接口文档](../后台/后台管理接口文档.md)
- [API 快速参考](../后台/后台管理API快速参考.md)

---

## 📮 技术支持

如有问题，请联系开发团队。

**最后更新**：2026-02-12  
**版本**：v1.0

