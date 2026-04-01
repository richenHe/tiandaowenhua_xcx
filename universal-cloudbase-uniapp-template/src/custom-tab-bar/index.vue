<!--
  预留：微信自定义 tabBar。需在 pages.json 的 tabBar 中设置 "custom": true 才会生效。
  当前项目使用原生 tabBar（未开启 custom），因 dev/build 下 custom-tab-bar 未稳定编译为小程序组件时会导致底栏整段消失。
  未登录「我的」由 mine 页 onShow 重定向登录处理。
-->
<template>
  <view class="tab-bar">
    <view
      v-for="(item, index) in list"
      :key="item.pagePath"
      class="tab-item"
      @tap="onTabTap(index)"
    >
      <image
        class="tab-icon-img"
        :src="selected === index ? item.selectedIconPath : item.iconPath"
        mode="aspectFit"
      />
      <text class="tab-label" :class="{ 'tab-label--active': selected === index }">
        {{ item.text }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { isBusinessLoggedIn } from '@/utils/auth-state'

const list = [
  {
    pagePath: '/pages/index/index',
    text: '首页',
    iconPath: '/static/tabbar/home.png',
    selectedIconPath: '/static/tabbar/home-active.png'
  },
  {
    pagePath: '/pages/mall/index',
    text: '商城',
    iconPath: '/static/tabbar/mall.png',
    selectedIconPath: '/static/tabbar/mall-active.png'
  },
  {
    pagePath: '/pages/academy/index',
    text: '商学院',
    iconPath: '/static/tabbar/academy.png',
    selectedIconPath: '/static/tabbar/academy-active.png'
  },
  {
    pagePath: '/pages/mine/index',
    text: '我的',
    iconPath: '/static/tabbar/mine.png',
    selectedIconPath: '/static/tabbar/mine-active.png'
  }
]

const selected = ref(0)

const onTabTap = (index: number) => {
  if (index === 3 && !isBusinessLoggedIn()) {
    uni.navigateTo({ url: '/pages/auth/login/index' })
    return
  }

  if (selected.value === index) return

  selected.value = index
  uni.switchTab({ url: list[index].pagePath })
}

const syncSelected = (index: number) => {
  if (selected.value === index) return
  selected.value = index
}

onMounted(() => {
  uni.$on('tabBarSync', syncSelected)
})

onUnmounted(() => {
  uni.$off('tabBarSync', syncSelected)
})
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.tab-bar {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100rpx;
  background-color: $td-bg-color-container;
  border-top: 2rpx solid $td-border-level-1;
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: content-box;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  padding-top: 8rpx;
}

.tab-icon-img {
  width: 54rpx;
  height: 54rpx;
}

.tab-label {
  font-size: 20rpx;
  line-height: 1;
  color: $td-text-color-secondary;
}

.tab-label--active {
  color: $td-brand-color;
}
</style>
