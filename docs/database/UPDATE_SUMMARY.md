# 云数据库文档更新说明

> 更新日期：2026-02-04
> 更新版本：V1.8
> 更新目的：支持 Claude Code 等无 MCP 工具的开发环境

---

## 📋 更新概述

本次更新为云数据库指南新增了**三份重要文档**，确保在无法使用 MCP 工具的环境下（如 Claude Code），开发者仍能通过 SDK 和 CLI 完成所有数据库操作。

---

## 🆕 新增文档

### 1. SDK_GUIDE.md - CloudBase 数据库 SDK 操作指南

**文件路径**: `docs/database/SDK_GUIDE.md`

**适用场景**:
- ✅ Claude Code 等无 MCP 工具的 AI 编辑器
- ✅ 本地开发脚本
- ✅ CI/CD 自动化流程
- ✅ 需要批量操作的场景

**主要内容**:
1. **数据库访问方式对比**
   - MCP 工具 vs Manager SDK vs 云函数 vs 前端 SDK

2. **CloudBase Manager SDK 使用**
   - 安装和初始化
   - 密钥获取和配置
   - 基础使用示例

3. **执行 SQL 语句**
   - 使用 Manager SDK 执行 SQL
   - 使用 CloudBase CLI 执行 SQL
   - 批量建表脚本示例

4. **安全规则配置**
   - 使用 CLI 配置
   - 使用 Node.js SDK 配置
   - 批量配置脚本

5. **云函数访问数据库**
   - 云函数 SDK 初始化
   - 完整的 CRUD 示例
   - 事务处理示例

6. **小程序端访问**
   - 前端 SDK 初始化
   - 调用云函数的推荐方式

7. **常见操作示例**
   - 分页查询
   - 事务处理
   - 联表查询

8. **故障排查**
   - 连接问题
   - 权限问题
   - SQL 执行错误
   - 性能优化

---

### 2. QUICK_REFERENCE.md - CloudBase 数据库操作速查卡

**文件路径**: `docs/database/QUICK_REFERENCE.md`

**适用场景**:
- ✅ 快速查找命令
- ✅ 命令行操作
- ✅ 日常运维
- ✅ 故障排查

**主要内容**:
1. **快速开始**
   - 环境准备
   - 创建数据库

2. **常用 SQL 命令**
   - 查询类命令
   - 创建类命令
   - 修改类命令

3. **安全规则配置**
   - 查看安全规则
   - 设置安全规则

4. **批量操作脚本**
   - 批量建表脚本（Shell）
   - 批量设置安全规则脚本（Shell）

5. **验证命令**
   - 验证表创建
   - 验证 _openid 字段
   - 验证字符集

6. **故障排查**
   - 连接问题
   - SQL 执行失败
   - 权限问题

7. **提示技巧**
   - 环境变量设置
   - 命令别名配置

---

### 3. SCRIPTS_EXAMPLES.md - CloudBase 数据库管理脚本示例

**文件路径**: `docs/database/SCRIPTS_EXAMPLES.md`

**适用场景**:
- ✅ Node.js 脚本自动化
- ✅ 复杂的批量操作
- ✅ 可复用的管理工具
- ✅ CI/CD 集成

**主要内容**:
1. **目录结构**
   - 推荐的脚本组织方式

2. **数据库管理器** (db-manager.js)
   - 封装的数据库操作类
   - 常用方法：query、batchQuery、tableExists 等

3. **SQL 提取工具** (sql-extractor.js)
   - 从 Markdown 提取 SQL 语句
   - 自动识别 CREATE TABLE 和 INSERT 语句

4. **批量建表脚本** (create-all-tables.js)
   - 自动读取模块文档
   - 提取并执行建表语句
   - 结果统计和错误处理

5. **安全规则配置脚本** (set-security-rules.js)
   - 批量设置所有表为 ADMINONLY
   - 进度显示和错误处理

6. **部署验证脚本** (verify-deployment.js)
   - 验证表数量
   - 验证 _openid 字段
   - 验证字符集和排序规则

7. **数据初始化脚本** (seed-data.js)
   - 插入系统配置
   - 插入课程数据
   - 插入通知配置

8. **package.json 配置**
   - npm 脚本配置
   - 一键部署命令

9. **环境变量配置**
   - .env 文件示例
   - 密钥管理

10. **使用方法**
    - 安装依赖
    - 一键部署
    - 分步执行

---

## 🔄 现有文档更新

### README.md 更新内容

1. **新增文档导航区块**
   - 在文档开头添加了三份新文档的快速链接
   - 清晰标注适用场景和主要内容

2. **更新版本号**
   - 从 V1.7 升级到 V1.8

3. **更新 8.5 章节 - 执行 SQL**
   - 新增"SQL 执行方法概览"对比表
   - 新增"方法 2: 使用 CloudBase CLI"
   - 新增"方法 3: 使用 Manager SDK"
   - 新增"方法 4: 使用 Web 控制台"
   - 原有的 MCP 工具方法重命名为"方法 1"

4. **更新 8.6 章节 - 配置安全规则**
   - 新增"配置方法"小节
   - 新增"方法 1: 使用 MCP 工具"
   - 新增"方法 2: 使用 CloudBase CLI"
   - 新增"方法 3: 使用 Manager SDK"
   - 添加各方法的示例代码

