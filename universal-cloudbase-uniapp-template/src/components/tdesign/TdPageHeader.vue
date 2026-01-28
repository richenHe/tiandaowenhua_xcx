<template>
  <view class="td-page-header" :class="headerClass" :style="headerStyle">
    <!-- 状态栏占位 -->
    <view v-if="statusBar" class="td-page-header__status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 导航栏 -->
    <view class="td-page-header__navbar">
      <!-- 左侧区域 -->
      <view class="td-page-header__left" @click="handleLeftClick">
        <slot name="left">
          <view v-if="showBack" class="td-page-header__back">
            <text class="td-page-header__back-icon">←</text>
            <text v-if="backText" class="td-page-header__back-text">{{ backText }}</text>
          </view>
        </slot>
      </view>
      
      <!-- 标题区域 -->
      <view class="td-page-header__title" :class="{ 'td-page-header__title--center': titleCenter }">
        <slot name="title">
          <text class="td-page-header__title-text">{{ title }}</text>
          <text v-if="subtitle" class="td-page-header__subtitle-text">{{ subtitle }}</text>
        </slot>
      </view>
      
      <!-- 右侧区域 -->
      <view class="td-page-header__right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
  
  <!-- 占位元素，防止内容被遮挡 -->
  <view v-if="fixed && placeholder" class="td-page-header__placeholder" :style="placeholderStyle"></view>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

interface Props {
  /** 标题 */
  title?: string
  /** 副标题 */
  subtitle?: string
  /** 标题是否居中 */
  titleCenter?: boolean
  /** 是否显示返回按钮 */
  showBack?: boolean
  /** 返回按钮文字 */
  backText?: string
  /** 是否固定在顶部 */
  fixed?: boolean
  /** 固定时是否显示占位元素 */
  placeholder?: boolean
  /** 是否显示状态栏 */
  statusBar?: boolean
  /** 背景色 */
  bgColor?: string
  /** 是否透明 */
  transparent?: boolean
  /** 是否显示底部边框 */
  border?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  subtitle: '',
  titleCenter: true,
  showBack: true,
  backText: '',
  fixed: true,
  placeholder: true,
  statusBar: true,
  bgColor: '',
  transparent: false,
  border: true
})

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'leftClick'): void
}>()

const statusBarHeight = ref(20)
const navbarHeight = 44 // 导航栏固定高度

onMounted(() => {
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 20
})

const headerClass = computed(() => ({
  'td-page-header--fixed': props.fixed,
  'td-page-header--transparent': props.transparent,
  'td-page-header--border': props.border && !props.transparent
}))

const headerStyle = computed(() => {
  if (props.bgColor) {
    return { backgroundColor: props.bgColor }
  }
  return {}
})

const placeholderStyle = computed(() => {
  const height = (props.statusBar ? statusBarHeight.value : 0) + navbarHeight
  return { height: height + 'px' }
})

const handleLeftClick = () => {
  emit('leftClick')
  if (props.showBack) {
    emit('back')
    // 默认返回上一页
    const pages = getCurrentPages()
    if (pages.length > 1) {
      uni.navigateBack()
    } else {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.td-page-header {
  background-color: $td-bg-color-container;
}

.td-page-header--fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.td-page-header--transparent {
  background-color: transparent;
}

.td-page-header--border {
  border-bottom: 2rpx solid $td-border-level-1;
}

.td-page-header__status-bar {
  width: 100%;
}

.td-page-header__navbar {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 $td-page-margin;
}

.td-page-header__left {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-width: 100rpx;
}

.td-page-header__back {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: $td-text-color-primary;
}

.td-page-header__back-icon {
  font-size: 36rpx;
}

.td-page-header__back-text {
  font-size: $td-font-size-base;
}

.td-page-header__title {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.td-page-header__title--center {
  text-align: center;
}

.td-page-header__title-text {
  font-size: $td-font-size-m;
  font-weight: $td-font-weight-semibold;
  color: $td-text-color-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-page-header__subtitle-text {
  font-size: $td-font-size-s;
  color: $td-text-color-secondary;
  margin-top: 4rpx;
}

.td-page-header__right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 100rpx;
}

.td-page-header__placeholder {
  width: 100%;
}
</style>

