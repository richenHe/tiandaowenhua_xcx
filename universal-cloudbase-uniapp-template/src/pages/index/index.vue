<template>
  <view class="page-container">
    <!-- 自定义顶栏（与商学院等 tab 页一致），下方再接轮播 -->
    <TdPageHeader title="首页" :show-back="false" />

    <!-- 滚动内容区域：顶栏占位后占满剩余视口高度 -->
    <scroll-view
      class="scroll-content"
      :scroll-y="true"
      :style="scrollViewHeightPx > 0 ? { height: scrollViewHeightPx + 'px' } : {}"
    >
      <!-- 轮播区域：相对定位容器，指示点锚定在 Banner 底部 -->
      <view class="banner-section">
        <!-- 轮播 Banner：设计稿 750×720，小程序通栏宽 750rpx、高 720rpx，与后台「轮播图」建议尺寸一致 -->
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
              :class="banner.cover_image ? '' : banner.theme"
              @click="onBannerClick(banner)"
            >
              <image
                v-if="banner.cover_image"
                :src="banner.cover_image"
                class="banner-cover-img"
                mode="aspectFill"
              />
              <template v-else>
                <text class="banner-emoji">{{ banner.emoji }}</text>
                <text class="banner-title">{{ banner.title }}</text>
                <text class="banner-subtitle">{{ banner.subtitle }}</text>
              </template>
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
      </view>

      <!-- 页面内容 -->
      <view class="page-content">
        <!-- 通知提示栏：仅在有后台公告时展示（无占位文案） -->
        <view v-if="announcementList.length" class="notice-bar" @click="goToAnnouncement">
          <view class="t-alert t-alert--theme-info">
            <view class="t-alert__icon"><icon type="info" size="16" color="#0052D9"/></view>
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

        <!-- 课程列表（按 Tab 筛选后为空时展示占位，避免大片留白） -->
        <view v-if="filteredCourseList.length" class="course-list">
          <CourseHomeCard
            v-for="(course, index) in filteredCourseList"
            :key="course.id ?? index"
            :cover-src="course.coverImage"
            :placeholder-emoji="course.emoji"
            :placeholder-tone="course.mediaTone"
            :type-label="course.typeLabel"
            :price-text="course.priceText"
            :cta-text="course.badgeText"
            @click="goToCourseDetail(course)"
            @cta-click="goToCourseDetail(course)"
          />
        </view>
        <view v-else-if="!courseListLoading" class="empty-state">
          <view class="empty-icon"><icon type="info" size="60" color="#ccc"/></view>
          <text class="empty-text">暂无课程</text>
        </view>
      </view>
    </scroll-view>

    <!-- 日历弹窗（农历风格，与 code.txt 一致） -->
    <view v-if="calendarVisible" class="calendar-popup-mask" @click.stop="hideCalendarPopup" catchtouchmove>
      <view class="calendar-popup" @click.stop>
        <Calendar
          :priceData="calendarPriceData"
          @select="onDateSelect"
          @close="hideCalendarPopup"
          @month-change="onCalendarMonthChange"
        />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import CapsuleTabs from '@/components/CapsuleTabs.vue';
import Calendar from '@/components/Calendar.vue';
import CourseHomeCard from '@/components/CourseHomeCard.vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { CourseApi, SystemApi } from '@/api';
import type { CalendarData } from '@/api/types/course';
import { formatPrice } from '@/utils';
import { ensureLoggedIn, isBusinessLoggedIn, navigateToLogin } from '@/utils/auth-state';

// 轮播图当前索引
const currentBannerIndex = ref(0);
// 当前选中的标签（'all'/'calendar' 为特殊值，其余为数字课程类型：1初探班/2密训班/3咨询服务）
const currentTab = ref<string | number>('all');
// 日历弹窗显示状态
const calendarVisible = ref(false);

// 公告列表（仅展示接口返回数据，无默认占位）
const announcementList = ref<{ id: number; title: string }[]>([]);

// 轮播图数据
const bannerList = ref<any[]>([]);

