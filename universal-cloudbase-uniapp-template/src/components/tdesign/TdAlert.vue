<template>
  <view v-if="visible" class="t-alert" :class="alertClass">
    <!-- 图标 -->
    <view v-if="!noIcon" class="t-alert__icon">
      <slot name="icon">
        <text>{{ themeIcon }}</text>
      </slot>
    </view>
    
    <!-- 内容 -->
    <view class="t-alert__content">
      <view v-if="title" class="t-alert__title">{{ title }}</view>
      <view class="t-alert__message">
        <slot>{{ message }}</slot>
      </view>
      
      <!-- 操作区 -->
      <view v-if="$slots.operation" class="t-alert__operation">
        <slot name="operation"></slot>
      </view>
    </view>
    
    <!-- 关闭按钮 -->
    <view v-if="closable" class="t-alert__close" @click="handleClose">
      <text>×</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

type AlertTheme = 'info' | 'success' | 'warning' | 'error' | 'default'
type AlertVariant = 'fill' | 'outline'

interface Props {
  /** 标题 */
  title?: string
  /** 消息内容 */
  message?: string
  /** 主题 */
  theme?: AlertTheme
  /** 变体 */
  variant?: AlertVariant
  /** 是否可关闭 */
  closable?: boolean
  /** 是否显示 */
  visible?: boolean
  /** 是否紧凑模式 */
  compact?: boolean
  /** 是否显示左侧边框强调 */
  accentBorder?: boolean
  /** 是否横幅样式 */
  banner?: boolean
  /** 是否隐藏图标 */
  noIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  message: '',
  theme: 'info',
  variant: 'fill',
  closable: false,
  visible: true,
  compact: false,
  accentBorder: false,
  banner: false,
  noIcon: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:visible', value: boolean): void
}>()

const internalVisible = ref(props.visible)

const visible = computed({
  get: () => props.visible,
  set: (val) => {
    internalVisible.value = val
    emit('update:visible', val)
  }
})

const alertClass = computed(() => ({
  [`t-alert--theme-${props.theme}`]: true,
  [`t-alert--variant-${props.variant}`]: props.variant === 'outline',
  't-alert--closable': props.closable,
  't-alert--compact': props.compact,
  't-alert--accent-border': props.accentBorder,
  't-alert--banner': props.banner,
  't-alert--no-icon': props.noIcon
}))

const themeIcon = computed(() => {
  const icons: Record<AlertTheme, string> = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✕',
    default: '●'
  }
  return icons[props.theme] || icons.info
})

const handleClose = () => {
  visible.value = false
  emit('close')
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-alert {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: $td-comp-paddingTB-l $td-comp-paddingLR-m;
  border-radius: $td-radius-default;
  border: 2rpx solid transparent;
  background-color: $td-bg-color-container-hover;
  margin-bottom: $td-card-spacing;
  box-sizing: border-box;
}

.t-alert__icon {
  display: flex;
  align-items: center;
  font-size: 32rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.t-alert__content {
  flex: 1;
  min-width: 0;
}

.t-alert__title {
  font-size: $td-font-size-base;
  font-weight: $td-font-weight-medium;
  color: $td-text-color-primary;
  line-height: $td-line-height-base;
  margin-bottom: 8rpx;
}

.t-alert__message {
  font-size: $td-font-size-base;
  color: $td-text-color-secondary;
  line-height: $td-line-height-base;
}

.t-alert__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  font-size: 24rpx;
  color: $td-text-color-secondary;
  border-radius: $td-radius-default;
  flex-shrink: 0;
  margin-top: 4rpx;
  
  &:active {
    background-color: rgba(0, 0, 0, 0.06);
  }
}

.t-alert__operation {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
}

// 主题 - Info
.t-alert--theme-info {
  background-color: #EDF4FF;
  border-color: #EDF4FF;
  
  .t-alert__icon {
    color: $td-brand-color;
  }
  
  .t-alert__title {
    color: $td-brand-color;
  }
}

// 主题 - Success
.t-alert--theme-success {
  background-color: #E8F8F2;
  border-color: #E8F8F2;
  
  .t-alert__icon {
    color: $td-success-color;
  }
  
  .t-alert__title {
    color: $td-success-color;
  }
}

// 主题 - Warning
.t-alert--theme-warning {
  background-color: #FFF9E6;
  border-color: #FFF9E6;
  
  .t-alert__icon {
    color: $td-warning-color;
  }
  
  .t-alert__title {
    color: $td-warning-color;
  }
}

// 主题 - Error
.t-alert--theme-error {
  background-color: #FDECEE;
  border-color: #FDECEE;
  
  .t-alert__icon {
    color: $td-error-color;
  }
  
  .t-alert__title {
    color: $td-error-color;
  }
}

// 主题 - Default
.t-alert--theme-default {
  background-color: $td-bg-color-container-hover;
  border-color: $td-border-level-1;
}

// 变体 - 描边
.t-alert--variant-outline {
  background-color: transparent;
  
  &.t-alert--theme-info {
    border-color: $td-brand-color;
  }
  
  &.t-alert--theme-success {
    border-color: $td-success-color;
  }
  
  &.t-alert--theme-warning {
    border-color: $td-warning-color;
  }
  
  &.t-alert--theme-error {
    border-color: $td-error-color;
  }
}

// 紧凑模式
.t-alert--compact {
  padding: $td-comp-paddingTB-m $td-comp-paddingLR-s;
  
  .t-alert__icon {
    font-size: 28rpx;
  }
  
  .t-alert__title,
  .t-alert__message {
    font-size: $td-font-size-s;
  }
}

// 左侧边框强调
.t-alert--accent-border {
  border-left-width: 6rpx;
}

// 横幅样式
.t-alert--banner {
  border-radius: 0;
  border-left: none;
  border-right: none;
  margin-bottom: 0;
}

// 隐藏图标
.t-alert--no-icon .t-alert__icon {
  display: none;
}

.t-alert + .t-alert {
  margin-top: $td-card-spacing;
}
</style>













