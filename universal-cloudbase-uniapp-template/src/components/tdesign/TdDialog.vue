<template>
  <view v-if="visible" class="t-dialog-overlay" @click="handleOverlayClick">
    <view class="t-dialog" :class="dialogClass" @click.stop>
      <!-- 标题 -->
      <view v-if="title" class="t-dialog__header">
        <text class="t-dialog__title">{{ title }}</text>
      </view>
      
      <!-- 内容 -->
      <view class="t-dialog__body">
        <slot>
          <text class="t-dialog__content">{{ content }}</text>
        </slot>
      </view>
      
      <!-- 底部按钮 -->
      <view class="t-dialog__footer">
        <button
          v-if="showCancel"
          class="t-dialog__button t-dialog__button--cancel"
          @click="handleCancel"
        >
          <text class="t-dialog__button-text">{{ cancelText }}</text>
        </button>
        <button
          class="t-dialog__button t-dialog__button--confirm"
          @click="handleConfirm"
        >
          <text class="t-dialog__button-text">{{ confirmText }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type DialogTheme = 'default' | 'info' | 'success' | 'warning' | 'error'

interface Props {
  /** 是否显示 */
  visible?: boolean
  /** 标题 */
  title?: string
  /** 内容 */
  content?: string
  /** 主题 */
  theme?: DialogTheme
  /** 确认按钮文字 */
  confirmText?: string
  /** 取消按钮文字 */
  cancelText?: string
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** 点击遮罩是否关闭 */
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  content: '',
  theme: 'default',
  confirmText: '确认',
  cancelText: '取消',
  showCancel: true,
  closeOnOverlay: true
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'close'): void
}>()

const dialogClass = computed(() => ({
  [`t-dialog--theme-${props.theme}`]: true
}))

const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
  emit('close')
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
  emit('close')
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    emit('cancel')
    emit('update:visible', false)
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  padding: 32rpx;
  box-sizing: border-box;
}

.t-dialog {
  width: 100%;
  max-width: 560rpx;
  background-color: white;
  border-radius: $td-radius-large;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  animation: dialog-fade-in 0.3s ease-out;
}

@keyframes dialog-fade-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.t-dialog__header {
  padding: 32rpx 32rpx 16rpx;
  text-align: center;
}

.t-dialog__title {
  font-size: 36rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  line-height: 1.4;
}

.t-dialog__body {
  padding: 16rpx 32rpx 32rpx;
  text-align: center;
}

.t-dialog__content {
  font-size: 28rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
  white-space: pre-line;
}

.t-dialog__footer {
  display: flex;
  border-top: 2rpx solid $td-border-level-1;
}

.t-dialog__button {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  
  &:active {
    background-color: $td-bg-color-container-active;
  }
  
  &:not(:last-child) {
    border-right: 2rpx solid $td-border-level-1;
  }
}

.t-dialog__button-text {
  font-size: 32rpx;
  font-weight: 500;
}

.t-dialog__button--cancel {
  .t-dialog__button-text {
    color: $td-text-color-secondary;
  }
}

.t-dialog__button--confirm {
  .t-dialog__button-text {
    color: $td-brand-color;
  }
}

// 主题样式
.t-dialog--theme-info {
  .t-dialog__button--confirm .t-dialog__button-text {
    color: $td-brand-color;
  }
}

.t-dialog--theme-success {
  .t-dialog__button--confirm .t-dialog__button-text {
    color: $td-success-color;
  }
}

.t-dialog--theme-warning {
  .t-dialog__button--confirm .t-dialog__button-text {
    color: $td-warning-color;
  }
}

.t-dialog--theme-error {
  .t-dialog__button--confirm .t-dialog__button-text {
    color: $td-error-color;
  }
}
</style>


