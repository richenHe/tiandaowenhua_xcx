# 天道文化小程序原型 (TDesign版本)

基于 TDesign 设计规范的完整原型设计方案，包含 52 个页面，模拟 iPhone 15 Pro 设备外观。

## 📋 项目概述

本项目是天道文化小程序的完整原型设计，使用 HTML/CSS 实现，遵循 TDesign 设计规范，适配微信小程序尺寸（375px），并包含 iPhone 15 Pro 设备外壳模拟。

### 核心特性

- ✅ **TDesign 设计系统** - 完全基于 TDesign 官方设计规范
- ✅ **52 个完整页面** - 覆盖所有功能模块
- ✅ **iPhone 15 Pro 外壳** - 真实模拟移动设备外观
- ✅ **微信小程序适配** - 375px 内容宽度
- ✅ **白色主调** - 优雅清新的视觉风格
- ✅ **组件化设计** - 可复用的 UI 组件库

## 🎨 设计规范

### 颜色系统

```css
--td-brand-color: #0052D9          /* 主品牌色 */
--td-brand-color-light: #266FE8    /* 品牌色-浅 */
--td-bg-color-page: #F5F5F5        /* 页面背景 */
--td-bg-color-container: #FFFFFF   /* 容器背景 */
--td-text-color-primary: #000000   /* 主文本 */
--td-warning-color: #D4AF37        /* 金色(价格、徽章) */
```

### 间距系统

- 页面边距：16px
- 卡片间距：12px
- 区块间距：24px

### 圆角系统

- 小圆角：3px (Badge)
- 默认圆角：6px (Button, Input, Card)
- 大圆角：12px
- 完全圆形：999px

## 📁 项目结构

```
prototype-tdesign/
├── index.html                 # 主入口页面
├── README.md                  # 项目说明
├── DESIGN_GUIDE.md            # 设计规范文档
│
├── styles/                    # 样式文件
│   ├── tdesign-theme.css      # TDesign 主题配置
│   ├── reset.css              # 样式重置
│   └── common.css             # 公共样式
│
├── components/                # 组件库
│   ├── button.css             # 按钮组件
│   ├── card.css               # 卡片组件
│   ├── input.css              # 输入框组件
│   ├── tabs.css               # 标签页组件
│   ├── badge.css              # 徽章组件
│   ├── avatar.css             # 头像组件
│   ├── dialog.css             # 对话框组件
│   ├── alert.css              # 警告提示组件
│   ├── form.css               # 表单组件
│   ├── list.css               # 列表组件
│   ├── divider.css            # 分割线组件
│   ├── progress.css           # 进度条组件
│   ├── device.css             # iPhone 15 Pro 设备外壳
│   └── all.css                # 所有组件汇总
│
├── pages/                     # 页面文件
│   ├── auth/                  # 授权模块 (2页)
│   ├── index/                 # 首页模块 (1页)
│   ├── course/                # 课程模块 (4页)
│   ├── order/                 # 订单模块 (4页)
│   ├── mine/                  # 个人中心 (8页)
│   ├── ambassador/            # 大使系统 (11页)
│   ├── academy/               # 商学院 (3页)
│   ├── mall/                  # 商城模块 (1页)
│   └── common/                # 公共页面 (1页)
│
├── playground/                # 组件展示
│   └── index.html             # Playground 页面
│
└── assets/                    # 资源文件
    ├── icons/                 # 图标
    └── images/                # 图片
```

## 📱 页面列表

### 授权登录模块 (2页)
1. 登录页 - `pages/auth/login.html`
2. 完善资料页 - `pages/auth/complete-profile.html`

### 首页和课程模块 (5页)
3. 课程学习首页 - `pages/index/home.html`
4. 课程详情页 - `pages/course/detail.html`
5. 我的课程 - `pages/course/my-courses.html`
6. 课程计划 - `pages/course/schedule.html`
7. 预约确认 - `pages/course/appointment-confirm.html`

### 订单流程模块 (4页)
8. 订单确认页 - `pages/order/confirm.html`
9. 选择推荐人 - `pages/order/select-referee.html`
10. 支付页 - `pages/order/payment.html`
11. 订单详情 - `pages/order/detail.html`