5. **更新变更记录**
   - 添加 V1.8 版本记录
   - 说明文档增强内容

6. **更新相关文档列表**
   - 在文档末尾添加新文档的链接

---

## 📊 文档结构对比

### 更新前
```
docs/database/
├── README.md                         # 主文档（仅 MCP 工具说明）
├── DEPLOYMENT_CHECKLIST.md          # 部署清单
├── 01_用户模块.md
├── 02_课程模块.md
├── ... (其他模块文档)
└── 09_后台管理模块.md
```

### 更新后
```
docs/database/
├── README.md                         # 主文档（✨ 增强版）
├── SDK_GUIDE.md                      # 🆕 SDK 完整操作指南
├── QUICK_REFERENCE.md                # 🆕 命令速查卡
├── SCRIPTS_EXAMPLES.md               # 🆕 脚本示例集合
├── DEPLOYMENT_CHECKLIST.md          # 部署清单
├── 01_用户模块.md
├── 02_课程模块.md
├── ... (其他模块文档)
└── 09_后台管理模块.md
```

---

## 🎯 解决的问题

### 1. Claude Code 等 AI 编辑器无法使用 MCP 工具

**问题**: Claude Code、Aider、Qoder 等 AI 编辑器不支持 MCP 协议，无法使用 `mcp_cloudbase_*` 系列工具。

**解决方案**:
- ✅ 提供 CloudBase CLI 完整命令
- ✅ 提供 Manager SDK 代码示例
- ✅ 提供批量操作脚本

### 2. 缺少命令行操作指引

**问题**: 原文档主要基于 MCP 工具，缺少纯命令行操作方法。

**解决方案**:
- ✅ 新增 QUICK_REFERENCE.md 速查卡
- ✅ 提供所有常用命令的 CLI 版本
- ✅ 提供 Shell 脚本示例

### 3. 缺少可复用的管理脚本

**问题**: 每次操作都需要手动执行，效率低且容易出错。

**解决方案**:
- ✅ 新增 SCRIPTS_EXAMPLES.md 脚本集合
- ✅ 提供批量建表、配置安全规则等完整脚本
- ✅ 支持一键部署

### 4. SDK 使用说明分散

**问题**: SDK 使用方法散落在各处，缺少系统性说明。

**解决方案**:
- ✅ 新增 SDK_GUIDE.md 完整指南
- ✅ 涵盖 Manager SDK、云函数 SDK、前端 SDK
- ✅ 提供完整的 CRUD 示例和故障排查

---

## 🚀 使用指南

### 对于 Cursor/Windsurf 用户（有 MCP 工具）

**推荐使用顺序**:
1. 主要使用 `README.md` 中的 MCP 工具方法（最简单）
2. 遇到问题时参考 `SDK_GUIDE.md` 的故障排查章节

### 对于 Claude Code 用户（无 MCP 工具）

**推荐使用顺序**:
1. **首次部署**: 阅读 `SDK_GUIDE.md` → 使用 `SCRIPTS_EXAMPLES.md` 中的脚本
2. **日常操作**: 使用 `QUICK_REFERENCE.md` 速查命令
3. **复杂操作**: 参考 `SDK_GUIDE.md` 的完整示例

### 对于命令行用户

**推荐使用顺序**:
1. **快速查命令**: 使用 `QUICK_REFERENCE.md`
2. **批量操作**: 使用 Shell 脚本（在 QUICK_REFERENCE.md 中）
3. **自动化**: 使用 Node.js 脚本（在 SCRIPTS_EXAMPLES.md 中）

---

## ✅ 验证清单

更新后，请确认以下功能可用：

- [ ] 可以通过 CloudBase CLI 执行 SQL
- [ ] 可以通过 Manager SDK 执行 SQL
- [ ] 可以批量创建所有 28 张表
- [ ] 可以批量配置安全规则为 ADMINONLY
- [ ] 可以验证部署结果
- [ ] 可以初始化基础数据
- [ ] 云函数可以正常访问数据库
- [ ] 前端可以通过云函数访问数据

---

## 📝 注意事项

1. **密钥安全**
   - 不要将 `.env` 文件提交到 Git
   - 使用环境变量管理 SecretId 和 SecretKey
   - 定期轮换密钥

2. **执行顺序**
   - 必须先创建表，再配置安全规则
   - 推荐使用一键部署脚本避免遗漏步骤

3. **兼容性**
   - 所有脚本都支持重复执行（幂等性）
   - 使用 `IF NOT EXISTS` 避免重复创建
   - 使用 `ON DUPLICATE KEY UPDATE` 避免数据冲突

4. **版本要求**
   - Node.js >= 14
   - @cloudbase/cli >= 1.x
   - @cloudbase/manager-node >= 2.x

---

## 🔗 快速链接

- [SDK 操作指南](./SDK_GUIDE.md)
- [快速参考卡](./QUICK_REFERENCE.md)
- [脚本示例](./SCRIPTS_EXAMPLES.md)
- [主文档](./README.md)
- [部署清单](./DEPLOYMENT_CHECKLIST.md)

---

**更新完成！** 现在无论使用哪种开发环境，都能轻松完成云数据库的部署和管理。











