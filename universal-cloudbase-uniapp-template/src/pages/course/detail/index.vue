<template>
  <view class="page-container">
    <TdPageHeader title="初探班详情" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <!-- 课程内容 -->
      <view v-if="!isLoading">
        <!-- 封面图片 -->
        <view class="cover-image" :style="courseInfo.coverImage ? {} : { background: getCourseGradient(courseInfo.type) }">
          <image
            v-if="courseInfo.coverImage"
            :src="courseInfo.coverImage"
            class="cover-image-img"
            mode="aspectFill"
          />
          <text v-else class="cover-image-emoji">{{ getCourseEmoji(courseInfo.type) }}</text>
        </view>

        <view class="page-content">
          <!-- 课程基本信息 -->
          <view class="t-card t-card--bordered">
            <view class="t-card__body">
              <view class="course-title">{{ courseInfo.name || '课程名称' }}</view>
              <view class="course-meta">
                <text class="course-price">¥{{ formatPrice(courseInfo.price) }}</text>
                <view class="t-badge--standalone t-badge--theme-success">
                  已有{{ courseInfo.soldCount }}人购买
                </view>
              </view>
            </view>
          </view>

        <!-- 标签页 -->
        <view class="t-tabs">
          <view class="t-tabs__header t-is-top">
            <view class="t-tabs__nav">
              <view class="t-tabs__nav-container">
                <view class="t-tabs__nav-wrap">
                  <view
                    class="t-tabs__bar"
                    :style="{ left: `calc(${activeTabIndex} * 33.33%)`, width: '33.33%' }"
                  ></view>
                  <view
                    v-for="(tab, index) in tabs"
                    :key="index"
                    class="t-tabs__nav-item"
                    :class="{ 't-is-active': activeTabIndex === index }"
                    @click="activeTabIndex = index"
                  >
                    <text>{{ tab.label }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="t-tabs__content">
            <view class="t-card t-card--bordered">
              <view class="t-card__body">
                <!-- 课程介绍 -->
                <view v-if="activeTabIndex === 0">
                  <view class="section-heading">📖 课程介绍</view>
                  <view class="section-text">{{ courseInfo.description }}</view>
                </view>

                <!-- 课程大纲 -->
                <view v-if="activeTabIndex === 1">
                  <view class="section-heading">📋 课程大纲</view>
                  <view class="section-list">
                    <view v-for="(item, index) in courseInfo.outline" :key="index" class="list-item">
                      {{ item }}
                    </view>
                  </view>
                </view>

                <!-- 讲师介绍 -->
                <view v-if="activeTabIndex === 2">
                  <view class="section-heading">👨‍🏫 讲师介绍</view>
                  <view class="section-text">{{ courseInfo.instructor }}</view>
                </view>
              </view>
            </view>
          </view>
        </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部 -->
    <view class="fixed-bottom">
      <text class="bottom-price">¥{{ formatPrice(courseInfo.price) }}</text>
      <button
        class="t-button t-button--theme-warning t-button--variant-base t-button--size-large"
        @click="handleBuy"
      >
        <span class="t-button__text">{{ buttonText }}</span>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { CourseApi } from '@/api';
import { formatPrice } from '@/utils';

// 当前选中的标签页
const activeTabIndex = ref(0);

// 标签页列表
const tabs = [
  { label: '课程介绍' },
  { label: '课程大纲' },
  { label: '讲师介绍' },
];

// 课程信息
const courseInfo = ref({
  id: null as number | null,
  name: '',
  type: 1,
  price: 0,
  soldCount: 0,
  coverImage: '',
  description: '',
  outline: [] as string[],
  instructor: '',
  is_purchased: false,
  user_course_id: null as number | null,
  attend_count: 1,
});

const getCourseEmoji = (type: number): string => {
  const map: Record<number, string> = { 1: '📚', 2: '🎓', 3: '🔄' };
  return map[type] || '📚';
};

const getCourseGradient = (type: number): string => {
  const map: Record<number, string> = {
    1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    2: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    3: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  };
  return map[type] || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
};

// 加载状态
const isLoading = ref(true);

// 加载课程详情
const loadCourseDetail = async (courseId: number) => {
  try {
    uni.showLoading({ title: '加载中...' });
    isLoading.value = true;
    const course = await CourseApi.getDetail(courseId);

    courseInfo.value.id = course.id;
    courseInfo.value.name = course.name;
    courseInfo.value.type = course.type;
    courseInfo.value.price = course.current_price || 0;
    courseInfo.value.soldCount = course.sold_count || 0;
    courseInfo.value.coverImage = course.cover_image || '';
    courseInfo.value.description = course.description || '';
    courseInfo.value.instructor = course.teacher || '';
    courseInfo.value.is_purchased = course.is_purchased || false;
    courseInfo.value.user_course_id = course.user_course_id || null;
    courseInfo.value.attend_count = course.attend_count || 0;

    // 解析课程大纲
    if (course.outline) {
      try {
        courseInfo.value.outline = typeof course.outline === 'string'
          ? JSON.parse(course.outline)
          : course.outline;
      } catch (e) {
        courseInfo.value.outline = course.outline ? [course.outline] : [];
      }
    }
    uni.hideLoading();
  } catch (error) {
    console.error('加载课程详情失败:', error);
    uni.hideLoading();
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    });
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = (currentPage as any).options || {};

  // 支持多种参数名：id、courseId、course_id（兼容性）
  // ⚠️ 先转 Number 再判断，避免字符串 "0" 被误判为 truthy
  const courseId = Number(options.id || options.courseId || options.course_id || 0);
  if (courseId > 0) {
    loadCourseDetail(courseId);
  } else {
    // 没有课程ID，显示错误并停止加载
    isLoading.value = false;
    uni.showToast({
      title: '课程ID不存在',
      icon: 'none'
    });
  }
});

