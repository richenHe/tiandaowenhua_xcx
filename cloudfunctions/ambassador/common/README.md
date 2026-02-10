# Common 公共模块

## 说明

这是所有云函数共享的公共模块源码，统一在这里维护和修改。

## 包含文件

- `db.js` - 数据库操作（CloudBase SDK rdb()）
- `auth.js` - 权限验证（checkClientAuth, checkAdminAuth）
- `response.js` - 响应格式（success, error, paramError）
- `utils.js` - 工具函数（generateUID, getPagination 等）
- `index.js` - 统一导出

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
- `wx-server-sdk` - 微信云开发 SDK
- `@cloudbase/node-sdk` - CloudBase Node SDK

这些依赖由各云函数的 `package.json` 管理，不需要在公共模块中安装。

