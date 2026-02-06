# 数据库文档索引

> 快速找到你需要的文档

---

## 📚 文档分类

### 🎯 主要文档

| 文档 | 说明 | 适用场景 |
|-----|------|---------|
| [README.md](./README.md) | **完整数据库设计文档** | 查看整体设计、表结构、ER图 |
| [SDK_GUIDE.md](./SDK_GUIDE.md) | **SDK 操作指南** | 无 MCP 工具的环境（Claude Code） |
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | **命令速查卡** | 快速查找 CLI 命令 |
| [SCRIPTS_EXAMPLES.md](./SCRIPTS_EXAMPLES.md) | **脚本示例集合** | 批量操作、自动化脚本 |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | **部署检查清单** | 数据库部署时逐项勾选 |

### 📦 模块文档

| 模块 | 文档 | 表数量 | 说明 |
|-----|------|-------|------|
| 用户 | [01_用户模块.md](./01_用户模块.md) | 2张 | 用户信息、推荐关系 |
| 课程 | [02_课程模块.md](./02_课程模块.md) | 2张 | 课程管理、用户课程 |
| 订单 | [03_订单模块.md](./03_订单模块.md) | 1张 | 统一订单管理 |
| 预约 | [04_预约模块.md](./04_预约模块.md) | 2张 | 课程排期、预约签到 |
| 大使 | [05_大使模块.md](./05_大使模块.md) | 7张 | 大使体系完整设计 |
| 商学院 | [06_商学院商城模块.md](./06_商学院商城模块.md) | 5张 | 商学院、商城兑换 |
| 协议 | [07_协议模块.md](./07_协议模块.md) | 2张 | 协议管理 |
| 反馈 | [08_反馈消息模块.md](./08_反馈消息模块.md) | 3张 | 反馈、消息通知 |
| 后台 | [09_后台管理模块.md](./09_后台管理模块.md) | 4张 | 后台管理、系统配置 |

---

## 🔍 按场景查找

### 场景 1: 我是 Cursor/Windsurf 用户（有 MCP 工具）

**推荐阅读顺序**:
1. [README.md](./README.md) - 查看整体架构和 MCP 工具使用
2. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 按清单逐步部署
3. 各模块文档 - 查看具体表结构

**部署步骤**:
1. 使用 `mcp_cloudbase_executeWriteSQL` 执行建表 SQL
2. 使用 `mcp_cloudbase_writeSecurityRule` 配置安全规则
3. 使用 `mcp_cloudbase_executeReadOnlySQL` 验证部署

---

### 场景 2: 我是 Claude Code 用户（无 MCP 工具）

**推荐阅读顺序**:
1. [SDK_GUIDE.md](./SDK_GUIDE.md) - 完整的 SDK 使用指南
2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - 常用命令速查
3. [SCRIPTS_EXAMPLES.md](./SCRIPTS_EXAMPLES.md) - 复制脚本直接使用

**部署步骤**:
1. 安装 `@cloudbase/cli`
2. 使用 `cloudbase db:query` 执行建表 SQL
3. 使用 `cloudbase db:security:set` 配置安全规则
4. 或使用 Node.js 脚本一键部署

---

### 场景 3: 我需要快速查找命令

**直接访问**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

**常用命令**:
```bash
# 查看所有表
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "SHOW TABLES;"

# 查看表结构
cloudbase db:query -e cloud1-0gnn3mn17b581124 -s "DESCRIBE users;"

# 设置安全规则
cloudbase db:security:set \
  -e cloud1-0gnn3mn17b581124 \
  --table "tiandao_culture.users" \
  --rule "ADMINONLY"
```

---

### 场景 4: 我需要批量操作脚本

**直接访问**: [SCRIPTS_EXAMPLES.md](./SCRIPTS_EXAMPLES.md)

**可用脚本**:
- ✅ 批量建表脚本
- ✅ 安全规则配置脚本
- ✅ 部署验证脚本
- ✅ 数据初始化脚本

---

### 场景 5: 我要查看具体的表结构

**访问对应的模块文档**:

