# CloudBase 数据库 SDK 操作指南

> **版本**: V1.0
> **更新时间**: 2026-02-04
> **适用于**: 天道文化小程序数据库操作
> **特别说明**: 本指南适用于无法使用 MCP 工具的环境（如 Claude Code）

---

## 📋 目录

1. [概述](#1-概述)
2. [CloudBase Manager SDK 使用](#2-cloudbase-manager-sdk-使用)
3. [执行 SQL 语句](#3-执行-sql-语句)
4. [安全规则配置](#4-安全规则配置)
5. [云函数访问数据库](#5-云函数访问数据库)
6. [小程序端访问（前端 SDK）](#6-小程序端访问前端-sdk)
7. [常见操作示例](#7-常见操作示例)
8. [故障排查](#8-故障排查)

---

## 1. 概述

### 1.1 数据库访问方式

本项目提供三种数据库访问方式：

| 访问方式 | 使用场景 | SDK/工具 | 权限级别 |
|---------|---------|---------|---------|
| **MCP 工具** | AI 编辑器自动化操作 | Cursor/Windsurf 内置 | 管理员 |
| **Manager SDK** | Node.js 脚本/本地管理 | `@cloudbase/manager-node` | 管理员 |
| **云函数** | 业务逻辑处理 | `@cloudbase/node-sdk` | 管理员 |
| **前端 SDK** | 前端直接访问（不推荐） | `@cloudbase/js-sdk` | 受限 |

### 1.2 架构说明

```
┌─────────────────────────────────────────────────────┐
│                   小程序前端                          │
│              (@cloudbase/js-sdk)                    │
└────────────────────┬────────────────────────────────┘
                     │ 调用云函数
                     ↓
┌─────────────────────────────────────────────────────┐
│                   云函数层                            │
│              (@cloudbase/node-sdk)                  │
│          ┌──────────────────────────────┐           │
│          │  user 模块 (用户业务)         │           │
│          │  course 模块 (课程业务)       │           │
│          │  order 模块 (订单业务)        │           │
│          │  ...                         │           │
│          └──────────────────────────────┘           │
└────────────────────┬────────────────────────────────┘
                     │ SQL 查询
                     ↓
┌─────────────────────────────────────────────────────┐
│              CloudBase MySQL 数据库                  │
│         (安全规则: ADMINONLY - 仅云函数可访问)        │
└─────────────────────────────────────────────────────┘

          ┌─────────────────────────────┐
          │    本地管理工具/脚本          │
          │  (@cloudbase/manager-node)  │
          └──────────────┬──────────────┘
                         │ 部署/管理
                         ↓
          ┌─────────────────────────────┐
          │     CloudBase 控制台          │
          └─────────────────────────────┘
```

---

## 2. CloudBase Manager SDK 使用

### 2.1 安装 SDK

```bash
# 全局安装（推荐）
npm install -g @cloudbase/cli @cloudbase/manager-node

# 项目安装
npm install --save-dev @cloudbase/manager-node
```

### 2.2 环境准备

```bash
# 1. 登录 CloudBase
cloudbase login

# 2. 设置默认环境
cloudbase env:list
cloudbase env:switch cloud1-0gnn3mn17b581124
```

### 2.3 基础使用示例

创建管理脚本 `scripts/db-manager.js`：

```javascript
const cloudbase = require('@cloudbase/manager-node');

// 初始化
const manager = new cloudbase.CloudBase({
  secretId: process.env.TCLOUD_SECRET_ID,  // 腾讯云 SecretId
  secretKey: process.env.TCLOUD_SECRET_KEY, // 腾讯云 SecretKey
  envId: 'cloud1-0gnn3mn17b581124'         // 环境 ID
});

// 或者使用临时密钥
const managerWithToken = new cloudbase.CloudBase({
  token: process.env.TCB_TOKEN,
  envId: 'cloud1-0gnn3mn17b581124'
});

module.exports = manager;
```

**获取密钥方式：**

```bash
# 方式 1: 使用 CLI 登录后自动获取
cloudbase login

# 方式 2: 从腾讯云控制台获取
# https://console.cloud.tencent.com/cam/capi
# 获取 SecretId 和 SecretKey

# 方式 3: 使用临时密钥（推荐）
cloudbase env:domain:list
```

---

## 3. 执行 SQL 语句

### 3.1 使用 Manager SDK 执行 SQL

#### 方法 1: 通过 CloudBase Manager API

```javascript
const cloudbase = require('@cloudbase/manager-node');

const manager = new cloudbase.CloudBase({
  secretId: process.env.TCLOUD_SECRET_ID,
  secretKey: process.env.TCLOUD_SECRET_KEY,
  envId: 'cloud1-0gnn3mn17b581124'
});

async function executeSql(sql) {
  try {
    // 调用数据库管理 API
    const result = await manager.commonService().call({
      Action: 'DescribeCloudBaseRunServerVersion',
      ServiceName: 'flexdb',
      Sql: sql,
      DatabaseName: 'tiandao_culture'
    });
    
    console.log('SQL 执行成功:', result);
    return result;
  } catch (error) {
    console.error('SQL 执行失败:', error);
    throw error;
  }
}

// 示例：查询所有表
executeSql('SHOW TABLES');

// 示例：创建表
executeSql(`
  CREATE TABLE IF NOT EXISTS test_table (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`);
```

#### 方法 2: 使用 CloudBase CLI

```bash
# 交互式 SQL 执行
cloudbase db:query -e cloud1-0gnn3mn17b581124

# 执行单条 SQL
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "SHOW TABLES;"

# 从文件执行 SQL
cloudbase db:query -e cloud1-0gnn3mn17b581124 -f ./create-tables.sql
```

### 3.2 批量执行建表 SQL

创建脚本 `scripts/create-all-tables.js`：

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 数据库模块文档路径
const docsPath = path.join(__dirname, '../docs/database');

// 模块列表（按依赖顺序）
const modules = [
  '01_用户模块',
  '02_课程模块',
  '03_订单模块',
  '04_预约模块',
  '05_大使模块',
  '06_商学院商城模块',
  '07_协议模块',
  '08_反馈消息模块',
  '09_后台管理模块'
];

async function extractCreateTableSQL(markdownContent) {
  // 提取 CREATE TABLE 语句的正则表达式
  const sqlRegex /```sql\s*(CREATE TABLE[\s\S]*?)\s*```/gi;
  const matches = [];
  let match;
  
  while ((match = sqlRegex.exec(markdownContent)) !== null) {
    if (match[1].includes('CREATE TABLE')) {
      matches.push(match[1].trim());
    }
  }
  
  return matches;
}

async function createAllTables() {
  console.log('🚀 开始创建数据库表...\n');
  
  // 1. 创建数据库
  const createDbSql = `
    CREATE DATABASE IF NOT EXISTS tiandao_culture
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci;
    
    USE tiandao_culture;
    SET time_zone = '+08:00';
  `;
  
  console.log('📝 创建数据库 tiandao_culture...');
  execSync(`cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "${createDbSql}"`, {
    stdio: 'inherit'
  });
  
  // 2. 按模块创建表
  for (const module of modules) {
    console.log(`\n📦 处理模块: ${module}`);
    const filePath = path.join(docsPath, `${module}.md`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  文件不存在: ${filePath}`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const sqlStatements = await extractCreateTableSQL(content);
    
    console.log(`   找到 ${sqlStatements.length} 个建表语句`);
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i];
      const tableName = sql.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i)?.[1];
      
      console.log(`   ✓ 创建表: ${tableName}`);
      
      try {
        execSync(`cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "${sql.replace(/"/g, '\\"')}"`, {
          stdio: 'pipe'
        });
      } catch (error) {
        console.error(`   ✗ 创建失败: ${tableName}`, error.message);
      }
    }
  }
  
  console.log('\n✅ 数据库表创建完成！');
  
  // 3. 验证
  console.log('\n🔍 验证表创建结果...');
  execSync(`cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "SHOW TABLES;"`, {
    stdio: 'inherit'
  });
}

// 执行
createAllTables().catch(console.error);
```

**运行脚本：**

```bash
node scripts/create-all-tables.js
```

---

## 4. 安全规则配置

### 4.1 理解安全规则

安全规则控制**前端 SDK** 对数据库的访问权限，不影响云函数和管理员操作。

**规则类型：**

| 规则 | 说明 | 适用场景 |
|-----|------|---------|
| `READONLY` | 仅读取 | 公开只读数据（如公告、课程列表） |
| `PRIVATE` | 仅自己的数据 | 用户个人数据（基于 _openid） |
| `ADMINWRITE` | 管理员写、用户读 | 半公开数据 |
| `ADMINONLY` | 仅管理员 | 敏感数据（订单、支付等） |
| `CUSTOM` | 自定义规则 | 复杂权限逻辑 |

**本项目统一使用 `ADMINONLY`**，理由：
- ✅ 强制所有前端操作通过云函数
- ✅ 防止前端直接访问数据库
- ✅ 云函数拥有管理员权限，不受影响
- ✅ 架构清晰，安全性最高

### 4.2 使用 CLI 配置安全规则

创建脚本 `scripts/set-security-rules.sh`：

```bash
#!/bin/bash

# CloudBase 环境配置
ENV_ID="cloud1-0gnn3mn17b581124"
DATABASE="tiandao_culture"

# 所有表列表
TABLES=(
  # 用户模块
  "users"
  "referee_change_logs"
  
  # 课程模块
  "courses"
  "user_courses"
  
  # 订单模块
  "orders"
  
  # 预约模块
  "class_records"
  "appointments"
  
  # 大使模块
  "ambassador_applications"
  "ambassador_quotas"
  "quota_usage_records"
  "merit_points_records"
  "cash_points_records"
  "withdrawals"
  "ambassador_upgrade_logs"
  
  # 商学院/商城模块
  "academy_intro"
  "academy_materials"
  "academy_cases"
  "mall_goods"
  "mall_exchange_records"
  
  # 协议模块
  "contract_templates"
  "contract_signatures"
  
  # 反馈/消息模块
  "feedbacks"
  "notification_configs"
  "notification_logs"
  
  # 后台管理模块
  "admin_users"
  "admin_operation_logs"
  "system_configs"
  "announcements"
)

echo "🔒 开始配置数据库安全规则..."
echo "环境 ID: $ENV_ID"
echo "数据库: $DATABASE"
echo "总表数: ${#TABLES[@]}"
echo ""

# 遍历所有表
for TABLE in "${TABLES[@]}"; do
  echo "设置 $TABLE 为 ADMINONLY..."
  
  # 使用 CloudBase CLI 设置安全规则
  cloudbase db:security:set \
    -e $ENV_ID \
    --table "$DATABASE.$TABLE" \
    --rule "ADMINONLY"
  
  if [ $? -eq 0 ]; then
    echo "✅ $TABLE - 成功"
  else
    echo "❌ $TABLE - 失败"
  fi
  
  echo ""
done

echo "✅ 安全规则配置完成！"
```

**运行脚本：**

```bash
chmod +x scripts/set-security-rules.sh
./scripts/set-security-rules.sh
```

### 4.3 使用 Node.js SDK 配置

创建脚本 `scripts/set-security-rules.js`：

```javascript
const cloudbase = require('@cloudbase/manager-node');

const manager = new cloudbase.CloudBase({
  secretId: process.env.TCLOUD_SECRET_ID,
  secretKey: process.env.TCLOUD_SECRET_KEY,
  envId: 'cloud1-0gnn3mn17b581124'
});

// 所有表列表
const tables = [
  // 用户模块（2张）
  'users', 'referee_change_logs',
  // 课程模块（2张）
  'courses', 'user_courses',
  // 订单模块（1张）
  'orders',
  // 预约模块（2张）
  'class_records', 'appointments',
  // 大使模块（7张）
  'ambassador_applications', 'ambassador_quotas', 'quota_usage_records',
  'merit_points_records', 'cash_points_records', 'withdrawals', 'ambassador_upgrade_logs',
  // 商学院/商城模块（5张）
  'academy_intro', 'academy_materials', 'academy_cases',
  'mall_goods', 'mall_exchange_records',
  // 协议模块（2张）
  'contract_templates', 'contract_signatures',
  // 反馈/消息模块（3张）
  'feedbacks', 'notification_configs', 'notification_logs',
  // 后台管理模块（4张）
  'admin_users', 'admin_operation_logs', 'system_configs', 'announcements'
];

async function setSecurityRules() {
  console.log('🔒 开始配置数据库安全规则...\n');
  console.log(`总表数: ${tables.length}\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const tableName of tables) {
    try {
      console.log(`设置 ${tableName} 为 ADMINONLY...`);
      
      // 调用 API 设置安全规则
      await manager.commonService().call({
        Action: 'ModifyDatabaseACL',
        DatabaseName: 'tiandao_culture',
        CollectionName: tableName,
        AclTag: 'ADMINONLY'
      });
      
      console.log(`✅ ${tableName} - 成功\n`);
      successCount++;
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ ${tableName} - 失败:`, error.message, '\n');
      failCount++;
    }
  }
  
  console.log('\n📊 配置结果汇总:');
  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`📝 总计: ${tables.length}`);
}

// 执行
setSecurityRules().catch(console.error);
```

**运行脚本：**

```bash
# 设置环境变量
export TCLOUD_SECRET_ID="your-secret-id"
export TCLOUD_SECRET_KEY="your-secret-key"

# 运行脚本
node scripts/set-security-rules.js
```

### 4.4 验证安全规则

```bash
# 列出所有表的安全规则
cloudbase db:security:list -e cloud1-0gnn3mn17b581124

# 检查特定表的规则
cloudbase db:security:get -e cloud1-0gnn3mn17b581124 --table "tiandao_culture.users"
```

---

## 5. 云函数访问数据库

### 5.1 云函数 SDK 初始化

在云函数中使用 `@cloudbase/node-sdk`：

```javascript
// cloudfunctions/database-utils/index.js
const cloud = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV  // 使用当前环境
});

