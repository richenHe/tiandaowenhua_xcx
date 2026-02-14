<template>
  <button
    class="t-button"
    :class="buttonClass"
    :disabled="disabled || loading"
    :loading="loading"
    :open-type="openType"
    @click="handleClick"
    @getuserinfo="emit('getuserinfo', $event)"
    @getphonenumber="emit('getphonenumber', $event)"
  >
    <view v-if="icon && !loading" class="t-button__icon">
      <text>{{ icon }}</text>
    </view>
    <view class="t-button__text">
      <slot>{{ text }}</slot>
    </view>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ButtonTheme = 'primary' | 'default' | 'light' | 'danger' | 'success' | 'warning'
type ButtonSize = 'small' | 'medium' | 'large' | 'extra-large'
type ButtonShape = 'rectangle' | 'round' | 'circle' | 'square'
type ButtonVariant = 'base' | 'fill' | 'outline' | 'text' | 'dashed'

interface Props {
  /** 按钮文字 */
  text?: string
  /** 主题 */
  theme?: ButtonTheme
  /** 尺寸 */
  size?: ButtonSize
  /** 形状 */
  shape?: ButtonShape
  /** 变体 */
  variant?: ButtonVariant
  /** 是否禁用 */
  disabled?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 是否占满整行 */
  block?: boolean
  /** 是否为幽灵按钮 */
  ghost?: boolean
  /** 图标 */
  icon?: string
  /** 微信开放能力 */
  openType?: string
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  theme: 'default',
  size: 'medium',
  shape: 'rectangle',
  variant: 'base',
  disabled: false,
  loading: false,
  block: false,
  ghost: false,
  icon: '',
  openType: ''
})

const emit = defineEmits<{
  (e: 'click', event: Event): void
  (e: 'getuserinfo', event: any): void
  (e: 'getphonenumber', event: any): void
}>()

const buttonClass = computed(() => ({
  [`t-button--theme-${props.theme}`]: true,
  [`t-button--size-${props.size}`]: true,
  [`t-button--shape-${props.shape}`]: true,
  [`t-button--variant-${props.variant}`]: true,
  't-button--disabled': props.disabled,
  't-button--loading': props.loading,
  't-button--block': props.block,
  't-button--ghost': props.ghost
}))

const handleClick = (e: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 0 $td-comp-paddingLR-m;
  height: $td-comp-size-m;
  font-size: $td-font-size-base;
  font-weight: $td-font-weight-medium;
  line-height: 1;
  white-space: nowrap;
  text-align: center;
  border: 2rpx solid transparent;
  border-radius: $td-radius-default;
  transition: all $td-transition-duration-base $td-transition-timing-function;
  box-sizing: border-box;
  
  // 清除微信按钮默认样式
  &::after {
    display: none;
  }
}

.t-button__text {
  display: inline-block;
}

.t-button__icon {
  display: inline-flex;
  align-items: center;
  font-size: 32rpx;
}

// 尺寸
.t-button--size-small {
  height: $td-comp-size-s;
  padding: 0 $td-comp-paddingLR-s;
  font-size: $td-font-size-s;
}

.t-button--size-large {
  height: $td-comp-size-l;
  padding: 0 $td-comp-paddingLR-l;
  font-size: $td-font-size-m;
}

.t-button--size-extra-large {
  height: $td-comp-size-xl;
  padding: 0 $td-comp-paddingLR-xl;
  font-size: $td-font-size-m;
}

// 形状
.t-button--shape-round {
  border-radius: $td-radius-round;
}

.t-button--shape-circle {
  width: $td-comp-size-m;
  padding: 0;
  border-radius: 50%;
}

.t-button--shape-circle.t-button--size-small {
  width: $td-comp-size-s;
}

.t-button--shape-circle.t-button--size-large {
  width: $td-comp-size-l;
}

.t-button--shape-square {
  border-radius: 0;
}