// 标签页数据（课程类型与数据库 courses.type 对齐：1初探班/2密训班/4沙龙；'calendar'为日历UI功能）
const allTabList = ref([
  { label: '全部', value: 'all' },
  { label: '初探班', value: 1 },
  { label: '密训班', value: 2 },
  { label: '沙龙', value: 4 },
  { label: '日历', value: 'calendar' }
]);

// 课程列表数据
const courseList = ref<any[]>([]);
/** 首页课程列表请求中：为 true 时不展示「暂无课程」，避免首屏误闪 */
const courseListLoading = ref(true);

const COURSE_TYPE_LABELS: Record<number, string> = {
  1: '初探班',
  2: '密训班',
  3: '咨询服务',
  4: '沙龙'
};

const getCourseTypeLabel = (type: number): string => COURSE_TYPE_LABELS[type] || '课程';

/** 与 TdPageHeader 占位高度算法一致（状态栏 + 44px 导航条），scroll-view 在微信端需明确高度 */
const NAVBAR_HEIGHT_PX = 44;
/** 顶栏占位之下的滚动区高度（windowHeight − 顶栏），避免 flex:1 失效时轮播仍顶到屏顶被遮挡 */
const scrollViewHeightPx = ref(0);

const syncScrollViewHeight = () => {
  const si = uni.getSystemInfoSync();
  const statusBar = si.statusBarHeight ?? 20;
  const headerBlockPx = statusBar + NAVBAR_HEIGHT_PX;
  scrollViewHeightPx.value = Math.max(0, si.windowHeight - headerBlockPx);
};

// 加载课程列表
const loadCourseList = async () => {
  courseListLoading.value = true;
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await CourseApi.getList({ page: 1, page_size: 20 });

    courseList.value = result.list.map((course: any) => {
      const priceNum = course.current_price || 0;
      return {
        id: course.id,
        emoji: getCourseEmoji(course.type),
        mediaTone: getCourseMediaTone(course.type),
        coverImage: course.cover_image || '',
        type: course.type,
        typeLabel: getCourseTypeLabel(course.type),
        priceText: course.type === 4 ? '免费' : `¥${formatPrice(priceNum)}`,
        badgeText: '查看详情'
      };
    });
  } catch (error) {
    console.error('加载课程列表失败:', error);
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
    courseListLoading.value = false;
  }
};

// 获取课程图标
const getCourseEmoji = (type: number): string => {
  const emojiMap: Record<number, string> = {
    1: '📚',
    2: '🎓',
    3: '🔄',
    4: '🎤'
  };
  return emojiMap[type] || '📚';
};

const getCourseMediaTone = (type: number): 'pink' | 'blue' | 'purple' | 'orange' => {
  const toneMap: Record<number, 'pink' | 'blue' | 'purple' | 'orange'> = {
    1: 'pink',
    2: 'blue',
    3: 'purple',
    4: 'orange'
  };
  return toneMap[type] || 'pink';
};

// 日历排期数据（日期键 → 课程信息，含多日课展开后的 nicknames）
const calendarPriceData = ref<CalendarData>({});

