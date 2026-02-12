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
// 注意：这个组件仅用于兼容，实际应该使用 CSS 类名
// 样式已在 src/styles/components/dialog.scss 中定义
</style>

















