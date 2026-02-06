# 天道文化小程序 - 云函数开发规范

> **版本**: V2.0  
> **更新时间**: 2026-02-04  
> **CloudBase 环境**: cloud1-0gnn3mn17b581124  
> **架构模式**: 模块优先（单函数多路由，通过 action 参数区分操作）

---

## 📋 目录

1. [云函数架构](#1-云函数架构)
2. [目录结构](#2-目录结构)
3. [开发规范](#3-开发规范)
4. [公共层使用](#4-公共层使用)
5. [代码示例](#5-代码示例)
6. [执行流程](#6-执行流程)
7. [注意事项](#7-注意事项)
8. [参考资料](#8-参考资料)

---

## 1. 云函数架构

### 1.1 整体架构

本项目采用**云函数作为唯一数据访问层**，前后端统一通过云函数操作数据库。

```
┌─────────────────────────────────────────────────────────────┐
│                       应用层（Application）                    │
├─────────────────────────────────────────────────────────────┤
│   小程序端（Mini Program）    │    管理后台（Admin Panel）     │
│   - 用户操作界面               │    - 管理员操作界面            │
│   - 业务逻辑展示               │    - 数据管理                  │
└──────────────┬────────────────┴───────────────┬──────────────┘
               │                                │
               │    通过 callFunction 调用      │
               ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    云函数层（Cloud Functions）                │
├─────────────────────────────────────────────────────────────┤
│  业务逻辑层                                                    │
│  - 自动获取 openid（用户身份识别）                            │
│  - 权限验证（admin/client/public）                           │
│  - 数据验证                                                    │
│  - 业务规则执行                                                │
│  - 数据转换                                                    │
│                                                               │
│  共享层（Layers）                                              │
│  - 数据库工具库（db-utils）                                    │
│  - 通用工具函数（common-utils）                                │
│  - 业务逻辑层（business-logic）                                │
└──────────────┬────────────────────────────────────────────────┘
               │
               │ SQL 操作（自动注入 _openid）
               ▼
┌─────────────────────────────────────────────────────────────┐
│                  CloudBase MySQL 数据库                        │
├─────────────────────────────────────────────────────────────┤
│  数据存储层                                                    │
│  - 28张业务表                                                  │
│  - _openid 字段（用户数据隔离）                                │
│  - 索引优化                                                    │
│  - 安全规则：ADMINONLY（强制通过云函数访问）                   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 架构优势

**✅ 安全性**
- 前端无法直接操作数据库，防止 SQL 注入和恶意操作
- 云函数自动获取 `openid`，防止前端伪造用户身份
- 数据库设置 `ADMINONLY` 规则，强制通过云函数访问

**✅ 可控性**
- 所有业务逻辑集中在云函数，便于维护和升级
- 权限控制统一管理，避免前端绕过检查
- 数据验证和转换在服务端完成，确保数据质量

**✅ 灵活性**
- 云函数可以自由组合多表查询、事务处理等复杂操作
- 易于实现缓存、限流、日志等中间件功能
- 便于进行 A/B 测试和灰度发布

### 1.3 模块优先架构

**【推荐】单函数多路由（通过 action 参数区分操作）**

```
📦 5个核心云函数（按业务模块划分）
├── user/              # 用户模块（用户信息、课程、订单、积分等）
├── course/            # 课程模块（课程列表、详情、预约等）
├── order/             # 订单模块（创建、支付、取消、退款等）
├── ambassador/        # 大使模块（申请、邀请、名额、提现等）
└── system/            # 系统模块（配置、统计、公告等）

🔧 3个公共层（代码复用）
├── layers/db-utils/       # 数据库操作工具
├── layers/common-utils/   # 通用工具函数（权限、响应、验证等）
└── layers/business-logic/ # 业务逻辑（可选）
```

**架构优势：**

1. ✅ **函数数量少**：5个核心函数，易于管理
2. ✅ **冷启动概率低**：函数调用频率高，实例长期保持热启动
3. ✅ **权限控制灵活**：通过 `action` 前缀（public:/client:/admin:）区分权限
4. ✅ **业务逻辑集中**：同一模块的代码在一个函数中，便于维护
5. ✅ **代码复用性高**：公开接口、用户接口、管理接口可共享逻辑

---

## 2. 目录结构

### 2.1 推荐结构

```
cloudfunctions/                                # 云函数根目录
│
├── user/                                      # 【用户模块云函数】
│   ├── index.js                               # 主入口（处理所有用户相关操作）
│   ├── config.json                            # 层配置
│   └── package.json                           # 依赖配置
│       # 支持的 action：
│       # - client:getMyCourses       获取我的课程
│       # - client:getMyOrders        获取我的订单
│       # - client:updateProfile      更新个人资料
│       # - client:getMeritPoints     获取功德积分
│       # - admin:getAllUsers         管理员获取所有用户
│       # - admin:updateUser          管理员更新用户
│       # - admin:deleteUser          管理员删除用户
│
├── course/                                    # 【课程模块云函数】
│   ├── index.js
│   ├── config.json
│   └── package.json
│       # 支持的 action：
│       # - public:getList             公开获取课程列表
│       # - public:getDetail           公开获取课程详情
│       # - client:makeAppointment     用户预约课程
│       # - admin:create               管理员创建课程
│       # - admin:update               管理员更新课程
│
├── order/                                     # 【订单模块云函数】
│   ├── index.js
│   ├── config.json
│   └── package.json
│       # 支持的 action：
│       # - client:create              用户创建订单
│       # - client:pay                 用户支付订单
│       # - client:cancel              用户取消订单
│       # - admin:getAll               管理员获取所有订单
│       # - admin:refund               管理员退款
│
├── ambassador/                                # 【大使模块云函数】
│   ├── index.js
│   ├── config.json
│   └── package.json
│       # 支持的 action：
│       # - client:apply                用户申请大使
│       # - client:invite               大使邀请用户
│       # - client:getQuota             大使获取名额
│       # - admin:approve               管理员审批申请
│
├── system/                                    # 【系统模块云函数】
│   ├── index.js
│   ├── config.json
│   └── package.json
│       # 支持的 action：
│       # - admin:getConfig             获取系统配置
│       # - admin:updateConfig          更新系统配置
│       # - admin:getStatistics         获取系统统计
│
└── layers/                                    # 【层目录】（共享代码）
    ├── db-utils/                              # 数据库工具层
    │   ├── nodejs/
    │   │   └── node_modules/                  # MySQL 驱动等依赖
    │   ├── index.js                           # 导出数据库连接和查询工具
    │   └── package.json
    │
    ├── common-utils/                          # 通用工具层
    │   ├── index.js                           # 权限验证、响应格式化等
    │   └── package.json
    │
    └── business-logic/                        # 业务逻辑层（可选）
        ├── index.js                           # 积分计算、订单处理等
        └── package.json
```

### 2.2 文件说明

#### 2.2.1 云函数文件

**index.js** - 云函数主入口
```javascript
// 必须导出 main 函数作为入口
exports.main = async (event, context) => {
  // event: 前端传入的参数
  // context: 云函数上下文（包含 OPENID 等信息）
  
  const { action, ...params } = event;
  const { OPENID } = cloud.getWXContext();
  
  // 根据 action 分发到不同的处理函数
  // ...
}
```

**config.json** - 云函数配置（层绑定）
```json
{
  "permissions": {
    "openapi": []
  },
  "triggers": [],
  "layers": [
    {
      "name": "db-utils",
      "version": 1
    },
    {
      "name": "common-utils",
      "version": 1
    }
  ]
}
```

**package.json** - 依赖管理
```json
{
  "name": "user",
  "version": "1.0.0",
  "description": "用户模块云函数",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}
```

#### 2.2.2 层文件

层的文件会被挂载到 `/opt` 目录，在云函数中通过 `require('/opt/...')` 引用。

---

## 3. 开发规范

### 3.1 Action 命名规范

**格式：`{namespace}:{operation}`**

#### 3.1.1 Namespace（权限命名空间）

| Namespace | 说明 | 权限要求 | 使用场景 |
|-----------|-----|---------|---------|
| `public` | 公开接口 | 无需登录 | 课程列表、公告列表等 |
| `client` | 客户端接口 | 需要登录（普通用户） | 我的课程、我的订单等 |
| `admin` | 管理端接口 | 需要管理员权限 | 用户管理、数据统计等 |

#### 3.1.2 Operation（操作类型）

| 前缀 | 说明 | 示例 |
|-----|------|------|
| `get*` | 查询操作 | getList, getDetail, getMyCourses |
| `create*` | 创建操作 | create, createOrder |
| `update*` | 更新操作 | update, updateProfile |
| `delete*` | 删除操作 | delete, deleteUser |
| 动词 | 其他操作 | apply, approve, pay, cancel |

#### 3.1.3 命名示例

```javascript
// ✅ 推荐写法
'public:getList'           // 公开获取列表
'public:getDetail'         // 公开获取详情
'client:getMyCourses'      // 用户获取自己的课程
'client:createOrder'       // 用户创建订单
'client:updateProfile'     // 用户更新个人资料
'admin:getAllUsers'        // 管理员获取所有用户
'admin:approve'            // 管理员审批
'admin:getStatistics'      // 管理员获取统计数据

// ❌ 不推荐写法
'getUserCourses'           // 缺少命名空间，无法区分权限
'admin_getAllUsers'        // 使用下划线，不符合规范
'getList'                  // 缺少命名空间
```

### 3.2 权限验证规范

#### 3.2.1 获取用户身份

```javascript
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event, context) => {
  // ✅ 自动获取当前用户 openid
  const { OPENID } = cloud.getWXContext();
  
  // ❌ 不要从前端接收 openid（可以被伪造）
  // const { openid } = event; // 错误！
}
```

#### 3.2.2 权限检查流程

```javascript
exports.main = async (event, context) => {
  const { action, ...params } = event;
  const { OPENID } = cloud.getWXContext();
  
  try {
    // ==================== 公开路由（无需权限）====================
    if (action.startsWith('public:')) {
      return await handlePublicRequest(action, params);
    }
    
    // ==================== 客户端路由（需要登录）==================
    if (action.startsWith('client:')) {
      // 验证用户身份
      const user = await checkClientAuth(OPENID);
      return await handleClientRequest(OPENID, user, action, params);
    }
    
    // ==================== 管理端路由（需要管理员权限）============
    if (action.startsWith('admin:')) {
      // 验证管理员权限
      const admin = await checkAdminAuth(OPENID);
      return await handleAdminRequest(OPENID, admin, action, params);
    }
    
    throw new Error(`未知操作: ${action}`);
    
  } catch (error) {
    return errorResponse(error.message, error);
  }
}
```

### 3.3 数据库操作规范

#### 3.3.1 自动注入 _openid

```javascript
// ✅ 推荐：查询时自动过滤为当前用户的数据
const myCourses = await db.query(
  'SELECT * FROM user_courses WHERE _openid = ?',
  [OPENID]
);

// ✅ 推荐：插入时自动设置 _openid
await db.query(
  'INSERT INTO orders (_openid, user_id, ...) VALUES (?, ?, ...)',
  [OPENID, userId, ...]
);

// ❌ 错误：允许用户查询其他用户的数据
const allCourses = await db.query('SELECT * FROM user_courses');
```

#### 3.3.2 管理员操作

```javascript
// ✅ 推荐：管理员可以查询所有数据，但需要先验证权限
const admin = await checkAdminAuth(OPENID);

const allUsers = await db.query(
  'SELECT * FROM users WHERE role = ?',
  ['ambassador']
);
```

### 3.4 响应格式规范

**统一使用以下响应格式：**

```javascript
// 成功响应
{
  success: true,
  code: 0,
  message: '操作成功',
  data: { ... },
  timestamp: 1707123456789
}

// 错误响应
{
  success: false,
  code: -1,
  message: '操作失败',
  error: '具体错误信息',
  timestamp: 1707123456789
}
```

**使用层中的响应工具：**

```javascript
const { successResponse, errorResponse } = require('/opt/common-utils');

// 成功
return successResponse(data, '操作成功');

// 失败
return errorResponse('操作失败', error);
```

---

## 4. 公共层使用

### 4.1 层的作用

**层（Layer）** 是云函数的代码共享机制，可以将依赖库、公共代码文件等资源独立管理，实现多个函数间的代码复用。

**优势：**
- ✅ 减小部署包体积
- ✅ 提高开发效率（公共代码只需维护一份）
- ✅ 支持在线编辑（代码包 < 10MB）
- ✅ 版本管理（层支持版本控制）

### 4.2 引用层

层中的文件会被挂载到 `/opt` 目录：

```javascript
// 引用 db-utils 层
const { query, insert, update } = require('/opt/db-utils');

// 引用 common-utils 层
const { checkAdminAuth, successResponse } = require('/opt/common-utils');

// 引用 business-logic 层
const { calculateMeritPoints } = require('/opt/business-logic');
```

### 4.3 db-utils 层（数据库工具）

**提供的方法：**

```javascript
const db = require('/opt/db-utils');

// 查询数据
const rows = await db.query(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);

// 插入数据
const result = await db.insert(
  'INSERT INTO orders (_openid, ...) VALUES (?, ...)',
  [openid, ...]
);

// 更新数据
await db.update(
  'UPDATE users SET nickname = ? WHERE _openid = ?',
  [nickname, openid]
);

// 软删除
await db.softDelete('users', userId);

// 事务处理
await db.transaction(async (conn) => {
  await conn.query('INSERT INTO ...');
  await conn.query('UPDATE ...');
});
```

### 4.4 common-utils 层（通用工具）

**提供的方法：**

```javascript
const utils = require('/opt/common-utils');

// 权限验证
const user = await utils.checkClientAuth(openid);
const admin = await utils.checkAdminAuth(openid, 'admin');

// 响应格式化
return utils.successResponse(data, '操作成功');
return utils.errorResponse('操作失败', error);

// 参数验证
const error = utils.validateRequired(event, ['courseId', 'date']);
if (error) {
  return utils.errorResponse(error);
}

// 分页处理
const { offset, limit } = utils.getPagination(page, pageSize);

// 日期格式化
const dateStr = utils.formatDateTime(new Date());
```

### 4.5 business-logic 层（业务逻辑，可选）

**提供的方法：**

```javascript
const business = require('/opt/business-logic');

// 计算功德分
const meritPoints = business.calculateMeritPoints(orderAmount);

// 计算积分
const cashPoints = business.calculateCashPoints(orderAmount);

// 检查是否可以升级
const canUpgrade = await business.checkUpgradeEligibility(userId);
```

---

## 5. 代码示例

### 5.1 用户模块云函数

```javascript
// cloudfunctions/user/index.js
const cloud = require('wx-server-sdk');
cloud.init();

const { query } = require('/opt/db-utils');
const { 
  checkAdminAuth, 
  checkClientAuth, 
  successResponse, 
  errorResponse,
  validateRequired,
  getPagination
} = require('/opt/common-utils');

exports.main = async (event, context) => {
  const { action, ...params } = event;
  const { OPENID } = cloud.getWXContext();
  
  try {
    // ==================== 客户端路由 ====================
    if (action.startsWith('client:')) {
      return await handleClientRequest(OPENID, action, params);
    }
    
    // ==================== 管理端路由 ====================
    if (action.startsWith('admin:')) {
      return await handleAdminRequest(OPENID, action, params);
    }
    
    throw new Error(`未知操作: ${action}`);
    
  } catch (error) {
    console.error('云函数执行错误:', error);
    return errorResponse(error.message, error);
  }
}

/**
 * 处理客户端请求
 */
async function handleClientRequest(openid, action, params) {
  // 验证用户身份
  const user = await checkClientAuth(openid);
  
  switch (action) {
    case 'client:getMyCourses':
      // 获取我的课程
      const courses = await query(
        `SELECT uc.*, c.title, c.cover_image, c.type
         FROM user_courses uc
         LEFT JOIN courses c ON uc.course_id = c.id
         WHERE uc._openid = ?
         ORDER BY uc.created_at DESC`,
        [openid]
      );
      return successResponse(courses);
    
    case 'client:getMyOrders':
      // 获取我的订单
      const { page = 1, pageSize = 20 } = params;
      const { offset, limit } = getPagination(page, pageSize);
      
      const orders = await query(
        `SELECT o.*, c.title as course_title
         FROM orders o
         LEFT JOIN courses c ON o.course_id = c.id
         WHERE o._openid = ?
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [openid, limit, offset]
      );
      return successResponse(orders);
    
    case 'client:updateProfile':
      // 更新个人信息
      const error = validateRequired(params, ['nickname']);
      if (error) {
        return errorResponse(error);
      }
      
      await query(
        `UPDATE users 
         SET nickname = ?, avatar = ?, phone = ?
         WHERE _openid = ?`,
        [params.nickname, params.avatar, params.phone, openid]
      );
      return successResponse(null, '更新成功');
    
    default:
      throw new Error(`未知的客户端操作: ${action}`);
  }
}

/**
 * 处理管理端请求
 */
async function handleAdminRequest(openid, action, params) {
  // 🔒 验证管理员权限
  const admin = await checkAdminAuth(openid, 'admin');
  
  switch (action) {
    case 'admin:getAllUsers':
      // 获取所有用户列表
      const { page = 1, pageSize = 20, keyword = '' } = params;
      const { offset, limit } = getPagination(page, pageSize);
      
      let sql = 'SELECT * FROM users WHERE 1=1';
      const sqlParams = [];
      
      if (keyword) {
        sql += ' AND (nickname LIKE ? OR phone LIKE ?)';
        sqlParams.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      sqlParams.push(limit, offset);
      
      const users = await query(sql, sqlParams);
      return successResponse(users);
    
    case 'admin:updateUser':
      // 更新用户信息
      const error = validateRequired(params, ['userId', 'role']);
      if (error) {
        return errorResponse(error);
      }
      
      await query(
        `UPDATE users 
         SET role = ?, status = ?
         WHERE id = ?`,
        [params.role, params.status, params.userId]
      );
      return successResponse(null, '更新成功');
    
    default:
      throw new Error(`未知的管理端操作: ${action}`);
  }
}
```

### 5.2 课程模块云函数

```javascript
// cloudfunctions/course/index.js
const cloud = require('wx-server-sdk');
cloud.init();

const { query } = require('/opt/db-utils');
const { 
  checkAdminAuth, 
  checkClientAuth, 
  successResponse, 
  errorResponse,
  getPagination
} = require('/opt/common-utils');

exports.main = async (event, context) => {
  const { action, ...params } = event;
  const { OPENID } = cloud.getWXContext();
  
  try {
    // ==================== 公开路由 ====================
    if (action.startsWith('public:')) {
      return await handlePublicRequest(action, params);
    }
    
    // ==================== 客户端路由 ====================
    if (action.startsWith('client:')) {
      return await handleClientRequest(OPENID, action, params);
    }
    
    // ==================== 管理端路由 ====================
    if (action.startsWith('admin:')) {
      return await handleAdminRequest(OPENID, action, params);
    }
    
    throw new Error(`未知操作: ${action}`);
    
  } catch (error) {
    console.error('云函数执行错误:', error);
    return errorResponse(error.message, error);
  }
}

/**
 * 处理公开请求（无需权限）
 */
async function handlePublicRequest(action, params) {
  switch (action) {
    case 'public:getList':
      // 获取课程列表
      const { page = 1, pageSize = 20, type = '' } = params;
      const { offset, limit } = getPagination(page, pageSize);
      
      let sql = 'SELECT * FROM courses WHERE status = "published"';
      const sqlParams = [];
      
      if (type) {
        sql += ' AND type = ?';
        sqlParams.push(type);
      }
      
      sql += ' ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?';
      sqlParams.push(limit, offset);
      
      const courses = await query(sql, sqlParams);
      return successResponse(courses);
    
    case 'public:getDetail':
      // 获取课程详情
      const [course] = await query(
        'SELECT * FROM courses WHERE id = ? AND status = "published"',
        [params.courseId]
      );
      return successResponse(course || null);
    
    default:
      throw new Error(`未知的公开操作: ${action}`);
  }
}

/**
 * 处理客户端请求
 */
async function handleClientRequest(openid, action, params) {
  const user = await checkClientAuth(openid);
  
  switch (action) {
    case 'client:makeAppointment':
      // 预约课程
      await query(
        `INSERT INTO appointments 
         (_openid, course_id, class_record_id, status)
         VALUES (?, ?, ?, 'pending')`,
        [openid, params.courseId, params.classRecordId]
      );
      return successResponse(null, '预约成功');
    
    default:
      throw new Error(`未知的客户端操作: ${action}`);
  }
}

/**
 * 处理管理端请求
 */
async function handleAdminRequest(openid, action, params) {
  // 🔒 验证管理员权限
  const admin = await checkAdminAuth(openid, 'admin');
  
  switch (action) {
    case 'admin:create':
      // 创建课程
      const result = await query(
        `INSERT INTO courses
         (title, subtitle, type, price, status)
         VALUES (?, ?, ?, ?, 'draft')`,
        [params.title, params.subtitle, params.type, params.price]
      );
      return successResponse({ id: result.insertId }, '创建成功');
    
    case 'admin:update':
      // 更新课程
      await query(
        `UPDATE courses
         SET title = ?, type = ?, price = ?, status = ?
         WHERE id = ?`,
        [params.title, params.type, params.price, params.status, params.courseId]
      );
      return successResponse(null, '更新成功');
    
    default:
      throw new Error(`未知的管理端操作: ${action}`);
  }
}
```

### 5.3 前端调用示例

#### 5.3.1 小程序端调用

```javascript
// 小程序 src/api/user.js
import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'cloud1-0gnn3mn17b581124'
});

/**
 * 获取我的课程
 */
export async function getMyCourses() {
  const result = await app.callFunction({
    name: 'user',
    data: {
      action: 'client:getMyCourses'
    }
  });
  return result.result.data;
}

/**
 * 更新个人资料
 */
export async function updateProfile(nickname, avatar, phone) {
  const result = await app.callFunction({
    name: 'user',
    data: {
      action: 'client:updateProfile',
      nickname,
      avatar,
      phone
    }
  });
  return result.result;
}
```

#### 5.3.2 管理后台调用

```javascript
// 管理后台 admin-panel/src/api/user.js
import cloudbase from '@cloudbase/js-sdk';

const app = cloudbase.init({
  env: 'cloud1-0gnn3mn17b581124'
});

/**
 * 获取所有用户
 */
export async function getAllUsers(page, pageSize, keyword = '') {
  const result = await app.callFunction({
    name: 'user',
    data: {
      action: 'admin:getAllUsers',
      page,
      pageSize,
      keyword
    }
  });
  return result.result.data;
}

/**
 * 更新用户信息
 */
export async function updateUser(userId, role, status) {
  const result = await app.callFunction({
    name: 'user',
    data: {
      action: 'admin:updateUser',
      userId,
      role,
      status
    }
  });
  return result.result;
}
```

---

## 6. 执行流程

### 6.1 云函数开发流程

```
┌─────────────────────────────────────────────────────────────┐
│                    云函数开发完整流程                          │
└─────────────────────────────────────────────────────────────┘

Step 1: 需求分析
├── 确定功能模块（用户/课程/订单/大使/系统）
├── 确定操作类型（public/client/admin）
├── 确定需要的参数和返回值
└── 确定需要的数据库表

Step 2: 选择/创建云函数
├── 确定属于哪个模块（user/course/order/ambassador/system）
├── 如果函数不存在，创建新函数目录
├── 如果函数已存在，直接添加新的 action 分支
└── 配置 config.json（绑定需要的层）

Step 3: 编写业务逻辑
├── 在 index.js 中添加新的 action 分支
├── 实现权限验证（public/client/admin）
├── 实现参数验证（使用 validateRequired）
├── 实现数据库操作（使用 db-utils 层）
├── 实现业务逻辑（可使用 business-logic 层）
└── 返回标准响应（使用 successResponse/errorResponse）

Step 4: 本地测试
├── 安装依赖：npm install
├── 编写测试用例
├── 使用云函数模拟器测试
└── 检查日志输出

Step 5: 部署上线
├── 打包云函数代码
├── 通过控制台上传部署
├── 等待部署完成
└── 查看部署日志

Step 6: 前端集成
├── 在前端项目中调用云函数
├── 传入正确的 action 和参数
├── 处理响应数据
└── 处理错误情况

Step 7: 测试验证
├── 测试公开接口（无需登录）
├── 测试客户端接口（需要登录）
├── 测试管理端接口（需要管理员权限）
├── 测试边界情况和异常情况
└── 查看云函数日志排查问题
```

### 6.2 云函数执行流程

```
┌─────────────────────────────────────────────────────────────┐
│                    云函数调用执行流程                          │
└─────────────────────────────────────────────────────────────┘

1. 前端调用
   ├── 小程序：app.callFunction({ name: 'user', data: { ... } })
   └── 管理后台：app.callFunction({ name: 'user', data: { ... } })

2. CloudBase 路由
   ├── 根据 name 找到对应的云函数
   ├── 自动注入 context（包含 OPENID）
   └── 调用函数的 main 方法

3. 云函数入口
   ├── exports.main = async (event, context) => { ... }
   ├── 解析 action 参数：const { action, ...params } = event
   ├── 获取用户身份：const { OPENID } = cloud.getWXContext()
   └── 根据 action 前缀分发路由

4. 权限验证
   ├── public:* → 无需验证，直接执行
   ├── client:* → checkClientAuth(OPENID)
   │   ├── 查询 users 表验证用户是否存在
   │   └── 返回用户信息
   └── admin:* → checkAdminAuth(OPENID, 'admin')
       ├── 查询 admin_users 表验证是否为管理员
       ├── 检查权限等级
       └── 返回管理员信息

5. 业务逻辑处理
   ├── 参数验证：validateRequired(params, ['field1', 'field2'])
   ├── 数据库查询：db.query(sql, params)
   │   ├── 自动注入 _openid（用户数据隔离）
   │   ├── 执行 SQL 查询
   │   └── 返回查询结果
   ├── 业务计算：business.calculatePoints(amount)
   └── 数据转换：formatDateTime(date)

6. 响应返回
   ├── 成功：successResponse(data, '操作成功')
   │   └── { success: true, code: 0, message: '...', data: { ... } }
   └── 失败：errorResponse('错误信息', error)
       └── { success: false, code: -1, message: '...', error: '...' }

7. 前端接收
   ├── 解析响应：const { success, data, message } = result.result
   ├── 成功处理：更新界面、显示提示
   └── 失败处理：显示错误信息、重试
```

### 6.3 数据库操作流程

```
┌─────────────────────────────────────────────────────────────┐
│                    数据库操作执行流程                          │
└─────────────────────────────────────────────────────────────┘

1. 云函数中调用 db-utils
   ├── const { query } = require('/opt/db-utils');
   └── const result = await query(sql, params);

2. db-utils 获取连接池
   ├── 从连接池获取数据库连接
   ├── 如果连接池不存在，创建新的连接池
   └── 配置：{ host, user, password, database, ... }

3. 执行 SQL 语句
   ├── 使用 mysql2 驱动执行查询
   ├── 自动进行参数绑定（防止 SQL 注入）
   └── 等待查询结果

4. 自动注入 _openid（用户数据隔离）
   ├── 查询操作：WHERE _openid = ?
   │   └── 只返回当前用户的数据
   └── 插入操作：INSERT INTO ... (_openid, ...) VALUES (?, ...)
       └── 自动设置为当前用户的 openid

5. 返回查询结果
   ├── SELECT 查询：返回数据行数组
   ├── INSERT 操作：返回 { insertId, affectedRows }
   ├── UPDATE 操作：返回 { affectedRows }
   └── DELETE 操作：返回 { affectedRows }

6. 释放数据库连接
   ├── 将连接归还到连接池
   └── 连接池自动管理连接的生命周期

7. 错误处理
   ├── 捕获 SQL 错误
   ├── 记录错误日志
   ├── 返回友好的错误信息
   └── 释放数据库连接
```

---

## 7. 注意事项

### 7.1 安全注意事项

**🔒 禁止从前端接收 openid**

```javascript
// ❌ 错误写法（可以被伪造）
exports.main = async (event, context) => {
  const { openid } = event; // 不要这样做！
  // ...
}

// ✅ 正确写法（自动获取）
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext(); // 安全可靠
  // ...
}
```

**🔒 必须进行权限验证**

```javascript
// ❌ 错误写法（缺少权限验证）
case 'admin:getAllUsers':
  const users = await query('SELECT * FROM users');
  return successResponse(users);

// ✅ 正确写法（先验证权限）
case 'admin:getAllUsers':
  const admin = await checkAdminAuth(openid, 'admin');
  const users = await query('SELECT * FROM users');
  return successResponse(users);
```

**🔒 SQL 注入防护**

```javascript
// ❌ 错误写法（SQL 注入风险）
const sql = `SELECT * FROM users WHERE name = '${params.name}'`;
const users = await query(sql);

// ✅ 正确写法（使用参数绑定）
const sql = 'SELECT * FROM users WHERE name = ?';
const users = await query(sql, [params.name]);
```

### 7.2 性能注意事项

**⚡ 避免 N+1 查询**

```javascript
// ❌ 错误写法（N+1 查询）
const orders = await query('SELECT * FROM orders WHERE _openid = ?', [openid]);
for (const order of orders) {
  order.course = await query('SELECT * FROM courses WHERE id = ?', [order.course_id]);
}

// ✅ 正确写法（使用 JOIN）
const orders = await query(
  `SELECT o.*, c.title as course_title
   FROM orders o
   LEFT JOIN courses c ON o.course_id = c.id
   WHERE o._openid = ?`,
  [openid]
);
```

**⚡ 合理使用分页**

```javascript
// ✅ 推荐：使用分页查询
const { offset, limit } = getPagination(page, pageSize);
const users = await query(
  'SELECT * FROM users LIMIT ? OFFSET ?',
  [limit, offset]
);
```

**⚡ 使用索引优化查询**

```sql
-- 确保经常查询的字段有索引
CREATE INDEX idx_openid ON user_courses(_openid);
CREATE INDEX idx_user_id ON orders(user_id);
CREATE INDEX idx_status ON orders(status);
```

### 7.3 开发注意事项

**📝 日志记录**

```javascript
exports.main = async (event, context) => {
  console.log('收到请求:', event);
  
  try {
    // 业务逻辑
    const result = await handleRequest(event);
    console.log('执行成功:', result);
    return successResponse(result);
  } catch (error) {
    console.error('执行失败:', error);
    return errorResponse(error.message, error);
  }
}
```

**📝 参数验证**

```javascript
// ✅ 推荐：先验证参数
const error = validateRequired(params, ['courseId', 'date', 'time']);
if (error) {
  return errorResponse(error);
}

// 再执行业务逻辑
await createAppointment(params);
```

**📝 错误处理**

```javascript
try {
  // 业务逻辑
} catch (error) {
  // 记录详细的错误信息
  console.error('详细错误:', {
    message: error.message,
    stack: error.stack,
    event,
    openid
  });
  
  // 返回友好的错误提示
  return errorResponse('操作失败，请稍后重试', error);
}
```

### 7.4 层（Layer）注意事项

**📦 层的大小限制**

- 单个层的压缩包大小不超过 **50MB**
- 每个函数最多可以绑定 **5个层**
- 层和函数代码总大小不超过 **500MB**（解压后）

**📦 层的版本管理**

```javascript
// ✅ 推荐：使用版本号管理层
{
  "layers": [
    { "name": "db-utils", "version": 1 },      // 稳定版
    { "name": "common-utils", "version": 2 }   // 测试版
  ]
}

// ❌ 不推荐：直接覆盖层（可能影响所有函数）
```

**📦 层的更新策略**

1. 创建新版本的层（version + 1）
2. 在测试函数中绑定新版本
3. 验证功能正常后，逐步切换生产函数到新版本

---

## 8. 参考资料

### 8.1 内部文档

- **[数据库设计文档](../../docs/database/README.md)** - 完整的数据库架构和部署指南
- **[后端API接口文档](../../后端API接口文档.md)** - 所有接口的详细说明
- **[项目需求文档](../../需求文档-V2.md)** - 业务需求和功能说明

### 8.2 CloudBase 官方文档

- **[云函数快速开始](https://docs.cloudbase.net/cloud-function/introduce)** - 云函数基础教程
- **[云函数 API 文档](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction)** - Node.js SDK API 参考
- **[层管理](https://docs.cloudbase.net/cloud-function/layer)** - 层的创建和使用
- **[数据库文档](https://docs.cloudbase.net/database/introduce)** - CloudBase 数据库使用指南
- **[安全规则](https://docs.cloudbase.net/database/security-rules)** - 数据库安全规则配置

### 8.3 快速链接

```
# CloudBase 控制台
https://console.cloud.tencent.com/tcb

# MySQL 数据库管理
https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/db/mysql

# 云函数管理
https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/scf

# 层管理
https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/scf/layer
```

### 8.4 常见问题速查

| 问题 | 解决方案 |
|-----|---------|
| 如何获取用户 openid？ | 使用 `cloud.getWXContext()` 自动获取 |
| 如何区分用户和管理员？ | 使用 action 前缀（client:/admin:）+ 权限验证 |
| 如何防止 SQL 注入？ | 使用参数绑定（`query(sql, [param1, param2])`） |
| 如何实现数据隔离？ | 查询时过滤 `WHERE _openid = ?` |
| 如何共享代码？ | 使用层（Layer）管理公共代码 |
| 如何调试云函数？ | 查看控制台日志 + 使用 `console.log` 输出 |
| 层更新后立即生效吗？ | 不会，需要等待新的函数实例启动 |
| 如何处理事务？ | 使用 `db.transaction` 包裹多个操作 |

---

**📝 文档维护**

- **创建时间**: 2026-02-04
- **最后更新**: 2026-02-04
- **维护人员**: 开发团队
- **反馈渠道**: 项目 Issue 或团队内部讨论

**🔗 相关资源**

- [GitHub 仓库](https://github.com/your-org/tiandao-miniprogram)
- [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
- [开发团队文档中心](https://wiki.example.com)