onShow(() => {
  if (courseInfo.value.id > 0) {
    loadCourseDetail(courseInfo.value.id);
  }
});

// 按钮文本(根据购买状态)
const buttonText = computed(() => {
  if (courseInfo.value.is_purchased) {
    return '立即预约';
  }
  return '立即购买';
});

/**
 * 立即购买/预约
 */
const handleBuy = () => {
  // 验证课程ID是否有效
  if (!courseInfo.value.id) {
    uni.showToast({
      title: '课程信息加载中，请稍候',
      icon: 'none'
    });
    return;
  }

  if (courseInfo.value.is_purchased) {
    // 已购买,跳转到预约确认页
    uni.navigateTo({
      url: `/pages/course/appointment-confirm/index?userCourseId=${courseInfo.value.user_course_id}&courseId=${courseInfo.value.id}`,
    });
  } else {
    // 未购买,跳转到订单确认页
    uni.navigateTo({
      url: `/pages/order/confirm/index?courseId=${courseInfo.value.id}`,
    });
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  background-color: $td-bg-color-page;
}

.cover-image {
  width: 100%;
  height: 420rpx;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 128rpx;
  overflow: hidden;

  .cover-image-img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .cover-image-emoji {
    font-size: 128rpx;
  }
}

.page-content {
  padding: 32rpx;
  padding-bottom: calc(152rpx + env(safe-area-inset-bottom)); // 为固定底部预留空间 + 额外留白
  background-color: $td-bg-color-page;
  min-height: calc(100vh - 420rpx - var(--td-page-header-height)); // 确保内容区域填满屏幕
}

// 卡片样式
.t-card {
  background-color: #FFFFFF;
  
  &--bordered {
    border: 2rpx solid $td-border-level-1;
    border-radius: $td-radius-large;
  }
  
  &__body {
    padding: 32rpx;
  }
}

// 课程基本信息
.course-title {
  font-size: 48rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  color: $td-text-color-primary;
}

.course-meta {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.course-price {
  color: $td-warning-color;
  font-size: 56rpx;
  font-weight: 600;
}

.t-badge--standalone {
  padding: 8rpx 16rpx;
  border-radius: $td-radius-default;
  font-size: 20rpx;
  display: inline-flex;
  align-items: center;

  &.t-badge--theme-success {
    background-color: rgba($td-success-color, 0.1);
    color: $td-success-color;
  }
}

// 标签页样式
.t-tabs {
  margin-top: 32rpx;
}

.t-tabs__header {
  background: white;
  border-radius: $td-radius-default;
  overflow: hidden;
  margin-bottom: 32rpx;
}

.t-tabs__nav-wrap {
  display: flex;
  position: relative;
  padding: 8rpx;
  width: 100%;
}

.t-tabs__bar {
  position: absolute;
  bottom: 8rpx;
  height: 4rpx;
  background-color: $td-brand-color;
  border-radius: 2rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.t-tabs__nav-item {
  flex: 1;
  min-width: 0; // 防止文字溢出
  padding: 24rpx 16rpx;
  text-align: center;
  font-size: 28rpx;
  color: $td-text-color-secondary;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  white-space: nowrap; // 防止文字换行
  
  text {
    display: inline-block;
  }

  &.t-is-active {
    color: $td-brand-color;
    font-weight: 600;
  }

  &:active {
    opacity: 0.7;
  }
}

// 标签页内容
.t-tabs__content {
  background-color: transparent;
}

.section-heading {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 24rpx;
}

.section-text {
  color: $td-text-color-secondary;
  line-height: 1.8;
  font-size: 28rpx;
}

.section-list {
  margin-left: 40rpx;

  .list-item {
    color: $td-text-color-secondary;
    line-height: 1.8;
    font-size: 28rpx;
    list-style: disc;
    display: list-item;

    &::before {
      content: '• ';
      color: $td-brand-color;
      font-weight: bold;
      margin-right: 8rpx;
    }
  }
}

// 固定底部
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: white;
  border-top: 2rpx solid $td-border-level-1;
  z-index: 100;
}

.bottom-price {
  color: $td-warning-color;
  font-size: 48rpx;
  font-weight: 600;
}

.t-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $td-radius-default;
  border: none;
  padding: 0 48rpx;

  &--size-large {
    height: 88rpx;
  }

  &--theme-warning {
    background-color: $td-warning-color;

    .t-button__text {
      color: #FFFFFF;
      font-size: 32rpx;
      font-weight: 500;
    }
  }
}
</style>

