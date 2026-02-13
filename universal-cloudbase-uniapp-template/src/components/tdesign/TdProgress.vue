<template>
  <view class="t-progress" :class="progressClass">
    <!-- 线性进度条 -->
    <template v-if="!circle">
      <view class="t-progress__bar">
        <view class="t-progress__inner" :style="innerStyle"></view>
        <view v-if="labelInside" class="t-progress__text">{{ displayText }}</view>
      </view>
      <view v-if="!labelInside && showText" class="t-progress__text">
        <slot>{{ displayText }}</slot>
      </view>
    </template>
    
    <!-- 圆形进度条 -->
    <template v-else>
      <view class="t-progress__circle">
        <view class="t-progress__circle-bg"></view>
        <view class="t-progress__circle-inner" :style="circleStyle"></view>
      </view>
      <view class="t-progress__circle-text">
        <slot>{{ displayText }}</slot>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ProgressTheme = 'primary' | 'success' | 'warning' | 'error'
type ProgressSize = 'small' | 'medium' | 'large'
type ProgressStatus = 'default' | 'success' | 'error' | 'warning'

interface Props {
  /** 进度百分比 0-100 */
  percentage?: number
  /** 主题 */
  theme?: ProgressTheme
  /** 尺寸 */
  size?: ProgressSize
  /** 状态 */
  status?: ProgressStatus
  /** 是否显示文字 */
  showText?: boolean
  /** 文字是否在内部 */
  labelInside?: boolean
  /** 是否条纹 */
  striped?: boolean
  /** 是否激活动画 */
  active?: boolean
  /** 是否圆形 */
  circle?: boolean
  /** 自定义文字 */
  format?: (percentage: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  percentage: 0,
  theme: 'primary',
  size: 'medium',
  status: 'default',
  showText: true,
  labelInside: false,
  striped: false,
  active: false,
  circle: false,
  format: undefined
})

const progressClass = computed(() => ({
  [`t-progress--theme-${props.theme}`]: true,
  [`t-progress--size-${props.size}`]: true,
  [`t-progress--status-${props.status}`]: props.status !== 'default',
  't-progress--striped': props.striped,
  't-progress--active': props.active,
  't-progress--circle': props.circle,
  't-progress--label-inside': props.labelInside
}))

const innerStyle = computed(() => ({
  width: `${Math.min(100, Math.max(0, props.percentage))}%`
}))

const circleStyle = computed(() => {
  const percentage = Math.min(100, Math.max(0, props.percentage))
  // 圆形进度使用 conic-gradient 实现
  return {
    background: `conic-gradient(var(--progress-color) ${percentage * 3.6}deg, transparent 0deg)`
  }
})

const displayText = computed(() => {
  const percentage = Math.min(100, Math.max(0, props.percentage))
  if (props.format) {
    return props.format(percentage)
  }
  return `${percentage}%`
})
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-progress {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  --progress-color: #{$td-brand-color};
}

.t-progress__bar {
  position: relative;
  flex: 1;
  height: 16rpx;
  background-color: $td-bg-color-container-hover;
  border-radius: 999rpx;
  overflow: hidden;
}

.t-progress__inner {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: var(--progress-color);
  border-radius: 999rpx;
  transition: width $td-transition-duration-slow $td-transition-timing-function;
}

.t-progress__text {
  margin-left: 16rpx;
  font-size: $td-font-size-s;
  color: $td-text-color-secondary;
  white-space: nowrap;
  flex-shrink: 0;
}

// 主题
.t-progress--theme-primary {
  --progress-color: #{$td-brand-color};
}

.t-progress--theme-success {
  --progress-color: #{$td-success-color};
}

.t-progress--theme-warning {
  --progress-color: #{$td-warning-color};
}

.t-progress--theme-error {
  --progress-color: #{$td-error-color};
}

// 状态
.t-progress--status-success {
  --progress-color: #{$td-success-color};
  
  .t-progress__text {
    color: $td-success-color;
  }
}

.t-progress--status-error {
  --progress-color: #{$td-error-color};
  
  .t-progress__text {
    color: $td-error-color;
  }
}

.t-progress--status-warning {
  --progress-color: #{$td-warning-color};
  
  .t-progress__text {
    color: $td-warning-color;
  }
}

// 尺寸
.t-progress--size-small .t-progress__bar {
  height: 8rpx;
}

.t-progress--size-large .t-progress__bar {
  height: 24rpx;
}

// 条纹
.t-progress--striped .t-progress__inner {
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.15) 75%,
    transparent 75%,
    transparent
  );
  background-size: 40rpx 40rpx;
}

// 激活动画
.t-progress--striped.t-progress--active .t-progress__inner {
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  from {
    background-position: 40rpx 0;
  }
  to {
    background-position: 0 0;
  }
}

// 标签在内部
.t-progress--label-inside .t-progress__bar {
  height: 40rpx;
}

.t-progress--label-inside .t-progress__text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin-left: 0;
  color: #FFFFFF;
  font-size: 22rpx;
  z-index: 1;
}

// 圆形进度条
.t-progress--circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 200rpx;
  height: 200rpx;
  position: relative;
  
  .t-progress__circle {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
  
  .t-progress__circle-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: $td-bg-color-container-hover;
  }
  
  .t-progress__circle-inner {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    mask: radial-gradient(transparent 60%, #000 60%);
    -webkit-mask: radial-gradient(transparent 60%, #000 60%);
  }
  
  .t-progress__circle-text {
    position: relative;
    font-size: $td-font-size-m;
    font-weight: $td-font-weight-semibold;
    color: $td-text-color-primary;
  }
}

.t-progress--circle.t-progress--size-small {
  width: 120rpx;
  height: 120rpx;
  
  .t-progress__circle-text {
    font-size: $td-font-size-s;
  }
}

.t-progress--circle.t-progress--size-large {
  width: 280rpx;
  height: 280rpx;
  
  .t-progress__circle-text {
    font-size: $td-font-size-l;
  }
}
</style>



























