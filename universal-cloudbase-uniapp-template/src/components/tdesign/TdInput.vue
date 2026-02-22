<template>
  <view class="t-input__wrap">
    <view class="t-input" :class="inputClass">
      <!-- 前缀 -->
      <view v-if="prefix || $slots.prefix" class="t-input__prefix">
        <slot name="prefix">
          <text v-if="prefix" class="t-input__prefix-icon">{{ prefix }}</text>
        </slot>
      </view>
      
      <!-- 输入框 -->
      <input
        class="t-input__inner"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        :password="type === 'password' && !showPassword"
        :focus="focus"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @confirm="handleConfirm"
      />
      
      <!-- 清除按钮 -->
      <view
        v-if="clearable && modelValue && !disabled"
        class="t-input__clear"
        @click="handleClear"
      >
        <text>×</text>
      </view>
      
      <!-- 密码切换 -->
      <view
        v-if="type === 'password'"
        class="t-input__suffix"
        @click="togglePassword"
      >
        <text class="t-input__suffix-icon">{{ showPassword ? '👁' : '👁‍🗨' }}</text>
      </view>
      
      <!-- 后缀 -->
      <view v-if="suffix || $slots.suffix" class="t-input__suffix">
        <slot name="suffix">
          <text v-if="suffix" class="t-input__suffix-icon">{{ suffix }}</text>
        </slot>
      </view>
    </view>
    
    <!-- 提示文字 -->
    <view v-if="tips" class="t-input__tips" :class="tipsClass">
      {{ tips }}
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

type InputSize = 'small' | 'medium' | 'large'
type InputStatus = 'default' | 'success' | 'warning' | 'error'
type InputAlign = 'left' | 'center' | 'right'

interface Props {
  /** 值 */
  modelValue?: string | number
  /** 类型 */
  type?: 'text' | 'password' | 'number' | 'digit' | 'idcard'
  /** 占位符 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否可清除 */
  clearable?: boolean
  /** 最大长度 */
  maxlength?: number
  /** 尺寸 */
  size?: InputSize
  /** 状态 */
  status?: InputStatus
  /** 对齐方式 */
  align?: InputAlign
  /** 前缀图标 */
  prefix?: string
  /** 后缀图标 */
  suffix?: string
  /** 提示文字 */
  tips?: string
  /** 是否自动聚焦 */
  focus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  disabled: false,
  clearable: false,
  maxlength: -1,
  size: 'medium',
  status: 'default',
  align: 'left',
  prefix: '',
  suffix: '',
  tips: '',
  focus: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
  (e: 'focus', event: any): void
  (e: 'blur', event: any): void
  (e: 'clear'): void
  (e: 'confirm', value: string): void
}>()

const isFocused = ref(false)
const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type === 'password') return 'text'
  if (props.type === 'number') return 'number'
  if (props.type === 'digit') return 'digit'
  if (props.type === 'idcard') return 'idcard'
  return 'text'
})

const inputClass = computed(() => ({
  [`t-input--size-${props.size}`]: true,
  [`t-align-${props.align}`]: true,
  't-is-focused': isFocused.value,
  't-is-disabled': props.disabled,
  't-is-error': props.status === 'error',
  't-is-success': props.status === 'success',
  't-is-warning': props.status === 'warning'
}))

const tipsClass = computed(() => ({
  't-input__tips--error': props.status === 'error',
  't-input__tips--success': props.status === 'success',
  't-input__tips--warning': props.status === 'warning'
}))

const handleInput = (e: any) => {
  const value = e.detail.value
  emit('update:modelValue', value)
  emit('input', value)
}

const handleFocus = (e: any) => {
  isFocused.value = true
  emit('focus', e)
}

const handleBlur = (e: any) => {
  isFocused.value = false
  emit('blur', e)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}

const handleConfirm = (e: any) => {
  emit('confirm', e.detail.value)
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.t-input__wrap {
  width: 100%;
}

.t-input {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: $td-comp-size-m;
  padding: 0 $td-comp-paddingLR-s;
  background-color: $td-bg-color-container;
  border: 2rpx solid $td-border-level-1;
  border-radius: $td-radius-default;
  transition: all $td-transition-duration-base $td-transition-timing-function;
  box-sizing: border-box;
}

.t-input__inner {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 0;
  font-size: $td-font-size-base;
  color: $td-text-color-primary;
  background-color: transparent;
  border: none;
  outline: none;
}

// 前缀后缀
.t-input__prefix,
.t-input__suffix {
  display: flex;
  align-items: center;
  color: $td-text-color-secondary;
  flex-shrink: 0;
}

.t-input__prefix {
  margin-right: 16rpx;
}

.t-input__suffix {
  margin-left: 16rpx;
}

.t-input__prefix-icon,
.t-input__suffix-icon {
  font-size: 32rpx;
}

// 清除按钮
.t-input__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32rpx;
  height: 32rpx;
  font-size: 24rpx;
  color: $td-text-color-placeholder;
  background-color: $td-bg-color-container-hover;
  border-radius: 50%;
  margin-left: 8rpx;
  
  &:active {
    background-color: $td-border-level-2;
  }
}

// 提示文字
.t-input__tips {
  margin-top: 8rpx;
  font-size: $td-font-size-s;
  color: $td-text-color-secondary;
  line-height: $td-line-height-base;
  
  &--error {
    color: $td-error-color;
  }
  
  &--success {
    color: $td-success-color;
  }
  
  &--warning {
    color: $td-warning-color;
  }
}

// 聚焦状态
.t-input.t-is-focused {
  border-color: $td-brand-color;
  box-shadow: 0 0 0 4rpx rgba(0, 82, 217, 0.1);
}

// 禁用状态
.t-input.t-is-disabled {
  background-color: $td-bg-color-container-hover;
  border-color: $td-border-level-1;
  
  .t-input__inner {
    color: $td-text-color-disabled;
  }
}

// 错误状态
.t-input.t-is-error {
  border-color: $td-error-color;
  
  &.t-is-focused {
    box-shadow: 0 0 0 4rpx rgba(227, 77, 89, 0.1);
  }
}

// 成功状态
.t-input.t-is-success {
  border-color: $td-success-color;
  
  &.t-is-focused {
    box-shadow: 0 0 0 4rpx rgba(0, 168, 112, 0.1);
  }
}

// 警告状态
.t-input.t-is-warning {
  border-color: $td-warning-color;
  
  &.t-is-focused {
    box-shadow: 0 0 0 4rpx rgba(212, 175, 55, 0.1);
  }
}

// 尺寸变体
.t-input--size-small {
  height: $td-comp-size-s;
  padding: 0 $td-comp-paddingLR-xs;
  
  .t-input__inner {
    font-size: $td-font-size-s;
  }
}

.t-input--size-large {
  height: $td-comp-size-l;
  padding: 0 $td-comp-paddingLR-m;
  
  .t-input__inner {
    font-size: $td-font-size-m;
  }
}

// 文本对齐
.t-align-left .t-input__inner {
  text-align: left;
}

.t-align-center .t-input__inner {
  text-align: center;
}

.t-align-right .t-input__inner {
  text-align: right;
}
</style>
































