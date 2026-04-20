<template>
  <view class="page-container">
    <TdPageHeader title="课程详情" :showBack="true" />

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
                <text class="course-price">{{ isExchangeMode ? pointsPrice + '积分' : (courseInfo.type === 4 ? '免费' : '¥' + formatPrice(courseInfo.price)) }}</text>
                <view v-if="courseInfo.type !== 4" class="t-badge--standalone t-badge--theme-success">
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
                    :style="{ left: `calc(${activeTabIndex} * ${100/tabs.length}%)`, width: (100/tabs.length) + '%' }"
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
                <!-- 课程介绍（图文块，接口已转 CDN URL） -->
                <view v-if="activeTabIndex === 0">
                  <view class="section-heading">📖 课程介绍</view>
                  <view v-if="courseInfo.descriptionBlocks.length" class="rich-body">
                    <template v-for="(b, bi) in courseInfo.descriptionBlocks" :key="'db-' + bi">
                      <rich-text
                        v-if="b.type === 'text' && courseRichTextHasContent(b.text)"
                        class="section-text course-rich-text"
                        :nodes="b.text"
                      />
                      <image
                        v-else-if="b.type === 'image' && b.image"
                        :src="b.image"
                        class="rich-img"
                        mode="widthFix"
                      />
                    </template>
                  </view>
                  <view v-else-if="courseInfo.description" class="section-text">{{ courseInfo.description }}</view>
                  <view v-else class="section-text section-text--muted">暂无介绍</view>
                </view>

                <!-- 课程大纲（图文块） -->
                <view v-if="activeTabIndex === 1">
                  <view class="section-heading">📋 课程大纲</view>
                  <view v-if="courseInfo.outlineBlocks.length" class="rich-body">
                    <template v-for="(b, bi) in courseInfo.outlineBlocks" :key="'ob-' + bi">
                      <view v-if="b.type === 'text' && courseRichTextHasContent(b.text)" class="rich-outline-rich-wrap">
                        <rich-text class="section-text course-rich-text" :nodes="b.text" />
                      </view>
                      <image
                        v-else-if="b.type === 'image' && b.image"
                        :src="b.image"
                        class="rich-img"
                        mode="widthFix"
                      />
                    </template>
                  </view>
                  <view v-else-if="courseInfo.outline.length" class="section-list">
                    <view v-for="(item, index) in courseInfo.outline" :key="index" class="list-item">
                      {{ item }}
                    </view>
                  </view>
                  <view v-else class="section-text section-text--muted">暂无大纲</view>
                </view>

                <!-- 讲师介绍 -->
                <view v-if="activeTabIndex === 2">
                  <view class="section-heading">👨‍🏫 讲师介绍</view>
                  <view class="section-text">{{ courseInfo.instructor }}</view>
                </view>

                <!-- 赠送课程（动态 tab，index >= 3；v-for 必须在外层 template，否则 Vue 3 的 v-if 优先级高于 v-for，gi 为 undefined） -->
                <template v-for="(gc, gi) in giftCourses" :key="'gift-'+gc.id">
                  <view v-if="activeTabIndex === 3 + gi">
                    <view class="section-heading">🎁 赠送课程详情</view>
                    <view class="gift-course-card">
                      <image v-if="gc.cover_image" :src="gc.cover_image" class="gift-course-cover" mode="aspectFill" />
                      <view class="gift-course-info">
                        <view class="gift-course-name">{{ gc.name }}</view>
                        <view class="gift-course-meta">
                          <text class="gift-course-type">{{ gc.type_name }}</text>
                          <text v-if="gc.validity_days" class="gift-course-validity">有效期 {{ gc.validity_days }} 天</text>
                          <text v-else class="gift-course-validity">永久有效</text>
                        </view>
                      </view>
                    </view>
                    <!-- 赠送课程 tab 仅展示赠送课卡片，不展示大纲等附加块 -->
                  </view>
                </template>
              </view>
            </view>
          </view>
        </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部 -->
    <view class="fixed-bottom">
      <text class="bottom-price">{{ bottomPriceText }}</text>
      <button
        class="t-button t-button--size-large"
        :class="(isExchangeMode && !canAffordExchange) || isAllExpired
          ? 't-button--theme-default t-button--variant-outline t-button--disabled'
          : 't-button--theme-warning t-button--variant-base'"
        :disabled="(isExchangeMode && !canAffordExchange) || isAllExpired"
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
import { CourseApi, OrderApi, SystemApi } from '@/api';
import type { CourseRichBlock } from '@/api/types/course';
import { formatPrice } from '@/utils';

