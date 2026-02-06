# 数据库部署检查清单

> **版本**: V1.1  
> **日期**: 2026-02-04  
> **适用于**: 天道文化小程序数据库部署
>
> **CloudBase 环境信息**：
> - 环境 ID: `cloud1-0gnn3mn17b581124`
> - 环境别名: `cloud1`
> - MySQL 实例: `tnt-e300s320g`
> - 区域: `ap-shanghai`

---

## 📋 部署前准备

### 必需信息

- [x] CloudBase 环境 ID: `cloud1-0gnn3mn17b581124`
- [x] 数据库名称: `tiandao_culture`
- [x] 字符集: `utf8mb4`
- [x] 排序规则: `utf8mb4_unicode_ci`
- [ ] 已登录 CloudBase MCP 环境

### 文档准备

- [ ] 已打开 `docs/database/README.md`
- [ ] 已准备好 9 个模块文档（01-09）
- [ ] 已了解建表 SQL 在各模块文档的 "2. 表结构" 章节

---

## 🚀 快速部署步骤

### 步骤 1：创建数据库

```sql
CREATE DATABASE IF NOT EXISTS tiandao_culture
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tiandao_culture;
SET time_zone = '+08:00';
```

### 步骤 2：按顺序创建表

**⚠️ 重要：必须按以下顺序执行，因为存在依赖关系**

| 顺序 | 模块 | 文档路径 | 表数量 | 完成 |
|-----|------|---------|-------|-----|
| 1 | 用户模块 | [01_用户模块.md](./01_用户模块.md) | 2张 | [ ] |
| 2 | 课程模块 | [02_课程模块.md](./02_课程模块.md) | 2张 | [ ] |
| 3 | 订单模块 | [03_订单模块.md](./03_订单模块.md) | 1张 | [ ] |
| 4 | 预约模块 | [04_预约模块.md](./04_预约模块.md) | 2张 | [ ] |
| 5 | 大使模块 | [05_大使模块.md](./05_大使模块.md) | 7张 | [ ] |
| 6 | 商学院商城 | [06_商学院商城模块.md](./06_商学院商城模块.md) | 5张 | [ ] |
| 7 | 协议模块 | [07_协议模块.md](./07_协议模块.md) | 2张 | [ ] |
| 8 | 反馈消息 | [08_反馈消息模块.md](./08_反馈消息模块.md) | 3张 | [ ] |
| 9 | 后台管理 | [09_后台管理模块.md](./09_后台管理模块.md) | 4张 | [ ] |

**总计：28 张表**

### 步骤 3：验证表创建

```sql
-- 1. 检查表数量（应该是 28）
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'tiandao_culture';

-- 2. 列出所有表
SHOW TABLES;

-- 3. 检查关键表的结构
DESCRIBE users;
DESCRIBE courses;
DESCRIBE orders;
```

### 步骤 4：验证 _openid 字段

```sql
-- 检查所有包含 _openid 字段的表
SELECT table_name, column_name 
FROM information_schema.columns
WHERE table_schema = 'tiandao_culture' 
  AND column_name = '_openid'
ORDER BY table_name;
```

**应该包含以下表（约 15 张）：**
- users, user_courses, orders, appointments
- ambassador_applications, ambassador_quotas, quota_usage_records
- merit_points_records, cash_points_records, withdrawals
- mall_exchange_records, contract_signatures, feedbacks
- notification_logs

### 步骤 5：配置安全规则（强制要求）

> **⚠️ 重要说明**：本项目采用**云函数架构**，前端不直接访问数据库。
> 数据库安全规则作为**防御层**，防止意外的直接访问。
> 
> **真正的权限控制在云函数内部实现！**
> 
> **配置方案（唯一）**：所有表统一设为 `ADMINONLY`

**将所有 28 张表设为 ADMINONLY（强制要求）**

