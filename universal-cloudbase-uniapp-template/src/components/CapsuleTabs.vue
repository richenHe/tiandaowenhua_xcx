<template>
  <scroll-view class="capsule-tabs-scroll" scroll-x :show-scrollbar="false" enhanced :bounces="false">
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
  </scroll-view>
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
.capsule-tabs-scroll {
  width: 100%;
  white-space: nowrap;
  /* 隐藏微信小程序端滚动条 */
  ::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

.capsule-tabs {
  display: inline-flex;
  align-items: center;
  background-color: #FAFAFA;
  border-radius: 999rpx;
  padding: 4rpx;
  border: none;

  &__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 16rpx 32rpx;
    border-radius: 999rpx;
    font-size: 28rpx;
    color: #808080;
    transition: all 0.2s ease;
    white-space: nowrap;
    cursor: pointer;

    &.is-active {
      background-color: #FFFFFF;
      color: #0052D9;
      font-weight: 500;
      box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.05);
    }
  }
}
</style>