// 获取数据库实例
const db = app.database();

// 导出 db 实例供其他云函数使用
module.exports = {
  app,
  db
};
```

### 5.2 执行 SQL 查询

```javascript
// cloudfunctions/user/index.js
const { db } = require('../database-utils');

exports.main = async (event, context) => {
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'getUserInfo':
        return await getUserInfo(event.openid);
      
      case 'updateUserInfo':
        return await updateUserInfo(event.openid, data);
      
      default:
        return { code: 400, message: '未知操作' };
    }
  } catch (error) {
    console.error('云函数错误:', error);
    return { code: 500, message: error.message };
  }
};

// 查询用户信息
async function getUserInfo(openid) {
  const sql = `
    SELECT id, name, phone, avatar, level, referee_id
    FROM users
    WHERE _openid = ? AND deleted_at IS NULL
    LIMIT 1
  `;
  
  const result = await db.runTransaction(async transaction => {
    const users = await transaction.collection('_sqlExecute_').add({
      sql,
      params: [openid]
    });
    return users;
  });
  
  if (result.length === 0) {
    return { code: 404, message: '用户不存在' };
  }
  
  return { code: 0, data: result[0] };
}

// 更新用户信息
async function updateUserInfo(openid, data) {
  const { name, avatar, phone } = data;
  
  const sql = `
    UPDATE users
    SET name = ?, avatar = ?, phone = ?, updated_at = NOW()
    WHERE _openid = ? AND deleted_at IS NULL
  `;
  
  const result = await db.runTransaction(async transaction => {
    return await transaction.collection('_sqlExecute_').add({
      sql,
      params: [name, avatar, phone, openid]
    });
  });
  
  return { code: 0, message: '更新成功', affected: result.affectedRows };
}
```

### 5.3 完整的 CRUD 示例

```javascript
// cloudfunctions/course/index.js
const { db } = require('../database-utils');

