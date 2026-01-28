<template>
  <view class="capsule-tabs">
    <view 
      v-for="(item, index) in options" 
      :key="item.value ?? index"
      class="capsule-tabs__item"
      :class="{ 'is-active': modelValue === (item.value ?? index) }"
      @click="handleChange(item.value ?? index)"
    >
      {{ item.label }}
    </view>
  </view>
</template>

<script setup lang="ts">
interface TabOption {
  label: string
  value?: string | number
}

interface Props {
  modelValue: string | number
  options: TabOption[]
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleChange = (value: string | number) => {
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style lang="scss" scoped>
/**
 * 胶囊标签组件 - 严格按照原型图 tabs.css 胶囊模式实现
 * 参考: prototype-tdesign/components/tabs.css 第168-194行
 */
.capsule-tabs {
  display: inline-flex;
  align-items: center;
  // 原型图: background-color: var(--td-bg-color-container-hover) = #FAFAFA
  background-color: #FAFAFA;
  // 原型图: border-radius: var(--td-radius-round) = 999px
  border-radius: 999rpx;
  // 原型图: padding: 2px
  padding: 4rpx;
  
  &__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    // 原型图: padding: var(--td-comp-paddingTB-m) var(--td-comp-paddingLR-m) = 8px 16px
    padding: 16rpx 32rpx;
    // 原型图: border-radius: var(--td-radius-round) = 999px
    border-radius: 999rpx;
    // 原型图: font-size: var(--td-font-size-base) = 14px
    font-size: 28rpx;
    // 原型图: color: var(--td-text-color-secondary) = #808080
    color: #808080;
    // 原型图: transition: all var(--td-transition-duration-base)
    transition: all 0.2s ease;
    white-space: nowrap;
    cursor: pointer;
    
    &.is-active {
      // 原型图: background-color: var(--td-bg-color-container) = #FFFFFF
      background-color: #FFFFFF;
      // 原型图: color: var(--td-brand-color) = #0052D9
      color: #0052D9;
      // 原型图: font-weight: var(--td-font-weight-medium) = 500
      font-weight: 500;
      // 原型图: box-shadow: var(--td-shadow-1) = 0 1px 10px rgba(0, 0, 0, 0.05)
      box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.05);
    }
  }
}
</style>

