# Common 公共模块

## 说明

这是所有云函数共享的公共模块源码，统一在这里维护和修改。

## 包含文件

- `db.js` - 数据库操作（CloudBase SDK rdb()）
- `auth.js` - 权限验证（checkClientAuth, checkAdminAuth）
- `response.js` - 响应格式（success, error, paramError）
- `utils.js` - 工具函数（generateUID, getPagination 等）
- `storage.js` - 云存储操作（上传、下载、删除文件）⭐ **新增**
- `index.js` - 统一导出

## 快速开始

### 数据库操作

```javascript
const { db } = require('common');

// Query Builder 风格
const { data: users } = await db.from('users').select('*').eq('id', 1);
```

### 云存储操作 ⭐

```javascript
const { storage } = require('common');

// 上传文件
const fileID = await storage.uploadFile('users/avatars/user_123.jpg', buffer);

// 获取下载链接
const url = await storage.getTempFileURL(fileID);

// 删除文件
await storage.deleteFile(fileID);
```

详细文档请查看：[storage.js 使用文档](./README-storage.md)

## 使用流程

### 1. 修改公共代码

在这个目录（`cloudfunctions/common`）中修改代码，不要直接修改各云函数内的 common 目录。

### 2. 同步到所有云函数

```powershell
cd d:\project\cursor\work\xcx\cloudfunctions
.\同步公共模块.ps1
```

### 3. 部署更新的云函数

```powershell
# 使用 MCP 工具部署
mcp_cloudbase_updateFunctionCode({
  name: "user",  # 或 order, course, ambassador, system
  functionRootPath: "d:\\project\\cursor\\work\\xcx\\cloudfunctions"
})
```

## 注意事项

⚠️ **不要在此目录包含 node_modules**
- 公共模块源码不需要 node_modules
- common 模块没有外部依赖（只依赖云函数环境的 SDK）
- 依赖会在各云函数部署后在线安装

## 依赖说明

common 模块依赖云函数环境提供的 SDK：
- `wx-server-sdk` - 微信云开发 SDK（可选，用于微信支付）
- `@cloudbase/node-sdk` - CloudBase Node SDK（必需）

这些依赖由各云函数的 `package.json` 管理，不需要在公共模块中安装。

## 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-02-12 | v1.1 | 新增 storage.js 云存储模块 |
| 2026-02-10 | v1.0 | 初始版本 |
