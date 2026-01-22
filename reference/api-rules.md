# 天道文化小程序 API前后端调用规则文档

## 文档信息

- **版本**：V1.0
- **创建日期**：2026-01-21
- **文档性质**：API前后端调用规范文档
- **基于**：
  - requirements-rules.md（需求规则概述）
  - 需求文档-V2.md（详细需求文档）
  - 腾讯云CloudBase官方文档

---

## 目录

1. [概述](#1-概述)
2. [请求规范](#2-请求规范)
3. [响应规范](#3-响应规范)
4. [云函数调用规范](#4-云函数调用规范)
5. [前端API封装](#5-前端api封装)
6. [业务规则校验](#6-业务规则校验)
7. [数据验证](#7-数据验证)
8. [安全规范](#8-安全规范)
9. [日志监控](#9-日志监控)
10. [版本管理](#10-版本管理)
11. [接口示例](#11-接口示例)
12. [附录](#12-附录)

---

## 1. 概述

### 1.1 适用范围

本文档适用于**天道文化小程序**项目的所有API接口开发，包括：

| 端类型 | 说明 |
|-------|------|
| **小程序端** | 用户端小程序（微信小程序、H5） |
| **后台管理端** | 管理员后台Web系统 |
| **云函数端** | 腾讯云CloudBase云函数 |

### 1.2 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                      小程序端                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  uniapp     │  │  cloudbase  │  │  微信支付       │ │
│  │  前端框架   │  │  SDK        │  │                 │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   腾讯云CloudBase                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  云函数     │  │  云数据库   │  │  云存储        │ │
│  │  Node.js    │  │  MySQL      │  │  COS           │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   后台管理端                             │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │  Web管理    │  │  Admin API  │                      │
│  │  前端       │  │  云函数     │                      │
│  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

### 1.3 名词定义

| 术语 | 定义 |
|------|------|
| **云函数** | 腾讯云CloudBase Serverless函数，运行在Node.js环境 |
| **调用方** | 发起API请求的客户端（小程序端或后台管理端） |
| **被调用方** | 接收API请求的云函数 |
| **功德分** | 虚拟奖励分，用于商城兑换（不可提现） |
| **积分** | 可提现的现金分（鸿鹄及以上大使专用） |
| **推荐人** | 用户注册时绑定的传播大使，可获得推荐奖励 |
| **大使等级** | 准青鸾(1)、青鸾(2)、鸿鹄(3)、金凤(4) |

### 1.4 参考文档

| 文档 | 链接 |
|------|------|
| 腾讯云CloudBase云函数-快速开始 | https://docs.cloudbase.net/cloud-function/quick-start |
| 腾讯云CloudBase云函数-开发指南 | https://docs.cloudbase.net/cloud-function/develop/introduce |
| 腾讯云CloudBase云函数-编写指南 | https://docs.cloudbase.net/cloud-function/how-coding |
| 腾讯云CloudBase云函数-测试指南 | https://docs.cloudbase.net/cloud-function/develop/how-test |
| 腾讯云CloudBase云函数-日志调试 | https://docs.cloudbase.net/cloud-function/debugging/log |
| 腾讯云CloudBase云函数-监控 | https://docs.cloudbase.net/cloud-function/debugging/monitor |
| 腾讯云CloudBase认证授权 | https://docs.cloudbase.net/authentication-v2/auth/introduce |
| 腾讯云CloudBase数据库 | https://docs.cloudbase.net/database/introduce |
| 需求规则概述文档 | reference/requirements-rules.md |
| 详细需求文档 | 需求文档-V2.md |

---

## 2. 请求规范

### 2.1 请求方式

根据操作类型选择合适的HTTP方法：

| 方法 | 操作类型 | 示例 |
|-----|---------|------|
| **GET** | 查询数据（幂等操作） | 获取课程列表、查询用户信息 |
| **POST** | 创建数据、提交操作 | 创建订单、提交反馈、登录 |
| **PUT** | 更新数据（完整更新） | 更新用户资料、修改订单状态 |
| **DELETE** | 删除数据 | 删除预约、取消订单 |

### 2.2 请求头配置

所有API请求必须携带以下请求头：

```http
Content-Type: application/json
Accept: application/json
X-Request-ID: {uuid}          // 请求唯一标识
X-Client-Version: {version}   // 客户端版本号
X-Platform: wechat/h5/admin   // 平台类型
```

**云函数调用特殊头**（CloudBase SDK自动处理）：

```http
X-TCB-EnvID: {env-id}         // 环境ID
Authorization: Bearer {token} // 用户认证令牌（CloudBase内置）
```

### 2.3 参数规范

#### 2.3.1 参数传递方式

| 参数位置 | 适用场景 | 示例 |
|---------|---------|------|
| **Path** | URL路径参数 | `/api/course/{courseId}` |
| **Query** | 列表查询参数 | `?page=1&size=10&status=active` |
| **Body** | 创建/更新数据 | POST请求的请求体 |

#### 2.3.2 参数命名规范

```json
// ✅ 正确的命名
{
    "userId": "用户ID",
    "courseId": "课程ID",
    "refereeId": "推荐人ID",
    "createdAt": "创建时间",
    "isConfirmed": "是否确认"
}

// ❌ 错误的命名
{
    "user_id": "下划线风格",
    "USERID": "大写风格",
    "uid": "缩写不明确",
    "c": "单字母"
}
```

**命名规则**：
- 使用小驼峰命名（camelCase）
- 使用完整的英文单词，避免缩写
- 布尔值使用 `is`/`has`/`can` 前缀
- 时间字段统一使用 `At` 后缀

#### 2.3.3 参数数据类型

| 类型 | JSON类型 | 说明 |
|-----|---------|------|
| 字符串 | `string` | 文本内容 |
| 整数 | `number` | 不使用浮点数表示金额 |
| 金额 | `number` | 单位为分，整数 |
| 布尔值 | `boolean` | true/false |
| 日期时间 | `string` | ISO 8601格式：`YYYY-MM-DDTHH:mm:ss.sssZ` |
| 数组 | `array` | 数组类型 |
| 对象 | `object` | 嵌套对象 |

### 2.4 分页排序标准

#### 2.4.1 分页参数

```json
// 请求参数
{
    "page": 1,        // 当前页码，从1开始
    "pageSize": 10,   // 每页条数，默认10，最大100
    "total": 0        // 服务端返回总条数
}
```

#### 2.4.2 排序参数

```json
// 请求参数
{
    "orderBy": "createdAt",  // 排序字段
    "orderType": "desc"      // 排序方向：asc/desc
}

// 常用排序字段
// - createdAt 创建时间
// - updatedAt 更新时间
// - orderNo 订单号
// - amount 金额
```

#### 2.4.3 筛选参数

```json
// 请求参数
{
    "filters": {
        "status": "paid",        // 精确匹配
        "amountMin": 100,        // 范围起始
        "amountMax": 1000,       // 范围结束
        "keyword": "课程",       // 模糊搜索
        "createdAtStart": "2026-01-01T00:00:00Z",
        "createdAtEnd": "2026-12-31T23:59:59Z"
    }
}
```

---

## 3. 响应规范

### 3.1 统一响应结构

所有API响应必须使用统一的JSON结构：

```json
{
    "code": 0,              // 状态码：0表示成功，非0表示错误
    "message": "操作成功",   // 状态描述
    "data": {               // 响应数据
        // 具体数据
    },
    "requestId": "uuid",    // 请求ID，用于追踪
    "timestamp": 1706784000000  // 响应时间戳
}
```

### 3.2 成功响应格式

#### 3.2.1 查询单个对象

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "userId": "user_001",
        "nickname": "张三",
        "avatarUrl": "https://...",
        "ambassadorLevel": 2,
        "createdAt": "2026-01-15T10:30:00Z"
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": 1706784000000
}
```

#### 3.2.2 查询列表（带分页）

```json
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [
            {
                "courseId": "course_001",
                "courseName": "初探班",
                "price": 168800,
                "status": "active"
            },
            {
                "courseId": "course_002",
                "courseName": "密训班",
                "price": 3888800,
                "status": "active"
            }
        ],
        "pagination": {
            "page": 1,
            "pageSize": 10,
            "total": 25,
            "totalPages": 3
        }
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440001",
    "timestamp": 1706784000000
}
```

#### 3.2.3 创建/更新成功

```json
{
    "code": 0,
    "message": "创建成功",
    "data": {
        "orderId": "order_001",
        "orderNo": "TD202601210001",
        "amount": 168800,
        "createdAt": "2026-01-21T10:30:00Z"
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440002",
    "timestamp": 1706784000000
}
```

### 3.3 错误响应格式

#### 3.3.1 业务错误

```json
{
    "code": 40001,
    "message": "推荐人资格验证失败，准青鸾大使只能推荐初探班",
    "data": {
        "refereeLevel": 1,
        "courseType": "密训班",
        "requiredLevel": 2
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440003",
    "timestamp": 1706784000000
}
```

#### 3.3.2 参数错误

```json
{
    "code": 40002,
    "message": "参数验证失败：手机号格式不正确",
    "data": {
        "field": "phone",
        "value": "13800138000",
        "rule": "手机号格式不正确"
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440004",
    "timestamp": 1706784000000
}
```

#### 3.3.3 认证错误

```json
{
    "code": 40101,
    "message": "用户未登录",
    "data": null,
    "requestId": "550e8400-e29b-41d4-a716-446655440005",
    "timestamp": 1706784000000
}
```

#### 3.3.4 权限错误

```json
{
    "code": 40301,
    "message": "无权限操作，只有青鸾及以上大使可执行此操作",
    "data": {
        "currentLevel": 1,
        "requiredLevel": 2
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440006",
    "timestamp": 1706784000000
}
```

#### 3.3.5 系统错误

```json
{
    "code": 50001,
    "message": "系统繁忙，请稍后重试",
    "data": null,
    "requestId": "550e8400-e29b-41d4-a716-446655440007",
    "timestamp": 1706784000000
}
```

### 3.4 状态码定义

#### 3.4.1 成功状态码

| code | message | 说明 |
|-----|---------|------|
| 0 | success | 操作成功 |
| 1 | created | 创建成功 |
| 2 | updated | 更新成功 |
| 3 | deleted | 删除成功 |

#### 3.4.2 客户端错误（4xxxx）

| code | message | 说明 |
|-----|---------|------|
| 40001 | 参数验证失败 | 业务参数校验不通过 |
| 40002 | 参数格式错误 | 参数格式不符合要求 |
| 40101 | 未登录 | 用户未认证 |
| 40102 | Token过期 | 认证令牌已过期 |
| 40301 | 无权限 | 没有操作权限 |
| 40302 | 推荐人资格不符 | 推荐人不满足条件 |
| 40401 | 资源不存在 | 请求的资源不存在 |
| 40901 | 资源冲突 | 资源状态不允许操作 |

#### 3.4.3 服务端错误（5xxxx）

| code | message | 说明 |
|-----|---------|------|
| 50001 | 系统错误 | 内部系统错误 |
| 50002 | 服务繁忙 | 系统负载过高 |
| 50003 | 数据库错误 | 数据库操作失败 |
| 50004 | 支付失败 | 支付处理失败 |

---

## 4. 云函数调用规范

### 4.1 命名规范

云函数使用模块化命名方式，按功能模块分组：

```
cloudfunctions/
├── user/                    # 用户模块
│   ├── login/              # 登录相关
│   ├── profile/            # 个人信息
│   └── referee/            # 推荐人管理
├── course/                  # 课程模块
│   ├── list/               # 课程列表
│   ├── detail/             # 课程详情
│   └── my/                 # 我的课程
├── order/                   # 订单模块
│   ├── create/             # 创建订单
│   ├── pay/                # 支付相关
│   └── notify/             # 支付回调
├── ambassador/              # 大使模块
│   ├── info/               # 大使信息
│   ├── points/             # 积分管理
│   └── qrcode/             # 推荐二维码
├── admin/                   # 后台管理模块
│   ├── course/             # 课程管理
│   ├── user/               # 用户管理
│   └── order/              # 订单管理
└── utils/                   # 工具函数
    ├── validation/         # 校验工具
    └── logger/             # 日志工具
```

**云函数名称格式**：`{模块名}_{功能名}`

```javascript
// 正确示例
cloudfunctions/user_login       // 用户登录
cloudfunctions/course_list      // 课程列表
cloudfunctions/order_create     // 创建订单
cloudfunctions/ambassador_info  // 大使信息

// 错误示例
cloudfunctions/user             // 过于笼统
cloudfunctions/getUserInfo      // 大写字母
cloudfunctions.user.login       // 包含特殊字符
```

### 4.2 参数传递规则

#### 4.2.1 输入参数

云函数通过 `event` 对象接收参数：

```javascript
// cloudfunctions/user_login/index.js
exports.main = async (event, context) => {
    const { code, userInfo } = event;

    // 参数校验
    if (!code) {
        return {
            code: 40002,
            message: "参数错误：缺少code参数"
        };
    }

    // 业务逻辑...
};
```

#### 4.2.2 参数白名单

只接收预期的参数，防止参数注入攻击：

```javascript
// 允许的参数列表
const ALLOWED_PARAMS = ['code', 'userInfo', 'refereeId', 'page', 'pageSize'];

// 参数过滤
const safeParams = {};
for (const key of ALLOWED_PARAMS) {
    if (event[key] !== undefined) {
        safeParams[key] = event[key];
    }
}
```

#### 4.2.3 敏感参数处理

以下参数不应出现在日志中：

```javascript
// 需要过滤的敏感参数
const SENSITIVE_PARAMS = ['password', 'token', 'phoneCode', 'paySecret'];

// 日志记录时过滤
const safeLog = { ...params };
SENSITIVE_PARAMS.forEach(key => {
    if (safeLog[key]) safeLog[key] = '***';
});
```

### 4.3 返回值格式

云函数统一返回格式：

```javascript
// 成功返回
return {
    code: 0,
    message: 'success',
    data: { ... },
    requestId: context.requestId,
    timestamp: Date.now()
};

// 错误返回
return {
    code: 40001,
    message: '业务错误描述',
    data: null,
    requestId: context.requestId,
    timestamp: Date.now()
};
```

### 4.4 错误处理机制

#### 4.4.1 统一错误处理

```javascript
exports.main = async (event, context) => {
    try {
        // 业务逻辑

    } catch (error) {
        // 记录错误日志
        console.error('云函数执行失败:', {
            requestId: context.requestId,
            error: error.message,
            stack: error.stack,
            event: event
        });

        // 返回统一错误格式
        return {
            code: 50001,
            message: '系统繁忙，请稍后重试',
            data: null,
            requestId: context.requestId,
            timestamp: Date.now()
        };
    }
};
```

#### 4.4.2 业务异常类

```javascript
// 自定义业务异常
class BusinessError extends Error {
    constructor(code, message, data = null) {
        super(message);
        this.code = code;
        this.data = data;
    }
}

// 使用示例
if (!user) {
    throw new BusinessError(40401, '用户不存在');
}

if (ambassadorLevel < requiredLevel) {
    throw new BusinessError(40302, '推荐人资格不符', {
        currentLevel: ambassadorLevel,
        requiredLevel: requiredLevel
    });
}
```

### 4.5 云函数配置建议

#### 4.5.1 资源配置

| 配置项 | 可选值 | 推荐值 | 说明 |
|-------|-------|-------|------|
| 内存 | 64MB/128MB/256MB/512MB/1024MB/2048MB | 256MB | 根据实际需求调整，复杂业务建议512MB |
| 超时时间 | 1-60s（普通云函数）/1-900s（HTTP云函数） | 30s | 复杂业务可延长至60s |
| 环境变量 | - | - | 存储敏感配置和环境参数 |

#### 4.5.2 环境变量配置

```javascript
// 环境变量配置示例
const ENV_CONFIG = {
    // 数据库配置
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT || 3306,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,

    // 微信配置
    WECHAT_APPID: process.env.WECHAT_APPID,
    WECHAT_SECRET: process.env.WECHAT_SECRET,

    // 业务配置
    ORDER_EXPIRY_MINUTES: parseInt(process.env.ORDER_EXPIRY_MINUTES) || 30,
    REWARD_RATES: JSON.parse(process.env.REWARD_RATES || '{}')
};
```

#### 4.5.3 云函数层管理

```javascript
// 云函数可使用层（Layer）管理依赖
const LAYER_CONFIG = {
    // Node.js常用依赖层
    nodeDependencies: {
        layerName: 'cloudbase-node-dependencies',
        layerVersion: 1
    }
};
```

#### 4.5.4 预置并发配置

```javascript
// 预置并发配置（可选，用于提升冷启动性能）
const PRESET_CONFIG = {
    enabled: true,
    provisionedCount: 1,  // 预置实例数量
    timeout: 300          // 预置超时时间（秒）
};
```

**配置参考**：
- 内存配置：https://docs.cloudbase.net/cloud-function/develop/introduce#资源配置
- 环境变量：https://docs.cloudbase.net/cloud-function/develop/introduce#环境变量
- 层管理：https://docs.cloudbase.net/cloud-function/layer
- 预置并发：https://docs.cloudbase.net/cloud-function/alias

---

## 5. 前端API封装

### 5.1 请求拦截器

#### 5.1.1 请求拦截逻辑

```typescript
// 请求发起前的处理
interface RequestInterceptor {
    onFulfilled: (config) => Promise<config>;
    onRejected: (error) => Promise<error>;
}

// 处理逻辑
{
    // 1. 添加认证令牌
    config.headers.Authorization = `Bearer ${getToken()}`;

    // 2. 添加请求ID
    config.headers['X-Request-ID'] = generateUUID();

    // 3. 添加客户端信息
    config.headers['X-Client-Version'] = getAppVersion();
    config.headers['X-Platform'] = getPlatform();

    // 4. 加载状态显示
    showLoading(config.loading);
}
```

#### 5.1.2 请求配置

```typescript
interface RequestConfig {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: object;        // Query参数
    data?: object;          // Body参数
    loading?: boolean;      // 是否显示加载提示
    timeout?: number;       // 超时时间
    retryCount?: number;    // 重试次数
}
```

### 5.2 响应拦截器

#### 5.2.1 响应处理逻辑

```typescript
interface ResponseInterceptor {
    onFulfilled: (response) => Promise<response>;
    onRejected: (error) => Promise<error>;
}

// 成功处理
if (response.data.code === 0) {
    hideLoading();
    return response.data.data;
}

// 错误处理
switch (response.data.code) {
    case 40101:  // 未登录
        redirectToLogin();
        break;
    case 40102:  // Token过期
        refreshToken();
        break;
    case 40301:  // 无权限
        showToast('无权限操作');
        break;
    default:
        showToast(response.data.message);
}
```

#### 5.2.2 统一错误处理

```typescript
// 错误类型定义
interface ApiError {
    code: number;
    message: string;
    data: any;
    requestId: string;
}

// 全局错误处理
function handleError(error: ApiError) {
    // 1. 记录错误日志
    logError(error);

    // 2. 显示错误提示
    showToast(error.message);

    // 3. 特殊错误处理
    if (error.code === 50001) {
        // 系统错误，可选：自动重试
        retryRequest();
    }
}
```

### 5.3 请求方法封装

#### 5.3.1 基础请求方法

```typescript
// GET 请求
async function get<T>(
    url: string,
    params?: object,
    options?: RequestOptions
): Promise<T> {
    return request({
        method: 'GET',
        url,
        params,
        ...options
    });
}

// POST 请求
async function post<T>(
    url: string,
    data?: object,
    options?: RequestOptions
): Promise<T> {
    return request({
        method: 'POST',
        url,
        data,
        ...options
    });
}

// PUT 请求
async function put<T>(
    url: string,
    data?: object,
    options?: RequestOptions
): Promise<T> {
    return request({
        method: 'PUT',
        url,
        data,
        ...options
    });
}

// DELETE 请求
async function del<T>(
    url: string,
    params?: object,
    options?: RequestOptions
): Promise<T> {
    return request({
        method: 'DELETE',
        url,
        params,
        ...options
    });
}
```

#### 5.3.2 云函数调用方法

```typescript
// 云函数调用
async function callFunction<T>(
    name: string,
    data?: object
): Promise<T> {
    return cloudbase.callFunction({
        name,
        data
    }).then(res => {
        if (res.result.code !== 0) {
            throw new ApiError(res.result);
        }
        return res.result.data;
    });
}

// 使用示例
const userInfo = await callFunction('user_info', { userId: 'user_001' });
```

### 5.4 接口分类管理

#### 5.4.1 API模块划分

```typescript
// api/user.ts - 用户相关接口
export const userApi = {
    login: (code: string, userInfo: object) =>
        callFunction('user_login', { code, userInfo }),

    getProfile: () =>
        callFunction('user_profile'),

    updateProfile: (data: ProfileData) =>
        callFunction('user_update', { data }),

    updateReferee: (refereeId: string) =>
        callFunction('user_update_referee', { refereeId })
};

// api/course.ts - 课程相关接口
export const courseApi = {
    getList: (params: ListParams) =>
        callFunction('course_list', params),

    getDetail: (courseId: string) =>
        callFunction('course_detail', { courseId }),

    getMyCourses: () =>
        callFunction('course_my')
};

// api/order.ts - 订单相关接口
export const orderApi = {
    create: (data: CreateOrderParams) =>
        callFunction('order_create', data),

    getList: (params: ListParams) =>
        callFunction('order_list', params),

    getDetail: (orderId: string) =>
        callFunction('order_detail', { orderId }),

    pay: (orderId: string) =>
        callFunction('order_pay', { orderId })
};

// api/ambassador.ts - 大使相关接口
export const ambassadorApi = {
    getInfo: () =>
        callFunction('ambassador_info'),

    getMeritPoints: (params: ListParams) =>
        callFunction('ambassador_merit_points', params),

    getCashPoints: (params: ListParams) =>
        callFunction('ambassador_cash_points', params),

    getQrcode: () =>
        callFunction('ambassador_qrcode')
};
```

---

## 6. 业务规则校验

### 6.1 推荐人资格验证

#### 6.1.1 验证规则

```typescript
// 推荐人等级要求
const REFERRER_LEVEL_REQUIREMENTS = {
    '初探班': 1,    // 准青鸾及以上
    '密训班': 2,    // 青鸾及以上
    '咨询': 2,      // 青鸾及以上
    '顾问': 2       // 青鸾及以上
};

// 验证函数
async function validateReferee(
    refereeId: string,
    courseType: string
): Promise<ValidationResult> {
    // 1. 检查推荐人是否存在
    const referee = await getUser(refereeId);
    if (!referee) {
        throw new BusinessError(40401, '推荐人不存在');
    }

    // 2. 检查推荐人等级
    const requiredLevel = REFERRER_LEVEL_REQUIREMENTS[courseType];
    if (referee.ambassadorLevel < requiredLevel) {
        throw new BusinessError(40302, '推荐人资格不符', {
            currentLevel: referee.ambassadorLevel,
            requiredLevel: requiredLevel,
            courseType: courseType
        });
    }

    // 3. 特殊规则：准青鸾只能推荐初探班
    if (referee.ambassadorLevel === 1 && courseType !== '初探班') {
        throw new BusinessError(40302, '准青鸾大使只能推荐初探班');
    }

    return { valid: true };
}
```

#### 6.1.2 验证时机

| 场景 | 验证时机 | 说明 |
|-----|---------|------|
| 创建订单 | 订单创建前 | 必须验证通过才能创建 |
| 修改推荐人 | 订单支付前 | 支付前可修改，修改后需重新验证 |
| 用户资料修改 | 修改推荐人时 | 7天内只能修改1次 |

### 6.2 大使等级权限

```typescript
// 大使等级定义
const AMBASSADOR_LEVELS = {
    0: { name: '普通学员', permissions: [] },
    1: { name: '准青鸾', permissions: ['can_refer_basic'] },
    2: { name: '青鸾', permissions: ['can_refer_all', 'can_get_merit'] },
    3: { name: '鸿鹄', permissions: ['can_refer_all', 'can_get_cash'] },
    4: { name: '金凤', permissions: ['can_refer_all', 'can_get_cash_high'] }
};

// 权限检查
function checkPermission(level: number, permission: string): boolean {
    const role = AMBASSADOR_LEVELS[level];
    return role.permissions.includes(permission);
}
```

### 6.3 功德分/积分互斥规则

```typescript
// 功德分和积分互斥 - 推荐奖励只发放一种
async function calculateReward(
    ambassador: User,
    order: Order
): Promise<RewardResult> {
    const { ambassadorLevel, courseType, coursePrice } = order;

    // 互斥规则：功德分和积分不能同时发放
    if (ambassadorLevel >= 3) {
        // 鸿鹄及以上：只发积分
        return {
            meritPoints: 0,
            cashPoints: calculateCashPoints(ambassadorLevel, courseType, coursePrice),
            note: '鸿鹄大使推荐只发放积分'
        };
    } else if (ambassadorLevel === 2) {
        // 青鸾：只发功德分
        return {
            meritPoints: calculateMeritPoints(courseType, coursePrice),
            cashPoints: 0,
            note: '青鸾大使推荐只发放功德分'
        };
    } else {
        // 准青鸾：无奖励
        return {
            meritPoints: 0,
            cashPoints: 0,
            note: '准青鸾大使暂无推荐奖励'
        };
    }
}

// 计算积分（鸿鹄及以上）
function calculateCashPoints(level: number, type: string, price: number): number {
    const rates = {
        '初探班': 0.30,
        '密训班': 0.20,
        '咨询': 0.20,
        '顾问': 0.03
    };
    return Math.floor(price * rates[type]);
}

// 计算功德分（青鸾）
function calculateMeritPoints(type: string, price: number): number {
    const rates = {
        '初探班': 0.30,
        '密训班': 0.20,
        '咨询': 0.20
    };
    return Math.floor(price * rates[type]);
}
```

### 6.4 订单状态流转

```typescript
// 订单状态
const ORDER_STATUS = {
    PENDING: 'pending',       // 待支付
    PAID: 'paid',             // 已支付
    CANCELLED: 'cancelled',   // 已取消
    REFUNDED: 'refunded',     // 已退款
    COMPLETED: 'completed'    // 已完成
};

// 状态流转规则
const STATUS_TRANSITIONS = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PAID]: [ORDER_STATUS.REFUNDED, ORDER_STATUS.COMPLETED],
    [ORDER_STATUS.CANCELLED]: [],  // 终态
    [ORDER_STATUS.REFUNDED]: [],   // 终态
    [ORDER_STATUS.COMPLETED]: []   // 终态
};

// 状态检查
function canTransition(currentStatus: string, newStatus: string): boolean {
    const allowed = STATUS_TRANSITIONS[currentStatus] || [];
    return allowed.includes(newStatus);
}

// 状态流转
async function updateOrderStatus(orderId: string, newStatus: string) {
    const order = await getOrder(orderId);

    if (!canTransition(order.status, newStatus)) {
        throw new BusinessError(40901, '订单状态不允许此操作', {
            currentStatus: order.status,
            targetStatus: newStatus
        });
    }

    // 更新状态
    await updateOrder(orderId, { status: newStatus });

    // 状态变更通知
    if (newStatus === ORDER_STATUS.PAID) {
        await handlePaymentSuccess(order);
    }
}
```

---

## 7. 数据验证

### 7.1 参数必填校验

```typescript
// 必填参数校验
function validateRequired(params: object, requiredFields: string[]): void {
    const missingFields = [];

    for (const field of requiredFields) {
        if (params[field] === undefined || params[field] === null) {
            missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        throw new BusinessError(40002, '缺少必填参数', {
            missingFields
        });
    }
}

// 使用示例
function createOrder(params: CreateOrderParams) {
    validateRequired(params, ['courseId', 'refereeId']);
    // ...
}
```

### 7.2 数据格式校验

```typescript
// 常用校验规则
const VALIDATION_RULES = {
    // 手机号
    phone: {
        pattern: /^1[3-9]\d{9}$/,
        message: '手机号格式不正确'
    },

    // 邮箱
    email: {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: '邮箱格式不正确'
    },

    // 金额（分）
    amount: {
        pattern: /^[1-9]\d*$/,
        message: '金额必须为正整数（单位：分）'
    },

    // 微信OpenID
    openid: {
        pattern: /^o[0-9a-zA-Z\-]{28}$/,
        message: 'OpenID格式不正确'
    },

    // 日期时间
    datetime: {
        pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
        message: '日期时间格式不正确'
    }
};

// 校验函数
function validateField(value: any, rule: string): boolean {
    const validator = VALIDATION_RULES[rule];
    if (!validator) return true;

    if (typeof value === 'string') {
        return validator.pattern.test(value);
    }
    return false;
}

// 综合校验
function validateData(data: object, rules: object): ValidationResult {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
        const value = data[field];

        // 必填检查
        if (rule.required && (value === undefined || value === null || value === '')) {
            errors.push({ field, message: `${field}不能为空` });
            continue;
        }

        // 格式检查
        if (value !== undefined && value !== null && rule.pattern) {
            if (!rule.pattern.test(String(value))) {
                errors.push({ field, message: rule.message });
            }
        }
    }

    if (errors.length > 0) {
        throw new BusinessError(40002, '参数验证失败', { errors });
    }

    return { valid: true };
}
```

### 7.3 边界值处理

```typescript
// 分页边界
function getPaginationParams(page: number, pageSize: number) {
    return {
        page: Math.max(1, page || 1),
        pageSize: Math.min(100, Math.max(1, pageSize || 10)),
        offset: (Math.max(1, page || 1) - 1) * Math.min(100, Math.max(1, pageSize || 10))
    };
}

// 金额边界
function validateAmount(amount: number): number {
    if (amount < 1) {
        throw new BusinessError(40002, '金额必须大于0');
    }
    if (amount > 99999999) {
        throw new BusinessError(40002, '金额超出限制');
    }
    return Math.floor(amount);
}

// 数组边界
function sliceArray<T>(arr: T[], page: number, pageSize: number): T[] {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return arr.slice(start, end);
}
```

---

## 8. 安全规范

### 8.1 敏感数据处理

```typescript
// 需要加密存储的字段
const SENSITIVE_FIELDS = [
    'password',
    'payPassword',
    'phone',
    'idCard'
];

// 敏感字段脱敏
function maskSensitiveData(data: object): object {
    const masked = { ...data };

    // 手机号脱敏：138****8000
    if (masked.phone) {
        masked.phone = masked.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    }

    // 姓名脱敏：张**
    if (masked.realName) {
        masked.realName = masked.realName[0] + '**';
    }

    return masked;
}

// 响应时自动脱敏
function sanitizeResponse(data: object, sensitiveFields: string[]): object {
    const sanitized = { ...data };
    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            delete sanitized[field];
        }
    });
    return sanitized;
}
```

### 8.2 SQL注入防护

```typescript
// 使用参数化查询（CloudBase SDK内置）
const db = cloudbase.database();

// 正确：参数化查询
const res = await db.collection('users')
    .where({
        userId: cloudbase.database().command.eq(userId)  // 安全
    })
    .get();

// 错误：拼接SQL（严禁使用）
// const sql = `SELECT * FROM users WHERE userId = '${userId}'`;  // SQL注入风险
```

### 8.3 XSS防护

```typescript
// 输入过滤
function sanitizeInput(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// 富文本内容需要特殊处理
function sanitizeHtml(html: string): string {
    // 使用专业HTML清理库，如：DOMPurify
    // 此处为简化示例
    const allowedTags = ['p', 'br', 'strong', 'em', 'ul', 'li', 'ol'];
    // ... 实现HTML白名单过滤
}
```

### 8.4 接口防刷限制

```typescript
// 请求频率限制配置
const RATE_LIMITS = {
    // 登录：5次/分钟
    '/api/user/login': { count: 5, window: 60000 },

    // 创建订单：10次/分钟
    '/api/order/create': { count: 10, window: 60000 },

    // 支付：5次/分钟
    '/api/order/pay': { count: 5, window: 60000 },

    // 默认限制：60次/分钟
    default: { count: 60, window: 60000 }
};

// 请求频率检查
async function checkRateLimit(
    userId: string,
    action: string
): Promise<boolean> {
    const limit = RATE_LIMITS[action] || RATE_LIMITS.default;
    const key = `rate_limit:${userId}:${action}`;

    const count = await redis.incr(key);

    if (count === 1) {
        await redis.expire(key, limit.window / 1000);
    }

    if (count > limit.count) {
        throw new BusinessError(42901, '请求过于频繁，请稍后重试');
    }

    return true;
}
```

---

## 9. 日志监控

### 9.1 请求日志记录

```typescript
// 请求日志结构
interface RequestLog {
    requestId: string;
    timestamp: number;
    userId: string;
    method: string;
    url: string;
    params: object;
    responseTime: number;
    statusCode: number;
    success: boolean;
    errorMessage?: string;
}

// 记录请求日志
function logRequest(log: RequestLog): void {
    console.log(JSON.stringify({
        level: 'INFO',
        type: 'REQUEST',
        ...log,
        timestamp: new Date().toISOString()
    }));
}
```

### 9.2 错误日志记录

```typescript
// 错误日志结构
interface ErrorLog {
    requestId: string;
    timestamp: number;
    userId: string;
    errorCode: number;
    errorMessage: string;
    stack?: string;
    context?: object;
}

// 记录错误日志
function logError(log: ErrorLog): void {
    console.error(JSON.stringify({
        level: 'ERROR',
        type: 'ERROR',
        ...log,
        timestamp: new Date().toISOString()
    }));

    // 上报到监控系统（可选）
    // monitor.report(log);
}
```

### 9.3 性能监控指标

```typescript
// 性能指标
interface PerformanceMetrics {
    apiResponseTime: number;      // API响应时间
    databaseQueryTime: number;    // 数据库查询时间
    memoryUsage: number;          // 内存使用
    requestCount: number;         // 请求次数
    errorCount: number;           // 错误次数
}

// 记录性能指标
function recordMetrics(metrics: PerformanceMetrics): void {
    // 云函数日志中输出
    console.log(JSON.stringify({
        level: 'INFO',
        type: 'METRICS',
        ...metrics,
        timestamp: new Date().toISOString()
    }));
}

// 关键性能指标告警
const PERFORMANCE_THRESHOLDS = {
    apiResponseTime: 5000,      // 5秒
    databaseQueryTime: 3000,    // 3秒
    memoryUsage: 256 * 1024 * 1024  // 256MB
};
```

### 9.4 日志级别定义

| 级别 | 说明 | 使用场景 |
|-----|------|---------|
| **DEBUG** | 调试信息 | 开发环境详细日志 |
| **INFO** | 普通信息 | 请求日志、业务流程 |
| **WARN** | 警告信息 | 可恢复的错误、异常情况 |
| **ERROR** | 错误信息 | 系统错误、异常中断 |

---

## 10. 版本管理

### 10.1 API版本控制

```typescript
// URL路径版本控制
// /v1/api/user/login
// /v2/api/user/login

// 云函数版本管理
const API_VERSIONS = {
    v1: {
        releaseDate: '2026-01-21',
        status: 'active',
        deprecatedAt: null
    },
    v2: {
        releaseDate: null,
        status: 'planned',
        deprecatedAt: null
    }
};
```

### 10.2 变更记录

```typescript
// 变更日志结构
interface ChangeLog {
    version: string;
    date: string;
    changes: {
        type: 'added' | 'modified' | 'deprecated' | 'fixed';
        description: string;
        api?: string;
    }[];
}

// 变更日志示例
const CHANGE_LOG = [
    {
        version: '1.0.0',
        date: '2026-01-21',
        changes: [
            { type: 'added', description: '初始版本发布', api: null },
            { type: 'added', description: '用户登录接口', api: '/v1/api/user/login' },
            { type: 'added', description: '课程列表接口', api: '/v1/api/course/list' },
            { type: 'added', description: '订单创建接口', api: '/v1/api/order/create' }
        ]
    }
];
```

### 10.3 废弃接口处理

```typescript
// 废弃接口标记
const DEPRECATED_APIS = {
    '/v1/api/user/old-login': {
        deprecatedAt: '2026-06-01',
        removedAt: '2026-12-01',
        alternative: '/v1/api/user/login',
        message: '旧版登录接口已废弃，请使用新版接口'
    }
};

// 废弃接口响应头
function handleDeprecatedApi(api: string): Response {
    const deprecation = DEPRECATED_APIS[api];

    return {
        code: 41001,
        message: deprecation.message,
        data: {
            deprecated: true,
            alternative: deprecation.alternative,
            deprecatedAt: deprecation.deprecatedAt,
            removedAt: deprecation.removedAt
        },
        headers: {
            'Deprecation': 'true',
            'Sunset': deprecation.removedAt,
            'Link': `<${deprecation.alternative}>; rel="alternate"`
        }
    };
}
```

---

## 11. 接口示例

### 11.1 用户相关接口

#### 11.1.1 微信登录

```json
// 请求
POST /api/user/login
{
    "code": "微信登录code",
    "userInfo": {
        "nickName": "用户昵称",
        "avatarUrl": "https://...",
        "gender": 1
    },
    "refereeId": "推荐人ID（可选）"
}

// 响应
{
    "code": 0,
    "message": "success",
    "data": {
        "token": "用户认证令牌",
        "userId": "user_001",
        "isFirstLogin": true,
        "needCompleteProfile": true
    }
}
```

#### 11.1.2 获取用户信息

```json
// 请求
GET /api/user/info

// 响应
{
    "code": 0,
    "message": "success",
    "data": {
        "userId": "user_001",
        "nickname": "张三",
        "avatarUrl": "https://...",
        "realName": "张**",
        "phone": "138****8000",
        "ambassadorLevel": 2,
        "isRefereeConfirmed": true,
        "createdAt": "2026-01-15T10:30:00Z"
    }
}
```

### 11.2 课程相关接口

#### 11.2.1 课程列表

```json
// 请求
GET /api/course/list
{
    "page": 1,
    "pageSize": 10,
    "filters": {
        "status": "active",
        "type": "初探班"
    },
    "orderBy": "createdAt",
    "orderType": "desc"
}

// 响应
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [
            {
                "courseId": "course_001",
                "courseName": "初探班",
                "courseType": "初探班",
                "price": 168800,
                "description": "国学兵法入门课程",
                "coverImage": "https://...",
                "status": "active",
                "studentCount": 156
            }
        ],
        "pagination": {
            "page": 1,
            "pageSize": 10,
            "total": 5,
            "totalPages": 1
        }
    }
}
```

#### 11.2.2 课程详情

```json
// 请求
GET /api/course/detail
{
    "courseId": "course_001"
}

// 响应
{
    "code": 0,
    "message": "success",
    "data": {
        "courseId": "course_001",
        "courseName": "初探班",
        "courseType": "初探班",
        "price": 168800,
        "originalPrice": 198800,
        "description": "国学兵法入门课程",
        "detail": "<富文本内容>",
        "coverImage": "https://...",
        "lecturer": {
            "name": "讲师名称",
            "title": "讲师职称",
            "avatar": "https://...",
            "intro": "讲师介绍"
        },
        "duration": "3天",
        "status": "active",
        "isPurchased": false,
        "studentCount": 156
    }
}
```

### 11.3 订单相关接口

#### 11.3.1 创建订单

```json
// 请求
POST /api/order/create
{
    "courseId": "course_001",
    "refereeId": "ambassador_001"
}

// 响应
{
    "code": 0,
    "message": "创建成功",
    "data": {
        "orderId": "order_001",
        "orderNo": "TD202601210001",
        "courseId": "course_001",
        "courseName": "初探班",
        "amount": 168800,
        "refereeId": "ambassador_001",
        "refereeName": "大使名称",
        "status": "pending",
        "expiredAt": "2026-01-21T11:30:00Z",
        "createdAt": "2026-01-21T10:30:00Z"
    }
}
```

#### 11.3.2 发起支付

```json
// 请求
POST /api/order/pay
{
    "orderId": "order_001"
}

// 响应
{
    "code": 0,
    "message": "success",
    "data": {
        "orderId": "order_001",
        "paymentParams": {
            "timeStamp": "1706785800",
            "nonceStr": "随机字符串",
            "package": "prepay_id=wx20260121...",
            "signType": "RSA",
            "paySign": "签名"
        }
    }
}
```

### 11.4 大使相关接口

#### 11.4.1 获取大使信息

```json
// 请求
GET /api/ambassador/info

// 响应
{
    "code": 0,
    "message": "success",
    "data": {
        "userId": "ambassador_001",
        "nickname": "大使昵称",
        "avatarUrl": "https://...",
        "ambassadorLevel": 2,
        "levelName": "青鸾大使",
        "meritPoints": 5064,
        "cashPoints": {
            "frozen": 1688,
            "available": 1688,
            "total": 3376
        },
        "recommendCount": {
            "total": 5,
            "firstClass": 3,
            "secondClass": 2
        },
        "contractInfo": {
            "hasSigned": true,
            "signedAt": "2026-01-10T10:00:00Z",
            "expiredAt": "2027-01-10T10:00:00Z"
        }
    }
}
```

#### 11.4.2 功德分明细

```json
// 请求
GET /api/merit-points/records
{
    "page": 1,
    "pageSize": 10,
    "filters": {
        "type": "recommend"  // recommend/activity/exchange
    }
}

// 响应
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [
            {
                "recordId": "mp_001",
                "type": "recommend",
                "amount": 506,
                "description": "推荐学员购买初探班",
                "orderNo": "TD202601210001",
                "createdAt": "2026-01-21T10:30:00Z"
            },
            {
                "recordId": "mp_002",
                "type": "activity",
                "amount": 200,
                "description": "担任辅导员1次",
                "activityId": "activity_001",
                "createdAt": "2026-01-20T15:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "pageSize": 10,
            "total": 15,
            "totalPages": 2
        }
    }
}
```

### 11.5 后台管理接口

#### 11.5.1 课程管理-列表

```json
// 请求
GET /api/admin/course/list
{
    "page": 1,
    "pageSize": 20,
    "filters": {
        "keyword": "初探班",
        "status": "active",
        "courseType": "初探班"
    }
}

// 响应
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [
            {
                "courseId": "course_001",
                "courseName": "初探班",
                "courseType": "初探班",
                "price": 168800,
                "status": "active",
                "studentCount": 156,
                "createdAt": "2026-01-01T10:00:00Z",
                "updatedAt": "2026-01-15T14:30:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "pageSize": 20,
            "total": 5,
            "totalPages": 1
        }
    }
}
```

#### 11.5.2 大使管理-审核

```json
// 请求
POST /api/admin/ambassador/audit
{
    "applicationId": "apply_001",
    "status": "approved",  // approved/rejected
    "remark": "面试通过",
    "interviewTime": "2026-01-25T14:00:00Z"
}

// 响应
{
    "code": 0,
    "message": "审核成功",
    "data": {
        "applicationId": "apply_001",
        "status": "approved",
        "ambassadorId": "ambassador_001"
    }
}
```

---

## 12. 附录

### 12.1 错误码列表

| 分类 | 范围 | 说明 |
|-----|------|------|
| 成功 | 0-9 | 操作成功 |
| 客户端错误 | 40000-49999 | 请求参数或权限问题 |
| 服务端错误 | 50000-59999 | 系统内部错误 |

#### 12.1.1 客户端错误码

| code | message | 说明 |
|-----|---------|------|
| 40001 | 参数验证失败 | 业务参数校验不通过 |
| 40002 | 参数格式错误 | 参数格式不符合要求 |
| 40101 | 未登录 | 用户未认证 |
| 40102 | Token过期 | 认证令牌已过期 |
| 40301 | 无权限 | 没有操作权限 |
| 40302 | 推荐人资格不符 | 推荐人不满足条件 |
| 40401 | 资源不存在 | 请求的资源不存在 |
| 40901 | 资源冲突 | 资源状态不允许操作 |
| 41001 | 资源已废弃 | 接口已废弃 |
| 42901 | 请求过于频繁 | 超过频率限制 |

#### 12.1.2 服务端错误码

| code | message | 说明 |
|-----|---------|------|
| 50001 | 系统错误 | 内部系统错误 |
| 50002 | 服务繁忙 | 系统负载过高 |
| 50003 | 数据库错误 | 数据库操作失败 |
| 50004 | 支付失败 | 支付处理失败 |
| 50005 | 云函数调用失败 | 云函数执行异常 |

### 12.2 状态码对照表

#### 12.2.1 订单状态

| 值 | 说明 |
|---|------|
| pending | 待支付 |
| paid | 已支付 |
| cancelled | 已取消 |
| refunded | 已退款 |
| completed | 已完成 |

#### 12.2.2 大使等级

| 值 | 等级值 | 说明 |
|---|-------|------|
| normal | 0 | 普通学员 |
| junior | 1 | 准青鸾大使 |
| middle | 2 | 青鸾大使 |
| senior | 3 | 鸿鹄大使 |
| superior | 4 | 金凤大使 |

#### 12.2.3 课程类型

| 值 | 说明 |
|---|------|
| first_class | 初探班 |
| second_class | 密训班 |
| consultation | 咨询 |
| advisor | 顾问 |

### 12.3 参考文档

| 文档 | 链接 |
|------|------|
| 腾讯云CloudBase云函数-快速开始 | https://docs.cloudbase.net/cloud-function/quick-start |
| 腾讯云CloudBase云函数-开发指南 | https://docs.cloudbase.net/cloud-function/develop/introduce |
| 腾讯云CloudBase云函数-编写指南 | https://docs.cloudbase.net/cloud-function/how-coding |
| 腾讯云CloudBase云函数-测试指南 | https://docs.cloudbase.net/cloud-function/develop/how-test |
| 腾讯云CloudBase云函数-日志调试 | https://docs.cloudbase.net/cloud-function/debugging/log |
| 腾讯云CloudBase云函数-监控 | https://docs.cloudbase.net/cloud-function/debugging/monitor |
| 腾讯云CloudBase云函数-定时触发器 | https://docs.cloudbase.net/cloud-function/timer-trigger |
| 腾讯云CloudBase云函数-灰度发布 | https://docs.cloudbase.net/cloud-function/gray-release |
| 腾讯云CloudBase云函数-层管理 | https://docs.cloudbase.net/cloud-function/layer |
| 腾讯云CloudBase云函数-预置并发 | https://docs.cloudbase.net/cloud-function/alias |
| 腾讯云CloudBase认证授权 | https://docs.cloudbase.net/authentication-v2/auth/introduce |
| 腾讯云CloudBase数据库 | https://docs.cloudbase.net/database/introduce |
| 腾讯云CloudBase云存储 | https://docs.cloudbase.net/storage/introduce |
| 需求规则概述文档 | reference/requirements-rules.md |
| 详细需求文档 | 需求文档-V2.md |

---

## 文档版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| V1.0 | 2026-01-21 | 初始版本，定义API前后端调用规则 |