// 主题 - Base 样式（原型图主要样式）
.t-button--theme-primary.t-button--variant-base {
  background-color: #F3F6FF; // --td-bg-color-container-select
  color: $td-brand-color;
  border-color: transparent;
  
  &:active:not(.t-button--disabled) {
    background-color: #D4E3FF;
  }
}

.t-button--theme-default.t-button--variant-base {
  background-color: $td-bg-color-container;
  color: $td-text-color-primary;
  border-color: $td-border-level-1;
  
  &:active:not(.t-button--disabled) {
    background-color: $td-bg-color-container-hover;
  }
}

.t-button--theme-success.t-button--variant-base {
  background-color: $td-success-color;
  color: #FFFFFF;
  border-color: $td-success-color;
  
  &:active:not(.t-button--disabled) {
    opacity: 0.9;
  }
}

.t-button--theme-warning.t-button--variant-base {
  background-color: $td-warning-color;
  color: #FFFFFF;
  border-color: $td-warning-color;
  
  &:active:not(.t-button--disabled) {
    opacity: 0.9;
  }
}

.t-button--theme-danger.t-button--variant-base {
  background-color: $td-error-color;
  color: #FFFFFF;
  border-color: $td-error-color;
  
  &:active:not(.t-button--disabled) {
    opacity: 0.9;
  }
}

// 主题 - 填充样式（保持兼容）
.t-button--theme-primary.t-button--variant-fill {
  background-color: $td-brand-color;
  color: #FFFFFF;
  
  &:active:not(.t-button--disabled) {
    background-color: $td-brand-color-dark;
  }
}

.t-button--theme-default.t-button--variant-fill {
  background-color: $td-bg-color-container-active;
  color: $td-text-color-primary;
  
  &:active:not(.t-button--disabled) {
    background-color: $td-bg-color-container-hover;
  }
}

.t-button--theme-danger.t-button--variant-fill {
  background-color: $td-error-color;
  color: #FFFFFF;
  
  &:active:not(.t-button--disabled) {
    opacity: 0.9;
  }
}

.t-button--theme-success.t-button--variant-fill {
  background-color: $td-success-color;
  color: #FFFFFF;
}

.t-button--theme-warning.t-button--variant-fill {
  background-color: $td-warning-color;
  color: #FFFFFF;
}

// 主题 - 描边样式
.t-button--variant-outline {
  background-color: transparent;
}

.t-button--theme-primary.t-button--variant-outline {
  border-color: $td-brand-color;
  color: $td-brand-color;
}

.t-button--theme-default.t-button--variant-outline {
  border-color: $td-border-level-1;
  color: $td-text-color-primary;
}

.t-button--theme-danger.t-button--variant-outline {
  border-color: $td-error-color;
  color: $td-error-color;
}

// 主题 - 文字样式
.t-button--variant-text {
  background-color: transparent;
  border-color: transparent;
  padding: 0 16rpx;
}

.t-button--theme-primary.t-button--variant-text {
  color: $td-brand-color;
}

.t-button--theme-default.t-button--variant-text {
  color: $td-text-color-primary;
}

.t-button--theme-danger.t-button--variant-text {
  color: $td-error-color;
}

// 主题 - 虚线样式
.t-button--variant-dashed {
  background-color: transparent;
  border-style: dashed;
}

.t-button--theme-primary.t-button--variant-dashed {
  border-color: $td-brand-color;
  color: $td-brand-color;
}

.t-button--theme-default.t-button--variant-dashed {
  border-color: $td-border-level-1;
  color: $td-text-color-primary;
}

// 禁用状态
.t-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

// 加载中（使用原生微信 loading）
.t-button--loading {
  cursor: wait;
}

// 块级按钮
.t-button--block {
  display: flex;
  width: 100%;
}

// 幽灵按钮
.t-button--ghost {
  background-color: transparent;
  
  &.t-button--theme-primary {
    border-color: $td-brand-color;
    color: $td-brand-color;
  }
}
</style>

