<template>
  <view>
    <!-- 占位元素，防止内容跳动 -->
    <view v-if="isFixed" :style="{ height: `${wrapperHeight}px`, marginBottom: `${marginBottom}rpx` }"></view>

    <!-- 实际的 tabs 容器 -->
    <view
      :id="wrapperId"
      class="sticky-tabs-wrapper"
      :class="{ 'is-fixed': isFixed }"
      :style="isFixed ? fixedStyle : normalStyle"
    >
      <slot name="tabs"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'

// 获取当前组件实例
const instance = getCurrentInstance()

// 生成唯一 ID
const wrapperId = `sticky-tabs-${Math.random().toString(36).substr(2, 9)}`

interface Props {
  offsetTop?: number // 吸顶时距离顶部的距离（px）
  marginBottom?: number // 底部外边距（rpx）
  backgroundColor?: string // 背景色
  paddingLeft?: number // 左内边距（rpx）
  paddingRight?: number // 右内边距（rpx）
  enabled?: boolean // 是否启用吸顶
}

const props = withDefaults(defineProps<Props>(), {
  offsetTop: 0,
  marginBottom: 0,
  backgroundColor: '#F5F5F5',
  paddingLeft: 32,
  paddingRight: 32,
  enabled: true
})

// 吸顶状态
const isFixed = ref(false)
const wrapperTop = ref(0)
const wrapperHeight = ref(0)

// 正常状态的样式
const normalStyle = computed(() => ({
  marginBottom: `${props.marginBottom}rpx`
}))

// 固定时的样式
const fixedStyle = computed(() => ({
  position: 'fixed',
  top: `${props.offsetTop}px`,
  left: 0,
  right: 0,
  zIndex: 99,
  backgroundColor: props.backgroundColor,
  paddingTop: '12px',
  paddingBottom: '12px',
  paddingLeft: `${props.paddingLeft}rpx`,
  paddingRight: `${props.paddingRight}rpx`,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
}))

// 获取元素位置信息
const getWrapperInfo = () => {
  if (!props.enabled || !instance) return

  setTimeout(() => {
    const query = uni.createSelectorQuery().in(instance.proxy)
    query.select(`#${wrapperId}`).boundingClientRect().exec((res: any) => {
      if (res && res[0]) {
        wrapperHeight.value = res[0].height
      }
    })
  }, 100)
}

// 更新滚动位置
const updateScrollTop = (scrollTop: number) => {
  if (!props.enabled || !instance) return

  // 第一次滚动时，记录元素的初始位置
  if (wrapperTop.value === 0) {
    setTimeout(() => {
      const query = uni.createSelectorQuery().in(instance.proxy)
      query.select(`#${wrapperId}`).boundingClientRect().exec((res: any) => {
        if (res && res[0]) {
          wrapperTop.value = scrollTop + res[0].top
          wrapperHeight.value = res[0].height
        }
      })
    }, 50)
    return
  }

  // 计算触发点：元素初始位置 - 吸顶偏移量
  const triggerPoint = wrapperTop.value - props.offsetTop
  const shouldFixed = scrollTop >= triggerPoint

  if (shouldFixed !== isFixed.value) {
    isFixed.value = shouldFixed
  }
}

onMounted(() => {
  if (props.enabled) {
    getWrapperInfo()
  }
})

// 暴露方法给父组件
defineExpose({
  updateScrollTop
})
</script>

<style lang="scss" scoped>
.sticky-tabs-wrapper {
  &.is-fixed {
    position: fixed;
    left: 0;
    right: 0;
  }
}
</style>