| 需要查看 | 访问文档 |
|---------|---------|
| 用户表、推荐关系 | [01_用户模块.md](./01_用户模块.md) |
| 课程表、用户课程 | [02_课程模块.md](./02_课程模块.md) |
| 订单表 | [03_订单模块.md](./03_订单模块.md) |
| 预约、签到 | [04_预约模块.md](./04_预约模块.md) |
| 大使相关（申请、配额、提现等）| [05_大使模块.md](./05_大使模块.md) |
| 商学院、商城 | [06_商学院商城模块.md](./06_商学院商城模块.md) |
| 协议签署 | [07_协议模块.md](./07_协议模块.md) |
| 反馈、消息 | [08_反馈消息模块.md](./08_反馈消息模块.md) |
| 后台管理、系统配置 | [09_后台管理模块.md](./09_后台管理模块.md) |

---

### 场景 6: 我要开发云函数

**推荐阅读**:
1. [README.md - 8.1.3 云函数目录结构](./README.md#813-云函数目录结构)
2. [SDK_GUIDE.md - 5. 云函数访问数据库](./SDK_GUIDE.md#5-云函数访问数据库)

**关键代码示例**:
```javascript
// 云函数初始化
const cloud = require('@cloudbase/node-sdk');
const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
const db = app.database();

// 执行 SQL
const result = await db.runTransaction(async transaction => {
  return await transaction.collection('_sqlExecute_').add({
    sql: 'SELECT * FROM users WHERE _openid = ?',
    params: [openid]
  });
});
```

---

### 场景 7: 我遇到了部署问题

**故障排查顺序**:
1. [SDK_GUIDE.md - 8. 故障排查](./SDK_GUIDE.md#8-故障排查)
2. [README.md - 8.10 常见问题](./README.md#810-常见问题)
3. [QUICK_REFERENCE.md - 故障排查](./QUICK_REFERENCE.md#故障排查)

**常见问题**:
- ❓ 连接失败 → 检查登录状态和网络
- ❓ 权限拒绝 → 检查安全规则配置
- ❓ SQL 执行错误 → 检查语法和字段名
- ❓ 表已存在 → 使用 `IF NOT EXISTS`

---

## 📊 文档关系图

```
README.md (主文档)
    │
    ├─→ SDK_GUIDE.md (无 MCP 工具环境)
    │       │
    │       ├─→ QUICK_REFERENCE.md (命令速查)
    │       └─→ SCRIPTS_EXAMPLES.md (脚本示例)
    │
    ├─→ DEPLOYMENT_CHECKLIST.md (部署清单)
    │
    └─→ 模块文档 (01-09)
            ├─→ 01_用户模块.md
            ├─→ 02_课程模块.md
            ├─→ 03_订单模块.md
            ├─→ 04_预约模块.md
            ├─→ 05_大使模块.md
            ├─→ 06_商学院商城模块.md
            ├─→ 07_协议模块.md
            ├─→ 08_反馈消息模块.md
            └─→ 09_后台管理模块.md
```

---

## 🎯 快速决策树

```
开始
 │
 ├─ 有 MCP 工具？
 │   ├─ 是 → README.md (使用 MCP 工具方法)
 │   └─ 否 → ↓
 │
 ├─ 需要批量操作？
 │   ├─ 是 → SCRIPTS_EXAMPLES.md (使用 Node.js 脚本)
 │   └─ 否 → ↓
 │
 ├─ 只需要简单命令？
 │   ├─ 是 → QUICK_REFERENCE.md (查找 CLI 命令)
 │   └─ 否 → ↓
 │
 └─ 需要完整说明？
     └─ 是 → SDK_GUIDE.md (完整 SDK 指南)
```

---

## 📞 获取帮助

### 文档问题
- 查看 [README.md - 10. 变更记录](./README.md#10-变更记录)
- 查看 [UPDATE_SUMMARY.md](./UPDATE_SUMMARY.md) 了解最新更新

### 技术问题
- 查看对应文档的"故障排查"章节
- 参考 [CloudBase 官方文档](https://docs.cloudbase.net/)

---

**最后更新**: 2026-02-04 | **文档版本**: V1.8

