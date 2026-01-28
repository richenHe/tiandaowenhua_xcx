<template>
  <view class="t-tag" :class="tagClass" @click="handleClick">
    <view v-if="icon || $slots.icon" class="t-tag__icon">
      <slot name="icon">
        <text>{{ icon }}</text>
      </slot>
    </view>
    <view class="t-tag__text">
      <slot>{{ text }}</slot>
    </view>
    <view v-if="closable" class="t-tag__close" @click.stop="handleClose">
      <text>×</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TagTheme = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'error'
type TagSize = 'small' | 'medium' | 'large'
type TagShape = 'square' | 'round' | 'mark'
type TagVariant = 'light' | 'dark' | 'outline'

interface Props {
  /** 标签文字 */
  text?: string
  /** 主题 */
  theme?: TagTheme
  /** 尺寸 */
  size?: TagSize
  /** 形状 */
  shape?: TagShape
  /** 变体 */
  variant?: TagVariant
  /** 图标 */
  icon?: string
  /** 是否可关闭 */
  closable?: boolean
  /** 是否可选中 */
  checkable?: boolean
  /** 是否选中 */
  checked?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 最大宽度（超出显示省略号） */
  maxWidth?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  theme: 'default',
  size: 'medium',
  shape: 'square',
  variant: 'light',
  icon: '',
  closable: false,
  checkable: false,
  checked: false,
  disabled: false,
  maxWidth: undefined
})

const emit = defineEmits<{
  (e: 'click', event: Event): void
  (e: 'close', event: Event): void
  (e: 'update:checked', value: boolean): void
}>()

const tagClass = computed(() => ({
  [`t-tag--theme-${props.theme}`]: true,
  [`t-tag--size-${props.size}`]: true,
  [`t-tag--shape-${props.shape}`]: true,
  [`t-tag--variant-${props.variant}`]: true,
  't-tag--closable': props.closable,
  't-tag--checkable': props.checkable,
  't-tag--checked': props.checked,
  't-tag--disabled': props.disabled,
  't-tag--ellipsis': !!props.maxWidth
}))

const handleClick = (e: Event) => {
  if (props.disabled) return
  
  if (props.checkable) {
    emit('update:checked', !props.checked)
  }
  emit('click', e)
}

const handleClose = (e: Event) => {
  if (props.disabled) return
  emit('close', e)
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44rpx;
  padding: 0 16rpx;
  font-size: $td-font-size-s;
  font-weight: $td-font-weight-medium;
  line-height: 1;
  border-radius: $td-radius-small;
  white-space: nowrap;
  box-sizing: border-box;
}

.t-tag__text {
  display: inline-block;
}

.t-tag__icon {
  margin-right: 8rpx;
  font-size: 24rpx;
}

.t-tag__close {
  margin-left: 8rpx;
  font-size: 24rpx;
  cursor: pointer;
  opacity: 0.7;
}

// 主题 - 浅色
.t-tag--theme-default.t-tag--variant-light,
.t-tag--theme-primary.t-tag--variant-light {
  background-color: rgba($td-brand-color, 0.1);
  color: $td-brand-color;
}

.t-tag--theme-success.t-tag--variant-light {
  background-color: rgba($td-success-color, 0.1);
  color: $td-success-color;
}

.t-tag--theme-warning.t-tag--variant-light {
  background-color: rgba($td-warning-color, 0.1);
  color: $td-warning-color;
}

.t-tag--theme-danger.t-tag--variant-light,
.t-tag--theme-error.t-tag--variant-light {
  background-color: rgba($td-error-color, 0.1);
  color: $td-error-color;
}

// 主题 - 深色
.t-tag--theme-default.t-tag--variant-dark,
.t-tag--theme-primary.t-tag--variant-dark {
  background-color: $td-brand-color;
  color: #FFFFFF;
}

.t-tag--theme-success.t-tag--variant-dark {
  background-color: $td-success-color;
  color: #FFFFFF;
}

.t-tag--theme-warning.t-tag--variant-dark {
  background-color: $td-warning-color;
  color: #FFFFFF;
}

.t-tag--theme-danger.t-tag--variant-dark,
.t-tag--theme-error.t-tag--variant-dark {
  background-color: $td-error-color;
  color: #FFFFFF;
}

// 主题 - 描边
.t-tag--variant-outline {
  background-color: transparent;
  border: 2rpx solid;
}

.t-tag--theme-default.t-tag--variant-outline,
.t-tag--theme-primary.t-tag--variant-outline {
  border-color: $td-brand-color;
  color: $td-brand-color;
}

.t-tag--theme-success.t-tag--variant-outline {
  border-color: $td-success-color;
  color: $td-success-color;
}

.t-tag--theme-warning.t-tag--variant-outline {
  border-color: $td-warning-color;
  color: $td-warning-color;
}

.t-tag--theme-danger.t-tag--variant-outline,
.t-tag--theme-error.t-tag--variant-outline {
  border-color: $td-error-color;
  color: $td-error-color;
}

// 尺寸
.t-tag--size-small {
  height: 36rpx;
  padding: 0 12rpx;
  font-size: $td-font-size-xs;
}

.t-tag--size-large {
  height: 56rpx;
  padding: 0 24rpx;
  font-size: $td-font-size-base;
}

// 形状
.t-tag--shape-round {
  border-radius: $td-radius-round;
}

.t-tag--shape-mark {
  border-radius: 0 $td-radius-small $td-radius-small 0;
}

// 可选中
.t-tag--checkable {
  cursor: pointer;
}

.t-tag--checkable:not(.t-tag--checked) {
  background-color: $td-bg-color-container-active;
  color: $td-text-color-secondary;
}

// 禁用
.t-tag--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

// 省略
.t-tag--ellipsis {
  max-width: 200rpx;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

