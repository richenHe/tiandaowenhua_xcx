<template>
  <view class="t-tabs" :class="tabsClass">
    <!-- 选项卡导航 -->
    <scroll-view
      class="t-tabs__nav"
      scroll-x
      :scroll-with-animation="true"
      :scroll-left="scrollLeft"
    >
      <view
        v-for="(item, index) in tabs"
        :key="index"
        class="t-tabs__nav-item"
        :class="{
          't-tabs__nav-item--active': modelValue === index,
          't-tabs__nav-item--disabled': item.disabled
        }"
        @click="handleTabClick(index, item)"
      >
        <view v-if="item.icon" class="t-tabs__nav-item-icon">
          <text>{{ item.icon }}</text>
        </view>
        <text>{{ item.label }}</text>
        <view v-if="item.badge" class="t-tabs__nav-item-badge">
          {{ item.badge }}
        </view>
      </view>
      
      <!-- 下划线指示器 -->
      <view v-if="!theme || theme === 'line'" class="t-tabs__track" :style="trackStyle"></view>
    </scroll-view>
    
    <!-- 内容区 -->
    <view v-if="$slots.default" class="t-tabs__content">
      <slot></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'

interface TabItem {
  label: string
  icon?: string
  badge?: string | number
  disabled?: boolean
}

type TabsTheme = 'line' | 'card' | 'capsule'

interface Props {
  /** 当前激活的选项卡索引 */
  modelValue?: number
  /** 选项卡列表 */
  tabs?: TabItem[]
  /** 主题 */
  theme?: TabsTheme
  /** 是否平均分配宽度 */
  evenly?: boolean
  /** 是否显示底部边框 */
  bordered?: boolean
  /** 是否吸顶 */
  sticky?: boolean
  /** 吸顶偏移量 */
  stickyTop?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  tabs: () => [],
  theme: 'line',
  evenly: false,
  bordered: true,
  sticky: false,
  stickyTop: 0
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'change', value: number, item: TabItem): void
}>()

const scrollLeft = ref(0)
const trackStyle = ref({})

const tabsClass = computed(() => ({
  [`t-tabs--${props.theme}`]: true,
  't-tabs--evenly': props.evenly,
  't-tabs--bordered': props.bordered && props.theme === 'line',
  't-tabs--sticky': props.sticky
}))

const handleTabClick = (index: number, item: TabItem) => {
  if (item.disabled) return
  
  emit('update:modelValue', index)
  emit('change', index, item)
}

// 更新指示器位置
const updateTrack = async () => {
  await nextTick()
  
  if (props.theme !== 'line') return
  if (!props.tabs.length) return
  
  const itemWidth = props.evenly ? 100 / props.tabs.length : 0
  const width = props.evenly ? `${itemWidth}%` : '60rpx'
  const left = props.evenly 
    ? `${props.modelValue * itemWidth + itemWidth / 2}%`
    : `calc(${props.modelValue * 150}rpx + 45rpx)`
  
  trackStyle.value = {
    width,
    left,
    transform: 'translateX(-50%)'
  }
}

watch(() => props.modelValue, updateTrack)
watch(() => props.tabs, updateTrack)

onMounted(updateTrack)
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-tabs {
  width: 100%;
}

.t-tabs__nav {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  background-color: $td-bg-color-container;
  white-space: nowrap;
}

.t-tabs__nav-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 88rpx;
  padding: 0 $td-comp-paddingLR-m;
  font-size: $td-font-size-base;
  color: $td-text-color-secondary;
  cursor: pointer;
  transition: all $td-transition-duration-base $td-transition-timing-function;
}

.t-tabs__nav-item--active {
  color: $td-brand-color;
  font-weight: $td-font-weight-medium;
}

.t-tabs__nav-item--disabled {
  color: $td-text-color-disabled;
  cursor: not-allowed;
}

.t-tabs__nav-item-icon {
  margin-right: 8rpx;
  font-size: 32rpx;
}

.t-tabs__nav-item-badge {
  margin-left: 8rpx;
  padding: 0 12rpx;
  height: 32rpx;
  line-height: 32rpx;
  font-size: $td-font-size-xs;
  color: #FFFFFF;
  background-color: $td-error-color;
  border-radius: 32rpx;
}

// 下划线指示器
.t-tabs__track {
  position: absolute;
  bottom: 0;
  height: 4rpx;
  background-color: $td-brand-color;
  border-radius: 2rpx;
  transition: all $td-transition-duration-base $td-transition-timing-function;
}

// 均分模式
.t-tabs--evenly .t-tabs__nav {
  display: flex;
}

.t-tabs--evenly .t-tabs__nav-item {
  flex: 1;
  padding: 0;
}

// 带边框
.t-tabs--bordered .t-tabs__nav {
  border-bottom: 2rpx solid $td-border-level-1;
}

// 卡片模式
.t-tabs--card .t-tabs__nav {
  background-color: $td-bg-color-page;
  padding: 8rpx;
  border-radius: $td-radius-default;
}

.t-tabs--card .t-tabs__nav-item {
  height: 64rpx;
  padding: 0 $td-comp-paddingLR-l;
  border-radius: $td-radius-default;
}

.t-tabs--card .t-tabs__nav-item--active {
  background-color: $td-bg-color-container;
  box-shadow: $td-shadow-1;
}

// 胶囊模式
.t-tabs--capsule .t-tabs__nav {
  background-color: $td-bg-color-page;
  padding: 6rpx;
  border-radius: $td-radius-round;
}

.t-tabs--capsule .t-tabs__nav-item {
  height: 56rpx;
  padding: 0 $td-comp-paddingLR-m;
  border-radius: $td-radius-round;
}

.t-tabs--capsule .t-tabs__nav-item--active {
  background-color: $td-brand-color;
  color: #FFFFFF;
}

// 吸顶
.t-tabs--sticky .t-tabs__nav {
  position: sticky;
  top: 0;
  z-index: 100;
}

// 内容区
.t-tabs__content {
  width: 100%;
}
</style>

