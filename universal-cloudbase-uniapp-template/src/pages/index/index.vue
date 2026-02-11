<template>
  <view class="page-container">
    <!-- 滚动内容区域 -->
    <scroll-view
      class="scroll-content"
      :scroll-y="true"
    >
      <!-- 轮播 Banner（可以滚动） -->
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
        <!-- 通知提示栏 - 轮播公告 -->
        <view class="notice-bar" @click="goToAnnouncement">
          <view class="t-alert t-alert--theme-info">
            <view class="t-alert__icon">📢</view>
            <view class="t-alert__content">
              <swiper
                class="announcement-swiper"
                :vertical="true"
                :autoplay="true"
                :interval="3000"
                :duration="500"
                :circular="true"
              >
                <swiper-item v-for="(announcement, index) in announcementList" :key="index">
                  <text class="t-alert__message">{{ announcement.title }}</text>
                </swiper-item>
              </swiper>
            </view>
            <view class="t-alert__close">›</view>
          </view>
        </view>

        <!-- 标签切换区域（不吸顶） -->
        <view class="tabs-container">
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
    </scroll-view>

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
import { CourseApi, SystemApi } from '@/api';

// 轮播图当前索引
const currentBannerIndex = ref(0);
// 当前选中的标签索引
const currentTab = ref('all');
// 日历弹窗显示状态
const calendarVisible = ref(false);

// 公告列表数据
const announcementList = ref([
  { id: 1, title: '【重要】初探班第12期即将开课' },
  { id: 2, title: '【通知】密训班报名火热进行中' },
  { id: 3, title: '【提醒】学员请及时完成课程预约' }
]);

// 轮播图数据
const bannerList = ref<any[]>([]);

// 标签页数据（包含日历）
const allTabList = ref([
  { label: '全部', value: 'all' },
  { label: '初探班', value: 'beginner' },
  { label: '密训班', value: 'advanced' },
  { label: '日历', value: 'calendar' }
]);

// 课程列表数据
const courseList = ref<any[]>([]);

// 加载课程列表
const loadCourseList = async () => {
  try {
    const result = await CourseApi.getList({ page: 1, page_size: 20 });

    // 转换课程数据格式
    courseList.value = result.list.map((course: any) => ({
      id: course.id,
      title: course.name,
      price: course.current_price || 0,
      emoji: getCourseEmoji(course.type),
      imageTheme: getCourseTheme(course.type),
      type: getCourseTypeKey(course.type),
      purchased: false // 需要从用户已购课程中判断
    }));
  } catch (error) {
    console.error('加载课程列表失败:', error);
  }
};

// 获取课程图标
const getCourseEmoji = (type: number): string => {
  const emojiMap: Record<number, string> = {
    1: '📚',
    2: '🎓',
    3: '🔄'
  };
  return emojiMap[type] || '📚';
};

// 获取课程主题
const getCourseTheme = (type: number): string => {
  const themeMap: Record<number, string> = {
    1: 'course-image--pink',
    2: 'course-image--blue',
    3: 'course-image--purple'
  };
  return themeMap[type] || 'course-image--pink';
};

// 获取课程类型键
const getCourseTypeKey = (type: number): string => {
  const typeMap: Record<number, string> = {
    1: 'beginner',
    2: 'advanced',
    3: 'retrain'
  };
  return typeMap[type] || 'beginner';
};

// 日历价格数据（从后台获取）
const calendarPriceData = ref<Record<string, any>>({});

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
    // 判断是否为 tabBar 页面
    const tabBarPages = ['/pages/index/index', '/pages/mall/index', '/pages/academy/index', '/pages/mine/index']
    if (tabBarPages.includes(banner.link)) {
      uni.switchTab({ url: banner.link })
    } else {
      uni.navigateTo({ url: banner.link })
    }
  }
}

// 加载轮播图列表
const loadBannerList = async () => {
  try {
    const result = await SystemApi.getBannerList();
    if (result.list && result.list.length > 0) {
      // 将后台返回的数据转换为前端需要的格式
      bannerList.value = result.list.map((item: any) => ({
        id: item.id,
        emoji: '', // 后台暂无emoji字段，使用空字符串
        title: item.title,
        subtitle: item.subtitle || '',
        theme: getBannerTheme(item.id), // 根据ID或其他规则分配主题
        link: item.link || '',
        cover_image: item.cover_image
      }));
    }
  } catch (error) {
    console.error('加载轮播图失败:', error);
    // 失败时使用默认数据
    bannerList.value = [
      {
        emoji: '',
        title: '天道文化课程平台',
        subtitle: '传承国学智慧 · 弘扬天道文化',
        theme: 'banner-slide--blue',
        link: ''
      }
    ];
  }
};

// 获取轮播图主题色
const getBannerTheme = (id: number): string => {
  const themes = ['banner-slide--blue', 'banner-slide--purple', 'banner-slide--pink'];
  return themes[id % themes.length];
};

const onTabChange = (value: string | number) => {
  if (value === 'calendar') {
    showCalendarPopup();
    setTimeout(() => {
      currentTab.value = 'all';
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

const onDateSelect = (date: Date) => {
  // 日历只是展示，不需要提示和关闭弹窗
};

const loadCalendarPriceData = async () => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    
    // 计算当月第一天和最后一天
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    // 调用后台接口获取日历数据
    const result = await CourseApi.getCalendarSchedule({
      startDate: firstDay,
      endDate: lastDayStr
    });
    
    // 转换数据格式，将课程信息转换为日历组件需要的格式
    calendarPriceData.value = result;
  } catch (error) {
    console.error('加载日历数据失败:', error);
    calendarPriceData.value = {};
  }
};

// 跳转到公告页面
const goToAnnouncement = () => {
  uni.navigateTo({ url: '/pages/common/announcement/index' });
};

// 跳转到课程详情
const goToCourseDetail = (course: any) => {
  uni.navigateTo({ url: `/pages/course/detail/index?courseId=${course.id}` });
};

onMounted(() => {
  loadBannerList();
  loadCalendarPriceData();
  loadCourseList();
  loadAnnouncements();
});

// 加载公告列表
const loadAnnouncements = async () => {
  try {
    const result = await SystemApi.getAnnouncementList({ page: 1, page_size: 3 });
    if (result.list && result.list.length > 0) {
      announcementList.value = result.list.map((item: any) => ({
        id: item.id,
        title: item.title
      }));
    }
  } catch (error) {
    console.error('加载公告失败:', error);
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  width: 100%;
  min-height: 100vh;
  background-color: $td-bg-color-page;
  position: relative;
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

// 滚动内容区域
.scroll-content {
  height: 100vh; // 全屏高度，Banner 也在里面可以滚动
  box-sizing: border-box;
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
    flex-shrink: 0;
  }
  
  &__content {
    flex: 1;
    overflow: hidden;
    height: 44rpx; // 固定高度以适配轮播
  }
  
  &__message {
    font-size: $td-font-size-base;
    color: $td-text-color-primary;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__close {
    font-size: 40rpx;
    color: $td-text-color-secondary;
    flex-shrink: 0;
  }
}

// 公告轮播
.announcement-swiper {
  width: 100%;
  height: 44rpx;
  
  swiper-item {
    display: flex;
    align-items: center;
    height: 44rpx;
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
