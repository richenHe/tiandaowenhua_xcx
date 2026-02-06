# CapsuleTabs 吸顶功能 - 快速参考

## 🎯 使用场景

### 场景 1：单个 CapsuleTabs（需要吸顶）

**示例：订单列表、课程列表等**

```vue
<template>
  <view class="page-container">
    <TdPageHeader title="我的订单" />

    <scroll-view class="scroll-content" :scroll-y="true">
      <!-- CapsuleTabs 会自动吸顶 -->
      <CapsuleTabs
        v-model="activeTab"
        :options="tabOptions"
      />

      <!-- 列表内容 -->
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.scroll-content {
  height: calc(100vh - var(--window-top));
}
</style>
```

### 场景 2：多个 CapsuleTabs（只有一个吸顶）

**示例：商城页面（主分类 + 子分类）**

```vue
<template>
  <scroll-view class="scroll-content" :scroll-y="true">
    <!-- 主分类：不吸顶 -->
    <CapsuleTabs
      v-model="mainTab"
      :options="mainOptions"
      :sticky="false"
    />

    <!-- 子分类：吸顶 -->
    <CapsuleTabs
      v-model="subTab"
      :options="subOptions"
      :sticky="true"
    />

    <!-- 列表内容 -->
  </scroll-view>
</template>
```

### 场景 3：有 Banner 的页面（禁用吸顶）

**示例：首页**

```vue
<template>
  <view class="page-container">
    <!-- Banner 轮播图 -->
    <swiper class="banner-swiper">
      <!-- ... -->
    </swiper>

    <scroll-view class="scroll-content" :scroll-y="true">
      <!-- 禁用吸顶 -->
      <CapsuleTabs
        v-model="activeTab"
        :options="tabOptions"
        :sticky="false"
      />

      <!-- 列表内容 -->
    </scroll-view>
  </view>
</template>
```

## ⚙️ 配置说明

### 默认行为

```vue
<!-- 默认启用吸顶 -->
<CapsuleTabs v-model="activeTab" :options="tabOptions" />
```

等同于：

```vue
<CapsuleTabs
  v-model="activeTab"
  :options="tabOptions"
  :sticky="true"
  :offset-top="0"
  sticky-background="#F5F5F5"
/>
```

### 常用配置

| 配置 | 值 | 说明 |
|------|-----|------|
| `:sticky="false"` | 禁用吸顶 | 用于首页、主分类等 |
| `:sticky="true"` | 启用吸顶 | 默认值，可省略 |
| `:offset-top="100"` | 自定义吸顶位置 | 单位：px |
| `sticky-background="#FFF"` | 自定义背景色 | 吸顶时的背景 |

## 📋 页面检查清单

在应用吸顶功能前，检查以下几点：

- [ ] 页面使用了 `scroll-view` 组件
- [ ] scroll-view 设置了正确的高度：`height: calc(100vh - var(--window-top))`
- [ ] scroll-view 启用了滚动：`:scroll-y="true"`
- [ ] 确定哪些 CapsuleTabs 需要吸顶，哪些不需要
- [ ] 如果有 Banner，禁用吸顶：`:sticky="false"`

## 🔧 必需的样式配置

```scss
// 必须设置 scroll-view 的高度
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}

// 如果页面没有 TdPageHeader，使用：
.scroll-content {
  height: 100vh;
  box-sizing: border-box;
}

// 如果有固定高度的 Banner，使用：
.scroll-content {
  height: calc(100vh - 560rpx); // 减去 Banner 高度
  box-sizing: border-box;
}
```

## 🎨 已完成的页面

### ✅ 商城页面 (mall/index.vue)

```vue
<!-- 主分类：不吸顶 -->
<CapsuleTabs
  v-model="activeMainTab"
  :options="mainTabOptions"
  :sticky="false"
/>

<!-- 子分类：吸顶 -->
<CapsuleTabs
  v-model="activeCategory"
  :options="categoryOptions"
  :sticky="true"
/>
```

### ✅ 首页 (index/index.vue)

```vue
<!-- 有 Banner，禁用吸顶 -->
<CapsuleTabs
  v-model="currentTab"
  :options="allTabList"
  :sticky="false"
/>
```

## 📝 待处理页面

以下页面需要检查和应用吸顶功能：

1. **src/pages/academy/cases/index.vue** - 成功案例
2. **src/pages/academy/materials/index.vue** - 素材库
3. **src/pages/ambassador/cash-points/index.vue** - 积分管理
4. **src/pages/mine/orders/index.vue** - 我的订单
5. **src/pages/course/my-courses/index.vue** - 我的课程
6. **src/pages/ambassador/activity-records/index.vue** - 活动记录
7. **src/pages/mine/appointments/index.vue** - 我的预约

### 应用步骤

对于每个页面：

1. **打开页面文件**
2. **检查是否使用 scroll-view**
   - 如果没有，需要先改造页面结构
3. **确认 scroll-view 高度设置**
   ```scss
   .scroll-content {
     height: calc(100vh - var(--window-top));
   }
   ```
4. **决定是否启用吸顶**
   - 有 Banner：`:sticky="false"`
   - 多个 CapsuleTabs：第一个 `:sticky="false"`，第二个 `:sticky="true"`
   - 单个 CapsuleTabs：默认启用（可省略 sticky 属性）
5. **测试功能**
   - 刷新页面
   - 向下滚动
   - 确认吸顶效果

## 🐛 故障排除

### 问题：吸顶不生效

**检查：**
1. scroll-view 高度是否正确
2. scroll-y 是否启用
3. 内容是否足够长（能产生滚动）

**解决：**
```vue
<scroll-view
  class="scroll-content"
  :scroll-y="true"
>
```

```scss
.scroll-content {
  height: calc(100vh - var(--window-top));
}
```

### 问题：吸顶位置不对

**检查：**
页面是否有自定义的固定元素

**解决：**
```vue
<CapsuleTabs :offset-top="100" />
```

### 问题：不想要吸顶

**解决：**
```vue
<CapsuleTabs :sticky="false" />
```

## 📚 相关文档

- 详细文档：`src/components/CapsuleTabs.md`
- 实现总结：`docs/capsule-tabs-sticky-implementation.md`
- 示例页面：`src/pages/mall/index.vue`
