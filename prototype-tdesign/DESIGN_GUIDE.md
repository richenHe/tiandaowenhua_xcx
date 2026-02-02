# TDesign 设计规范指南

本文档详细说明了天道文化小程序原型中使用的 TDesign 设计规范。

## 目录

- [设计原则](#设计原则)
- [颜色系统](#颜色系统)
- [字体系统](#字体系统)
- [间距系统](#间距系统)
- [圆角系统](#圆角系统)
- [阴影系统](#阴影系统)
- [组件规范](#组件规范)

## 设计原则

### 1. 一致性 Consistency

在整个产品中保持视觉和交互的一致性，降低用户的学习成本。

### 2. 反馈 Feedback

为用户的操作提供及时、明确的反馈，让用户了解系统状态。

### 3. 效率 Efficiency

优化交互流程，减少用户操作步骤，提升使用效率。

### 4. 可控 Controllability

用户应该能够自由地控制交互过程，系统不应强制用户做出选择。

## 颜色系统

### 品牌色

```css
--td-brand-color: #0052D9          /* 主品牌色 */
--td-brand-color-light: #266FE8    /* 品牌色-浅 */
--td-brand-color-lighter: #4787E8  /* 品牌色-更浅 */
--td-brand-color-dark: #003BA8     /* 品牌色-深 */
```

**使用场景**：
- 主要操作按钮
- 重要信息提示
- 当前选中状态
- 链接文本

### 背景色 (白色主调)

```css
--td-bg-color-page: #F5F5F5        /* 页面背景 */
--td-bg-color-container: #FFFFFF   /* 容器背景 */
--td-bg-color-container-hover: #FAFAFA /* 悬浮背景 */
--td-bg-color-container-active: #F5F5F5 /* 激活背景 */
--td-bg-color-container-select: #F3F6FF /* 选中背景 */
```

### 文本色

```css
--td-text-color-primary: #000000     /* 主文本 */
--td-text-color-secondary: #5E5E5E   /* 次要文本 */
--td-text-color-placeholder: #BBBBBB /* 占位文本 */
--td-text-color-disabled: #DDDDDD    /* 禁用文本 */
--td-text-color-anti: #FFFFFF        /* 反色文本 */
--td-text-color-brand: #0052D9       /* 品牌色文本 */
```

### 边框色

```css
--td-border-level-0: #F0F0F0         /* 零级边框 */
--td-border-level-1: #E7E7E7         /* 一级边框 */
--td-border-level-2: #EEEEEE         /* 二级边框 */
```

### 功能色

```css
--td-success-color: #00A870          /* 成功绿 */
--td-warning-color: #D4AF37          /* 金色 */
--td-error-color: #E34D59            /* 错误红 */
--td-info-color: #0052D9             /* 信息蓝 */
```

**颜色语义**：
- 成功：绿色，表示成功完成、正确、安全
- 警告/金色：橙/金色，表示价格、徽章、需要注意的信息
- 错误：红色，表示错误、危险、禁止操作
- 信息：蓝色，表示提示信息、帮助说明

## 字体系统

### 字体家族

```css
--td-font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, 
                  "Segoe UI", Roboto, "Helvetica Neue", Arial, 
                  "Noto Sans", sans-serif;
```

### 字号

```css
--td-font-size-s: 12px      /* 辅助文字 */
--td-font-size-base: 14px   /* 正文 */
--td-font-size-m: 16px      /* 小标题 */
--td-font-size-l: 18px      /* 标题 */
--td-font-size-xl: 20px     /* 大标题 */
--td-font-size-xxl: 24px    /* 超大标题 */
```

### 字重

```css
--td-font-weight-regular: 400   /* 常规 */
--td-font-weight-medium: 500    /* 中等 */
--td-font-weight-semibold: 600  /* 半粗 */
--td-font-weight-bold: 700      /* 粗体 */
```

### 行高

```css
--td-line-height-small: 1.2    /* 紧凑行高（标题） */
--td-line-height-base: 1.5     /* 标准行高（正文） */
--td-line-height-large: 1.8    /* 宽松行高 */
```

## 间距系统

### 组件内边距

```css
/* 垂直内边距 */
--td-comp-paddingTB-xxs: 1px
--td-comp-paddingTB-xs: 2px
--td-comp-paddingTB-s: 4px
--td-comp-paddingTB-m: 8px
--td-comp-paddingTB-l: 12px
--td-comp-paddingTB-xl: 16px
--td-comp-paddingTB-xxl: 24px

/* 水平内边距 */
--td-comp-paddingLR-xxs: 4px
--td-comp-paddingLR-xs: 8px
--td-comp-paddingLR-s: 12px
--td-comp-paddingLR-m: 16px
--td-comp-paddingLR-l: 24px
--td-comp-paddingLR-xl: 32px
--td-comp-paddingLR-xxl: 40px
```

### 页面级间距

```css
--td-page-margin: 16px         /* 页面边距 */
--td-card-spacing: 12px        /* 卡片间距 */
--td-section-spacing: 24px     /* 区块间距 */
```

### 间距使用原则

- 页面边距：16px（固定）
- 卡片之间：12px
- 区块之间：24px
- 文本段落：16px
- 列表项：12px

## 圆角系统

```css
--td-radius-small: 3px         /* 小圆角 (Badge) */
--td-radius-default: 6px       /* 默认圆角 (Button, Input, Card) */
--td-radius-medium: 9px        /* 中圆角 */
--td-radius-large: 12px        /* 大圆角 */
--td-radius-extraLarge: 16px   /* 超大圆角 */
--td-radius-round: 999px       /* 完全圆形 */
--td-radius-circle: 50%        /* 圆形百分比 */
```

### 圆角使用场景

- 3px：Badge、Tag 等小型组件
- 6px：Button、Input、Card 等常规组件
- 12px：Dialog、Drawer 等大型容器
- 999px：Pill 按钮、Progress 进度条
- 50%：Avatar 头像

## 阴影系统

```css
--td-shadow-1: 0 1px 10px rgba(0,0,0,.05)   /* 卡片阴影 */
--td-shadow-2: 0 2px 20px rgba(0,0,0,.08)   /* 悬浮阴影 */
--td-shadow-3: 0 6px 30px rgba(0,0,0,.12)   /* 弹窗阴影 */
--td-shadow-inset: inset 0 2px 4px rgba(0,0,0,.06) /* 内阴影 */
```

### 阴影使用场景

- Level 1：Card 卡片、列表项
- Level 2：悬浮状态、Dropdown 下拉菜单
- Level 3：Dialog 对话框、Modal 模态框
- 内阴影：Input 输入框内部

## 组件规范

### Button 按钮

**尺寸规范**：
- Small: 32px 高度
- Medium: 40px 高度（默认）
- Large: 48px 高度

**内边距**：
- Small: 0 8px
- Medium: 0 16px
- Large: 0 24px

**使用建议**：
- 主要操作使用 Primary 主题
- 次要操作使用 Default 主题
- 危险操作使用 Danger 主题
- 一个区域内最多一个 Primary 按钮

### Card 卡片

**内边距**：
- Header: 16px 24px
- Body: 16px 24px
- Footer: 12px 24px

**使用建议**：
- 用于组织和展示相关内容
- 卡片之间间距 12px
- 可以嵌套使用，但不要超过2层

### Input 输入框

**高度**：
- Small: 32px
- Medium: 40px（默认）
- Large: 48px

**状态**：
- Normal: 正常状态
- Hover: 悬浮状态
- Focus: 聚焦状态
- Disabled: 禁用状态
- Error: 错误状态
- Success: 成功状态

### 微信小程序适配

**内容宽度**：375px（微信小程序标准宽度）

**安全区域**：
- 顶部状态栏：44px
- 底部安全区域：34px（iPhone X及以上）

**可滚动区域**：
```css
height: calc(100vh - 44px - 34px); /* 减去状态栏和底部安全区域 */
```

### iPhone 15 Pro 设备规格

**设备尺寸**：
- 屏幕尺寸：6.1 英寸
- CSS 逻辑尺寸：393px × 852px
- 圆角半径：47.33px
- 小程序内容宽度：375px

**设备特性**：
- Dynamic Island（灵动岛）：126px × 37px
- 状态栏：44px
- 底部安全区域：34px

## 最佳实践

### 1. 颜色使用

- 主要内容使用 `--td-text-color-primary`
- 次要内容使用 `--td-text-color-secondary`
- 提示性内容使用 `--td-text-color-placeholder`
- 价格、金额使用 `--td-warning-color`（金色）

### 2. 间距使用

- 相关元素间距：8px
- 模块内元素间距：12px
- 模块间距：24px
- 页面边距：16px

### 3. 文本层级

```
超大标题 (24px) - 页面主标题
大标题 (20px) - 区块标题
标题 (18px) - 卡片标题
小标题 (16px) - 列表项标题
正文 (14px) - 主要内容
辅助文字 (12px) - 提示、说明
```

### 4. 交互反馈

- 所有可点击元素添加 `:hover` 状态
- 按钮点击添加 `:active` 状态
- 输入框聚焦添加边框高亮
- 使用过渡动画提升体验（200ms）

### 5. 响应式设计

- 使用弹性布局（Flexbox/Grid）
- 避免固定宽度，使用百分比或 flex
- 注意不同设备的安全区域
- 测试不同屏幕尺寸

## 组件复用指南

### 1. 样式复用

使用工具类进行快速布局：
```html
<div class="flex items-center gap-m">
  <div class="t-avatar"></div>
  <div class="flex-1">
    <div class="text-m text-bold">标题</div>
    <div class="text-s text-secondary">副标题</div>
  </div>
</div>
```

### 2. 组件组合

通过组合基础组件创建复杂组件：
```html
<div class="t-card t-card--bordered">
  <div class="t-card__body">
    <div class="t-card__meta">
      <div class="t-avatar"></div>
      <div class="t-card__meta-content">
        <div class="t-card__meta-title">标题</div>
        <div class="t-card__meta-description">描述</div>
      </div>
    </div>
  </div>
</div>
```

## 设计资源

- TDesign 官方组件库：https://tdesign.tencent.com/
- TDesign Figma 资源：https://tdesign.tencent.com/source
- TDesign 图标库：https://tdesign.tencent.com/design/icon

---

**天道文化小程序 TDesign 设计规范指南**  
基于 TDesign 官方设计规范 · 适配微信小程序 · iPhone 15 Pro


























