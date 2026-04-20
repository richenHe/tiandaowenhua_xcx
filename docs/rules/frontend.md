# 前端开发规范

> 📌 **适用场景**：开发或修改 `src/` 下的 Vue 页面、组件、样式时参考此文档。

---

## 样式规范（严格遵守）⚠️

### 样式优先级（强制执行，不得跳级）

1. **TDesign CSS 类名**（第一选择）
   - 先查 `src/styles/components/index.scss` 及其引入的所有 SCSS 文件
   - 使用现有的 `.t-*` 类名，如 `.t-card`、`.t-button`、`.t-page-header__back-icon`

2. **可复用组件样式**（第二选择）
   - 当前项目中 2+ 处需要相同样式 → 抽取到 `components/*.scss`
   - 命名规范：`.t-自定义名称`（如 `.t-price-card`）
   - 新建文件后必须在 `components/index.scss` 中添加 `@import`

3. **inline style**（最后手段）
   - 仅用于真正的"一次性"个性化样式（特定渐变背景、单独尺寸调整）
   - 颜色仍需使用 SCSS 变量引用

4. **绝对禁止**
   - ❌ 自定义 class 类名
   - ❌ 硬编码颜色值（如 `#0052D9`）
   - ❌ `<style>` 标签中的临时样式

### 样式添加流程

1. 需要样式 → 先查 `src/styles/components/`
2. 找到匹配 → 直接使用 TDesign 类名
3. 未找到 + 可复用 → 添加到 `components/*.scss` + 更新 `index.scss`
4. 未找到 + 一次性 → 使用 inline style（颜色仍用变量）

### 颜色规范

- 只能使用 SCSS 变量（如 `$td-brand-color`）

---

## 盒模型规范（防止溢出）

- scroll-view 带 padding 必须设置 `boxSizing: 'border-box'`
- 带 padding 的容器外层加 `overflow: 'hidden'`
- 优先使用 `.t-card`（已处理盒模型）

```vue
<!-- ✅ 正确 -->
<view :style="{ overflow: 'hidden' }">
  <scroll-view :style="{ padding: '24rpx', boxSizing: 'border-box' }">
    内容
  </scroll-view>
</view>

<!-- ❌ 错误 - 会溢出 48rpx -->
<scroll-view :style="{ padding: '24rpx' }">内容</scroll-view>
```

---

## 其他强制规范

- **弹窗**：必须使用 `uni.showModal`，禁止自定义弹窗
- **底部留白**：可滚动页面底部留白 `120rpx`
- **禁止**：自动启动开发服务器（已运行）
- **原型图迁移**：`var(--td-xxx)` → `$td-xxx`，`px` → `rpx`（1px = 2rpx）

---

## 常用组件

| 分类 | 组件 |
|------|------|
| 基础 | `.t-card`, `.t-button`, `.t-btn-outline-pill`（shadcn outline 风胶囊，见 `button-shadcn-outline.scss`）, `.t-badge`, `.t-avatar` |
| 表单 | `.t-form`, `.t-input`, `.t-radio-group` |
| 布局 | `.t-page-header`, `.t-section-title`, `.t-tabs` |
| 数据 | `.t-list`, `.t-cell` |

---

## CapsuleTabs（胶囊分段标签栏）

组件名为 `CapsuleTabs`，视觉对齐 **shadcn/ui `@shadcn/tabs` 的 default 变体**：浅灰轨道、圆角胶囊槽、选中项白底轻阴影 + 品牌色文字。样式在 `src/styles/components/capsule-tabs.scss`（`.t-capsule-tabs*`）。

使用 CapsuleTabs 吸顶场景需配合 StickyTabs：

```vue
<template>
  <scroll-view @scroll="handleScroll">
    <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight">
      <template #tabs>
        <CapsuleTabs v-model="activeTab" :options="tabOptions" />
      </template>
    </StickyTabs>
  </scroll-view>
</template>

<script setup>
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'

const stickyTabsRef = ref()
const pageHeaderHeight = ref(64)

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  pageHeaderHeight.value = (systemInfo.statusBarHeight || 20) + 44
})

const handleScroll = (e) => {
  stickyTabsRef.value?.updateScrollTop(e.detail.scrollTop)
}
</script>
```

> **注意**：首页等有 Banner 的页面不需要吸顶，直接使用 CapsuleTabs。

---

## 图片显示注意事项

本项目使用 `@cloudbase/js-sdk`（HTTP 方式），**没有调用 `wx.cloud.init()`**，小程序 `<image>` 组件无法解析 `cloud://` fileID。

```vue
<!-- ✅ 正确 - 使用 API 返回的 HTTPS URL（云函数已转换） -->
<image :src="course.coverImage" mode="aspectFill" />

<!-- ✅ 有图显示图，无图降级到 emoji/渐变色 -->
<view class="cover" :style="item.cover_image ? {} : { background: fallbackGradient }">
  <image v-if="item.cover_image" :src="item.cover_image" mode="aspectFill" />
  <text v-else>{{ fallbackEmoji }}</text>
</view>
```

---

## Code Review 检查清单

- [ ] **代码注释**：所有函数、组件、业务逻辑已添加必要注释（参考 `docs/rules/code-comment.md`）
- [ ] **样式优先级**：先用 TDesign CSS 类名，再考虑可复用组件样式
- [ ] **可复用性**：相同样式已抽取到 `components/*.scss`
- [ ] **禁止项**：无自定义类名、无硬编码颜色、无随意 inline style
- [ ] **盒模型**：scroll-view 带 padding 设置了 `boxSizing: border-box`
- [ ] **溢出控制**：滚动容器外层有 `overflow: hidden`
- [ ] **交互规范**：弹窗用 `uni.showModal`
- [ ] **颜色规范**：所有颜色用 SCSS 变量（`$td-xxx`）
- [ ] **图片字段**：`cover_image`、`avatar` 等图片字段已由云函数转换为 HTTPS URL
