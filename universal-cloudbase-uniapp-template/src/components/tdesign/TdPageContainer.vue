<template>
  <view class="page-container" :class="containerClass">
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** 是否使用安全区域底部边距 */
  safeAreaBottom?: boolean
  /** 背景色 */
  bgColor?: 'page' | 'container' | 'transparent'
  /** 是否全屏 */
  fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  safeAreaBottom: true,
  bgColor: 'page',
  fullscreen: false
})

const containerClass = computed(() => ({
  'page-container--safe-bottom': props.safeAreaBottom,
  [`page-container--bg-${props.bgColor}`]: true,
  'page-container--fullscreen': props.fullscreen
}))
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-container--bg-page {
  background-color: $td-bg-color-page;
}

.page-container--bg-container {
  background-color: $td-bg-color-container;
}

.page-container--bg-transparent {
  background-color: transparent;
}

.page-container--safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.page-container--fullscreen {
  height: 100vh;
  overflow: hidden;
}
</style>