// 当前选中的标签页
const activeTabIndex = ref(0);

// 标签页列表（动态，含赠送课程 tab）
const baseTabs = [
  { label: '课程介绍' },
  { label: '课程大纲' },
  { label: '讲师介绍' },
];
const tabs = ref(baseTabs);
const giftCourses = ref<any[]>([]);

// 课程信息
const courseInfo = ref({
  id: null as number | null,
  name: '',
  type: 1,
  price: 0,
  soldCount: 0,
  coverImage: '',
  description: '',
  /** 图文介绍（优先展示） */
  descriptionBlocks: [] as CourseRichBlock[],
  /** 图文大纲（优先展示） */
  outlineBlocks: [] as CourseRichBlock[],
  outline: [] as string[],
  instructor: '',
  is_purchased: false,
  user_course_id: null as number | null,
  attend_count: 1,
  user_course_status: null as number | null,
});

// 兑换模式相关状态
const isExchangeMode = ref(false);
const pointsPrice = ref(0);
const userCashPoints = ref(0);

const canAffordExchange = computed(() => userCashPoints.value >= pointsPrice.value);

const getCourseEmoji = (type: number): string => {
  const map: Record<number, string> = { 1: '📚', 2: '🎓', 3: '🔄', 4: '🎤' };
  return map[type] || '📚';
};

const getCourseGradient = (type: number): string => {
  const map: Record<number, string> = {
    1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    2: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    3: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    4: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
  };
  return map[type] || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
};

/** 图文块文字：纯文本或 HTML，判断是否应有展示（与后台 contenteditable 一致） */
const courseRichTextHasContent = (raw?: string | null): boolean => {
  if (raw == null || !String(raw).trim()) return false;
  const plain = String(raw)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return plain.length > 0;
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
    courseInfo.value.user_course_status = course.user_course_status ?? null;

    const descBlocks = Array.isArray((course as any).description_blocks)
      ? ((course as any).description_blocks as CourseRichBlock[])
      : [];
    courseInfo.value.descriptionBlocks = descBlocks.filter(
      (b) => b && (b.type === 'text' || b.type === 'image')
    );

    const outBlocks = Array.isArray((course as any).outline_blocks)
      ? ((course as any).outline_blocks as CourseRichBlock[])
      : [];
    courseInfo.value.outlineBlocks = outBlocks.filter(
      (b) => b && (b.type === 'text' || b.type === 'image')
    );

    // 纯文字大纲（无 outline_blocks 时的兜底，与云函数 enrich 返回的 outline 数组一致）
    courseInfo.value.outline = [];
    if (course.outline) {
      try {
        courseInfo.value.outline = typeof course.outline === 'string'
          ? JSON.parse(course.outline)
          : (Array.isArray(course.outline) ? course.outline : []);
      } catch (e) {
        courseInfo.value.outline = course.outline ? [String(course.outline)] : [];
      }
    }

    // 赠送课程 tabs
    giftCourses.value = course.gift_courses || [];
    const dynamicTabs = [...baseTabs];
    for (let i = 0; i < giftCourses.value.length; i++) {
      dynamicTabs.push({ label: '赠送课程' });
    }
    tabs.value = dynamicTabs;

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

// 加载用户积分（兑换模式使用）
const loadUserPoints = async () => {
  try {
    const points = await SystemApi.getUserPoints() as any;
    userCashPoints.value = points.cash_points_available ?? points.cashPointsAvailable ?? 0;
  } catch (error) {
    console.error('加载用户积分失败:', error);
  }
};

onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = (currentPage as any).options || {};

  // 检测兑换模式：从商城页跳转时携带 from=exchange
  if (options.from === 'exchange') {
    isExchangeMode.value = true;
    pointsPrice.value = Number(options.pointsPrice || 0);
    loadUserPoints();
  }

  const courseId = Number(options.id || options.courseId || options.course_id || 0);
  if (courseId > 0) {
    loadCourseDetail(courseId);
  } else {
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
  if (isExchangeMode.value) {
    loadUserPoints();
  }
});

