<template>
  <view class="page-container">
    <!-- 通知铃铛按钮 -->
    <view class="notification-btn" @click="goToAnnouncement">
      <text class="notification-icon">🔔</text>
      <view v-if="hasNewNotification" class="notification-dot"></view>
    </view>

    <!-- 轮播 Banner -->
    <swiper 
      class="banner-swiper" 
      :indicator-dots="false" 
      :autoplay="true" 
      :interval="4000" 
      :duration="300"
      :circular="true"
      @change="onSwiperChange"
    >
      <swiper-item v-for="(banner, index) in bannerList" :key="index">
        <view 
          class="banner-slide" 
          :class="banner.theme"
          @click="onBannerClick(banner)"
        >
          <text class="banner-emoji">{{ banner.emoji }}</text>
          <text class="banner-title">{{ banner.title }}</text>
          <text class="banner-subtitle">{{ banner.subtitle }}</text>
        </view>
      </swiper-item>
    </swiper>
    
    <!-- 轮播指示器 -->
    <view class="banner-pagination">
      <view 
        v-for="(item, index) in bannerList" 
        :key="index"
        class="banner-pagination-bullet"
        :class="{ 'banner-pagination-bullet-active': currentBannerIndex === index }"
      ></view>
    </view>

    <!-- 页面内容 -->
    <view class="page-content">
      <!-- 通知提示栏 -->
      <view class="notice-bar" @click="goToAnnouncement">
        <view class="t-alert t-alert--theme-info">
          <view class="t-alert__icon">📢</view>
          <view class="t-alert__content">
            <text class="t-alert__message">【重要】初探班第12期即将开课</text>
          </view>
          <view class="t-alert__close">›</view>
        </view>
      </view>

      <!-- 标签切换区域 -->
      <view class="tabs-container">
        <!-- 课程分类标签 + 日历按钮 -->
        <CapsuleTabs 
          v-model="currentTab" 
          :options="allTabList"
          @change="onTabChange"
        />
      </view>

      <!-- 课程列表 -->
      <view class="course-list">
        <view 
          v-for="(course, index) in filteredCourseList" 
          :key="index"
          class="t-card t-card--bordered t-card--hoverable course-card"
          @click="goToCourseDetail(course)"
        >
          <view class="course-image" :class="course.imageTheme">
            <text class="course-emoji">{{ course.emoji }}</text>
          </view>
          <view class="t-card__body">
            <view class="course-header">
              <text class="course-title">{{ course.title }}</text>
              <view v-if="course.purchased" class="t-badge--standalone t-badge--theme-success">
                <text>已购买</text>
              </view>
            </view>
            <text class="course-price">¥{{ course.price }}</text>
            <button class="t-button t-button--theme-warning t-button--variant-base t-button--block">
              <text class="t-button__text">查看详情</text>
            </button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 日历弹窗 -->
    <view v-if="calendarVisible" class="calendar-popup-mask" @click.stop="hideCalendarPopup" catchtouchmove>
      <view class="calendar-popup" @click.stop>
        <view class="calendar-popup-header">
          <text class="calendar-popup-title">选择日期</text>
          <text class="calendar-popup-close" @click="hideCalendarPopup">✕</text>
        </view>
        <Calendar 
          :priceData="calendarPriceData"
          @select="onDateSelect"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import CapsuleTabs from '@/components/CapsuleTabs.vue';
import Calendar from '@/components/Calendar.vue';

// 轮播图当前索引
const currentBannerIndex = ref(0);
// 是否有新通知
const hasNewNotification = ref(true);
// 当前选中的标签索引
const currentTab = ref('all');
// 日历弹窗显示状态
const calendarVisible = ref(false);