### 个人中心模块 (8页)
12. 我的首页 - `pages/mine/index.html`
13. 个人资料 - `pages/mine/profile.html`
14. 推荐人管理 - `pages/mine/referee-manage.html`
15. 订单记录 - `pages/mine/orders.html`
16. 预约记录 - `pages/mine/appointments.html`
17. 意见反馈 - `pages/mine/feedback.html`
18. 咨询预约 - `pages/mine/consultation.html`
19. 我的协议 - `pages/mine/contracts.html`

### 传播大使模块 (11页)
20. 大使等级页 - `pages/ambassador/level.html`
21. 申请大使页 - `pages/ambassador/apply.html`
22. 升级引导页 - `pages/ambassador/upgrade-guide.html`
23. 协议签署页 - `pages/ambassador/contract-sign.html`
24. 协议详情页 - `pages/ambassador/contract-detail.html`
25. 功德分页 - `pages/ambassador/merit-points.html`
26. 积分管理页 - `pages/ambassador/cash-points.html`
27. 提现申请页 - `pages/ambassador/withdraw.html`
28. 推荐二维码页 - `pages/ambassador/qrcode.html`
29. 推荐团队页 - `pages/ambassador/team.html`
30. 活动记录页 - `pages/ambassador/activity-records.html`

### 商学院模块 (3页)
31. 商学院介绍 - `pages/academy/intro.html`
32. 朋友圈素材 - `pages/academy/materials.html`
33. 学员案例 - `pages/academy/cases.html`

### 商城模块 (1页)
34. 积分兑换 - `pages/mall/index.html` (包含兑换商品、兑换课程Tab切换)

### 公共模块 (1页)
35. 通知公告 - `pages/common/announcement.html`

## 🚀 快速开始

### 1. 查看原型

直接打开 `index.html` 文件即可查看完整的原型导航页面。

或者访问各个具体页面：
- 组件展示：`playground/index.html`
- 登录页：`pages/auth/login.html`
- 课程首页：`pages/index/home.html`

### 2. 本地服务器（推荐）

使用本地服务器可以获得更好的体验：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve

# 使用 PHP
php -S localhost:8000
```

然后在浏览器中访问：`http://localhost:8000`

## 🎯 核心组件

### Button 按钮

```html
<button class="t-button t-button--theme-primary t-button--variant-base">
  <span class="t-button__text">按钮文字</span>
</button>
```

主题：`primary`, `default`, `success`, `warning`, `danger`
变体：`base`, `outline`, `dashed`, `text`
尺寸：`small`, `medium`, `large`

### Card 卡片

```html
<div class="t-card t-card--bordered t-card--shadow">
  <div class="t-card__header">
    <div class="t-card__title">标题</div>
  </div>
  <div class="t-card__body">内容</div>
  <div class="t-card__footer">底部</div>
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

## 📱 iPhone 15 Pro 设备外壳

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
    <div class="device-safe-area-bottom"></div>
  </div>
</div>
```

设备规格：
- 屏幕尺寸：6.1 英寸
- CSS 逻辑尺寸：393px × 852px
- 圆角半径：47.33px
- 小程序内容宽度：375px

## 🎨 自定义主题

修改 `styles/tdesign-theme.css` 文件中的 CSS 变量即可自定义主题颜色：

```css
:root {
  --td-brand-color: #0052D9;          /* 修改主品牌色 */
  --td-warning-color: #D4AF37;        /* 修改金色 */
  --td-bg-color-page: #F5F5F5;        /* 修改页面背景 */
}
```

## 📖 技术栈

- HTML5
- CSS3 (使用 CSS 自定义属性)
- 无JavaScript依赖（纯静态原型）
- 基于 TDesign 设计规范

## 🔗 相关链接

- [TDesign 官网](https://tdesign.tencent.com/)
- [TDesign 设计指南](https://tdesign.tencent.com/design/overview)
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

## 📄 许可证

本项目仅用于原型设计和演示目的。

---

**天道文化小程序原型设计方案 (TDesign版本)**  
© 2024 基于 TDesign 设计规范 · 52个完整页面 · iPhone 15 Pro 适配













