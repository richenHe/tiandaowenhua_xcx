# 云函数目录

## 项目结构

本项目包含以下云函数模块：

- **user** - 用户模块（用户资料、认证、积分等）
- **order** - 订单模块（订单创建、支付、管理等）
- **course** - 课程模块（课程管理、预约、班次等）
- **ambassador** - 大使模块（大使认证、升级、提现等）
- **system** - 系统模块（系统配置、公告、管理后台等）
- **callbacks** - 回调函数（支付回调、消息推送等）

## 管理后台登录凭证

### 测试账号

**账号 1：**
- 用户名：`herichen`
- 密码：`tiandaowenhua`

**账号 2：**
- 用户名：`admin`
- 密码：`admin123`

**JWT_SECRET**:
tiandao_culture_admin_jwt_secret_key_2026_very_secure_32chars

> ⚠️ **注意**：以上为测试环境账号，生产环境请使用强密码并定期更换。

## 开发规范

请参考项目根目录下的 `.cursorrules` 文件，了解详细的开发规范：

- 字段命名规范（前端驼峰命名，数据库下划线命名）
- 云函数开发规范（运行时版本、目录结构、路由架构等）
- 数据库操作规范（统一使用 Query Builder）
- 公共代码同步部署规范

## 部署说明

### 环境要求
- Node.js 运行时：`Nodejs14.18`（与依赖层兼容）
- 依赖层：
  - `common-layer` (version 2)
  - `business-logic-layer` (version 1)

### 部署流程
1. 修改云函数代码
2. 如修改了 `common/` 或 `business-logic/` 目录，需同步到所有云函数
3. 使用 MCP 工具 `updateFunctionCode` 批量更新云函数

### 快速命令
```bash
# 查看云函数列表
tcb fn list

# 查看云函数详情
tcb fn detail --name <函数名>

# 查看云函数日志
tcb fn log --name <函数名>
```

## 数据库配置

**业务数据库**：`tiandao_culture`

所有业务表统一存放在此数据库中，MCP 查询时必须明确指定数据库名。

### 关键表
- `users` - 用户表
- `orders` - 订单表
- `courses` - 课程表
- `user_courses` - 用户课程关联表
- `appointments` - 预约表
- `ambassadors` - 大使表
- `withdraw_requests` - 提现申请表
- `announcements` - 公告表

## 常见问题

### Q1：运行时版本不匹配错误
A1：删除函数后使用 `Nodejs14.18` 重新创建

### Q2：数据库查询失败
A2：确认查询的是 `tiandao_culture` 数据库，而非环境数据库

### Q3：公共代码修改后如何同步
A3：参考"公共代码同步部署规范"，使用 `updateFunctionCode` 批量更新 5 个云函数（user、order、course、ambassador、system）

## 相关文档

- [云函数标准部署规范](./云函数标准部署规范.md)
- [同步函数说明](./sync-functions.md)
- [更新日志](./CHANGELOG.md)
- [各模块 API 文档](./*/API文档.md)

## 技术支持

如遇到问题，请查看：
1. 项目开发规范（`.cursorrules`）
2. 各云函数的"开发报告.md"
3. CloudBase 控制台日志