exports.main = async (event, context) => {
  const { action, data } = event;
  
  try {
    switch (action) {
      // 查询课程列表
      case 'getCourseList':
        return await getCourseList(data.type);
      
      // 查询课程详情
      case 'getCourseDetail':
        return await getCourseDetail(data.courseId);
      
      // 购买课程（创建订单）
      case 'buyCourse':
        return await buyCourse(event.openid, data);
      
      // 查询我的课程
      case 'getMyCourses':
        return await getMyCourses(event.openid);
      
      default:
        return { code: 400, message: '未知操作' };
    }
  } catch (error) {
    console.error('云函数错误:', error);
    return { code: 500, message: error.message };
  }
};

// 查询课程列表
async function getCourseList(type) {
  let sql = `
    SELECT id, name, type, current_price, retrain_price, description
    FROM courses
    WHERE deleted_at IS NULL
  `;
  
  const params = [];
  
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY display_order ASC, id ASC';
  
  const result = await db.runTransaction(async transaction => {
    return await transaction.collection('_sqlExecute_').add({
      sql,
      params
    });
  });
  
  return { code: 0, data: result };
}

// 查询课程详情
async function getCourseDetail(courseId) {
  const sql = `
    SELECT id, name, type, current_price, retrain_price, description, 
           detail_info, is_visible
    FROM courses
    WHERE id = ? AND deleted_at IS NULL
    LIMIT 1
  `;
  
  const result = await db.runTransaction(async transaction => {
    return await transaction.collection('_sqlExecute_').add({
      sql,
      params: [courseId]
    });
  });
  
  if (result.length === 0) {
    return { code: 404, message: '课程不存在' };
  }
  
  return { code: 0, data: result[0] };
}