```javascript
// 所有表的完整列表
const tables = [
  // 用户模块（2张表）
  'users', 'referee_change_logs',
  // 课程模块（2张表）
  'courses', 'user_courses',
  // 订单模块（1张表）
  'orders',
  // 预约模块（2张表）
  'class_records', 'appointments',
  // 大使模块（7张表）
  'ambassador_applications', 'ambassador_quotas', 'quota_usage_records',
  'merit_points_records', 'cash_points_records', 'withdrawals', 'ambassador_upgrade_logs',
  // 商学院/商城模块（5张表）
  'academy_intro', 'academy_materials', 'academy_cases',
  'mall_goods', 'mall_exchange_records',
  // 协议模块（2张表）
  'contract_templates', 'contract_signatures',
  // 反馈/消息模块（3张表）
  'feedbacks', 'notification_configs', 'notification_logs',
  // 后台管理模块（4张表）
  'admin_users', 'admin_operation_logs', 'system_configs', 'announcements'
];

// 批量设置安全规则
for (const tableName of tables) {
  mcp_cloudbase_writeSecurityRule({
    resourceType: "sqlDatabase",
    resourceId: tableName,
    aclTag: "ADMINONLY"
  });
}
```

**✅ 优势：**
- 最安全，前端无法通过 SDK 直接访问
- 强制所有操作通过云函数
- 防止意外泄露和误操作
- 云函数拥有管理员权限，不受影响
- 符合本项目的架构设计

### 步骤 6：插入初始数据

```sql
-- 系统配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('points_to_cash_ratio', '100', '积分兑换现金比例：100积分=1元'),
('retrain_price_ratio', '0.3', '复训价格比例：课程原价的30%'),
('merit_points_ratio', '0.1', '功德分比例：订单金额的10%');

-- 课程数据
INSERT INTO courses (name, type, current_price, retrain_price, description) VALUES
('初探班', 1, 9800.00, 2940.00, '基础课程介绍...'),
('密训班', 2, 19800.00, 5940.00, '进阶课程介绍...');

-- 更多初始数据...
```

---

## ✅ 部署验证检查

### 数据库级别

- [ ] 数据库字符集为 utf8mb4
- [ ] 数据库排序规则为 utf8mb4_unicode_ci
- [ ] 时区设置为 +08:00

### 表级别

- [ ] 共创建 28 张表
- [ ] 所有表的字符集和排序规则正确
- [ ] 所有表都有主键 (id)
- [ ] 必需的表都有 _openid 字段
- [ ] 所有索引创建成功

### 安全规则

- [ ] 所有 28 张表已配置为 ADMINONLY
- [ ] 验证云函数仍可正常访问数据库
- [ ] 确认前端 SDK 无法直接访问数据库

### 数据初始化

- [ ] 系统配置数据已插入
- [ ] 课程基础数据已插入
- [ ] 管理员账号已创建（如需要）

---

## 🔧 常见问题处理

### 问题 1：表已存在

```sql
-- 方案 A：删除重建（谨慎！）
DROP TABLE IF EXISTS table_name;

-- 方案 B：使用 IF NOT EXISTS
CREATE TABLE IF NOT EXISTS table_name (...);
```

### 问题 2：字符集错误

```sql
-- 检查并修改表字符集
ALTER TABLE table_name CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 问题 3：缺少 _openid 字段

```sql
-- 添加 _openid 字段
ALTER TABLE table_name ADD COLUMN _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT 'CloudBase 用户标识';
```

### 问题 4：部署过程中断

1. 检查已创建的表：`SHOW TABLES;`
2. 对比模块文档，找到中断位置
3. 从中断位置继续执行后续模块

---

## 📝 部署记录

**部署人员：** `_________________`  
**部署日期：** `_________________`  
**环境 ID：** `cloud1-0gnn3mn17b581124`  
**环境别名：** `cloud1`  
**MySQL 实例：** `tnt-e300s320g`  
**部署结果：** `□ 成功  □ 失败`

**遇到的问题：**

```
（记录部署过程中遇到的问题和解决方案）
```

**备注：**

```
（其他需要记录的信息）
```

---

## 📚 相关文档

- [README.md](./README.md) - 完整数据库设计文档
- [01_用户模块.md](./01_用户模块.md) - 用户模块详细设计
- [02_课程模块.md](./02_课程模块.md) - 课程模块详细设计
- [03-09 其他模块文档](./README.md#4-模块文档索引)

---

**下一步：**
- [ ] 创建云函数层（database-utils, common-utils 等）
- [ ] 创建核心云函数并绑定层
- [ ] 测试数据库连接和基本 CRUD 操作
- [ ] 配置云函数的环境变量
- [ ] 进行端到端测试

