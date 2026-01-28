<template>
  <view class="t-badge" :class="badgeClass">
    <slot></slot>
    <view v-if="visible" class="t-badge__inner" :class="innerClass" :style="innerStyle">
      <slot name="count">
        {{ displayContent }}
      </slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type BadgeTheme = 'primary' | 'success' | 'warning' | 'danger' | 'error' | 'info' | 'default'
type BadgeSize = 'small' | 'medium' | 'large'
type BadgeShape = 'round' | 'square' | 'circle' | 'ribbon'
type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

interface Props {
  /** 显示的内容 */
  count?: number | string
  /** 是否显示为红点 */
  dot?: boolean
  /** 最大显示数量（超过显示 count+） */
  maxCount?: number
  /** 偏移量 [x, y] */
  offset?: [number, number]
  /** 是否显示 */
  showZero?: boolean
  /** 主题 */
  theme?: BadgeTheme
  /** 尺寸 */
  size?: BadgeSize
  /** 形状 */
  shape?: BadgeShape
  /** 是否有边框 */
  bordered?: boolean
  /** 是否独立使用（不包裹内容） */
  standalone?: boolean
  /** 位置 */
  position?: BadgePosition
  /** 是否显示脉冲动画 */
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  dot: false,
  maxCount: 99,
  offset: undefined,
  showZero: false,
  theme: 'danger',
  size: 'medium',
  shape: 'round',
  bordered: true,
  standalone: false,
  position: 'top-right',
  pulse: false
})

const badgeClass = computed(() => ({
  't-badge--standalone': props.standalone,
  [`t-badge--position-${props.position}`]: !props.standalone,
  't-badge--pulse': props.pulse
}))

const innerClass = computed(() => ({
  't-badge--dot': props.dot,
  [`t-badge--theme-${props.theme}`]: true,
  [`t-badge--size-${props.size}`]: true,
  [`t-badge--shape-${props.shape}`]: true,
  't-badge--bordered': props.bordered
}))

const innerStyle = computed(() => {
  if (props.offset && props.offset.length === 2) {
    return {
      transform: `translate(calc(50% + ${props.offset[0]}rpx), calc(-50% + ${props.offset[1]}rpx))`
    }
  }
  return {}
})

const visible = computed(() => {
  if (props.dot) return true
  if (typeof props.count === 'string') return !!props.count
  return props.showZero || props.count > 0
})

const displayContent = computed(() => {
  if (props.dot) return ''
  if (typeof props.count === 'string') return props.count
  if (props.count > props.maxCount) return `${props.maxCount}+`
  return props.count
})
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-badge {
  position: relative;
  display: inline-block;
  vertical-align: middle;
}

.t-badge--standalone {
  display: inline-flex;
}

.t-badge--standalone .t-badge__inner {
  position: relative;
  transform: none;
}

.t-badge__inner {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(50%, -50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 12rpx;
  font-size: $td-font-size-xs;
  font-weight: $td-font-weight-medium;
  color: #FFFFFF;
  background-color: $td-error-color;
  border-radius: 32rpx;
  white-space: nowrap;
  box-sizing: border-box;
  z-index: 1;
}

// 点样式
.t-badge--dot {
  min-width: 16rpx;
  width: 16rpx;
  height: 16rpx;
  padding: 0;
  border-radius: 50%;
}

// 主题
.t-badge--theme-primary {
  background-color: $td-brand-color;
}

.t-badge--theme-success {
  background-color: $td-success-color;
}

.t-badge--theme-warning {
  background-color: $td-warning-color;
}

.t-badge--theme-danger {
  background-color: $td-error-color;
}

.t-badge--theme-info {
  background-color: #909399;
}

// 尺寸
.t-badge--size-small {
  min-width: 24rpx;
  height: 24rpx;
  padding: 0 8rpx;
  font-size: 20rpx;
  
  &.t-badge--dot {
    min-width: 12rpx;
    width: 12rpx;
    height: 12rpx;
    padding: 0;
  }
}

.t-badge--size-large {
  min-width: 40rpx;
  height: 40rpx;
  padding: 0 16rpx;
  font-size: $td-font-size-s;
  
  &.t-badge--dot {
    min-width: 20rpx;
    width: 20rpx;
    height: 20rpx;
    padding: 0;
  }
}

// 形状
.t-badge--shape-square {
  border-radius: $td-radius-default;
}

.t-badge--shape-ribbon {
  position: absolute;
  top: -6rpx;
  right: -12rpx;
  padding: 4rpx 20rpx;
  border-radius: 0 $td-radius-default 0 $td-radius-default;
  transform: none;
}

// 边框
.t-badge--bordered {
  box-shadow: 0 0 0 2rpx #FFFFFF;
}

// 位置变体
.t-badge--position-top-left .t-badge__inner {
  top: 0;
  right: auto;
  left: 0;
  transform: translate(-50%, -50%);
}

.t-badge--position-bottom-left .t-badge__inner {
  top: auto;
  bottom: 0;
  right: auto;
  left: 0;
  transform: translate(-50%, 50%);
}

.t-badge--position-bottom-right .t-badge__inner {
  top: auto;
  bottom: 0;
  right: 0;
  left: auto;
  transform: translate(50%, 50%);
}

// 圆形形状
.t-badge--shape-circle {
  border-radius: 50%;
}

// 脉冲动画
.t-badge--pulse .t-badge__inner::after {
  content: '';
  position: absolute;
  top: -2rpx;
  left: -2rpx;
  right: -2rpx;
  bottom: -2rpx;
  border-radius: inherit;
  background-color: inherit;
  animation: badge-pulse 1.5s infinite;
  z-index: -1;
}

@keyframes badge-pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

// 错误主题（别名）
.t-badge--theme-error {
  background-color: $td-error-color;
}

// 默认主题
.t-badge--theme-default {
  color: $td-text-color-primary;
  background-color: $td-bg-color-container-hover;
}
</style>