// 购买课程（创建订单）
async function buyCourse(openid, data) {
  const { courseId, orderType } = data;
  
  // 开始事务
  return await db.runTransaction(async transaction => {
    // 1. 查询课程信息
    const course = await transaction.collection('_sqlExecute_').add({
      sql: 'SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL',
      params: [courseId]
    });
    
    if (course.length === 0) {
      throw new Error('课程不存在');
    }
    
    // 2. 计算订单金额
    const price = orderType === 1 
      ? course[0].current_price 
      : course[0].retrain_price;
    
    // 3. 创建订单
    const orderNo = generateOrderNo();
    await transaction.collection('_sqlExecute_').add({
      sql: `
        INSERT INTO orders 
        (_openid, order_no, order_type, course_id, course_name, 
         original_price, actual_price, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())
      `,
      params: [
        openid, orderNo, orderType, courseId, course[0].name,
        price, price
      ]
    });
    
    return {
      code: 0,
      message: '订单创建成功',
      data: { orderNo, price }
    };
  });
}

// 查询我的课程
async function getMyCourses(openid) {
  const sql = `
    SELECT 
      uc.id, uc.course_id, uc.course_name, uc.purchase_type,
      uc.purchase_time, uc.remaining_attempts,
      c.type as course_type, c.description
    FROM user_courses uc
    LEFT JOIN courses c ON uc.course_id = c.id
    WHERE uc._openid = ? AND uc.deleted_at IS NULL
    ORDER BY uc.purchase_time DESC
  `;
  
  const result = await db.runTransaction(async transaction => {
    return await transaction.collection('_sqlExecute_').add({
      sql,
      params: [openid]
    });
  });
  
  return { code: 0, data: result };
}