// 底部价格文案
const bottomPriceText = computed(() => {
  if (isExchangeMode.value) return pointsPrice.value + '积分';
  if (courseInfo.value.type === 4) return '免费';
  return '¥' + formatPrice(courseInfo.value.price);
});

// 是否所有课程记录都已过期（status=3），且没有有效记录
const isAllExpired = computed(() => {
  return courseInfo.value.is_purchased && courseInfo.value.user_course_status === 3;
});

// 按钮文本
const buttonText = computed(() => {
  if (isExchangeMode.value) {
    return canAffordExchange.value ? '立即兑换' : '积分不足';
  }
  if (courseInfo.value.type === 4) return '立即预约';
  if (isAllExpired.value) return '课程已过期';
  if (courseInfo.value.is_purchased) return '立即预约';
  return '立即购买';
});

/**
 * 积分兑换课程（兑换模式下调用，逻辑与商城页 handleExchangeCourse 一致）
 */
const handleExchange = () => {
  if (!canAffordExchange.value) {
    uni.showModal({
      title: '提示',
      content: '积分不足，无法兑换该课程',
      showCancel: false,
    });
    return;
  }

  uni.showModal({
    title: '提示',
    content: `确定用 ${pointsPrice.value} 积分兑换课程吗？`,
    confirmText: '确定',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        try {
          await OrderApi.exchangeCourse({
            course_id: courseInfo.value.id!,
            use_cash_points_if_not_enough: true
          });
          await loadUserPoints();
          uni.showToast({ title: '兑换成功', icon: 'success', duration: 2000 });
        } catch (error: any) {
          console.error('兑换失败:', error);
          uni.showToast({
            title: error?.message || '兑换失败，请重试',
            icon: 'none',
            duration: 2500,
          });
        }
      }
    },
  });
};

/**
 * 立即购买/预约/兑换
 */
const handleBuy = () => {
  if (!courseInfo.value.id) {
    uni.showToast({ title: '课程信息加载中，请稍候', icon: 'none' });
    return;
  }

  // 兑换模式：执行积分兑换
  if (isExchangeMode.value) {
    handleExchange();
    return;
  }

  // 已购买且全部过期 → 提示重新购买
  if (isAllExpired.value) {
    uni.showModal({
      title: '提示',
      content: '课程已过期，请重新购买后继续学习',
      showCancel: false,
    });
    return;
  }

  if (courseInfo.value.type === 4 || courseInfo.value.is_purchased) {
    uni.navigateTo({
      url: `/pages/course/schedule/index?course_id=${courseInfo.value.id}&course_type=${courseInfo.value.type}`,
    });
  } else {
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

.section-text--muted {
  color: $td-text-color-placeholder;
}

.rich-body {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.course-rich-text {
  font-size: 28rpx;
  line-height: 1.8;
  color: $td-text-color-secondary;
}

.rich-outline-rich-wrap {
  margin-bottom: 8rpx;
}

.rich-img {
  width: 100%;
  display: block;
  border-radius: $td-radius-default;
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

// 赠送课程卡片
.gift-course-card {
  display: flex;
  gap: 24rpx;
  align-items: flex-start;

  .gift-course-cover {
    width: 180rpx;
    height: 120rpx;
    border-radius: $td-radius-default;
    flex-shrink: 0;
  }

  .gift-course-info {
    flex: 1;
    min-width: 0;
  }

  .gift-course-name {
    font-size: 30rpx;
    font-weight: 600;
    color: $td-text-color-primary;
    margin-bottom: 12rpx;
  }

  .gift-course-meta {
    display: flex;
    gap: 16rpx;
    font-size: 24rpx;
    color: $td-text-color-secondary;
  }

  .gift-course-type {
    padding: 4rpx 12rpx;
    background: rgba($td-brand-color, 0.1);
    color: $td-brand-color;
    border-radius: 4rpx;
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
  border-radius: $td-radius-round;
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

  &--disabled {
    opacity: 1;
    background-color: #bbbbbb;

    .t-button__text {
      color: #ffffff;
    }
  }
}
</style>

