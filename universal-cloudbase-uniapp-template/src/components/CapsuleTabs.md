# CapsuleTabs 组件使用文档

## 功能特性

CapsuleTabs 是一个胶囊样式的标签页组件，**内置自动吸顶功能**。

### 主要特性

- ✅ 胶囊样式设计，符合 TDesign 规范
- ✅ **自动吸顶**：滚动时自动固定在页面顶部
- ✅ **零配置**：默认启用吸顶，无需手动设置
- ✅ **自动计算**：自动计算页面头部高度
- ✅ **跨平台兼容**：支持微信小程序、H5、App 等

## 基础用法

### 最简单的使用方式（推荐）

```vue
<template>
  <view>
    <CapsuleTabs
      v-model="activeTab"
      :options="tabOptions"
      @change="handleTabChange"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'

const activeTab = ref(0)
const tabOptions = [
  { label: '全部', value: 0 },
  { label: '文具', value: 1 },
  { label: '生活', value: 2 }
]

const handleTabChange = (value: number) => {
  console.log('切换到:', value)
}
</script>
```

**就这么简单！** 吸顶功能会自动生效，无需任何额外配置。

## 高级配置

### 禁用吸顶功能

如果某个页面不需要吸顶（比如有 Banner 轮播图的首页），可以禁用：

```vue
<CapsuleTabs
  v-model="activeTab"
  :options="tabOptions"
  :sticky="false"
/>
```

### 自定义吸顶位置

默认会自动计算页面头部高度（状态栏 + 导航栏），如果需要自定义：

```vue
<CapsuleTabs
  v-model="activeTab"
  :options="tabOptions"
  :sticky="true"
  :offset-top="100"
/>
```

### 自定义吸顶背景色

```vue
<CapsuleTabs
  v-model="activeTab"
  :options="tabOptions"
  :sticky="true"
  sticky-background="#FFFFFF"
/>
```

## 完整示例

### 商城页面示例

```vue
<template>
  <view class="page-container">
    <TdPageHeader title="积分商城" :showBack="false" />

    <scroll-view class="scroll-content" :scroll-y="true">
      <!-- 积分横幅 -->
      <view class="points-banner">
        <text>💎 功德分: 1500</text>
      </view>

      <!-- 主标签 -->
      <view class="tabs-wrapper">
        <CapsuleTabs
          v-model="activeMainTab"
          :options="mainTabOptions"
        />
      </view>

      <!-- 分类标签（自动吸顶） -->
      <view class="tabs-wrapper">
        <CapsuleTabs
          v-model="activeCategory"
          :options="categoryOptions"
          :sticky="true"
        />
      </view>

      <!-- 商品列表 -->
      <view class="product-list">
        <!-- 商品内容 -->
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

const activeMainTab = ref(0)
const mainTabOptions = [
  { label: '兑换商品', value: 0 },
  { label: '兑换课程', value: 1 }
]

const activeCategory = ref(0)
const categoryOptions = [
  { label: '全部', value: 0 },
  { label: '文具', value: 1 },
  { label: '生活', value: 2 }
]
</script>

<style lang="scss" scoped>
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}

.tabs-wrapper {
  margin-bottom: 24rpx;
}
</style>
```

## 重要提示

### 1. scroll-view 高度设置

为了让吸顶功能正常工作，**必须**给 scroll-view 设置正确的高度：

```scss
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}
```

### 2. 页面结构要求

推荐的页面结构：

```
page-container
├── TdPageHeader (固定在顶部)
└── scroll-view (可滚动区域)
    ├── 其他内容
    ├── CapsuleTabs (会自动吸顶)
    └── 列表内容
```

### 3. 多个 CapsuleTabs 的情况

如果页面有多个 CapsuleTabs：
- 第一个通常不需要吸顶（设置 `:sticky="false"`）
- 第二个及以后的可以启用吸顶（默认或设置 `:sticky="true"`）

## Props 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | string \| number | - | 当前选中的标签值（必填） |
| options | TabOption[] | - | 标签选项数组（必填） |
| sticky | boolean | true | 是否启用吸顶功能 |
| offsetTop | number | 0 | 吸顶时距离顶部的距离（px），0 表示自动计算 |
| stickyBackground | string | '#F5F5F5' | 吸顶时的背景色 |

### TabOption 类型

```typescript
interface TabOption {
  label: string        // 标签显示文本
  value?: string | number  // 标签值（可选，默认使用索引）
}
```

## Events 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| update:modelValue | value: string \| number | 选中值变化时触发 |
| change | value: string \| number | 选中值变化时触发 |

## 技术实现

吸顶功能使用 **IntersectionObserver API** 实现，具有以下优势：

- ✅ 性能优秀，不需要监听 scroll 事件
- ✅ 自动检测元素位置变化
- ✅ 跨平台兼容性好
- ✅ 无需手动计算滚动位置

## 常见问题

### Q: 吸顶功能不生效？

**A:** 检查以下几点：
1. scroll-view 是否设置了正确的高度：`height: calc(100vh - var(--window-top))`
2. scroll-view 是否启用了滚动：`:scroll-y="true"`
3. 页面内容是否足够长，能够产生滚动

### Q: 吸顶位置不对？

**A:** 可以手动设置 `offset-top` 参数：
```vue
<CapsuleTabs :offset-top="64" />
```

### Q: 如何禁用某个页面的吸顶？

**A:** 设置 `sticky` 为 `false`：
```vue
<CapsuleTabs :sticky="false" />
```

### Q: 可以同时有多个吸顶的 CapsuleTabs 吗？

**A:** 可以，但通常只有一个需要吸顶。建议：
- 第一个 CapsuleTabs：`:sticky="false"`（主分类，不吸顶）
- 第二个 CapsuleTabs：`:sticky="true"`（子分类，吸顶）

## 迁移指南

### 从旧版 StickyTabs 迁移

如果你之前使用的是独立的 StickyTabs 组件：

**旧代码：**
```vue
<StickyTabs ref="stickyTabsRef" :offset-top="64">
  <template #tabs>
    <CapsuleTabs v-model="activeTab" :options="tabOptions" />
  </template>
</StickyTabs>

<script setup>
const stickyTabsRef = ref()
const handleScroll = (e) => {
  stickyTabsRef.value?.updateScrollTop(e.detail.scrollTop)
}
</script>
```

**新代码：**
```vue
<CapsuleTabs
  v-model="activeTab"
  :options="tabOptions"
  :sticky="true"
/>

<!-- 不需要任何 script 代码！ -->
```

## 更新日志

### v2.0.0 (2026-02-06)
- ✨ 新增：内置自动吸顶功能
- ✨ 新增：使用 IntersectionObserver 实现，性能更好
- ✨ 新增：自动计算页面头部高度
- 🔥 移除：不再需要独立的 StickyTabs 组件
- 🔥 移除：不再需要手动监听 scroll 事件