// 轮播图数据
const bannerList = ref([
  {
    emoji: '',
    title: '天道文化课程平台',
    subtitle: '传承国学智慧 · 弘扬天道文化',
    theme: 'banner-slide--blue',
    link: ''
  },
  {
    emoji: '🏫',
    title: '天道文化商学院',
    subtitle: '传承国学智慧 · 培养复合型人才\n点击了解更多',
    theme: 'banner-slide--purple',
    link: '/pages/academy/intro/index'
  },
  {
    emoji: '📱',
    title: '朋友圈素材库',
    subtitle: '精美海报 · 宣传文案\n一键保存分享',
    theme: 'banner-slide--pink',
    link: '/pages/academy/materials/index'
  },
  {
    emoji: '⭐',
    title: '学员成功案例',
    subtitle: '5000+学员见证 · 真实反馈\n查看更多案例',
    theme: 'banner-slide--blue',
    link: '/pages/academy/cases/index'
  }
]);

// 标签页数据（包含日历）
const allTabList = ref([
  { label: '全部', value: 'all' },
  { label: '初探班', value: 'beginner' },
  { label: '密训班', value: 'advanced' },
  { label: '日历', value: 'calendar' }
]);

// 课程列表数据
const courseList = ref([
  {
    id: 1,
    title: '初探班',
    price: 1688,
    emoji: '📚',
    imageTheme: 'course-image--pink',
    type: 'beginner',
    purchased: true
  },
  {
    id: 2,
    title: '密训班',
    price: 38888,
    emoji: '🎓',
    imageTheme: 'course-image--blue',
    type: 'advanced',
    purchased: false
  }
]);

// 日历价格数据（模拟从后台获取）
const calendarPriceData = ref<Record<string, number>>({});

// 根据标签筛选课程
const filteredCourseList = computed(() => {
  if (currentTab.value === 'all') {
    return courseList.value;
  }
  return courseList.value.filter(course => course.type === currentTab.value);
});

// 轮播切换事件
const onSwiperChange = (e: any) => {
  currentBannerIndex.value = e.detail.current;
};

// 轮播点击事件
const onBannerClick = (banner: any) => {
  if (banner.link) {
    uni.navigateTo({ url: banner.link });
  }
};

// 标签切换事件
const onTabChange = (value: string | number) => {
  console.log('Tab changed:', value);
  
  // 如果点击日历，显示弹窗并重置选中状态
  if (value === 'calendar') {
    showCalendarPopup();
    // 重置为之前的选中状态（保持课程分类选中）
    setTimeout(() => {
      currentTab.value = 'all'; // 或者保持之前的选中值
    }, 0);
  }
};

// 显示日历弹窗
const showCalendarPopup = () => {
  calendarVisible.value = true;
  loadCalendarPriceData();
};

// 隐藏日历弹窗
const hideCalendarPopup = () => {
  calendarVisible.value = false;
};

// 日期选择事件
const onDateSelect = (date: Date) => {
  console.log('Selected date:', date);
  // 日历只是展示，不需要提示和关闭弹窗
};

// 加载日历价格数据（模拟API调用）
const loadCalendarPriceData = async () => {
  // TODO: 实际项目中这里应该调用后台API
  // const res = await api.getCalendarPrices();
  
  // 模拟数据：为当月的一些日期设置价格
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const mockData: Record<string, number> = {};
  
  // 为当月每一天设置价格（模拟数据）
  for (let day = 1; day <= 28; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    mockData[dateStr] = 60; // 统一价格 ¥60
  }
  
  calendarPriceData.value = mockData;
};

// 跳转到公告页面
const goToAnnouncement = () => {
  uni.navigateTo({ url: '/pages/common/announcement' });
};

// 跳转到课程详情
const goToCourseDetail = (course: any) => {
  uni.navigateTo({ url: `/pages/course/detail/index?id=${course.id}` });
};

// 页面加载时初始化
onMounted(() => {
  // 可以在这里预加载日历数据
  loadCalendarPriceData();
});
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  width: 100%;
  min-height: 100vh;
  background-color: $td-bg-color-page;
  position: relative;
}

