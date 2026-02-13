<template>
  <view 
    v-if="!vertical" 
    class="t-divider t-divider--horizontal" 
    :class="dividerClass"
  >
    <view v-if="$slots.default || content" class="t-divider__text">
      <slot>{{ content }}</slot>
    </view>
  </view>
  <view v-else class="t-divider t-divider--vertical" :class="dividerClass"></view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type DividerAlign = 'left' | 'center' | 'right'
type DividerTheme = 'default' | 'primary' | 'success' | 'warning' | 'error'
type DividerLineStyle = 'solid' | 'dashed' | 'dotted'

interface Props {
  /** 是否垂直 */
  vertical?: boolean
  /** 文字内容 */
  content?: string
  /** 文字位置 */
  align?: DividerAlign
  /** 主题 */
  theme?: DividerTheme
  /** 线条样式 */
  lineStyle?: DividerLineStyle
  /** 是否紧凑 */
  compact?: boolean
  /** 是否无间距 */
  noMargin?: boolean
  /** 是否加粗 */
  thick?: boolean
  /** 是否渐变 */
  gradient?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  vertical: false,
  content: '',
  align: 'center',
  theme: 'default',
  lineStyle: 'solid',
  compact: false,
  noMargin: false,
  thick: false,
  gradient: false
})

const hasContent = computed(() => {
  return !!props.content || !!props.content
})

const dividerClass = computed(() => ({
  't-divider--with-text': hasContent.value && !props.vertical,
  [`t-divider--text-${props.align}`]: hasContent.value && !props.vertical,
  't-divider--no-text': !hasContent.value && !props.vertical,
  [`t-divider--theme-${props.theme}`]: props.theme !== 'default',
  [`t-divider--${props.lineStyle}`]: props.lineStyle !== 'solid',
  't-divider--compact': props.compact,
  't-divider--no-margin': props.noMargin,
  't-divider--thick': props.thick,
  't-divider--gradient': props.gradient
}))
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-divider {
  display: flex;
  align-items: center;
  margin: $td-comp-paddingTB-xl 0;
  border: none;
  font-size: $td-font-size-s;
  color: $td-text-color-secondary;
}

.t-divider::before,
.t-divider::after {
  content: '';
  flex: 1;
  height: 2rpx;
  background-color: $td-border-level-1;
}

// 水平分割线
.t-divider--horizontal {
  width: 100%;
  flex-direction: row;
}

// 垂直分割线
.t-divider--vertical {
  display: inline-block;
  width: 2rpx;
  height: 1em;
  margin: 0 16rpx;
  vertical-align: middle;
  background-color: $td-border-level-1;
  
  &::before,
  &::after {
    display: none;
  }
}

// 带文字
.t-divider--with-text {
  display: flex;
}

.t-divider__text {
  padding: 0 32rpx;
  white-space: nowrap;
}

// 文字位置
.t-divider--text-left::before {
  flex: 0 0 5%;
  max-width: 5%;
}

.t-divider--text-left::after {
  flex: 1;
}

.t-divider--text-center::before,
.t-divider--text-center::after {
  flex: 1;
}

.t-divider--text-right::before {
  flex: 1;
}

.t-divider--text-right::after {
  flex: 0 0 5%;
  max-width: 5%;
}

// 无文字
.t-divider--no-text::before {
  flex: 1;
}

.t-divider--no-text::after {
  display: none;
}

// 虚线
.t-divider--dashed::before,
.t-divider--dashed::after {
  border-top: 2rpx dashed $td-border-level-1;
  background-color: transparent;
  height: 0;
}

.t-divider--dashed.t-divider--vertical {
  border-left: 2rpx dashed $td-border-level-1;
  background-color: transparent;
  width: 0;
}

// 点线
.t-divider--dotted::before,
.t-divider--dotted::after {
  border-top: 2rpx dotted $td-border-level-1;
  background-color: transparent;
  height: 0;
}

.t-divider--dotted.t-divider--vertical {
  border-left: 2rpx dotted $td-border-level-1;
  background-color: transparent;
  width: 0;
}

// 主题
.t-divider--theme-primary {
  &::before,
  &::after {
    background-color: $td-brand-color;
  }
  
  &.t-divider--vertical {
    background-color: $td-brand-color;
  }
  
  .t-divider__text {
    color: $td-brand-color;
  }
}

.t-divider--theme-success {
  &::before,
  &::after {
    background-color: $td-success-color;
  }
  
  &.t-divider--vertical {
    background-color: $td-success-color;
  }
  
  .t-divider__text {
    color: $td-success-color;
  }
}

.t-divider--theme-warning {
  &::before,
  &::after {
    background-color: $td-warning-color;
  }
  
  &.t-divider--vertical {
    background-color: $td-warning-color;
  }
  
  .t-divider__text {
    color: $td-warning-color;
  }
}

.t-divider--theme-error {
  &::before,
  &::after {
    background-color: $td-error-color;
  }
  
  &.t-divider--vertical {
    background-color: $td-error-color;
  }
  
  .t-divider__text {
    color: $td-error-color;
  }
}

// 紧凑
.t-divider--compact {
  margin: $td-comp-paddingTB-m 0;
}

// 无间距
.t-divider--no-margin {
  margin: 0;
}

// 加粗
.t-divider--thick {
  &::before,
  &::after {
    height: 4rpx;
  }
  
  &.t-divider--vertical {
    width: 4rpx;
  }
}

// 渐变
.t-divider--gradient {
  &::before,
  &::after {
    background: linear-gradient(to right, transparent, $td-border-level-1, transparent);
  }
  
  &.t-divider--vertical {
    background: linear-gradient(to bottom, transparent, $td-border-level-1, transparent);
  }
}
</style>



























