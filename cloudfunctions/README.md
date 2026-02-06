# 云函数配置和部署指南

## 📁 目录结构

```
cloudfunctions/
├── cloudbaserc.json          # CloudBase 配置文件
├── layers/                   # 公共层
│   └── common/               # 公共函数层
│       ├── package.json
│       ├── index.js          # 入口文件
│       ├── db.js             # 数据库操作
│       ├── response.js       # 统一响应格式
│       └── utils.js          # 工具函数
└── test/                     # 测试云函数
    ├── package.json
    └── index.js
```

## 🚀 快速开始

### 1. 安装 CloudBase CLI

```bash
npm install -g @cloudbase/cli
```

### 2. 登录 CloudBase

```bash
tcb login
```

### 3. 安装依赖

```bash
# 安装公共层依赖
cd cloudfunctions/layers/common
npm install

# 安装测试云函数依赖
cd ../../test
npm install
```

### 4. 使用自动部署脚本（推荐）

```bash
# 在项目根目录执行
node scripts/deploy-functions.js
```

### 5. 手动部署（可选）

如果自动部署脚本有问题，可以手动部署：

#### 5.1 部署公共层

```bash
cd D:\project\cursor\work\xcx
tcb fn layer publish common ./cloudfunctions/layers/common --envId cloud1-0gnn3mn17b581124
```

#### 5.2 部署测试云函数

```bash
tcb fn deploy test ./cloudfunctions/test ^
  --envId cloud1-0gnn3mn17b581124 ^
  --runtime Nodejs18.15 ^
  --timeout 30 ^
  --env MYSQL_HOST=gz-cynosdbmysql-grp-2xaxm80c.sql.tencentcdb.com ^
  --env MYSQL_PORT=22483 ^
  --env MYSQL_USER=xcx ^
  --env MYSQL_PASSWORD=xCX020202 ^
  --env MYSQL_DATABASE=tiandao_culture
```

## 🧪 测试云函数

### 方法1：使用 MCP 工具测试

在 AI 对话中执行：

```
请使用 MCP 工具调用测试云函数：
- 函数名: test
- action: ping
```

### 方法2：在小程序中测试

```javascript
// 在小程序代码中
wx.cloud.callFunction({
  name: 'test',
  data: {
    action: 'ping'
  }
}).then(res => {
  console.log('测试结果:', res);
}).catch(err => {
  console.error('调用失败:', err);
});
```

### 方法3：在 CloudBase 控制台测试

1. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 进入环境 `cloud1-0gnn3mn17b581124`
3. 点击「云函数」→「test」→「函数代码」→「测试」
4. 输入测试数据：

```json
{
  "action": "ping"
}
```

## 📋 可用的测试 Action

### 1. ping - 基础功能测试

测试云函数是否正常运行。

**请求参数：**
```json
{
  "action": "ping"
}
```

**预期响应：**
```json
{
  "code": 0,
  "message": "云函数运行正常",
  "data": {
    "message": "pong",
    "openid": "user-openid",
    "timestamp": "2026-02-04 10:30:00",
    "env": "cloud1-0gnn3mn17b581124"
  },
  "timestamp": 1738648200000
}
```

### 2. testDB - 数据库连接测试

测试数据库连接和查询功能。

**请求参数：**
```json
{
  "action": "testDB"
}
```

**预期响应：**
```json
{
  "code": 0,
  "message": "数据库连接正常",
  "data": {
    "database": "tiandao_culture",
    "serverTime": "2026-02-04 10:30:00",
    "userRecords": 0,
    "openid": "user-openid"
  },
  "timestamp": 1738648200000
}
```

### 3. testAuth - 用户认证测试

测试用户认证和数据查询功能（需要先在数据库中插入测试用户）。

**请求参数：**
```json
{
  "action": "testAuth"
}
```

**预期响应：**
```json
{
  "code": 0,
  "message": "用户认证正常",
  "data": {
    "user": {
      "id": 1,
      "username": "test_user",
      "real_name": "测试用户",
      "phone": "138****5678",
      "user_type": "student",
      "ambassador_level": null
    },
    "openid": "user-openid"
  },
  "timestamp": 1738648200000
}
```

## 🔧 配置说明

### cloudbaserc.json 配置项

```json
{
  "envId": "环境ID",
  "functionRoot": "./cloudfunctions",
  "functions": [
    {
      "name": "函数名",
      "timeout": 30,                    // 超时时间（秒）
      "envVariables": {                 // 环境变量
        "MYSQL_HOST": "数据库主机",
        "MYSQL_PORT": "数据库端口",
        "MYSQL_USER": "数据库用户",
        "MYSQL_PASSWORD": "数据库密码",
        "MYSQL_DATABASE": "数据库名"
      },
      "runtime": "Nodejs18.15",         // 运行时版本
      "layers": [                       // 依赖的公共层
        {
          "name": "common",
          "version": 1
        }
      ]
    }
  ]
}
```

## 🛠️ 公共层使用

在云函数中使用公共层：

```javascript
const { db, response, utils } = require('common');

// 数据库查询
const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// 统一响应
return response.success(users, '查询成功');

// 工具函数
const { offset, limit } = utils.getPagination(page, pageSize);
```

## 📝 常见问题

### 1. 部署失败：未找到 tcb 命令

**解决方法：**
```bash
npm install -g @cloudbase/cli
tcb login
```

### 2. 云函数调用失败：未授权

**原因：** 用户未登录或 openid 无效

**解决方法：** 确保小程序用户已通过 `wx.cloud.init()` 初始化并登录

### 3. 数据库连接失败

**检查项：**
- 环境变量是否正确配置（cloudbaserc.json）
- 数据库访问权限是否正确
- 数据库实例是否运行正常

### 4. 公共层未生效

**解决方法：**
1. 确认公共层已部署：`tcb fn layer list --envId cloud1-0gnn3mn17b581124`
2. 重新部署云函数，确保关联了公共层
3. 检查云函数配置中的 `layers` 配置

## 🎯 下一步

云函数环境配置完成后，建议按以下顺序开发：

1. ✅ **测试云函数** - 验证环境可用性
2. 📝 **开发业务云函数** - 根据前端需求开发 API
   - 用户模块 (user)
   - 课程模块 (course)
   - 订单模块 (order)
   - 大使模块 (ambassador)
   - 等...
3. 🔗 **前端集成** - 调用云函数接口
4. 🧪 **联调测试** - 前后端联合测试

## 📚 参考文档

- [CloudBase 云函数官方文档](https://docs.cloudbase.net/cloud-function/introduction.html)
- [项目云函数开发指南](../universal-cloudbase-uniapp-template/cloudfunctions/README.md)


