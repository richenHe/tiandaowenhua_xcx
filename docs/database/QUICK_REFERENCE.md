# CloudBase 数据库操作速查卡

> 快速参考 - 适用于 Claude Code 等无 MCP 工具的环境

---

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装 CLI
npm install -g @cloudbase/cli

# 登录
cloudbase login

# 查看环境列表
cloudbase env:list

# 切换到目标环境
cloudbase env:switch cloud1-0gnn3mn17b581124
```

### 2. 创建数据库

```bash
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
CREATE DATABASE IF NOT EXISTS tiandao_culture
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
"
```

---

## 📊 常用 SQL 命令

### 查询类

```bash
# 查看所有表
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "SHOW TABLES;"

# 查看表结构
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "DESCRIBE users;"

# 查看建表语句
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "SHOW CREATE TABLE users;"

# 查询表数据
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "SELECT * FROM users LIMIT 10;"

# 统计表数量
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'tiandao_culture';
"

# 检查 _openid 字段
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'tiandao_culture' AND column_name = '_openid';
"
```

### 创建类

```bash
# 从文件创建表
cloudbase db:query -e cloud1-0gnn3mn17b581124 -f ./create-table.sql

# 创建单表（示例）
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  _openid VARCHAR(64) DEFAULT '' NOT NULL,
  name VARCHAR(50) DEFAULT '' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_openid (_openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"

# 添加索引
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
CREATE INDEX idx_phone ON users(phone);
"
```

### 修改类

```bash
# 添加字段
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
ALTER TABLE users ADD COLUMN email VARCHAR(100);
"

# 修改字段
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
ALTER TABLE users MODIFY COLUMN phone VARCHAR(20);
"

# 删除字段
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
ALTER TABLE users DROP COLUMN email;
"
```

---

## 🔒 安全规则配置

### 查看安全规则

```bash
# 查看所有表的安全规则
cloudbase db:security:list -e cloud1-0gnn3mn17b581124

# 查看特定表的安全规则
cloudbase db:security:get \
  -e cloud1-0gnn3mn17b581124 \
  --table "tiandao_culture.users"
```

### 设置安全规则

```bash
# 设置单表为 ADMINONLY
cloudbase db:security:set \
  -e cloud1-0gnn3mn17b581124 \
  --table "tiandao_culture.users" \
  --rule "ADMINONLY"

# 批量设置（使用脚本）
# 参考 docs/database/SDK_GUIDE.md#4-安全规则配置
```

---

## 📦 批量操作脚本

### 批量建表脚本

创建 `scripts/create-tables.sh`：

```bash
#!/bin/bash

ENV_ID="cloud1-0gnn3mn17b581124"
DOCS_PATH="./docs/database"

# 模块列表（按依赖顺序）
MODULES=(
  "01_用户模块"
  "02_课程模块"
  "03_订单模块"
  "04_预约模块"
  "05_大使模块"
  "06_商学院商城模块"
  "07_协议模块"
  "08_反馈消息模块"
  "09_后台管理模块"
)

echo "🚀 开始创建数据库表..."

# 创建数据库
cloudbase db:query -e $ENV_ID -s "
CREATE DATABASE IF NOT EXISTS tiandao_culture
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
"

# 遍历模块
for module in "${MODULES[@]}"; do
  echo "📦 处理模块: $module"
  
  # 提取并执行 CREATE TABLE 语句
  # 需要手动从 markdown 提取 SQL 或使用专门的提取脚本
  
done

echo "✅ 完成！"
```

### 批量设置安全规则脚本

创建 `scripts/set-security.sh`：

```bash
#!/bin/bash

ENV_ID="cloud1-0gnn3mn17b581124"
DATABASE="tiandao_culture"

# 所有28张表
TABLES=(
  "users" "referee_change_logs"
  "courses" "user_courses"
  "orders"
  "class_records" "appointments"
  "ambassador_applications" "ambassador_quotas" "quota_usage_records"
  "merit_points_records" "cash_points_records" "withdrawals" "ambassador_upgrade_logs"
  "academy_intro" "academy_materials" "academy_cases"
  "mall_goods" "mall_exchange_records"
  "contract_templates" "contract_signatures"
  "feedbacks" "notification_configs" "notification_logs"
  "admin_users" "admin_operation_logs" "system_configs" "announcements"
)

echo "🔒 开始配置安全规则..."

for table in "${TABLES[@]}"; do
  echo "设置 $table 为 ADMINONLY..."
  
  cloudbase db:security:set \
    -e $ENV_ID \
    --table "$DATABASE.$table" \
    --rule "ADMINONLY"
  
  if [ $? -eq 0 ]; then
    echo "✅ $table"
  else
    echo "❌ $table"
  fi
done

echo "✅ 完成！"
```

**运行脚本：**

```bash
chmod +x scripts/set-security.sh
./scripts/set-security.sh
```

---

## 🔍 验证命令

### 验证表创建

```bash
# 检查表数量（应该是28张）
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
SELECT COUNT(*) as count FROM information_schema.tables
WHERE table_schema = 'tiandao_culture';
"

# 列出所有表
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'tiandao_culture'
ORDER BY table_name;
"
```

### 验证 _openid 字段

```bash
# 检查所有包含 _openid 的表（应该约15张）
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
SELECT table_name FROM information_schema.columns
WHERE table_schema = 'tiandao_culture' AND column_name = '_openid'
ORDER BY table_name;
"
```

### 验证字符集

```bash
# 检查数据库字符集
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME = 'tiandao_culture';
"

# 检查表字符集
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "
SELECT table_name, table_collation
FROM information_schema.tables
WHERE table_schema = 'tiandao_culture';
"
```

---

## 🛠️ 故障排查

### 连接问题

```bash
# 检查登录状态
cloudbase login --status

# 重新登录
cloudbase logout
cloudbase login

# 检查环境信息
cloudbase env:list
```

### SQL 执行失败

```bash
# 查看错误详情（使用 --verbose）
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "SHOW TABLES;" --verbose

# 检查 SQL 语法
# 使用在线工具或本地 MySQL 客户端验证
```

### 权限问题

```bash
# 检查当前用户权限
cloudbase user:info

# 检查环境权限
cloudbase env:domain:list -e cloud1-0gnn3mn17b581124
```

---

## 📚 相关文档

- **[完整 SDK 操作指南](./SDK_GUIDE.md)** - 详细的 SDK 使用说明
- **[数据库设计文档](./README.md)** - 完整的数据库设计
- **[部署检查清单](./DEPLOYMENT_CHECKLIST.md)** - 部署步骤速查

---

## 💡 提示

### 环境变量设置

创建 `.env` 文件简化命令：

```bash
# .env
CLOUDBASE_ENV_ID=cloud1-0gnn3mn17b581124
CLOUDBASE_DATABASE=tiandao_culture
```

使用时：

```bash
# 加载环境变量
export $(cat .env | xargs)

# 简化命令
cloudbase db:query -e $CLOUDBASE_ENV_ID -s "SHOW TABLES;"
```

### 别名设置

在 `.bashrc` 或 `.zshrc` 中添加：

```bash
# CloudBase 别名
alias cbq='cloudbase db:query -e cloud1-0gnn3mn17b581124'
alias cbs='cloudbase db:security'

# 使用
cbq -s "SHOW TABLES;"
cbs:list -e cloud1-0gnn3mn17b581124
```

---

**最后更新**: 2026-02-04








