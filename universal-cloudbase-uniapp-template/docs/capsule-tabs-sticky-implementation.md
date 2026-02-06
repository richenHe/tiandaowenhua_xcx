# CapsuleTabs 吸顶功能实现总结

## ✅ 已完成的工作

### 1. 核心功能实现

- ✅ 将吸顶功能直接集成到 CapsuleTabs 组件中
- ✅ 使用 IntersectionObserver API 实现自动吸顶检测
- ✅ 自动计算页面头部高度（状态栏 + 导航栏）
- ✅ 支持自定义吸顶位置和背景色
- ✅ 默认启用吸顶，可通过 `sticky` 属性控制

### 2. 技术方案

**使用 IntersectionObserver 的优势：**
- 🚀 性能优秀，不需要监听 scroll 事件
- 🎯 自动检测元素位置变化
- 🌐 跨平台兼容性好（微信小程序、H5、App）
- 💡 无需手动计算滚动位置

**关键代码：**
```javascript
// 使用 IntersectionObserver 监听元素位置
observer = uni.createIntersectionObserver(instance.proxy, {
  thresholds: [0, 0.5, 1],
  observeAll: false
})

observer.relativeToViewport({
  top: -calculatedOffsetTop.value
}).observe('.capsule-tabs-wrapper', (res) => {
  const shouldFixed = res.boundingClientRect.top <= calculatedOffsetTop.value
  if (shouldFixed !== isFixed.value) {
    isFixed.value = shouldFixed
  }
})
```

### 3. 已更新的文件

1. **src/components/CapsuleTabs.vue** - 集成吸顶功能
2. **src/pages/mall/index.vue** - 简化使用方式
3. **src/components/CapsuleTabs.md** - 使用文档
4. **删除 src/components/StickyTabs.vue** - 不再需要独立组件

## 📖 使用指南

### 最简单的使用方式

```vue
<template>
  <view class="page-container">
    <TdPageHeader title="页面标题" />

    <scroll-view class="scroll-content" :scroll-y="true">
      <!-- 其他内容 -->

      <!-- CapsuleTabs 会自动吸顶 -->
      <CapsuleTabs
        v-model="activeTab"
        :options="tabOptions"
      />

      <!-- 列表内容 -->
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'

const activeTab = ref(0)
const tabOptions = [
  { label: '全部', value: 0 },
  { label: '分类1', value: 1 },
  { label: '分类2', value: 2 }
]
</script>

<style lang="scss" scoped>
// 重要：scroll-view 必须设置正确的高度
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}
</style>
```

### 关键要点

1. **scroll-view 高度设置**（必须）：
   ```scss
   .scroll-content {
     height: calc(100vh - var(--window-top));
   }
   ```

2. **启用滚动**（必须）：
   ```vue
   <scroll-view :scroll-y="true">
   ```

3. **吸顶控制**（可选）：
   ```vue
   <!-- 启用吸顶（默认） -->
   <CapsuleTabs :sticky="true" />

   <!-- 禁用吸顶 -->
   <CapsuleTabs :sticky="false" />
   ```

## 🔧 如何应用到其他页面

### 步骤 1：检查页面结构

确保页面有以下结构：
```
page-container
├── TdPageHeader (可选)
└── scroll-view (必须)
    ├── 其他内容
    ├── CapsuleTabs
    └── 列表内容
```

### 步骤 2：设置 scroll-view 高度

在页面的 `<style>` 中添加：
```scss
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}
```

### 步骤 3：使用 CapsuleTabs

直接使用，无需额外配置：
```vue
<CapsuleTabs
  v-model="activeTab"
  :options="tabOptions"
/>
```

### 步骤 4：测试

1. 在微信开发者工具中打开页面
2. 向下滚动页面
3. 观察 CapsuleTabs 是否固定在顶部

## 📋 需要应用吸顶功能的页面清单

根据代码扫描，以下页面使用了 CapsuleTabs：

### ✅ 已完成
1. **src/pages/mall/index.vue** - 积分商城（已完成）

### 📝 待处理（需要检查和应用）
2. **src/pages/index/index.vue** - 首页
   - ⚠️ 有 Banner 轮播图，可能不适合吸顶
   - 建议：设置 `:sticky="false"`

3. **src/pages/academy/cases/index.vue** - 成功案例
4. **src/pages/academy/materials/index.vue** - 素材库
5. **src/pages/ambassador/cash-points/index.vue** - 积分管理
6. **src/pages/mine/orders/index.vue** - 我的订单
7. **src/pages/course/my-courses/index.vue** - 我的课程
8. **src/pages/ambassador/activity-records/index.vue** - 活动记录
9. **src/pages/mine/appointments/index.vue** - 我的预约