// 生成订单号
function generateOrderNo() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TD${timestamp}${random}`;
}
```

---

## 6. 小程序端访问（前端 SDK）

### 6.1 前端 SDK 初始化

```javascript
// src/utils/cloudbase.ts
import cloudbase from '@cloudbase/js-sdk';

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'cloud1-0gnn3mn17b581124'
});

// 获取数据库实例（注意：由于安全规则为 ADMINONLY，前端无法直接使用）
const db = app.database();

export { app, db };
```

### 6.2 调用云函数（推荐方式）

```javascript
// src/utils/api/user.ts
import { app } from '@/utils/cloudbase';

/**
 * 获取用户信息
 */
export async function getUserInfo() {
  try {
    const res = await app.callFunction({
      name: 'user',
      data: {
        action: 'getUserInfo'
      }
    });
    
    if (res.result.code === 0) {
      return res.result.data;
    } else {
      throw new Error(res.result.message);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    throw error;
  }
}

/**
 * 更新用户信息
 */
export async function updateUserInfo(data: {
  name?: string;
  avatar?: string;
  phone?: string;
}) {
  try {
    const res = await app.callFunction({
      name: 'user',
      data: {
        action: 'updateUserInfo',
        data
      }
    });
    
    if (res.result.code === 0) {
      return true;
    } else {
      throw new Error(res.result.message);
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
    throw error;
  }
}
```

