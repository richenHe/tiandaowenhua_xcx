# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

**天道文化小程序** - 基于 UniApp + 腾讯云开发的跨平台应用，用于孙膑道天道文化课程的线上销售、学习管理和推广。

仓库包含两个子项目：
- `universal-cloudbase-uniapp-template/` - 实际开发项目（UniApp + 云开发）
- `prototype-tdesign/` - 原型设计（静态 HTML/CSS）

## 常用命令

### UniApp 项目（实际开发）

```bash
# 进入项目目录
cd universal-cloudbase-uniapp-template

# 安装依赖
npm install

# H5 开发（默认）
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin

# 支付宝小程序开发
npm run dev:mp-alipay

# 抖音小程序开发
npm run dev:mp-toutiao

# 构建 H5 生产版本
npm run build:h5

# 构建微信小程序
npm run build:mp-weixin

# 类型检查
npm run type-check
```

### 原型设计项目

```bash
cd prototype-tdesign

# 启动本地服务器
python -m http.server 8000
# 或
npx serve

# 访问地址
http://localhost:8000
```

## 技术栈

### UniApp 项目
- **框架**: UniApp (Vue 3 Composition API)
- **构建工具**: Vite
- **语言**: TypeScript
- **后端服务**: 腾讯云开发 CloudBase
- **多端支持**: H5、微信小程序、支付宝小程序、抖音小程序、App

### 原型设计
- **技术**: HTML5 + CSS3（纯静态）
- **设计规范**: TDesign
- **设备模拟**: iPhone 15 Pro 外壳

## 项目架构

### UniApp 项目结构

```
universal-cloudbase-uniapp-template/
├── src/
│   ├── components/          # Vue 组件
│   ├── pages/               # 页面文件
│   │   ├── index/           # 首页
│   │   ├── login/           # 登录模块
│   │   └── profile/         # 个人中心
│   ├── utils/               # 工具函数
│   │   ├── cloudbase.ts     # 云开发配置
│   │   └── index.ts         # 通用工具
│   ├── static/              # 静态资源
│   ├── App.vue              # 应用入口
│   ├── main.ts              # 入口文件
│   ├── pages.json           # 页面路由
│   └── manifest.json        # 应用配置
├── cloudfunctions/          # 云函数
├── vite.config.ts           # Vite 配置
├── tsconfig.json            # TypeScript 配置
└── cloudbaserc.json         # CloudBase CLI 配置
```

### 原型设计结构

```
prototype-tdesign/
├── styles/                  # 样式文件
│   ├── tdesign-theme.css    # TDesign 主题变量
│   ├── reset.css            # 样式重置
│   └── common.css           # 公共样式
├── components/              # CSS 组件库
│   ├── button.css           # 按钮
│   ├── card.css             # 卡片
│   ├── input.css            # 输入框
│   ├── tabs.css             # 标签页
│   ├── badge.css            # 徽章
│   ├── avatar.css           # 头像
│   ├── dialog.css           # 对话框
│   └── device.css           # iPhone 外壳
├── pages/                   # 页面（按功能模块分组）
│   ├── auth/                # 授权登录 (2页)
│   ├── index/               # 首页 (1页)
│   ├── course/              # 课程模块 (4页)
│   ├── order/               # 订单模块 (4页)
│   ├── mine/                # 个人中心 (8页)
│   ├── ambassador/          # 大使系统 (11页)
│   ├── academy/             # 商学院 (3页)
│   ├── mall/                # 商城 (1页)
│   └── common/              # 公共页面 (1页)
├── playground/              # 组件展示
├── index.html               # 主入口
└── DESIGN_GUIDE.md          # 设计规范文档
```

## 云开发配置

在 `src/utils/cloudbase.ts` 中配置环境 ID：

```typescript
const ENV_ID = 'your-env-id'; // 替换为实际环境ID
```

云开发资源使用：
- **身份认证**: 匿名登录、短信/邮箱验证码、密码登录、微信小程序登录
- **云数据库**: NoSQL 数据库存储业务数据
- **云函数**: 处理服务端逻辑
- **云存储**: 文件上传下载

## 设计规范

### TDesign 颜色变量

```css
--td-brand-color: #0052D9;          /* 主品牌色 */
--td-brand-color-light: #266FE8;    /* 品牌色-浅 */
--td-bg-color-page: #F5F5F5;        /* 页面背景 */
--td-bg-color-container: #FFFFFF;   /* 容器背景 */
--td-warning-color: #D4AF37;        /* 金色(价格/徽章) */
```

### 间距规范
- 页面边距：16px
- 卡片间距：12px
- 区块间距：24px

## 文档创建确认原则

### 强制执行规则

**创建任何文档（.md、.txt、README 等）前必须先向用户确认**

**新增代码时要添加注释**

**必读文档：`docs/database/数据库详细信息.md`，每次对话开始或收到新任务时，立即读取上述文档**

### 确认内容

在创建文档前，必须向用户确认以下信息：

1. **文档名称和路径**
   - 完整的文件路径
   - 文件名称和格式

2. **文档用途和必要性**
   - 为什么需要这个文档
   - 文档的主要内容是什么
   - 是否有替代方案

3. **预计内容大小**
   - 预计页数或字数
   - 是否会消耗大量 token

### 例外情况

以下情况可以直接创建，无需确认：

1. **用户明确要求创建的文档**
   - 用户直接说"创建 XXX 文档"
   - 用户提供了具体的文档需求

2. **项目必需的配置文件**
   - `package.json`
   - `.gitignore`
   - `.env.example`
   - `tsconfig.json`
   - `vite.config.ts`
   - 等标准配置文件

3. **代码注释和 JSDoc**
   - 函数注释
   - 类注释
   - 行内注释
   - 这些不属于独立文档

### 目的

- **避免创建无关文档**：防止创建用户不需要的文档
- **节省 token 消耗**：大型文档会消耗大量 token
- **提高工作效率**：专注于用户真正需要的内容
- **保持项目整洁**：避免文档泛滥

### 示例

**❌ 错误做法**：
```
用户：实现支付功能
助手：我来创建支付功能文档、测试文档、部署文档...
（直接创建了10+个文档，消耗大量 token）
```

**✅ 正确做法**：
```
用户：实现支付功能
助手：我已完成支付功能的代码实现。是否需要我创建以下文档？
1. 支付功能说明文档（约5页）
2. 测试指南（约3页）
3. 部署文档（约2页）
请告诉我需要哪些文档。
```

### 特殊说明

- 如果用户说"编写代码"，默认只编写代码，不创建文档
- 如果用户说"完整实现"，可以询问是否需要文档
- 如果用户说"生成文档"，则可以直接创建文档
- 对于已经创建的文档，可以继续更新和完善

## 相关资源

- [UniApp 文档](https://uniapp.dcloud.io/)
- [云开发文档](https://cloud.tencent.com/document/product/876)
- [TDesign 官网](https://tdesign.tencent.com/)