// 通知铃铛按钮
.notification-btn {
  position: fixed;
  top: 100rpx;
  right: 32rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  
  .notification-icon {
    font-size: 48rpx;
    filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.2));
  }
  
  .notification-dot {
    position: absolute;
    top: 8rpx;
    right: 8rpx;
    width: 16rpx;
    height: 16rpx;
    background-color: $td-error-color;
    border-radius: 50%;
  }
}

// 轮播图
.banner-swiper {
  width: 100%;
  height: 560rpx;
}

.banner-slide {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #FFFFFF;
  text-align: center;
  padding: 80rpx 40rpx;
  box-sizing: border-box;
  
  &--blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  
  &--purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  &--pink {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
}

swiper-item {
  width: 100%;
  height: 100%;
}

.banner-emoji {
  font-size: 96rpx;
  margin-bottom: 32rpx;
}

.banner-title {
  font-size: 56rpx;
  font-weight: 600;
  margin-bottom: 32rpx;
  text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
}

.banner-subtitle {
  font-size: 32rpx;
  opacity: 0.95;
  line-height: 1.6;
  white-space: pre-line;
}

// 轮播指示器
.banner-pagination {
  position: absolute;
  left: 40rpx;
  top: 500rpx;
  display: flex;
  gap: 16rpx;
  z-index: 10;
}

.banner-pagination-bullet {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
  
  &-active {
    width: 48rpx;
    border-radius: 8rpx;
    background: rgba(255, 255, 255, 0.95);
  }
}

// 页面内容
.page-content {
  padding: $td-page-margin;
  padding-bottom: 120rpx; // 底部留白，方便滚动查看
}

// 通知提示栏
.t-alert {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background-color: #E6F4FF;
  border-radius: $td-radius-default;
  margin-bottom: 32rpx;
  
  &__icon {
    font-size: 32rpx;
    margin-right: 16rpx;
  }
  
  &__content {
    flex: 1;
  }
  
  &__message {
    font-size: $td-font-size-base;
    color: $td-text-color-primary;
  }
  
  &__close {
    font-size: 40rpx;
    color: $td-text-color-secondary;
  }
}

// 通知栏容器 - 添加下间距
.notice-bar {
  margin-bottom: 32rpx; // 16px * 2 = 32rpx，与原型图 .mb-l 一致
}

// 标签切换容器 - 调整布局
.tabs-container {
  margin-bottom: 32rpx;
}

// 课程列表
.course-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx; // 卡片之间的间距，与原型图保持一致
}

.course-card {
  background-color: $td-bg-color-container;
  border-radius: $td-radius-large;
  overflow: hidden;
  border: 2rpx solid $td-border-level-1;
}

.course-image {
  width: 100%;
  height: 320rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &--pink {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  
  &--blue {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
  
  &--purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}

.course-emoji {
  font-size: 96rpx;
}

.t-card__body {
  padding: 32rpx;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.course-title {
  font-size: 36rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.t-badge--standalone {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  
  &.t-badge--theme-success {
    background-color: rgba($td-success-color, 0.1);
    color: $td-success-color;
  }
}

.course-price {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: $td-warning-color;
  margin-bottom: 24rpx;
}

// 按钮
.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $td-radius-default;
  border: none;
  
  &--theme-warning {
    background-color: $td-warning-color;
    
    .t-button__text {
      color: #FFFFFF;
      font-size: $td-font-size-base;
      font-weight: 500;
    }
  }
  
  &--block {
    width: 100%;
  }
}

// 日历弹窗
.calendar-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64rpx;
}

.calendar-popup {
  width: 100%;
  max-width: 640rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  animation: popup-show 0.3s ease-out;
}

@keyframes popup-show {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.calendar-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
  
  .calendar-popup-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }
  
  .calendar-popup-close {
    font-size: 40rpx;
    color: #999;
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