### 6.3 前端直接访问（不推荐）

⚠️ **由于安全规则设置为 ADMINONLY，前端 SDK 无法直接访问数据库！**

如果必须使用前端直接访问，需要修改安全规则为 `PRIVATE` 或 `READONLY`，但**不推荐**。

---

## 7. 常见操作示例

### 7.1 分页查询

```javascript
// 云函数中实现分页
async function getOrderList(openid, page = 1, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  
  // 查询总数
  const countSql = `
    SELECT COUNT(*) as total
    FROM orders
    WHERE _openid = ? AND deleted_at IS NULL
  `;
  
  // 查询列表
  const listSql = `
    SELECT *
    FROM orders
    WHERE _openid = ? AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const [countResult, listResult] = await Promise.all([
    db.runTransaction(async t => 
      await t.collection('_sqlExecute_').add({ sql: countSql, params: [openid] })
    ),
    db.runTransaction(async t => 
      await t.collection('_sqlExecute_').add({
        sql: listSql,
        params: [openid, pageSize, offset]
      })
    )
  ]);
  
  return {
    code: 0,
    data: {
      list: listResult,
      total: countResult[0].total,
      page,
      pageSize,
      totalPages: Math.ceil(countResult[0].total / pageSize)
    }
  };
}
```

### 7.2 事务处理

```javascript
// 复杂事务示例：大使升级
async function upgradeAmbassador(openid, targetLevel) {
  return await db.runTransaction(async transaction => {
    // 1. 检查用户当前等级
    const user = await transaction.collection('_sqlExecute_').add({
      sql: 'SELECT * FROM users WHERE _openid = ? FOR UPDATE',
      params: [openid]
    });
    
    if (user[0].level >= targetLevel) {
      throw new Error('当前等级已达到或超过目标等级');
    }
    
    // 2. 检查是否有足够的功德分
    const meritPoints = await transaction.collection('_sqlExecute_').add({
      sql: `
        SELECT SUM(amount) as total
        FROM merit_points_records
        WHERE _openid = ? AND type = 1 AND deleted_at IS NULL
      `,
      params: [openid]
    });
    
    const requiredPoints = getRequiredMeritPoints(targetLevel);
    if (meritPoints[0].total < requiredPoints) {
      throw new Error('功德分不足');
    }
    
    // 3. 创建升级订单
    const orderNo = generateOrderNo();
    const upgradePrice = getUpgradePrice(user[0].level, targetLevel);
    
    await transaction.collection('_sqlExecute_').add({
      sql: `
        INSERT INTO orders
        (_openid, order_no, order_type, course_id, course_name,
         original_price, actual_price, status, created_at)
        VALUES (?, ?, 4, 0, ?, ?, ?, 1, NOW())
      `,
      params: [
        openid, orderNo,
        `升级到${getLevelName(targetLevel)}`,
        upgradePrice, upgradePrice
      ]
    });
    
    // 4. 返回订单号，等待支付
    return {
      code: 0,
      message: '升级订单创建成功',
      data: { orderNo, price: upgradePrice }
    };
  });
}
```

### 7.3 联表查询

```javascript
// 查询大使团队信息
async function getAmbassadorTeam(openid) {
  const sql = `
    SELECT 
      u.id, u.name, u.avatar, u.level,
      COUNT(DISTINCT uc.id) as course_count,
      SUM(CASE WHEN o.status = 3 THEN o.actual_price ELSE 0 END) as total_amount
    FROM users u
    LEFT JOIN user_courses uc ON u._openid = uc._openid
    LEFT JOIN orders o ON u._openid = o._openid
    WHERE u.referee_id = (
      SELECT id FROM users WHERE _openid = ? LIMIT 1
    )
    AND u.deleted_at IS NULL
    GROUP BY u.id, u.name, u.avatar, u.level
    ORDER BY u.created_at DESC
  `;
  
  const result = await db.runTransaction(async transaction => {
    return await transaction.collection('_sqlExecute_').add({
      sql,
      params: [openid]
    });
  });
  
  return { code: 0, data: result };
}
```

---

## 8. 故障排查

### 8.1 连接问题

**问题：无法连接到 CloudBase**

```bash
# 检查登录状态
cloudbase login

