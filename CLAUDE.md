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

## 相关资源

- [UniApp 文档](https://uniapp.dcloud.io/)
- [云开发文档](https://cloud.tencent.com/document/product/876)
- [TDesign 官网](https://tdesign.tencent.com/)