### 应用建议

对于每个页面：

1. **检查是否使用 scroll-view**
   - 如果是，确保设置了正确的高度
   - 如果不是，需要先改造为 scroll-view 结构

2. **检查是否有顶部固定元素**
   - 如果有 TdPageHeader，吸顶会自动计算高度
   - 如果有其他固定元素，可能需要手动设置 `offset-top`

3. **检查内容是否足够长**
   - 如果内容很短，不会产生滚动，吸顶功能不会触发
   - 这是正常的，不影响使用

4. **特殊页面处理**
   - 首页（有 Banner）：建议禁用吸顶 `:sticky="false"`
   - 其他页面：默认启用吸顶即可

## 🎯 快速应用模板

### 模板 A：标准页面（有 TdPageHeader）

```vue
<template>
  <view class="page-container">
    <TdPageHeader title="页面标题" />

    <scroll-view class="scroll-content" :scroll-y="true">
      <view class="page-content">
        <!-- CapsuleTabs 自动吸顶 -->
        <CapsuleTabs
          v-model="activeTab"
          :options="tabOptions"
        />

        <!-- 列表内容 -->
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}
</style>
```

### 模板 B：无顶部导航的页面

```vue
<template>
  <view class="page-container">
    <scroll-view class="scroll-content" :scroll-y="true">
      <view class="page-content">
        <!-- CapsuleTabs 自动吸顶 -->
        <CapsuleTabs
          v-model="activeTab"
          :options="tabOptions"
          :offset-top="0"
        />

        <!-- 列表内容 -->
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.scroll-content {
  height: 100vh;
  box-sizing: border-box;
}
</style>
```

### 模板 C：有 Banner 的页面（禁用吸顶）

```vue
<template>
  <view class="page-container">
    <!-- Banner 轮播图 -->
    <swiper class="banner-swiper">
      <!-- ... -->
    </swiper>

    <scroll-view class="scroll-content" :scroll-y="true">
      <view class="page-content">
        <!-- 禁用吸顶 -->
        <CapsuleTabs
          v-model="activeTab"
          :options="tabOptions"
          :sticky="false"
        />

        <!-- 列表内容 -->
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.scroll-content {
  height: calc(100vh - 560rpx); // 减去 Banner 高度
  box-sizing: border-box;
}
</style>
```

## 🐛 常见问题排查

### 问题 1：吸顶功能不生效

**可能原因：**
- scroll-view 高度设置不正确
- 内容不够长，没有产生滚动
- scroll-y 没有启用

**解决方法：**
```scss
// 确保 scroll-view 有正确的高度
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}
```

```vue
// 确保启用滚动
<scroll-view :scroll-y="true">
```

### 问题 2：吸顶位置不对

**可能原因：**
- 页面有自定义的顶部固定元素
- 自动计算的高度不准确

**解决方法：**
```vue
<!-- 手动设置吸顶位置 -->
<CapsuleTabs :offset-top="100" />
```

### 问题 3：多个 CapsuleTabs 都吸顶了

**可能原因：**
- 默认所有 CapsuleTabs 都启用吸顶

**解决方法：**
```vue
<!-- 第一个不吸顶 -->
<CapsuleTabs :sticky="false" />

<!-- 第二个吸顶 -->
<CapsuleTabs :sticky="true" />
```

## 📊 性能优化

使用 IntersectionObserver 的性能优势：

- ✅ 不需要监听 scroll 事件，减少事件处理开销
- ✅ 浏览器原生 API，性能优秀
- ✅ 自动节流，不会频繁触发
- ✅ 内存占用小，自动清理

## 🎉 总结

### 优势

1. **使用简单**：只需添加 `:sticky="true"` 或使用默认值
2. **零配置**：自动计算页面头部高度
3. **性能优秀**：使用 IntersectionObserver，不影响滚动性能
4. **兼容性好**：支持微信小程序、H5、App
5. **易于维护**：功能集成在组件内部，不需要外部配置

### 下一步

1. 测试 mall/index.vue 页面，确认吸顶功能正常
2. 逐个检查其他 8 个页面，应用吸顶功能
3. 如有问题，参考本文档的排查指南

### 联系方式

如有问题，请查看：
- 使用文档：`src/components/CapsuleTabs.md`
- 示例页面：`src/pages/mall/index.vue`
