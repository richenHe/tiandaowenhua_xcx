# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

天道文化微信小程序原型 (TDesign版本) - 基于 TDesign 设计规范的完整原型设计方案，包含 54 个页面，模拟 iPhone 15 Pro 设备外观。

## 常用命令

```bash
# 启动本地服务器查看原型
python -m http.server 8000
# 或
npx serve
# 或
php -S localhost:8000

# 访问地址
http://localhost:8000
```

## 技术栈

- HTML5 + CSS3（纯静态原型，无 JavaScript 依赖）
- 基于 TDesign 设计规范
- 适配微信小程序尺寸（375px）

## 设计规范要点

### 颜色系统
- 主品牌色：`--td-brand-color: #0052D9`
- 页面背景：`--td-bg-color-page: #F5F5F5`
- 容器背景：`--td-bg-color-container: #FFFFFF`
- 金色（价格/徽章）：`--td-warning-color: #D4AF37`

### 间距系统
- 页面边距：16px
- 卡片间距：12px
- 区块间距：24px

### 圆角系统
- 小圆角：3px（Badge/Tag）
- 默认圆角：6px（Button、Input、Card）
- 大圆角：12px（Dialog）
- 完全圆形：999px（Pill 按钮）

### 字号系统
- 辅助文字：12px
- 正文：14px
- 小标题：16px
- 标题：18px
- 大标题：20px
- 超大标题：24px

## 组件使用

### Button 按钮
```html
<button class="t-button t-button--theme-primary t-button--variant-base">
  <span class="t-button__text">按钮文字</span>
</button>
```
主题：`primary`, `default`, `success`, `warning`, `danger`
变体：`base`, `outline`, `dashed`, `text`
尺寸：`small`(32px), `medium`(40px), `large`(48px)

### Card 卡片
```html
<div class="t-card t-card--bordered t-card--shadow">
  <div class="t-card__header">
    <div class="t-card__title">标题</div>
  </div>
  <div class="t-card__body">内容</div>
</div>
```

### Input 输入框
```html
<div class="t-input__wrap">
  <div class="t-input t-align-left">
    <input class="t-input__inner" type="text" placeholder="请输入" />
  </div>
</div>
```

## 项目结构

```
prototype-tdesign/
├── index.html              # 主入口页面
├── styles/                 # 样式文件
│   ├── tdesign-theme.css   # TDesign 主题配置
│   ├── reset.css           # 样式重置
│   ├── common.css          # 公共样式
│   └── components/         # 组件样式
│       ├── button.css
│       ├── card.css
│       ├── input.css
│       ├── tabs.css
│       ├── badge.css
│       ├── avatar.css
│       ├── dialog.css
│       └── device.css      # iPhone 15 Pro 设备外壳
├── pages/                  # 页面文件
│   ├── auth/               # 授权模块 (2页)
│   ├── index/              # 首页 (1页)
│   ├── course/             # 课程模块 (4页)
│   ├── order/              # 订单模块 (4页)
│   ├── mine/               # 个人中心 (8页)
│   ├── ambassador/         # 大使系统 (11页)
│   ├── academy/            # 商学院 (3页)
│   └── common/             # 公共页面 (1页)
└── playground/             # 组件展示
```

## iPhone 15 Pro 设备外壳

```html
<div class="device-iphone15pro">
  <div class="device-frame">
    <div class="device-notch"></div>
    <div class="device-statusbar">
      <span class="statusbar-time">9:41</span>
    </div>
    <div class="device-screen">
      <!-- 小程序内容 375px -->
    </div>
  </div>
</div>
```

## 相关资源

- [TDesign 官网](https://tdesign.tencent.com/)
- [TDesign 设计指南](https://tdesign.tencent.com/design/overview)
- 详细规范见 `DESIGN_GUIDE.md`
