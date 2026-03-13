<template>
  <view class="tab-bar">
    <view
      v-for="(item, index) in list"
      :key="item.pagePath"
      class="tab-item"
      @tap="switchTab(index)"
    >
      <!-- #ifdef MP-WEIXIN -->
      <lottie
        class="tab-icon"
        :path="item.lottie"
        :autoplay="false"
        :loop="false"
        :action="actions[index]"
        mode="fit"
      />
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <image
        class="tab-icon-img"
        :src="selected === index ? item.selectedIconPath : item.iconPath"
        mode="aspectFit"
      />
      <!-- #endif -->
      <text class="tab-label" :style="{ color: selected === index ? selectedColor : defaultColor }">
        {{ item.text }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const selectedColor = '#0052D9';
const defaultColor = '#5E5E5E';

const list = [
  {
    pagePath: '/pages/index/index',
    text: '首页',
    lottie: '/static/lottie/home.json',
    iconPath: '/static/tabbar/home.png',
    selectedIconPath: '/static/tabbar/home-active.png',
  },
  {
    pagePath: '/pages/mall/index',
    text: '商城',
    lottie: '/static/lottie/mall.json',
    iconPath: '/static/tabbar/mall.png',
    selectedIconPath: '/static/tabbar/mall-active.png',
  },
  {
    pagePath: '/pages/academy/index',
    text: '商学院',
    lottie: '/static/lottie/academy.json',
    iconPath: '/static/tabbar/academy.png',
    selectedIconPath: '/static/tabbar/academy-active.png',
  },
  {
    pagePath: '/pages/mine/index',
    text: '我的',
    lottie: '/static/lottie/mine.json',
    iconPath: '/static/tabbar/mine.png',
    selectedIconPath: '/static/tabbar/mine-active.png',
  },
];

const selected = ref(0);
// 每个 tab 的 lottie 播放动作
const actions = reactive<string[]>(list.map(() => 'stop'));

const switchTab = (index: number) => {
  if (selected.value === index) return;

  // 旧 tab 停止并回到第一帧
  actions[selected.value] = 'stop';
  // 新 tab 播放动画
  actions[index] = 'play';
  selected.value = index;

  uni.switchTab({ url: list[index].pagePath });
};

// 接收页面 onShow 发来的同步事件，更新选中状态（不触发动画）
const syncSelected = (index: number) => {
  if (selected.value === index) return;
  actions[selected.value] = 'stop';
  selected.value = index;
};

onMounted(() => {
  uni.$on('tabBarSync', syncSelected);
});

onUnmounted(() => {
  uni.$off('tabBarSync', syncSelected);
});
</script>

<style lang="scss">
.tab-bar {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100rpx;
  background-color: #ffffff;
  border-top: 1rpx solid #eeeeee;
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

.tab-icon {
  width: 54rpx;
  height: 54rpx;
}

.tab-icon-img {
  width: 54rpx;
  height: 54rpx;
}

.tab-label {
  font-size: 20rpx;
  line-height: 1;
}
</style>