# 检查环境列表
cloudbase env:list

# 切换环境
cloudbase env:switch cloud1-0gnn3mn17b581124

# 检查网络连接
ping tcb.cloud.tencent.com
```

### 8.2 权限问题

**问题：Permission denied 或 access denied**

1. 检查安全规则：
```bash
cloudbase db:security:list -e cloud1-0gnn3mn17b581124
```

2. 确认访问方式：
   - 前端 SDK → 受安全规则限制（ADMINONLY 会拒绝）
   - 云函数 → 管理员权限，不受限制
   - Manager SDK → 管理员权限，不受限制

3. 检查云函数权限：
```javascript
// 确保云函数正确初始化
const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV  // 必须使用当前环境
});
```

### 8.3 SQL 执行错误

**问题：SQL syntax error**

1. 检查 SQL 语法：
```sql
-- 错误示例
SELECT * FROM users WHERE _openid = {openid};  -- ❌ 错误

-- 正确示例
SELECT * FROM users WHERE _openid = ?;         -- ✅ 正确（使用参数化查询）
```

2. 检查字段名和表名：
```sql
-- 使用 DESCRIBE 检查表结构
DESCRIBE users;

-- 使用 SHOW CREATE TABLE 查看完整定义
SHOW CREATE TABLE users;
```

3. 检查字符编码：
```sql
-- 确保数据库字符集正确
SHOW CREATE DATABASE tiandao_culture;

-- 转换表字符集（如需要）
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 8.4 性能问题

**问题：查询速度慢**

1. 添加索引：
```sql
-- 检查当前索引
SHOW INDEX FROM users;

-- 添加索引
CREATE INDEX idx_phone ON users(phone);
CREATE INDEX idx_level ON users(level);
```

2. 优化查询：
```sql
-- 使用 EXPLAIN 分析查询
EXPLAIN SELECT * FROM users WHERE phone = '13800138000';

-- 避免全表扫描
SELECT * FROM users WHERE id = 123;  -- ✅ 使用主键
SELECT * FROM users WHERE name = 'xx';  -- ❌ 可能全表扫描
```

3. 使用缓存：
```javascript
// 云函数中使用全局缓存
let courseCache = null;
let cacheTime = 0;

async function getCourseList() {
  const now = Date.now();
  
  // 缓存 5 分钟
  if (courseCache && (now - cacheTime) < 5 * 60 * 1000) {
    return courseCache;
  }
  
  // 查询数据库
  const result = await db.runTransaction(/* ... */);
  
  // 更新缓存
  courseCache = result;
  cacheTime = now;
  
  return result;
}
```

---

## 附录

### A. 完整的环境变量配置

创建 `.env.local` 文件：

```bash
# CloudBase 配置
CLOUDBASE_ENV_ID=cloud1-0gnn3mn17b581124
CLOUDBASE_ENV_ALIAS=cloud1

# 腾讯云密钥（用于 Manager SDK）
TCLOUD_SECRET_ID=your-secret-id
TCLOUD_SECRET_KEY=your-secret-key

# 数据库配置
DB_NAME=tiandao_culture
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci
```

### B. package.json 脚本配置

```json
{
  "scripts": {
    "db:create": "node scripts/create-all-tables.js",
    "db:security": "node scripts/set-security-rules.js",
    "db:query": "cloudbase db:query -e cloud1-0gnn3mn17b581124",
    "db:console": "cloudbase console",
    "deploy:functions": "cloudbase functions:deploy --all"
  },
  "devDependencies": {
    "@cloudbase/cli": "^1.x.x",
    "@cloudbase/manager-node": "^2.x.x"
  },
  "dependencies": {
    "@cloudbase/node-sdk": "^2.x.x"
  }
}
```

### C. 相关文档链接

- [CloudBase 官方文档](https://docs.cloudbase.net/)
- [CloudBase Manager Node SDK](https://docs.cloudbase.net/api-reference/manager/node/introduction)
- [CloudBase Node SDK](https://docs.cloudbase.net/api-reference/server/node/introduction)
- [MySQL 数据库文档](https://dev.mysql.com/doc/)

---

**文档维护**: 如有问题或建议，请更新本文档并提交 PR。


















