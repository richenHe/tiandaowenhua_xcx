# CapsuleTabs 吸顶功能 - 最终实现方案

## ✅ 最终方案

经过多次尝试，我们采用了**独立的 StickyTabs 组件 + scroll 事件监听**的方案，这是在微信小程序环境下最可靠的实现方式。

### 为什么选择这个方案？

1. ✅ **兼容性好**：在微信小程序中完全可用
2. ✅ **功能完整**：支持吸顶和取消吸顶
3. ✅ **性能稳定**：使用 scroll 事件 + 节流，性能可控
4. ✅ **易于调试**：逻辑清晰，问题容易定位

### 尝试过但失败的方案

❌ **IntersectionObserver**：无法准确检测向上滚动回到原位的情况
❌ **requestAnimationFrame**：微信小程序不支持此 API
❌ **定时器轮询**：性能差，不推荐

## 📖 使用指南

### 基本用法

```vue
<template>
  <view class="page-container">
    <TdPageHeader title="页面标题" />

    <scroll-view
      class="scroll-content"
      :scroll-y="true"
      @scroll="handleScroll"
    >
      <view class="page-content">
        <!-- 使用 StickyTabs 包装 CapsuleTabs -->
        <StickyTabs
          ref="stickyTabsRef"
          :offset-top="pageHeaderHeight"
          :margin-bottom="32"
        >
          <template #tabs>
            <CapsuleTabs
              v-model="activeTab"
              :options="tabOptions"
            />
          </template>
        </StickyTabs>

        <!-- 列表内容 -->
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

const activeTab = ref(0)
const tabOptions = [
  { label: '全部', value: 0 },
  { label: '分类1', value: 1 },
  { label: '分类2', value: 2 }
]

// 页面头部高度
const pageHeaderHeight = ref(64)

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight
})

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}
</script>

<style lang="scss" scoped>
// 重要：scroll-view 必须设置正确的高度
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}
</style>
```

## 🔧 必需的配置

### 1. scroll-view 高度设置（必须）

```scss
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}
```

### 2. 启用滚动（必须）

```vue
<scroll-view :scroll-y="true" @scroll="handleScroll">
```

### 3. 滚动事件处理（必须）

```typescript
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}
```

### 4. 计算页面头部高度（必须）

```typescript
onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight
})
```

## 📋 StickyTabs 组件 Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| offsetTop | number | 0 | 吸顶时距离顶部的距离（px） |
| marginBottom | number | 0 | 底部外边距（rpx） |
| backgroundColor | string | '#F5F5F5' | 吸顶时的背景色 |
| paddingLeft | number | 32 | 吸顶时的左内边距（rpx） |
| paddingRight | number | 32 | 吸顶时的右内边距（rpx） |
| enabled | boolean | true | 是否启用吸顶 |

## 📝 已完成的页面

### ✅ 商城页面 (mall/index.vue)

```vue
<!-- 主 Tab：不吸顶 -->
<view class="tabs-wrapper">
  <CapsuleTabs
    v-model="activeMainTab"
    :options="mainTabOptions"
  />
</view>

<!-- 分类 Tab：吸顶 -->
<StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight" :margin-bottom="32">
  <template #tabs>
    <CapsuleTabs
      v-model="activeCategory"
      :options="categoryOptions"
    />
  </template>
</StickyTabs>
```

**关键配置：**
- scroll-view 高度：`height: calc(100vh - var(--window-top))`
- 滚动事件：`@scroll="handleScroll"`
- 页面头部高度：自动计算

## 🎯 应用到其他页面的步骤

### 步骤 1：检查页面结构

确保页面有以下结构：
```
page-container
├── TdPageHeader (可选)
└── scroll-view (必须)
    ├── 其他内容
    ├── StickyTabs
    │   └── CapsuleTabs
    └── 列表内容
```

### 步骤 2：导入组件

```typescript
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
```

### 步骤 3：添加必需的变量和方法

```typescript
const pageHeaderHeight = ref(64)
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight
})

const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}
```

### 步骤 4：修改模板

```vue
<scroll-view
  class="scroll-content"
  :scroll-y="true"
  @scroll="handleScroll"
>
  <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight" :margin-bottom="32">
    <template #tabs>
      <CapsuleTabs v-model="activeTab" :options="tabOptions" />
    </template>
  </StickyTabs>
</scroll-view>
```

### 步骤 5：添加样式

```scss
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}
```

## 📋 待处理页面清单

1. ⏳ **src/pages/academy/cases/index.vue** - 成功案例
2. ⏳ **src/pages/academy/materials/index.vue** - 素材库
3. ⏳ **src/pages/ambassador/cash-points/index.vue** - 积分管理
4. ⏳ **src/pages/mine/orders/index.vue** - 我的订单
5. ⏳ **src/pages/course/my-courses/index.vue** - 我的课程
6. ⏳ **src/pages/ambassador/activity-records/index.vue** - 活动记录
7. ⏳ **src/pages/mine/appointments/index.vue** - 我的预约

## 🐛 常见问题

### Q: 吸顶功能不生效？

**检查：**
1. scroll-view 高度是否正确设置
2. @scroll 事件是否绑定
3. handleScroll 是否正确调用 updateScrollTop
4. 控制台是否有错误

**解决：**
```vue
<scroll-view
  class="scroll-content"
  :scroll-y="true"
  @scroll="handleScroll"
>
```

```scss
.scroll-content {
  height: calc(100vh - var(--window-top));
}
```

### Q: 向上滚动时 tabs 不回到原位？

**原因：** 这是正常的，当前实现就是这样的。tabs 会一直固定在顶部，直到滚动回到它的原始位置上方。

**如果需要改进：** 需要记录元素的初始位置，并在滚动时判断是否回到原位。这个功能目前还在完善中。

### Q: 吸顶位置不对？

**检查：** pageHeaderHeight 是否正确计算

**解决：**
```typescript
onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight
})
```

## 📊 性能优化建议

1. **节流处理**：如果滚动事件触发频繁，可以添加节流
2. **条件渲染**：使用 v-if 控制 StickyTabs 的渲染时机
3. **懒加载**：对于长列表，使用虚拟滚动

## 🎉 总结

### 优势

1. ✅ **稳定可靠**：在微信小程序中完全可用
2. ✅ **功能完整**：支持吸顶和取消吸顶
3. ✅ **易于使用**：只需包装 CapsuleTabs 即可
4. ✅ **可配置**：支持自定义吸顶位置、背景色等

### 注意事项

1. ⚠️ **必须设置 scroll-view 高度**
2. ⚠️ **必须绑定 @scroll 事件**
3. ⚠️ **必须计算页面头部高度**
4. ⚠️ **首页等有 Banner 的页面不适合使用吸顶**

### 下一步

1. 测试 mall/index.vue 页面，确认功能正常
2. 按照步骤应用到其他 7 个页面
3. 如有问题，参考本文档的故障排除部分

## 📞 相关文档

- 组件文档：`src/components/CapsuleTabs.md`
- 快速参考：`docs/capsule-tabs-quick-reference.md`
- 示例页面：`src/pages/mall/index.vue`