// 根据标签筛选课程（currentTab 为数字时按课程类型过滤）
const filteredCourseList = computed(() => {
  if (currentTab.value === 'all' || currentTab.value === 'calendar') {
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
  if (!banner.link) return;
  const link = banner.link.startsWith('/') ? banner.link : '/' + banner.link;
  const tabBarPages = ['/pages/index/index', '/pages/mall/index', '/pages/academy/index', '/pages/mine/index'];
  if (tabBarPages.includes(link)) {
    if (link === '/pages/mine/index' && !isBusinessLoggedIn()) {
      navigateToLogin();
      return;
    }
    uni.switchTab({ url: link });
    return;
  }
  if (!ensureLoggedIn()) return;
  uni.navigateTo({ url: link });
};

// 加载轮播图列表
const loadBannerList = async () => {
  try {
    const result = await SystemApi.getBannerList();
    if (result.list && result.list.length > 0) {
      bannerList.value = result.list.map((item: any) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle || '',
        cover_image: item.cover_image || '',
        link: item.link || '',
        theme: getBannerTheme(item.id),
      }));
    }
  } catch (error) {
    console.error('加载轮播图失败:', error);
    // 失败时展示默认兜底
    bannerList.value = [
      {
        id: 0,
        title: '天道文化课程平台',
        cover_image: '',
        link: '',
        theme: 'banner-slide--blue',
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

/**
 * 拉取指定公历月的课程排期昵称（用于日历格第二行）
 * @param merge 为 true 时合并进已有 priceData（切换月份时用）
 */
const loadCalendarPriceDataForMonth = async (
  year: number,
  month: number,
  merge = false
) => {
  try {
    uni.showLoading({ title: '加载中...' });
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const result = await CourseApi.getCalendarSchedule({
      startDate: firstDay,
      endDate: lastDayStr
    });

    const transformedData: CalendarData = merge ? { ...calendarPriceData.value } : {};
    for (const date in result) {
      transformedData[date] = result[date];
    }
    calendarPriceData.value = transformedData;
    uni.hideLoading();
  } catch (error) {
    console.error('加载日历数据失败:', error);
    uni.hideLoading();
    if (!merge) calendarPriceData.value = {};
  }
};

const loadCalendarPriceData = async () => {
  const today = new Date();
  await loadCalendarPriceDataForMonth(today.getFullYear(), today.getMonth() + 1, false);
};

const onCalendarMonthChange = (payload: { year: number; month: number }) => {
  loadCalendarPriceDataForMonth(payload.year, payload.month, true);
};

// 跳转到公告页面
const goToAnnouncement = () => {
  uni.navigateTo({ url: '/pages/common/announcement/index' });
};

// 跳转到课程详情（浏览介绍免登录；下单/预约在详情页或后续页再校验登录）
const goToCourseDetail = (course: any) => {
  uni.navigateTo({ url: `/pages/course/detail/index?courseId=${course.id}` });
};

// 加载公告列表（须写在 onMounted/onShow 之前，且不能在 setup 中途抛错，否则后续常量未初始化）
const loadAnnouncements = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await SystemApi.getAnnouncementList({ page: 1, page_size: 3 });
    const list = result?.list || [];
    announcementList.value =
      list.length > 0
        ? list.map((item: any) => ({
            id: item.id,
            title: item.title
          }))
        : [];
    uni.hideLoading()
  } catch (error) {
    console.error('加载公告失败:', error);
    uni.hideLoading()
  }
};

onMounted(() => {
  syncScrollViewHeight();
  loadBannerList();
  loadCalendarPriceData();
  loadCourseList();
  loadAnnouncements();
});

onShow(() => {
  syncScrollViewHeight();
  loadBannerList();
  loadCalendarPriceData();
  loadCourseList();
  loadAnnouncements();
});
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  background-color: $td-bg-color-page;
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

// 轮播外层：指示点相对 Banner 底部定位（避免顶栏加入后错位到整页坐标）
.banner-section {
  position: relative;
  width: 100%;
}

// 轮播（与素材规范 750×720 一致：全宽 = 750rpx 设计宽，高度 720rpx）
.banner-swiper {
  width: 100%;
  height: 720rpx;
}

.banner-slide {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  // 文字主题变体（无图片时）
  &--blue, &--purple, &--pink {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #FFFFFF;
    text-align: center;
    padding: 80rpx 40rpx;
    box-sizing: border-box;
  }
  
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
  overflow: hidden;
}

.banner-cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
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

// 轮播指示器（720rpx 高 Banner 内，与原 top:664rpx 等效：距底约 56rpx）
.banner-pagination {
  position: absolute;
  left: 40rpx;
  bottom: 56rpx;
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

// 滚动内容区域（顶栏占位后填满剩余高度，避免 100vh+占位超出视口）
.scroll-content {
  flex: 1;
  min-height: 0;
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

// 空状态（与我的课程等页一致）
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: $td-text-color-placeholder;
}

// 日历弹窗（遮罩与圆角对齐 code.txt）
.calendar-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $calendar-modal-mask;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64rpx;
}

.calendar-popup {
  width: 100%;
  max-width: 720rpx;
  border-radius: 64rpx;
  overflow: hidden;
  box-shadow: $td-shadow-3;
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

</style>
