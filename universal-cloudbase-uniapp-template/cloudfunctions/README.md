# 天道文化小程序 - 云函数开发规范

> **版本**: V2.0  
> **更新时间**: 2026-02-04  
> **CloudBase 环境**: cloud1-0gnn3mn17b581124  
> **架构模式**: 模块优先（单函数多路由，通过 action 参数区分操作）

---

## 📋 目录

1. [云函数架构](#1-云函数架构)
2. [环境配置](#2-环境配置)
3. [快速开始](#3-快速开始)
4. [目录结构](#4-目录结构)
5. [开发规范](#5-开发规范)
6. [公共层使用](#6-公共层使用)
7. [云存储架构](#7-云存储架构)
8. [代码示例](#8-代码示例)
9. [执行流程](#9-执行流程)
10. [注意事项](#10-注意事项)
11. [定时任务配置](#11-定时任务配置)
12. [HTTP云函数与回调接口](#12-http云函数与回调接口)
13. [参考资料](#13-参考资料)

---

## ⚠️ 重要说明

**本文档仅关注云函数代码编写和文件夹架构设计。**

✅ **需要做的：**
- 编写云函数代码（index.js）
- 配置云函数设置（config.json）
- 管理依赖（package.json）
- 组织文件夹结构
- 实现业务逻辑

❌ **不需要做的：**
- 部署操作（通过控制台代码包上传）
- CLI 工具使用
- 手动创建Layer
- 在线调试和日志查看

**开发流程：**
1. 按照规范编写云函数代码
2. 组织好文件夹结构
3. 本地测试验证代码逻辑
4. 打包整个 `cloudfunctions/` 目录
5. 通过控制台上传代码包完成部署

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
│  - 公共工具层（common）: 数据库+权限+响应+工具                │
│  - 业务逻辑层（business-logic）: 积分+支付+通知+订单          │
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

🔧 2个公共层（代码复用）
├── layers/common/         # 公共工具层（数据库+权限+响应+验证+工具函数）
└── layers/business-logic/ # 业务逻辑层（配置+积分+大使+支付+通知+订单）
```

**架构优势：**

1. ✅ **函数数量少**：5个核心函数，易于管理
2. ✅ **冷启动概率低**：函数调用频率高，实例长期保持热启动
3. ✅ **权限控制灵活**：通过 `action` 前缀（public:/client:/admin:）区分权限
4. ✅ **业务逻辑集中**：同一模块的代码在一个函数中，便于维护
5. ✅ **代码复用性高**:公开接口、用户接口、管理接口可共享逻辑

---

## 2. 环境配置

### 2.1 统一配置说明

所有云函数共享以下环境变量配置，在每个云函数的 `config.json` 文件中配置：

#### 2.1.1 数据库配置（必需）

| 配置项 | 值 | 说明 |
|-------|---|------|
| MYSQL_HOST | `gz-cynosdbmysql-grp-2xaxm80c.sql.tencentcdb.com` | MySQL数据库主机地址 |
| MYSQL_PORT | `22483` | MySQL数据库端口 |
| MYSQL_USER | `root` | 数据库用户名 |
| MYSQL_PASSWORD | `空` | 数据库密码（当前无密码） |
| MYSQL_DATABASE | `tiandao_db` | 数据库名称 |

#### 2.1.2 微信小程序配置（必需）

| 配置项 | 值 | 说明 |
|-------|---|------|
| WECHAT_APPID | `wx26753b179de5c25c` | 小程序AppID |
| WECHAT_APP_SECRET | **1cb66fd3f66540f6d003fbcb77695e7a** | 小程序密钥 |

**获取方法：**
1. 登录 https://mp.weixin.qq.com/
2. "开发 → 开发管理 → 开发设置 → 开发者ID"
3. 点击"AppSecret(小程序密钥)"右侧的"重置"
4. 验证身份后获取密钥（仅显示一次，请立即保存）

#### 2.1.3 微信消息推送配置（callbacks云函数必需）

| 配置项 | 值 | 说明 |
|-------|---|------|
| WECHAT_TOKEN | `tiandao_wechat_2026` | 微信消息推送Token |
| WECHAT_ENCODING_AES_KEY | `abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG` | 消息加密密钥（43位） |

#### 2.1.4 微信支付配置（order云函数必需）

| 配置项 | 值 | 说明 |
|-------|---|------|
| MCH_ID | `1710089873` | 微信商户号 |
| MCH_KEY | `e6f4c2a8b1d5973820fedcba56789012` | 商户密钥 v2 |
| MCH_API_V3_KEY | `Kj8mP2nQ5rT9wX3yZ6aB4cD7eF0gH1iL` | 商户密钥 v3 |

⚠️ **注意**：正式上线前请替换为微信支付商户平台的真实密钥

#### 2.1.5 管理员登录配置（system云函数必需）

| 配置项 | 值 | 说明 |
|-------|---|------|
| JWT_SECRET | `td2026_jwt_secret_key_a8f3e9d2c7b6541890fedcba12345678_secure` | JWT令牌密钥（64位） |

#### 2.1.6 完整配置示例

```json
{
  "permissions": {
    "openapi": [
      "wxpay.unifiedOrder",
      "wxpay.refund",
      "subscribeMessage.send"
    ]
  },
  "layers": [
    {
      "name": "common_cloud1-0gnn3mn17b581124",
      "version": "v2"
    },
    {
      "name": "business-logic_cloud1-0gnn3mn17b581124",
      "version": "v1"
    }
  ],
  "envVariables": {
    "MYSQL_HOST": "gz-cynosdbmysql-grp-2xaxm80c.sql.tencentcdb.com",
    "MYSQL_PORT": "22483",
    "MYSQL_USER": "root",
    "MYSQL_PASSWORD": "",
    "MYSQL_DATABASE": "tiandao_db",
    "WECHAT_APPID": "wx26753b179de5c25c",
    "WECHAT_APP_SECRET": "1cb66fd3f66540f6d003fbcb77695e7a",
    "WECHAT_TOKEN": "tiandao_wechat_2026",
    "WECHAT_ENCODING_AES_KEY": "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
    "MCH_ID": "1710089873",
    "MCH_KEY": "e6f4c2a8b1d5973820fedcba56789012",
    "MCH_API_V3_KEY": "Kj8mP2nQ5rT9wX3yZ6aB4cD7eF0gH1iL",
    "JWT_SECRET": "td2026_jwt_secret_key_a8f3e9d2c7b6541890fedcba12345678_secure"
  }
}
```

**说明：**
- 所有云函数共享相同的数据库配置
- 不同云函数根据需要使用不同的配置项：
  - `callbacks` 云函数：需要消息推送配置
  - `order` 云函数：需要微信支付配置
  - `system` 云函数：需要JWT配置
  - 其他云函数：只需数据库和小程序基础配置

---

## 3. 快速开始

### 3.1 编写第一个云函数

#### 步骤 1: 创建云函数目录

在 `cloudfunctions/` 目录下创建新的函数目录：

```
cloudfunctions/
└── user/              # 新建用户模块云函数
    ├── index.js       # 主入口文件
    ├── config.json    # 配置文件
    └── package.json   # 依赖管理
```

#### 步骤 2: 创建 package.json

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

#### 步骤 3: 创建 index.js

```javascript
const cloud = require('wx-server-sdk');
cloud.init();

const { query, successResponse, errorResponse } = require('common');

exports.main = async (event, context) => {
  const { action, ...params } = event;
  const { OPENID } = cloud.getWXContext();
  
  console.log('收到请求:', { action, openid: OPENID });
  
  try {
    // 根据 action 路由
    if (action === 'client:getProfile') {
      const [user] = await query(
        'SELECT * FROM users WHERE _openid = ?',
        [OPENID]
      );
      return successResponse(user);
    }
    
    throw new Error(`未知操作: ${action}`);
    
  } catch (error) {
    console.error('执行错误:', error);
    return errorResponse(error.message, error);
  }
}
```

#### 步骤 4: 创建 config.json

```json
{
  "permissions": {
    "openapi": []
  },
  "triggers": [],
  "layers": [
    {
      "name": "common_cloud1-0gnn3mn17b581124",
      "version": "v2"
    },
    {
      "name": "business-logic_cloud1-0gnn3mn17b581124",
      "version": "v1"
    }
  ],
  "envVariables": {
    "MYSQL_HOST": "your-db-host",
    "MYSQL_PORT": "3306",
    "MYSQL_USER": "root",
    "MYSQL_PASSWORD": "your-password",
    "MYSQL_DATABASE": "tiandao_db"
  }
}
```

**注意：** 环境变量也可以在控制台配置，不一定要写在 config.json 中。

#### 步骤 5: 本地测试（可选）

创建 `test.js` 进行本地测试:

```javascript
// test.js
const main = require('./index').main;

// 模拟 cloud.getWXContext()
global.cloud = {
  getWXContext: () => ({ OPENID: 'test-openid-123' })
};

// 模拟 event
const event = {
  action: 'client:getProfile'
};

main(event, {})
  .then(result => {
    console.log('✅ 执行成功:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('❌ 执行失败:', error);
  });
```

运行测试:

```bash
cd cloudfunctions/user
npm install
node test.js
```

### 3.2 完整的文件夹架构

开发完成后，你的 `cloudfunctions/` 目录结构应该如下：

```
cloudfunctions/
├── user/                      # 用户模块云函数
│   ├── index.js
│   ├── config.json
│   ├── package.json
│   ├── node_modules/          # npm install 后生成
│   └── test.js                # 可选：本地测试文件
│
├── course/                    # 课程模块云函数
│   ├── index.js
│   ├── config.json
│   ├── package.json
│   └── node_modules/
│
├── order/                     # 订单模块云函数
│   ├── index.js
│   ├── config.json
│   ├── package.json
│   └── node_modules/
│
└── layers/                    # 公共层目录
    ├── common/                # 公共工具层
    │   ├── nodejs/            # ⚠️ 必须是 nodejs 目录
    │   │   ├── index.js       # 入口文件
    │   │   ├── db.js          # 数据库模块
    │   │   ├── auth.js        # 权限验证模块
    │   │   ├── response.js    # 响应格式模块
    │   │   ├── utils.js       # 工具函数模块
    │   │   ├── package.json
    │   │   └── node_modules/
    │   └── README.md          # 层说明文档（完整项目中存在）
    │
    └── business-logic/        # 业务逻辑层
        ├── nodejs/
        │   ├── index.js       # 入口文件
        │   ├── config.js      # 配置管理
        │   ├── points.js      # 积分计算
        │   ├── ambassador.js  # 大使管理
        │   ├── payment.js     # 微信支付
        │   ├── notification.js # 消息通知
        │   ├── order.js       # 订单处理
        │   ├── package.json
        │   └── node_modules/
        └── README.md          # 层说明文档（完整项目中存在）
```

**Layer 目录结构说明：**

Layer 必须包含 `nodejs/` 目录，这个目录会被挂载到云函数的 `/opt/` 路径：

```
layers/common/
└── nodejs/                    # ⚠️ 固定目录名，不能修改
    ├── index.js               # 入口文件，导出所有模块
    ├── db.js                  # 数据库操作模块
    ├── auth.js                # 权限验证模块
    ├── response.js            # 响应格式模块
    ├── utils.js               # 工具函数模块
    ├── package.json           # 依赖配置
    └── node_modules/          # npm install 后生成
        ├── mysql2/            # 数据库驱动
        └── @cloudbase/node-sdk/ # CloudBase SDK
```

在云函数中引用:

```javascript
// 会从 /opt/ 目录加载
const common = require('common');  // 对应 layers/common/nodejs/index.js
const { db, auth, response, utils } = require('common');
```

### 3.3 开发完成后的打包

完成开发后，整个 `cloudfunctions/` 目录作为一个完整的代码包：

```bash
# 确保所有函数都已安装依赖
cd cloudfunctions/user && npm install
cd ../course && npm install
cd ../order && npm install

# Layer 也需要安装依赖
cd ../layers/common/nodejs && npm install
cd ../../business-logic/nodejs && npm install

# 整个 cloudfunctions 目录就是完整的代码包
# 通过控制台"本地上传文件夹"方式部署
```

### 3.4 config.json 配置说明

```json
{
  // 云 API 权限（调用其他云服务时需要）
  "permissions": {
    "openapi": [
      "wx.wxPayUnifiedOrder",  // 微信支付
      "wx.sendUniformMessage"  // 消息推送
    ]
  },
  
  // 定时触发器（如需定时任务）
  "triggers": [
    {
      "name": "dailyTask",
      "type": "timer",
      "config": "0 0 2 * * * *"  // 每天凌晨2点执行
    }
  ],
  
  // 环境变量（数据库配置等）
  "envVariables": {
    "MYSQL_HOST": "sh-xxx.sql.tencentcdb.com",
    "MYSQL_PORT": "3306",
    "MYSQL_USER": "root",
    "MYSQL_PASSWORD": "your-password",
    "MYSQL_DATABASE": "tiandao_db"
  },
  
  // 超时时间（秒，最大60）
  "timeout": 20,
  
  // 运行时版本（推荐 Nodejs16.13）
  "runtime": "Nodejs16.13",
  
  // 内存大小（MB：128/256/512/1024/2048）
  "memorySize": 256,
  
  // 关联的 Layer
  "layers": [
    {
      "name": "common_cloud1-0gnn3mn17b581124",
      "version": "v2"
    },
    {
      "name": "business-logic_cloud1-0gnn3mn17b581124",
      "version": "v1"
    }
  ]
}
```

---

## 4. 目录结构

### 4.1 推荐结构（含完整 Action 列表）

```
cloudfunctions/                                        # 云函数根目录
│
├── user/                                              # 【用户模块云函数】17个action
│   ├── index.js                                       # 主入口
│   ├── config.json                                    # 层配置 + 环境变量
│   └── package.json                                   # 依赖配置
│       #
│       # ── client（需登录）──────────────────────────
│       # client:login                  微信登录/注册
│       # client:getProfile             获取个人资料
│       # client:updateProfile          更新个人资料（姓名、手机、城市等）
│       # client:updateReferee          修改推荐人（7天限1次）
│       # client:getMyCourses           获取我的课程列表
│       # client:getMyOrders            获取我的订单列表（只读视图）
│       # client:getMeritPoints         获取功德分余额和统计
│       # client:getMeritPointsHistory  功德分明细记录
│       # client:getCashPoints          获取积分余额（可用/冻结/提现中）
│       # client:getCashPointsHistory   积分明细记录
│       # client:applyWithdraw          申请积分提现
│       # client:getWithdrawRecords     提现记录列表
│       # client:getMyReferees          获取我推荐的用户列表
│       #
│       # ── admin（需管理员权限）─────────────────────
│       # admin:getUserList             学员管理 - 列表（支持搜索/筛选）
│       # admin:getUserDetail           学员管理 - 详情（含购买记录/推荐关系）
│       # admin:updateUserReferee       学员管理 - 修改推荐人（记录变更日志）
│       # admin:getRefereeChangeLogs    推荐人变更审计日志
│
├── course/                                            # 【课程模块云函数】34个action
│   ├── index.js
│   ├── config.json
│   └── package.json
│       #
│       # ── public（无需登录）─────────────────────────
│       # public:getList                课程列表（支持按类型筛选）
│       # public:getDetail              课程详情
│       # public:getCaseList            案例列表
│       # public:getCaseDetail          案例详情
│       # public:getMaterialList        资料列表
│       # public:getAcademyList         商学院内容列表
│       # public:getAcademyDetail       商学院内容详情
│       #
│       # ── client（需登录）──────────────────────────
│       # client:getClassRecords        获取上课排期/时间表
│       # client:createAppointment      创建课程预约
│       # client:cancelAppointment      取消预约
│       # client:getMyAppointments      我的预约列表
│       # client:checkin                签到（扫码/手动）
│       # client:recordAcademyProgress  记录商学院学习进度
│       # client:getAcademyProgress     获取商学院学习进度
│       #
│       # ── admin（需管理员权限）─────────────────────
│       # admin:createCourse            创建课程
│       # admin:updateCourse            更新课程
│       # admin:deleteCourse            删除课程
│       # admin:getCourseList           管理端课程列表
│       # admin:createClassRecord       创建上课排期
│       # admin:updateClassRecord       更新上课排期
│       # admin:deleteClassRecord       删除上课排期
│       # admin:getClassRecordList      排期管理列表
│       # admin:getAppointmentList      预约管理列表
│       # admin:updateAppointmentStatus 更新预约状态（确认/拒绝）
│       # admin:batchCheckin            批量签到
│       # admin:createCase              创建案例
│       # admin:updateCase              更新案例
│       # admin:deleteCase              删除案例
│       # admin:createMaterial          创建资料
│       # admin:updateMaterial          更新资料
│       # admin:deleteMaterial          删除资料
│       # admin:createAcademyContent    创建商学院内容
│       # admin:updateAcademyContent    更新商学院内容
│       # admin:deleteAcademyContent    删除商学院内容
│
├── order/                                             # 【订单模块云函数】13个action
│   ├── index.js
│   ├── config.json                                    # ⚠️ 需配置微信支付权限
│   └── package.json
│       #
│       # ── public（无需登录）─────────────────────────
│       # public:paymentCallback        微信支付回调（验签+解密+更新订单+发奖励）
│       #
│       # ── client（需登录）──────────────────────────
│       # client:create                 创建订单（课程/升级/复训）
│       # client:createPayment          创建支付（调用微信统一下单）
│       # client:getDetail              订单详情
│       # client:getList                我的订单列表
│       # client:cancel                 取消订单（30分钟超时自动关闭）
│       # client:getMallGoods           商城商品列表（功德分兑换）
│       # client:exchangeGoods          功德分兑换商品（事务：扣分+减库存+记录）
│       # client:getExchangeRecords     兑换记录列表
│       #
│       # ── admin（需管理员权限）─────────────────────
│       # admin:getOrderList            订单管理列表
│       # admin:getOrderDetail          订单管理详情
│       # admin:refund                  订单退款（调用微信退款API）
│       # admin:withdrawAudit           积分提现审核（通过/拒绝）
│
├── ambassador/                                        # 【大使模块云函数】26个action
│   ├── index.js
│   ├── config.json
│   └── package.json
│       #
│       # ── client（需登录）──────────────────────────
│       # client:apply                  申请成为大使
│       # client:getApplicationStatus   查询申请状态
│       # client:upgrade                大使升级（支付类型/协议类型）
│       # client:getUpgradeGuide        获取升级指南（条件+进度）
│       # client:generateQRCode         生成推广二维码（调用 business.generateAmbassadorQRCode）
│       # client:getMyQuotas            查看我的名额（初探班/密训班）
│       # client:giftQuota              赠送名额给用户
│       # client:getContractTemplate    获取协议模板（填充用户变量）
│       # client:signContract           签署协议（记录IP/设备/快照）
│       # client:getMyContracts         我的协议列表
│       # client:getContractDetail      协议详情
│       #
│       # ── admin（需管理员权限）─────────────────────
│       # admin:getApplicationList      大使申请列表（待审核/待面试/已通过/已拒绝）
│       # admin:auditApplication        审核申请（通过/拒绝/安排面试）
│       # admin:getAmbassadorList       大使管理列表
│       # admin:getAmbassadorDetail     大使详情（含积分/推荐/活动/订单）
│       # admin:createActivity          添加活动记录（辅导员/义工/沙龙）
│       # admin:getActivityList         活动记录列表
│       # admin:updateActivity          更新活动记录
│       # admin:deleteActivity          删除活动记录（回退已发功德分）
│       # admin:createContractTemplate  创建协议模板
│       # admin:updateContractTemplate  更新协议模板
│       # admin:deleteContractTemplate  删除协议模板
│       # admin:getContractTemplateList 协议模板列表
│       # admin:getContractVersions     协议版本历史
│       # admin:getSignatureList        签署记录管理
│       # admin:getExpiringContracts    协议到期提醒列表
│       # admin:renewContract           手动续签协议
│
├── system/                                            # 【系统模块云函数】28个action
│   ├── index.js
│   ├── config.json
│   └── package.json
│       #
│       # ── client（需登录）──────────────────────────
│       # client:getFeedbackCourses     获取可反馈的课程列表
│       # client:getFeedbackTypes       获取反馈类型
│       # client:submitFeedback         提交反馈（支持图片）
│       # client:getMyFeedback          我的反馈列表
│       # client:getNotificationConfigs 获取消息配置
│       # client:subscribeNotification  订阅消息授权
│       #
│       # ── admin（需管理员权限）─────────────────────
│       # admin:login                   管理员登录（JWT token）
│       # admin:getConfig               获取系统配置
│       # admin:updateConfig            更新系统配置
│       # admin:getAmbassadorLevelConfigs   获取大使等级配置列表（积分比例/冻结金额/名额等）
│       # admin:updateAmbassadorLevelConfig 更新大使等级配置（修改后刷新缓存）
│       # admin:initAmbassadorLevelConfigs  初始化大使等级配置数据（首次部署用）
│       # admin:getStatistics           统计分析仪表盘
│       # admin:getFeedbackList         反馈管理列表
│       # admin:replyFeedback           反馈回复
│       # admin:createNotificationConfig 创建消息配置
│       # admin:updateNotificationConfig 更新消息配置
│       # admin:getNotificationConfigList 消息配置列表
│       # admin:getNotificationLogs     消息发送记录
│       # admin:sendNotification        手动发送订阅消息（批量）
│       # admin:createAnnouncement      创建通知公告
│       # admin:updateAnnouncement      更新通知公告
│       # admin:deleteAnnouncement      删除通知公告
│       # admin:getAnnouncementList     通知公告列表
│       # admin:createAdminUser         创建后台管理员
│       # admin:updateAdminUser         更新后台管理员
│       # admin:deleteAdminUser         删除后台管理员
│       # admin:getAdminUserList        后台管理员列表
│
└── layers/                                            # 【公共层目录】（共享代码）
    │
    ├── common/                                        # 公共工具层
    │   ├── nodejs/
    │   │   ├── index.js                               # 入口文件（导出所有模块）
    │   │   ├── db.js                                  # 数据库连接池和操作
    │   │   ├── auth.js                                # 权限验证模块
    │   │   ├── response.js                            # 统一响应格式
    │   │   ├── utils.js                               # 通用工具函数
    │   │   ├── package.json                           # 依赖: mysql2, @cloudbase/node-sdk
    │   │   └── node_modules/
    │   └── README.md                                  # 📖 SDK文档（完整项目路径：../../cloudfunctions/layers/common/README.md）
    │
    └── business-logic/                                # 业务逻辑层
        ├── nodejs/
        │   ├── index.js                               # 入口文件（导出所有模块）
        │   ├── config.js                              # 配置管理
        │   ├── points.js                              # 积分计算
        │   ├── ambassador.js                          # 大使管理
        │   ├── payment.js                             # 微信支付
        │   ├── notification.js                        # 消息通知
        │   ├── order.js                               # 订单处理
        │   ├── package.json                           # 依赖: wx-server-sdk
        │   └── node_modules/
        └── README.md                                  # 📖 SDK文档（完整项目路径：../../cloudfunctions/layers/business-logic/README.md）
```

> **📊 Action 统计：** 共 115+ 个 action（user:17 + course:34 + order:13 + ambassador:26 + system:25+）  
> **📖 公共层 SDK 文档：**（完整项目中存在，模板中不包含）  
> - [common 层](layers/common/README.md) - 数据库、权限、响应、工具函数（v2）  
> - [business-logic 层](layers/business-logic/README.md) - 配置、积分、大使、支付、通知、订单（v1）

### 4.2 文件说明

#### 4.2.1 云函数文件

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

#### 4.2.2 层文件

层的文件会被挂载到 `/opt` 目录，在云函数中通过 `require('/opt/...')` 引用。

---

## 5. 开发规范

### 5.1 Action 命名规范

**格式：`{namespace}:{operation}`**

#### 4.1.1 Namespace（权限命名空间）

| Namespace | 说明 | 权限要求 | 使用场景 |
|-----------|-----|---------|---------|
| `public` | 公开接口 | 无需登录 | 课程列表、公告列表等 |
| `client` | 客户端接口 | 需要登录（普通用户） | 我的课程、我的订单等 |
| `admin` | 管理端接口 | 需要管理员权限 | 用户管理、数据统计等 |

#### 4.1.2 Operation（操作类型）

| 前缀 | 说明 | 示例 |
|-----|------|------|
| `get*` | 查询操作 | getList, getDetail, getMyCourses |
| `create*` | 创建操作 | create, createOrder |
| `update*` | 更新操作 | update, updateProfile |
| `delete*` | 删除操作 | delete, deleteUser |
| 动词 | 其他操作 | apply, approve, pay, cancel |

#### 4.1.3 命名示例

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

### 4.2 权限验证规范

#### 4.2.1 获取用户身份

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

#### 4.2.2 权限检查流程

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

### 4.3 数据库操作规范

#### 4.3.1 自动注入 _openid

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

#### 4.3.2 管理员操作

```javascript
// ✅ 推荐：管理员可以查询所有数据，但需要先验证权限
const admin = await checkAdminAuth(OPENID);

const allUsers = await db.query(
  'SELECT * FROM users WHERE role = ?',
  ['ambassador']
);
```

### 4.4 响应格式规范

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

**统一错误码规范：**

| 错误码 | 说明 | 场景 | 示例 |
|-------|------|------|------|
| 0 | 成功 | 操作成功 | `{ code: 0, success: true }` |
| 400 | 参数错误 | 必填参数缺失、参数格式错误 | `{ code: 400, message: '缺少必填参数: courseId' }` |
| 401 | 未授权 | 缺少openid或未登录 | `{ code: 401, message: '请先登录' }` |
| 403 | 权限不足 | 非管理员访问管理接口 | `{ code: 403, message: '权限不足' }` |
| 404 | 资源不存在 | 查询数据不存在 | `{ code: 404, message: '课程不存在' }` |
| 409 | 冲突 | 数据已存在、状态冲突 | `{ code: 409, message: '订单已支付' }` |
| 500 | 服务器错误 | 数据库异常、代码错误 | `{ code: 500, message: '服务器内部错误' }` |

**使用层中的响应工具：**

```javascript
const { successResponse, errorResponse } = require('/opt/common-utils');

// 成功（默认 code 0）
return successResponse(data, '操作成功');

// 失败（带错误码）
return errorResponse('参数错误', error, 400);
return errorResponse('权限不足', null, 403);
return errorResponse('资源不存在', null, 404);
```

---

## 5. 公共层使用

### 5.1 层架构概述

本项目使用 **2个公共层** 实现代码复用和功能封装：

| 层名称 | 版本 | 功能模块 | 主要用途 | 文档链接 |
|--------|------|----------|----------|----------|
| **common** | v2 | db + auth + response + utils | 数据库操作、权限验证、响应格式化、工具函数 | [📖 完整文档](layers/common/README.md)（完整项目中存在） |
| **business-logic** | v1 | config + points + ambassador + payment + notification + order | 配置管理、积分计算、大使管理、微信支付、消息通知、订单处理 | [📖 完整文档](layers/business-logic/README.md)（完整项目中存在） |

**层的依赖关系：**
```
business-logic (v1)
  └─ 依赖 common (v2)
      ├─ mysql2
      └─ @cloudbase/node-sdk
```

**层的作用：**

**层（Layer）** 是云函数的代码共享机制，可以将依赖库、公共代码文件等资源独立管理，实现多个函数间的代码复用。

**优势：**
- ✅ 减小部署包体积
- ✅ 提高开发效率（公共代码只需维护一份）
- ✅ 支持在线编辑（代码包 < 10MB）
- ✅ 版本管理（层支持版本控制）
- ✅ 模块化设计（common 基础层 + business-logic 业务层）

### 5.2 引用层

层中的文件会被挂载到 `/opt` 目录：

```javascript
// 引用 common 层（数据库+权限+响应+工具）
const { query, insert, update, checkClientAuth, checkAdminAuth, successResponse, errorResponse } = require('common');

// 或者模块化引用
const { db, auth, response, utils } = require('common');
const users = await db.query('SELECT * FROM users WHERE _openid = ?', [openid]);
const user = await auth.checkClientAuth(openid);

// 引用 business-logic 层（需要先初始化）
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const business = require('business-logic');
business.init(cloud); // ⚠️ 必须初始化后才能使用支付和消息功能
```

### 5.3 common 层（公共工具）

**快速预览：**

```javascript
const { db, auth, response, utils } = require('common');
// 或者直接解构所需的函数
const { query, insert, update, checkClientAuth, checkAdminAuth, successResponse, errorResponse, validateRequired, getPagination } = require('common');

// 数据库操作
const users = await db.query('SELECT * FROM users WHERE _openid = ?', [openid]);
await db.insert('INSERT INTO orders (...) VALUES (?, ...)', [openid, ...]);
await db.update('UPDATE users SET name = ? WHERE _openid = ?', [name, openid]);

// 权限验证
const user = await auth.checkClientAuth(openid);       // client:* action 必须调用
const admin = await auth.checkAdminAuth(openid);        // admin:* action 必须调用

// 标准响应
return response.success(data, '操作成功');
return response.error('参数错误', null, 400);

// 参数校验
const err = utils.validateRequired(params, ['courseId', 'date']);
if (err) return response.error(err, null, 400);

// 分页
const { offset, limit } = utils.getPagination(page, pageSize);

// 工具函数
const orderNo = utils.generateOrderNo('ORD');
const maskedPhone = utils.maskPhone('13800138000'); // '138****8000'
```

> 📖 **完整 API 文档** → [`layers/common/README.md`](layers/common/README.md)（完整项目路径：`../../cloudfunctions/layers/common/README.md`）

### 5.4 business-logic 层（业务逻辑）

**快速预览：**

```javascript
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const business = require('business-logic')
business.init(cloud) // ⚠️ 必须初始化

// 配置管理
const config = await business.config.getConfig('course_price');

// 积分计算
const points = await business.points.calculatePoints('payment', 5980);
await business.points.addPoints(userId, points, 'payment', orderId);

// 大使管理
const level = await business.ambassador.checkAmbassadorLevel(userId);
await business.ambassador.upgradeAmbassador(userId, 'honghu');

// 微信支付
const payParams = await business.payment.unifiedOrder({
  userId,
  orderId,
  totalFee: 598000, // 单位：分
  body: '初探班课程'
});

// 订单管理
const order = await business.order.createOrder({
  userId,
  courseId,
  type: 'course',
  totalAmount: 5980
});

// 消息通知
await business.notification.sendMessage({
  touser: openid,
  templateId: 'TEMPLATE_ID',
  data: { thing1: { value: '订单已支付' } }
});
```

> 📖 **完整 API 文档** → [`layers/business-logic/README.md`](layers/business-logic/README.md)（完整项目路径：`../../cloudfunctions/layers/business-logic/README.md`）

---

## 6. 云存储架构

### 6.1 云存储目录结构

项目使用 CloudBase 云存储管理所有文件资源，采用统一的目录结构和命名规范：

```
cloud://cloud1-0gnn3mn17b581124/
│
├── users/avatars/              # 用户头像
├── courses/covers/             # 课程封面
├── courses/content/{id}/       # 课程详情图片
├── academy/cases/              # 学员案例（头像/图片/视频）
├── academy/materials/          # 朋友圈素材（海报/视频）
├── announcements/covers/       # 公告封面
├── feedbacks/images/           # 反馈图片
├── mall/goods/                 # 商品图片
└── admin/avatars/              # 管理员头像
```

> 📖 **完整云存储架构文档** → [`cloud-storage-architecture.md`](./cloud-storage-architecture.md)

### 6.2 数据库字段映射

| 表名 | 字段名 | 云存储路径 | 文件类型 |
|-----|-------|-----------|---------|
| users | avatar | `users/avatars/{uid}_{timestamp}.{ext}` | 图片 |
| courses | cover_image | `courses/covers/{course_id}_{timestamp}.{ext}` | 图片 |
| courses | content | `courses/content/{course_id}/` | 图片（富文本） |
| academy_intro | cover_image | `academy/intro/covers/{intro_id}_{timestamp}.{ext}` | 图片 |
| academy_cases | student_avatar | `academy/cases/avatars/{case_id}_{timestamp}.{ext}` | 图片 |
| academy_cases | video_url | `academy/cases/videos/{case_id}_{timestamp}.mp4` | 视频 |
| academy_cases | images | `academy/cases/images/{case_id}/` | 图片（JSON数组） |
| academy_materials | image_url | `academy/materials/{category}/{material_id}_{timestamp}.{ext}` | 图片 |
| academy_materials | video_url | `academy/materials/videos/{material_id}_{timestamp}.mp4` | 视频 |
| announcements | cover_image | `announcements/covers/{announcement_id}_{timestamp}.{ext}` | 图片 |
| feedbacks | images | `feedbacks/images/{feedback_id}/` | 图片（JSON数组） |
| mall_goods | goods_image | `mall/goods/{goods_id}_{timestamp}.{ext}` | 图片 |
| admin_users | avatar | `admin/avatars/{admin_id}_{timestamp}.{ext}` | 图片 |

### 6.3 文件命名规范

**基础格式：`{业务标识}_{时间戳}.{扩展名}`**

```javascript
// 生成云存储文件路径工具函数
function generateCloudPath(category, id, ext) {
  const timestamp = Date.now();
  return `${category}/${id}_${timestamp}.${ext}`;
}

// 使用示例
generateCloudPath('users/avatars', userId, 'jpg')
// 返回: users/avatars/123_1707123456789.jpg

generateCloudPath('courses/covers', courseId, 'webp')
// 返回: courses/covers/1_1707123456789.webp
```

### 6.4 云存储 SDK 使用

#### 6.4.1 前端上传文件

```javascript
// 小程序端上传用户头像
async uploadAvatar() {
  try {
    // 1. 选择图片
    const [err, res] = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    });
    
    if (err) throw err;
    
    const tempFilePath = res.tempFilePaths[0];
    
    // 2. 调用云函数上传
    const result = await uniCloud.callFunction({
      name: 'user',
      data: {
        action: 'client:uploadAvatar',
        tempFilePath
      }
    });
    
    const avatarUrl = result.result.data.fileID;
    
    // 3. 更新用户资料
    await uniCloud.callFunction({
      name: 'user',
      data: {
        action: 'client:updateProfile',
        avatar: avatarUrl
      }
    });
    
    uni.showToast({ title: '头像上传成功' });
    
  } catch (error) {
    console.error('上传失败:', error);
    uni.showToast({ title: '上传失败', icon: 'none' });
  }
}
```

#### 6.4.2 云函数处理上传

```javascript
// cloudfunctions/user/index.js
case 'client:uploadAvatar': {
  const { tempFilePath } = params;
  
  // 1. 获取用户信息
  const [user] = await query(
    'SELECT id, uid FROM users WHERE _openid = ?',
    [OPENID]
  );
  
  // 2. 生成云存储路径
  const ext = tempFilePath.split('.').pop();
  const cloudPath = `users/avatars/${user.uid}_${Date.now()}.${ext}`;
  
  // 3. 上传到云存储
  const uploadResult = await cloud.uploadFile({
    cloudPath,
    fileContent: tempFilePath
  });
  
  // 4. 更新数据库
  await update(
    'UPDATE users SET avatar = ? WHERE _openid = ?',
    [uploadResult.fileID, OPENID]
  );
  
  return successResponse({
    fileID: uploadResult.fileID,
    cloudPath
  });
}
```

#### 6.4.3 获取临时下载链接

```javascript
// 获取单个文件临时URL
async function getTempFileURL(fileID) {
  const result = await cloud.getTempFileURL({
    fileList: [fileID]
  });
  return result.fileList[0].tempFileURL;
}

// 批量获取临时URL
async function getBatchTempFileURLs(fileIDs) {
  const result = await cloud.getTempFileURL({
    fileList: fileIDs.map(id => ({ fileID: id }))
  });
  return result.fileList.map(item => ({
    fileID: item.fileID,
    tempFileURL: item.tempFileURL
  }));
}
```

### 6.5 安全规则配置

| 路径模式 | 读权限 | 写权限 | 说明 |
|---------|-------|-------|------|
| `/users/avatars/{uid}_*` | 公开 | 仅本人 | 用户只能修改自己的头像 |
| `/courses/**` | 公开 | 仅管理员 | 课程文件公开读取 |
| `/academy/**` | 公开/需登录 | 仅管理员 | 部分需大使权限 |
| `/announcements/**` | 公开 | 仅管理员 | 公告文件公开读取 |
| `/feedbacks/images/**` | 私有 | 仅本人 | 反馈图片仅用户和管理员可见 |
| `/mall/**` | 公开 | 仅管理员 | 商城图片公开读取 |
| `/admin/**` | 私有 | 仅管理员 | 后台文件仅管理员访问 |

### 6.6 最佳实践

#### 6.6.1 文件大小限制

| 文件类型 | 推荐大小 | 最大限制 |
|---------|---------|---------|
| 用户头像 | < 500KB | 2MB |
| 课程封面 | < 1MB | 3MB |
| 反馈图片 | < 2MB | 5MB |
| 案例视频 | < 50MB | 100MB |

#### 6.6.2 图片压缩

```javascript
// 前端上传前压缩
async compressAndUpload(tempFilePath) {
  const compressed = await uni.compressImage({
    src: tempFilePath,
    quality: 80,
    compressedWidth: 1080
  });
  
  return await uploadFile(compressed.tempFilePath);
}
```

#### 6.6.3 批量上传优化

```javascript
// 批量上传反馈图片（最多5个并发）
async function uploadFeedbackImages(tempFilePaths, feedbackId) {
  const uploadPromises = tempFilePaths.map((path, index) => {
    const ext = path.split('.').pop();
    const cloudPath = `feedbacks/images/${feedbackId}/img${index + 1}_${Date.now()}.${ext}`;
    
    return cloud.uploadFile({ cloudPath, fileContent: path });
  });
  
  // 并发上传（最多5个）
  const results = [];
  for (let i = 0; i < uploadPromises.length; i += 5) {
    const batch = uploadPromises.slice(i, i + 5);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  
  return results.map(r => r.fileID);
}
```

---

## 7. 代码示例

> ⚠️ **说明：** 本章仅提供云函数的**基础代码模板**，展示标准的入口结构和路由模式。  
> 各公共层的完整 API 用法请参阅对应的 SDK 文档（完整项目中存在）：
> - [`layers/common/README.md`](layers/common/README.md) - 数据库操作、权限验证、响应格式化、参数校验、工具函数
> - [`layers/business-logic/README.md`](layers/business-logic/README.md) - 配置管理、积分计算、大使管理、微信支付、消息通知、订单处理

### 6.1 云函数基础模板（含 public/client/admin 三种路由）

```javascript
// cloudfunctions/{模块名}/index.js
const cloud = require('wx-server-sdk');
cloud.init();

const { 
  query, 
  insert, 
  update, 
  transaction,
  checkClientAuth, 
  checkAdminAuth, 
  successResponse, 
  errorResponse,
  validateRequired,
  getPagination
} = require('common');

const business = require('business-logic');
business.init(cloud); // ⚠️ 如需使用支付和消息功能，必须初始化

exports.main = async (event, context) => {
  const { action, ...params } = event;
  const { OPENID } = cloud.getWXContext();
  
  try {
    // ==================== 公开路由（无需登录） ====================
    if (action.startsWith('public:')) {
      return await handlePublicRequest(action, params);
    }
    
    // ==================== 客户端路由（需登录） ====================
    if (action.startsWith('client:')) {
      return await handleClientRequest(OPENID, action, params);
    }
    
    // ==================== 管理端路由（需管理员） ====================
    if (action.startsWith('admin:')) {
      return await handleAdminRequest(OPENID, action, params);
    }
    
    throw new Error(`未知操作: ${action}`);
    
  } catch (error) {
    console.error(`[${action}] 云函数执行错误:`, error);
    return errorResponse(error.message, error, error.code || 500);
  }
};

// ==================== 公开请求处理 ====================
async function handlePublicRequest(action, params) {
  switch (action) {
    case 'public:getList': {
      const { page, pageSize, type } = params;
      const { offset, limit } = getPagination(page, pageSize);
      
      let sql = 'SELECT * FROM courses WHERE status = 1 AND deleted_at IS NULL';
      const sqlParams = [];
      
      if (type) {
        sql += ' AND type = ?';
        sqlParams.push(type);
      }
      
      sql += ' ORDER BY sort_order ASC LIMIT ? OFFSET ?';
      sqlParams.push(limit, offset);
      
      const list = await query(sql, sqlParams);
      const [{ total }] = await query(
        'SELECT COUNT(*) as total FROM courses WHERE status = 1 AND deleted_at IS NULL' + (type ? ' AND type = ?' : ''),
        type ? [type] : []
      );
      
      return successResponse({ total, page, pageSize, list });
    }
    
    default:
      throw new Error(`未知的公开操作: ${action}`);
  }
}

// ==================== 客户端请求处理 ====================
async function handleClientRequest(openid, action, params) {
  const user = await checkClientAuth(openid);  // ⚠️ 必须：验证用户身份
  
  switch (action) {
    case 'client:getProfile': {
      return successResponse(user);
    }
    
    case 'client:updateProfile': {
      const err = validateRequired(params, ['realName', 'phone']);
      if (err) return errorResponse(err, null, 400);
      
      await update(
        'UPDATE users SET real_name = ?, phone = ?, city = ?, profile_completed = 1 WHERE _openid = ?',
        [params.realName, params.phone, params.city || '', openid]
      );
      return successResponse(null, '更新成功');
    }
    
    default:
      throw new Error(`未知的客户端操作: ${action}`);
  }
}

// ==================== 管理端请求处理 ====================
async function handleAdminRequest(openid, action, params) {
  const admin = await checkAdminAuth(openid);  // ⚠️ 必须：验证管理员权限
  
  switch (action) {
    case 'admin:getUserList': {
      const { page, pageSize, keyword } = params;
      const { offset, limit } = getPagination(page, pageSize);
      
      let sql = 'SELECT * FROM users WHERE deleted_at IS NULL';
      const sqlParams = [];
      
      if (keyword) {
        sql += ' AND (real_name LIKE ? OR phone LIKE ?)';
        sqlParams.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      sqlParams.push(limit, offset);
      
      const list = await query(sql, sqlParams);
      return successResponse({ list });
    }
    
    default:
      throw new Error(`未知的管理端操作: ${action}`);
  }
}
```

### 6.2 config.json 配置模板

```json
{
  "permissions": {
    "openapi": [
      "wxpay.unifiedOrder",
      "wxpay.refund",
      "subscribeMessage.send"
    ]
  },
  "layers": [
    { 
      "name": "common_cloud1-0gnn3mn17b581124", 
      "version": "v2" 
    },
    { 
      "name": "business-logic_cloud1-0gnn3mn17b581124", 
      "version": "v1" 
    }
  ],
  "envVariables": {
    "MYSQL_HOST": "xxx",
    "MYSQL_PORT": "3306",
    "MYSQL_USER": "xxx",
    "MYSQL_PASSWORD": "xxx",
    "MYSQL_DATABASE": "xxx",
    "MCH_ID": "微信商户号（仅 order 函数需要）",
    "MCH_KEY": "商户API密钥（仅 order 函数需要）"
  }
}
```

### 6.3 前端调用示例

```javascript
// 小程序端调用（uni-app / wx.cloud）
// 方式一：uni-app
const result = await uniCloud.callFunction({
  name: 'user',
  data: { action: 'client:getProfile' }
});
const user = result.result.data;

// 方式二：wx.cloud
const result = await wx.cloud.callFunction({
  name: 'course',
  data: { action: 'public:getList', type: 'basic', page: 1, pageSize: 10 }
});
const { total, list } = result.result.data;

// 带参数的调用
const result = await wx.cloud.callFunction({
  name: 'order',
  data: { 
    action: 'client:create',
    courseId: 1,
    orderType: 'course',
    amount: 1688
  }
});

// 管理端调用（需管理员身份）
const result = await wx.cloud.callFunction({
  name: 'system',
  data: { action: 'admin:getStatistics' }
});
```

---

## 7. 执行流程

### 7.1 云函数开发流程

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

### 7.2 云函数执行流程

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

### 7.3 数据库操作流程

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

## 8. 注意事项

### 8.1 安全注意事项

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

### 8.2 性能注意事项

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

### 8.3 开发注意事项

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

### 8.4 层（Layer）注意事项

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

## 10. 定时任务配置

### 10.1 定时触发器概述

CloudBase 云函数支持定时触发器（Timer Trigger），可用于：
- 订单超时检查
- 合约到期提醒
- 临时文件清理
- 数据统计汇总
- 定时消息推送

### 10.2 配置方式

在云函数目录下的 `config.json` 文件中配置 `triggers` 数组：

```json
{
  "triggers": [
    {
      "name": "触发器名称",
      "type": "timer",
      "config": "Cron表达式"
    }
  ]
}
```

### 10.3 Cron 表达式格式

CloudBase 使用 **7字段 Cron 表达式**（秒 分 时 日 月 周 年）：

```
┌───────────── 秒 (0 - 59)
│ ┌───────────── 分钟 (0 - 59)
│ │ ┌───────────── 小时 (0 - 23)
│ │ │ ┌───────────── 日期 (1 - 31)
│ │ │ │ ┌───────────── 月份 (1 - 12)
│ │ │ │ │ ┌───────────── 星期 (0 - 6，0=周日)
│ │ │ │ │ │ ┌───────────── 年份 (可选)
│ │ │ │ │ │ │
* * * * * * *
```

**特殊字符**：
- `*` 任意值
- `,` 枚举值（如 `1,3,5`）
- `-` 范围值（如 `1-5`）
- `/` 步长值（如 `*/5` 表示每5个单位）

### 10.4 常用示例

```json
// cloudfunctions/system/config.json
{
  "triggers": [
    {
      "name": "orderExpireCheck",
      "type": "timer",
      "config": "0 */5 * * * * *"  // 每5分钟执行一次
    },
    {
      "name": "contractExpireRemind",
      "type": "timer",
      "config": "0 0 9 * * * *"     // 每天9:00执行
    },
    {
      "name": "tempFileCleanup",
      "type": "timer",
      "config": "0 0 2 * * * *"     // 每天凌晨2:00执行
    },
    {
      "name": "weeklyReport",
      "type": "timer",
      "config": "0 0 10 * * 1 *"    // 每周一10:00执行
    },
    {
      "name": "monthlyReport",
      "type": "timer",
      "config": "0 0 0 1 * * *"     // 每月1号0:00执行
    }
  ]
}
```

### 10.5 实现示例

#### 订单超时检查（每5分钟）

```javascript
// cloudfunctions/system/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  // 判断是否为定时触发器调用
  if (event.TriggerName === 'orderExpireCheck') {
    return await handleOrderExpireCheck();
  }

  // 其他action处理...
};

/**
 * 订单超时检查
 * 关闭创建后30分钟未支付的订单
 */
async function handleOrderExpireCheck() {
  const { query, update } = require('/opt/db-utils');
  
  try {
    // 1. 查询超时订单（30分钟未支付）
    const expiredOrders = await query(
      `SELECT id, order_no, user_id 
       FROM orders 
       WHERE pay_status = 0 
       AND order_status = 1 
       AND created_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
       LIMIT 100`
    );

    console.log(`发现 ${expiredOrders.length} 个超时订单`);

    // 2. 批量关闭订单
    for (const order of expiredOrders) {
      await update(
        'UPDATE orders SET order_status = 4 WHERE id = ?',
        [order.id]
      );

      // 3. 如果使用了名额，归还名额
      const [orderDetail] = await query(
        'SELECT quota_id FROM orders WHERE id = ?',
        [order.id]
      );

      if (orderDetail.quota_id) {
        await update(
          'UPDATE ambassador_quotas SET remaining_quantity = remaining_quantity + 1 WHERE id = ?',
          [orderDetail.quota_id]
        );
      }

      console.log(`订单 ${order.order_no} 已自动关闭`);
    }

    return {
      success: true,
      message: `处理了 ${expiredOrders.length} 个超时订单`
    };
  } catch (error) {
    console.error('订单超时检查失败:', error);
    return { success: false, error: error.message };
  }
}
```

#### 合约到期提醒（每天9:00）

```javascript
// cloudfunctions/system/index.js
const { sendSubscribeMessage } = require('/opt/business-logic');

/**
 * 合约到期提醒
 * 提前7天提醒大使合约即将到期
 */
async function handleContractExpireRemind() {
  const { query } = require('/opt/db-utils');
  
  try {
    // 1. 查询7天后到期的合约
    const expiringContracts = await query(
      `SELECT u.id, u.openid, u.realname, u.ambassador_level, c.end_date
       FROM users u
       LEFT JOIN ambassador_contracts c ON u.id = c.user_id
       WHERE u.ambassador_level > 0
       AND c.status = 1
       AND c.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       LIMIT 100`
    );

    console.log(`发现 ${expiringContracts.length} 份即将到期的合约`);

    // 2. 发送订阅消息提醒
    for (const contract of expiringContracts) {
      try {
        await sendSubscribeMessage(
          contract.openid,
          'TEMPLATE_CONTRACT_EXPIRE_REMIND',
          {
            thing1: { value: `${contract.realname}的大使合约` },
            date2: { value: contract.end_date },
            thing3: { value: '请及时续签合约' }
          },
          'pages/ambassador/contract/index'
        );

        console.log(`已发送提醒给用户 ${contract.id}`);
      } catch (error) {
        console.error(`发送消息失败（用户 ${contract.id}）:`, error);
      }
    }

    return {
      success: true,
      message: `发送了 ${expiringContracts.length} 条提醒`
    };
  } catch (error) {
    console.error('合约到期提醒失败:', error);
    return { success: false, error: error.message };
  }
}
```

### 10.6 注意事项

1. **触发器数量限制**：每个云函数最多支持 10 个触发器
2. **触发器名称规范**：支持 `a-z`、`A-Z`、`0-9`、`-`、`_`，最多60字符
3. **执行超时**：定时触发器也受云函数超时限制（最大900秒）
4. **并发控制**：避免定时任务执行时间过长导致下次触发时仍未完成
5. **错误处理**：定时任务应有完善的错误处理和日志记录
6. **幂等性**：确保定时任务可以安全地重复执行
7. **监控告警**：建议配置云函数监控，及时发现定时任务异常

### 10.7 部署触发器

通过控制台上传代码包后，触发器会自动生效。可在控制台查看触发器配置和执行日志：

```
https://tcb.cloud.tencent.com/dev?envId={envId}#/scf/detail?id={functionName}
```

---

## 11. HTTP云函数与回调接口

### 11.1 架构概述

**为什么使用HTTP云函数处理回调接口？**

本项目采用**单个HTTP云函数**统一管理所有第三方回调接口（消息推送、支付回调等），而不是为每个回调创建独立的云函数。

#### 11.1.1 架构对比

| 架构方案 | 优势 | 劣势 | 适用场景 |
|---------|------|------|---------|
| **单HTTP云函数** ✅ | • 统一管理所有回调<br>• 共享中间件（验签/日志/限流）<br>• 函数数量少，冷启动概率低<br>• 路由清晰，便于维护 | • 单函数故障影响所有回调<br>• 需要实现内部路由逻辑 | **本项目采用**<br>回调接口数量可控（<10个） |
| 多个独立云函数 | • 故障隔离<br>• 独立扩缩容 | • 函数数量多，管理复杂<br>• 代码重复（验签/日志）<br>• 冷启动概率高<br>• 配置分散 | 回调接口数量多（>20个）<br>且性能要求差异大 |

**本项目选择"单HTTP云函数"方案的理由：**

1. ✅ **符合现有架构**：与"模块优先架构"（单函数多路由）保持一致
2. ✅ **回调数量可控**：预计回调接口 < 10 个（支付/消息推送/退款/用户信息授权等）
3. ✅ **代码复用性高**：统一的验签、日志、错误处理逻辑
4. ✅ **维护成本低**：只需管理一个函数的部署、监控和日志
5. ✅ **冷启动优化**：高频回调（如支付）可保持函数热启动状态

#### 11.1.2 推荐的目录结构

```
cloudfunctions/
├── callbacks/                    # 【HTTP云函数】统一回调入口
│   ├── index.js                  # 主入口：路由分发
│   ├── config.json               # HTTP触发器配置
│   ├── package.json              # 依赖配置
│   ├── routes/                   # 回调路由模块
│   │   ├── message-push.js       # 消息推送回调
│   │   ├── payment.js            # 支付回调
│   │   ├── refund.js             # 退款回调
│   │   └── user-info.js          # 用户信息授权回调
│   └── middleware/               # 中间件
│       ├── verify.js             # 验签中间件
│       ├── logger.js             # 日志中间件
│       └── rate-limit.js         # 限流中间件
```

### 11.2 HTTP云函数配置

#### 11.2.1 创建HTTP云函数

在控制台创建云函数时，选择"HTTP触发"方式：

```json
// cloudfunctions/callbacks/config.json
{
  "triggers": [
    {
      "name": "http-trigger",
      "type": "http",
      "config": {
        "path": "/callbacks",      // 基础路径
        "method": "ALL",            // 支持所有HTTP方法
        "authRequired": false       // 不需要CloudBase身份验证（由业务层验签）
      }
    }
  ],
  "layers": [
    {
      "name": "common_cloud1-0gnn3mn17b581124",
      "version": "v2"
    },
    {
      "name": "business-logic_cloud1-0gnn3mn17b581124",
      "version": "v1"
    }
  ],
  "envVariables": {
    "MYSQL_HOST": "gz-cynosdbmysql-grp-2xaxm80c.sql.tencentcdb.com",
    "MYSQL_PORT": "22483",
    "MYSQL_USER": "root",
    "MYSQL_PASSWORD": "",
    "MYSQL_DATABASE": "tiandao_db",
    "WECHAT_APPID": "wx26753b179de5c25c",
    "WECHAT_APP_SECRET": "1cb66fd3f66540f6d003fbcb77695e7a",
    "WECHAT_TOKEN": "tiandao_wechat_2026",
    "WECHAT_ENCODING_AES_KEY": "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
    "MCH_ID": "1710089873",
    "MCH_KEY": "e6f4c2a8b1d5973820fedcba56789012",
    "MCH_API_V3_KEY": "Kj8mP2nQ5rT9wX3yZ6aB4cD7eF0gH1iL",
    "JWT_SECRET": "td2026_jwt_secret_key_a8f3e9d2c7b6541890fedcba12345678_secure"
  }
}
```

#### 11.2.2 package.json 配置

```json
{
  "name": "callbacks",
  "version": "1.0.0",
  "description": "统一回调处理HTTP云函数",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest",
    "crypto": "latest",
    "xml2js": "^0.6.2"
  }
}
```

#### 11.2.3 获取HTTP访问地址

部署后，在控制台"云函数详情 → 触发器"中获取HTTP访问地址：

```
基础URL: https://xxx-xxxx.service.tcloudbase.com/callbacks
```

**🔔 重要说明：路径匹配机制**

HTTP云函数支持**路径参数**，可以在同一域名下通过不同路径区分不同回调：

| 回调类型 | 配置的URL | 在函数中的 event.path |
|---------|----------|---------------------|
| 基础路径 | `https://xxx.com/callbacks` | `/callbacks` |
| 消息推送 | `https://xxx.com/callbacks/message-push` | `/callbacks/message-push` |
| 支付回调 | `https://xxx.com/callbacks/payment` | `/callbacks/payment` |
| 退款回调 | `https://xxx.com/callbacks/refund` | `/callbacks/refund` |

**关键点：**
- ✅ 配置 `path: "/callbacks"` 后，所有以 `/callbacks` 开头的路径都会路由到这个函数
- ✅ 通过 `event.path` 可以获取完整的请求路径
- ✅ 使用 `path.endsWith()` 进行路径匹配，实现内部路由分发
- ✅ 不同的第三方平台可以配置不同的回调URL，但都指向同一个云函数

**路径匹配流程图：**

```
外部请求                              云函数内部路由
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

微信消息推送
https://xxx.com/callbacks/message-push
                    ↓
              CloudBase 路由
                    ↓
         callbacks 云函数 (单个)
                    ↓
          event.path = "/callbacks/message-push"
                    ↓
    if (path.endsWith('/message-push'))  ✅匹配
                    ↓
         routes/message-push.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

微信支付回调
https://xxx.com/callbacks/payment
                    ↓
              CloudBase 路由
                    ↓
         callbacks 云函数 (同一个)
                    ↓
          event.path = "/callbacks/payment"
                    ↓
    if (path.endsWith('/payment'))  ✅匹配
                    ↓
         routes/payment.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

微信退款回调
https://xxx.com/callbacks/refund
                    ↓
              CloudBase 路由
                    ↓
         callbacks 云函数 (同一个)
                    ↓
          event.path = "/callbacks/refund"
                    ↓
    if (path.endsWith('/refund'))  ✅匹配
                    ↓
         routes/refund.js
```

**为什么这样设计不会冲突？**

1. **不同的URL路径** → 微信平台、支付平台各自配置不同的URL
2. **相同的云函数** → CloudBase将所有 `/callbacks/*` 的请求路由到同一个函数
3. **函数内部分发** → 通过 `event.path` 判断，分发到不同的处理模块
4. **模块独立处理** → 每个模块有自己的验签、业务逻辑，互不影响

### 11.3 微信小程序消息推送

#### 11.3.1 配置说明

微信小程序消息推送需要在微信公众平台配置服务器地址，用于接收订阅消息推送事件。配置完成后，云函数会自动接收并处理微信服务器推送的事件通知。

#### 11.3.2 订阅消息推送事件

本项目主要使用**订阅消息推送能力**，微信服务器会推送以下事件：

| 事件类型 | Event | 说明 | 用途 |
|---------|-------|------|------|
| 订阅消息发送成功 | subscribe_msg_sent_event | 订阅消息成功送达用户 | 更新发送状态为成功 |
| 用户拒绝订阅 | subscribe_msg_popup_event | 用户点击拒绝接收订阅消息 | 记录拒绝状态，优化引导文案 |

#### 11.3.3 推送参数说明

微信服务器推送的事件数据（JSON格式）：

```javascript
{
  "ToUserName": "gh_xxxxxxxxxxxx",           // 小程序原始ID
  "FromUserName": "oMgHVjngRipVsoxxx",        // 用户OpenID
  "CreateTime": 1707123456,                   // 消息创建时间（Unix时间戳）
  "MsgType": "event",                         // 消息类型（固定为 event）
  "Event": "subscribe_msg_sent_event",        // 事件类型
  "SubscribeMsgSentEvent": {                  // 事件详情
    "List": [
      {
        "TemplateId": "xxx",                  // 模板ID
        "MsgId": "123456",                    // 消息ID
        "ErrorCode": 0,                       // 错误码（0=成功）
        "ErrorStatus": "success"              // 发送状态
      }
    ]
  }
}
```

**重要字段说明：**

| 字段 | 类型 | 说明 | 示例 |
|------|-----|------|------|
| ToUserName | String | 小程序原始ID | gh_xxxxxxxxxxxx |
| FromUserName | String | 用户OpenID | oMgHVjngRipVsoxxx |
| CreateTime | Number | 事件创建时间（Unix时间戳，秒） | 1707123456 |
| Event | String | 事件类型 | subscribe_msg_sent_event |
| TemplateId | String | 订阅消息模板ID | xxx |
| MsgId | String | 消息ID | 123456 |
| ErrorCode | Number | 错误码（0=成功，其他=失败） | 0 |
| ErrorStatus | String | 发送状态 | success/failed |

### 11.4 实现示例

#### 11.4.1 主入口文件（路由分发）

```javascript
// cloudfunctions/callbacks/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 导入路由模块
const messagePush = require('./routes/message-push');
const payment = require('./routes/payment');
const refund = require('./routes/refund');

// 导入中间件
const { verifyWechatSignature } = require('./middleware/verify');
const { logRequest } = require('./middleware/logger');

exports.main = async (event, context) => {
  try {
    // 1. 解析HTTP请求（event对象结构说明）
    const { 
      path,                    // 请求路径，如 "/callbacks/message-push"
      httpMethod,              // HTTP方法，如 "GET", "POST"
      queryStringParameters,   // URL查询参数，如 { signature: "xxx", timestamp: "123" }
      body,                    // 请求体（JSON字符串或原始数据）
      headers,                 // 请求头，如 { "content-type": "application/json" }
      isBase64Encoded          // body是否为Base64编码
    } = event;
    
    // 2. 日志记录（记录关键信息）
    console.log('收到回调请求:', {
      path,
      method: httpMethod,
      query: queryStringParameters,
      contentType: headers['content-type']
    });
    
    // 3. 路由分发（通过路径后缀匹配）
    if (path.endsWith('/message-push')) {
      // 消息推送回调
      // 配置URL: https://xxx.com/callbacks/message-push
      return await messagePush.handler(event, context);
    }
    
    if (path.endsWith('/payment')) {
      // 支付回调
      // 配置URL: https://xxx.com/callbacks/payment
      return await payment.handler(event, context);
    }
    
    if (path.endsWith('/refund')) {
      // 退款回调
      // 配置URL: https://xxx.com/callbacks/refund
      return await refund.handler(event, context);
    }
    
    // 未知路径
    console.warn('未知的回调路径:', path);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not Found' })
    };
    
  } catch (error) {
    console.error('回调处理失败:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
```

**HTTP云函数的 event 对象结构：**

```javascript
{
  // 请求路径（完整路径，包含基础路径）
  "path": "/callbacks/message-push",
  
  // HTTP方法
  "httpMethod": "POST",
  
  // URL查询参数（GET请求）
  "queryStringParameters": {
    "signature": "xxx",
    "timestamp": "1707123456",
    "nonce": "xxx",
    "echostr": "test"
  },
  
  // 请求体（POST请求）
  "body": "{\"ToUserName\":\"gh_xxx\",\"FromUserName\":\"oMgHV...\"}",
  
  // 请求头
  "headers": {
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0",
    "x-forwarded-for": "183.xx.xx.xx"
  },
  
  // body是否为Base64编码
  "isBase64Encoded": false,
  
  // 其他信息
  "requestContext": {
    "requestId": "xxx-xxx-xxx",
    "sourceIp": "183.xx.xx.xx"
  }
}
```

#### 11.4.2 消息推送处理模块

```javascript
// cloudfunctions/callbacks/routes/message-push.js
const crypto = require('crypto');
const { query, insert } = require('common');

/**
 * 微信消息推送处理器
 */
exports.handler = async (event, context) => {
  try {
    const { httpMethod, queryStringParameters, body } = event;
    
    // ==================== GET 请求：接入验证 ====================
    if (httpMethod === 'GET') {
      return handleVerification(queryStringParameters);
    }
    
    // ==================== POST 请求：接收消息 ====================
    if (httpMethod === 'POST') {
      return await handleMessage(body);
    }
    
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
    
  } catch (error) {
    console.error('消息推送处理失败:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error'
    };
  }
};

/**
 * 处理微信接入验证（GET请求）
 */
function handleVerification(query) {
  const { signature, timestamp, nonce, echostr } = query;
  const token = process.env.WECHAT_TOKEN;
  
  // 1. 将 token、timestamp、nonce 三个参数进行字典序排序
  const arr = [token, timestamp, nonce].sort();
  
  // 2. 将三个参数字符串拼接成一个字符串进行sha1加密
  const sha1 = crypto.createHash('sha1');
  sha1.update(arr.join(''));
  const result = sha1.digest('hex');
  
  // 3. 验证签名
  if (result === signature) {
    console.log('✅ 微信消息推送接入验证成功');
    return {
      statusCode: 200,
      body: echostr  // 原样返回echostr参数
    };
  } else {
    console.error('❌ 微信消息推送验证失败');
    return {
      statusCode: 403,
      body: 'Forbidden'
    };
  }
}

/**
 * 处理接收到的消息（POST请求）
 * 主要处理订阅消息推送事件
 */
async function handleMessage(body) {
  try {
    // 解析消息内容（JSON格式）
    const message = typeof body === 'string' ? JSON.parse(body) : body;
    
    console.log('收到消息推送:', message);
    
    const { ToUserName, FromUserName, CreateTime, MsgType, Event } = message;
    
    // 仅处理事件类型的消息（订阅消息推送）
    if (MsgType !== 'event') {
      console.log('非事件消息，忽略:', MsgType);
      return { statusCode: 200, body: 'success' };
    }
    
    // 处理订阅消息相关事件
    await handleSubscribeMessageEvent(message);
    
    // 返回成功（微信要求返回"success"字符串）
    return {
      statusCode: 200,
      body: 'success'
    };
    
  } catch (error) {
    console.error('消息处理失败:', error);
    
    // ⚠️ 即使处理失败，也要返回 success，避免微信重复推送
    return {
      statusCode: 200,
      body: 'success'
    };
  }
}

/**
 * 处理订阅消息事件
 */
async function handleSubscribeMessageEvent(message) {
  const { Event, FromUserName, SubscribeMsgSentEvent, SubscribeMsgPopupEvent } = message;
  const { update } = require('common');
  
  switch (Event) {
    case 'subscribe_msg_sent_event':
      // 订阅消息发送成功
      console.log(`订阅消息发送成功: ${FromUserName}`);
      
      if (SubscribeMsgSentEvent && SubscribeMsgSentEvent.List) {
        for (const item of SubscribeMsgSentEvent.List) {
          const { TemplateId, MsgId, ErrorCode } = item;
          
          // 更新发送记录状态
          await update(
            `UPDATE subscription_message_logs 
             SET send_status = ?, event_type = ?, event_time = NOW() 
             WHERE openid = ? AND template_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
             ORDER BY created_at DESC LIMIT 1`,
            [ErrorCode === 0 ? 1 : 2, Event, FromUserName, TemplateId]
          );
          
          console.log(`✅ 已更新消息发送状态: MsgId=${MsgId}, ErrorCode=${ErrorCode}`);
        }
      }
      break;
    
    case 'subscribe_msg_popup_event':
      // 用户拒绝订阅消息
      console.log(`用户拒绝订阅消息: ${FromUserName}`);
      
      if (SubscribeMsgPopupEvent) {
        const { TemplateId } = SubscribeMsgPopupEvent;
        
        // 记录用户拒绝状态
        await update(
          `UPDATE subscription_message_logs 
           SET send_status = 2, fail_reason = '用户拒绝订阅', event_type = ?, event_time = NOW() 
           WHERE openid = ? AND template_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
           ORDER BY created_at DESC LIMIT 1`,
          [Event, FromUserName, TemplateId]
        );
        
        console.log(`⚠️ 用户拒绝订阅消息: TemplateId=${TemplateId}`);
      }
      break;
    
    default:
      console.log('未知事件类型:', Event);
  }
}
```

#### 11.4.3 数据库说明

需要创建 `subscription_message_logs` 表来记录订阅消息发送状态（建表SQL请联系开发人员获取）。

**表结构说明：**
- 记录每次订阅消息的发送请求
- 通过微信回调更新实际发送状态（成功/失败）
- 用于消息统计和问题排查

### 11.5 测试验证

#### 11.5.1 测试接入验证

使用Postman或curl测试GET请求（微信验证服务器地址）：

```bash
curl "https://xxx-xxxx.service.tcloudbase.com/callbacks/message-push?signature=xxx&timestamp=123456&nonce=xxx&echostr=test"
```

**预期返回：** `test`（原样返回echostr）

#### 11.5.2 测试订阅消息回调

模拟微信发送订阅消息成功回调：

```bash
curl -X POST "https://xxx-xxxx.service.tcloudbase.com/callbacks/message-push" \
  -H "Content-Type: application/json" \
  -d '{
    "ToUserName": "gh_xxxxxxxxxxxx",
    "FromUserName": "oMgHVjngRipVsoxxx",
    "CreateTime": 1707123456,
    "MsgType": "event",
    "Event": "subscribe_msg_sent_event",
    "SubscribeMsgSentEvent": {
      "List": [
        {
          "TemplateId": "xxx",
          "MsgId": "123456",
          "ErrorCode": 0,
          "ErrorStatus": "success"
        }
      ]
    }
  }'
```

**预期返回：** `success`

**预期行为：** 数据库 `subscription_message_logs` 表中对应记录的 `send_status` 字段更新为 `1`（发送成功）

#### 11.5.3 查看日志

在控制台"云函数 → callbacks → 日志"中查看执行日志：

```
https://console.cloud.tencent.com/tcb/scf/detail?id=callbacks
```

### 11.6 支付回调示例

#### 11.6.1 支付回调路由

```javascript
// cloudfunctions/callbacks/routes/payment.js
const crypto = require('crypto');
const xml2js = require('xml2js');
const { query, update, transaction } = require('common');
const business = require('business-logic');

/**
 * 微信支付回调处理器
 */
exports.handler = async (event, context) => {
  try {
    const { body } = event;
    
    // 1. 解析XML数据
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(body);
    const data = result.xml;
    
    console.log('收到支付回调:', data);
    
    // 2. 验签
    if (!verifyPaymentSignature(data)) {
      console.error('❌ 支付回调验签失败');
      return buildXmlResponse('FAIL', '签名验证失败');
    }
    
    // 3. 检查支付结果
    if (data.return_code !== 'SUCCESS' || data.result_code !== 'SUCCESS') {
      console.error('❌ 支付失败:', data);
      return buildXmlResponse('FAIL', '支付失败');
    }
    
    // 4. 处理订单
    const { out_trade_no, transaction_id, total_fee } = data;
    await handlePaymentSuccess(out_trade_no, transaction_id, total_fee);
    
    // 5. 返回成功
    return buildXmlResponse('SUCCESS', 'OK');
    
  } catch (error) {
    console.error('支付回调处理失败:', error);
    return buildXmlResponse('FAIL', '系统错误');
  }
};

/**
 * 验证支付回调签名
 */
function verifyPaymentSignature(data) {
  const { sign, ...params } = data;
  const mchKey = process.env.MCH_KEY;
  
  // 1. 参数按key排序
  const keys = Object.keys(params).sort();
  
  // 2. 拼接字符串
  const stringA = keys.map(key => `${key}=${params[key]}`).join('&');
  const stringSignTemp = `${stringA}&key=${mchKey}`;
  
  // 3. MD5加密并转大写
  const expectedSign = crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
  
  return expectedSign === sign;
}

/**
 * 处理支付成功
 */
async function handlePaymentSuccess(orderNo, transactionId, totalFee) {
  return await transaction(async (conn) => {
    // 1. 查询订单
    const [order] = await query(
      'SELECT * FROM orders WHERE order_no = ? FOR UPDATE',
      [orderNo]
    );
    
    if (!order) {
      throw new Error(`订单不存在: ${orderNo}`);
    }
    
    if (order.pay_status === 1) {
      console.log('订单已支付，跳过:', orderNo);
      return;
    }
    
    // 2. 更新订单状态
    await update(
      `UPDATE orders 
       SET pay_status = 1, 
           order_status = 2, 
           transaction_id = ?, 
           pay_time = NOW() 
       WHERE id = ?`,
      [transactionId, order.id]
    );
    
    // 3. 发放课程权益
    await business.order.grantCourseAccess(order.user_id, order.course_id);
    
    // 4. 发放推荐奖励
    await business.points.processReferralReward(order.user_id, totalFee);
    
    // 5. 发送订阅消息通知
    await business.notification.sendPaymentSuccessMessage(order.user_id, order.id);
    
    console.log(`✅ 订单 ${orderNo} 支付成功处理完成`);
  });
}

/**
 * 构建XML响应
 */
function buildXmlResponse(returnCode, returnMsg) {
  const xml = `<xml>
  <return_code><![CDATA[${returnCode}]]></return_code>
  <return_msg><![CDATA[${returnMsg}]]></return_msg>
</xml>`;
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: xml
  };
}
```

### 11.7 配置微信支付回调地址

在微信商户平台配置支付回调URL：

```
https://xxx-xxxx.service.tcloudbase.com/callbacks/payment

⚠️ 注意：这里的路径是 /callbacks/payment
- 基础路径是 /callbacks（config.json中配置）
- 支付回调后缀是 /payment（路由分发用）
```

**配置步骤：**

1. 登录微信商户平台：https://pay.weixin.qq.com/
2. 进入"产品中心 → 开发配置"
3. 配置支付结果通知URL：`https://xxx-xxxx.service.tcloudbase.com/callbacks/payment`
4. 保存配置

**多个回调URL配置示例：**

| 第三方平台 | 配置位置 | 回调URL | 云函数路径匹配 |
|-----------|---------|---------|---------------|
| 微信小程序消息推送 | 公众平台 → 开发设置 | `https://xxx.com/callbacks/message-push` | `path.endsWith('/message-push')` |
| 微信支付 | 商户平台 → 开发配置 | `https://xxx.com/callbacks/payment` | `path.endsWith('/payment')` |
| 微信退款 | 商户平台 → 开发配置 | `https://xxx.com/callbacks/refund` | `path.endsWith('/refund')` |

**优势：**
- ✅ 所有回调都在同一个云函数中处理
- ✅ 共享验签、日志、错误处理逻辑
- ✅ 统一管理，便于监控和维护
- ✅ 不同平台互不影响，通过路径区分

### 11.8 注意事项

#### 11.8.1 安全注意事项

- ✅ **必须验签**：所有回调接口必须验证签名，防止恶意请求
- ✅ **防重放攻击**：记录 MsgId 或订单号，避免重复处理
- ✅ **HTTPS加密**：回调地址必须使用HTTPS协议
- ✅ **敏感信息保护**：Token、密钥存储在环境变量中，不要硬编码
- ✅ **IP白名单**：有条件的话配置微信服务器IP白名单

#### 11.8.2 性能注意事项

- ⚡ **快速响应**：回调处理应在5秒内返回，避免超时
- ⚡ **异步处理**：耗时操作（发通知、统计）放到队列或定时任务
- ⚡ **幂等性**：确保重复推送不会导致数据异常
- ⚡ **日志记录**：完整记录请求和响应，便于排查问题

#### 11.8.3 错误处理

- ⚠️ **消息推送**：即使处理失败也要返回"success"，避免微信重复推送
- ⚠️ **支付回调**：返回"FAIL"会导致微信重复推送，谨慎使用
- ⚠️ **日志告警**：配置异常日志告警，及时发现回调失败

---

## 12. 参考资料

> **📌 文档位置说明**  
> 本模板为独立模板包,以下内部文档位于完整项目的上级目录中:
> - `layers/common/README.md` 和 `layers/business-logic/README.md` → 位于完整项目的 `cloudfunctions/layers/` 目录
> - `../../docs/database/数据库详细信息.md` → 位于完整项目的根目录
> - `../../后端API接口文档.md` 和 `../../需求文档-V2.md` → 位于完整项目的根目录
> - `./cloud-storage-architecture.md` → 位于当前 cloudfunctions/ 目录

### 11.1 内部文档

- **[数据库设计文档](../../docs/database/数据库详细信息.md)** - 完整的数据库架构和字段说明
- **[云存储架构文档](./cloud-storage-architecture.md)** - 云存储目录结构和使用规范
- **[后端API接口文档](../../后端API接口文档.md)** - 所有接口的详细说明
- **[项目需求文档](../../需求文档-V2.md)** - 业务需求和功能说明

### 12.2 CloudBase 官方文档

- **[云函数快速开始](https://docs.cloudbase.net/cloud-function/introduce)** - 云函数基础教程
- **[云函数 API 文档](https://docs.cloudbase.net/api-reference/server/node-sdk/introduction)** - Node.js SDK API 参考
- **[HTTP 云函数](https://docs.cloudbase.net/cloud-function/http)** - HTTP 触发器配置和使用
- **[层管理](https://docs.cloudbase.net/cloud-function/layer)** - 层的创建和使用
- **[云存储文档](https://docs.cloudbase.net/storage/introduce)** - CloudBase 云存储使用指南
- **[云存储 Web SDK](https://docs.cloudbase.net/storage/web)** - 前端上传下载文件
- **[云存储安全规则](https://docs.cloudbase.net/storage/security-rules)** - 云存储安全规则配置
- **[数据库文档](https://docs.cloudbase.net/database/introduce)** - CloudBase 数据库使用指南
- **[安全规则](https://docs.cloudbase.net/database/security-rules)** - 数据库安全规则配置

### 12.3 微信小程序官方文档

- **[消息推送](https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/message-push.html)** - 微信小程序消息推送完整指南
- **[云函数接收消息推送](https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/message-push.html#%E4%BA%91%E5%87%BD%E6%95%B0%E6%8E%A5%E6%94%B6%E6%B6%88%E6%81%AF%E6%8E%A8%E9%80%81)** - 使用云函数处理消息推送
- **[消息类型](https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/message-push.html#%E6%B6%88%E6%81%AF%E7%B1%BB%E5%9E%8B)** - 文本/图片/事件消息格式说明
- **[客服消息](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/customer-message/customerServiceMessage.send.html)** - 发送客服消息API
- **[微信支付回调](https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=9_7&index=8)** - 微信支付结果通知
- **[订阅消息](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/subscribe-message.html)** - 订阅消息推送能力

### 12.4 快速链接

```
# CloudBase 控制台
https://console.cloud.tencent.com/tcb

# MySQL 数据库管理
https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/db/mysql

# 云存储管理
https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/storage

# 云函数管理
https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/scf

# 层管理
https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/scf/layer
```

### 12.5 常见问题速查

| 问题 | 解决方案 |
|-----|---------|
| 如何获取用户 openid？ | 使用 `cloud.getWXContext()` 自动获取 |
| 如何区分用户和管理员？ | 使用 action 前缀（client:/admin:）+ 权限验证 |
| 如何防止 SQL 注入？ | 使用参数绑定（`query(sql, [param1, param2])`） |
| 如何实现数据隔离？ | 查询时过滤 `WHERE _openid = ?` |
| 如何共享代码？ | 使用层（Layer）管理公共代码 |
| Layer 如何引用？ | 使用 `require('/opt/layer-name')` |
| 如何处理事务？ | 使用 `db.transaction` 包裹多个操作 |
| 如何配置数据库连接？ | 在 config.json 的 envVariables 中配置 MYSQL_* 变量 |
| 如何本地测试云函数？ | 创建 test.js 模拟 cloud.getWXContext() |
| Layer 目录结构要求？ | 必须包含 `nodejs/` 目录，代码放在 nodejs/ 下 |
| config.json 必填项？ | 仅 layers 数组是建议配置项，其他都是可选 |
| 云函数超时时间最大值？ | 60 秒（在 config.json 中配置 timeout） |
| node_modules 要上传吗？ | 是的，需要在本地 npm install 后一起上传 |
| 如何处理前端错误？ | 统一错误码 + switch 判断 + 友好提示 |
| 如何上传文件到云存储？ | 前端调用云函数，云函数使用 `cloud.uploadFile()` |
| 云存储文件如何命名？ | 使用 `{业务标识}_{时间戳}.{扩展名}` 格式 |
| 如何获取云存储文件URL？ | 使用 `cloud.getTempFileURL()` 获取临时URL |
| 云存储文件大小限制？ | 图片推荐 < 2MB，视频推荐 < 50MB |
| 如何删除云存储文件？ | 使用 `cloud.deleteFile()` 删除 |
| 如何处理回调接口？ | 使用单个HTTP云函数，通过路径分发到不同处理模块 |
| 同一域名如何区分不同回调？ | 通过路径后缀区分（/callbacks/payment、/callbacks/message-push） |
| HTTP云函数如何获取请求路径？ | 通过 event.path 获取完整路径，用 path.endsWith() 匹配 |
| 如何配置消息推送？ | 在微信公众平台配置服务器URL，指向HTTP云函数地址 |
| 消息推送如何验签？ | 使用token+timestamp+nonce进行SHA1验签 |
| 消息推送返回什么？ | GET请求返回echostr，POST请求返回"success" |
| 如何记录订阅消息发送状态？ | 通过微信回调事件更新 subscription_message_logs 表 |
| 支付回调如何验签？ | 参数排序+key拼接后MD5加密验证 |
| 支付回调返回什么？ | XML格式，SUCCESS或FAIL |
| HTTP云函数如何获取请求参数？ | event.body/queryStringParameters/headers |
| HTTP云函数如何返回响应？ | 返回 { statusCode, headers, body } 对象 |

### 12.6 代码开发清单

#### 创建新云函数检查清单

- [ ] ✅ 创建函数目录（如 `cloudfunctions/user/`）
- [ ] ✅ 创建 `index.js` 并实现 `exports.main`
- [ ] ✅ 创建 `package.json` 并添加依赖
- [ ] ✅ 创建 `config.json` 并配置 layers
- [ ] ✅ 运行 `npm install` 安装依赖
- [ ] ✅ 实现 action 路由分发逻辑
- [ ] ✅ 添加权限验证（checkClientAuth/checkAdminAuth）
- [ ] ✅ 添加参数验证（validateRequired）
- [ ] ✅ 使用参数绑定防止 SQL 注入
- [ ] ✅ 用户数据查询过滤 _openid
- [ ] ✅ 返回标准响应格式（successResponse/errorResponse）
- [ ] ✅ 添加 console.log 日志
- [ ] ✅ 创建 test.js 进行本地测试
- [ ] ✅ 处理所有异常情况（try-catch）

#### 创建新 Layer 检查清单

- [ ] ✅ 创建 layer 目录（如 `cloudfunctions/layers/db-utils/`）
- [ ] ✅ 创建 `nodejs/` 子目录（必须）
- [ ] ✅ 在 nodejs/ 下创建 `index.js`
- [ ] ✅ 在 nodejs/ 下创建 `package.json`
- [ ] ✅ 进入 nodejs/ 目录运行 `npm install`
- [ ] ✅ 导出需要的方法（module.exports）
- [ ] ✅ 在云函数 config.json 中配置 layers
- [ ] ✅ 在云函数中测试引用（require('/opt/layer-name')）

#### 创建HTTP云函数检查清单

- [ ] ✅ 创建函数目录（如 `cloudfunctions/callbacks/`）
- [ ] ✅ 创建 `index.js` 实现主路由分发
- [ ] ✅ 创建 `routes/` 目录，按回调类型创建处理模块
- [ ] ✅ 创建 `middleware/` 目录，实现验签/日志/限流中间件
- [ ] ✅ 配置 `config.json` 中的 HTTP 触发器
- [ ] ✅ 配置环境变量（Token、密钥等）
- [ ] ✅ 实现接入验证（GET请求处理）
- [ ] ✅ 实现消息接收（POST请求处理）
- [ ] ✅ 实现验签逻辑（防止恶意请求）
- [ ] ✅ 实现消息去重（使用MsgId）
- [ ] ✅ 返回标准响应格式（success/XML）
- [ ] ✅ 在微信平台配置回调URL
- [ ] ✅ 测试接入验证和消息推送
- [ ] ✅ 查看云函数日志确认执行正常

### 12.7 代码质量规范

#### 安全防护清单

- [ ] ✅ 禁止从前端接收 openid，必须使用 `cloud.getWXContext()` 获取
- [ ] ✅ 所有 `admin:*` 操作必须调用 `checkAdminAuth()` 验证权限
- [ ] ✅ 所有 `client:*` 操作必须调用 `checkClientAuth()` 验证用户
- [ ] ✅ 所有 SQL 查询使用参数绑定，禁止字符串拼接
- [ ] ✅ 用户数据查询必须过滤 `WHERE _openid = ?`
- [ ] ✅ 敏感数据（密码、密钥）不要记录到日志
- [ ] ✅ 数据库连接信息使用环境变量，不要硬编码
- [ ] ✅ 必填参数使用 `validateRequired()` 验证
- [ ] ✅ 所有异常必须捕获并返回友好的错误信息
- [ ] ✅ 重要操作记录日志（创建订单、支付、退款等）

#### HTTP云函数安全清单

- [ ] ✅ 回调接口必须验证签名（微信消息推送、支付回调）
- [ ] ✅ 使用 MsgId 或订单号实现去重，防止重复处理
- [ ] ✅ Token、密钥存储在环境变量，不要硬编码
- [ ] ✅ 回调地址必须使用 HTTPS 协议
- [ ] ✅ 验证请求来源（User-Agent、IP白名单）
- [ ] ✅ 快速响应（5秒内返回），避免微信重复推送
- [ ] ✅ 即使处理失败也要返回成功（避免无限重试）
- [ ] ✅ 记录完整的请求和响应日志
- [ ] ✅ 配置异常告警，及时发现回调失败
- [ ] ✅ 实现幂等性，确保重复推送不会导致数据异常

#### 性能优化清单

- [ ] ✅ 避免 N+1 查询，使用 JOIN 合并查询
- [ ] ✅ 使用分页查询，不要一次查询所有数据
- [ ] ✅ 为常用查询字段添加索引
- [ ] ✅ 使用连接池复用数据库连接（db-utils 已实现）
- [ ] ✅ 全局变量缓存配置数据，减少冷启动影响
- [ ] ✅ 使用 Promise.all 并发执行独立的异步操作

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

