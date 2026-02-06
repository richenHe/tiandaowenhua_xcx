<template>
  <view class="page-container">
    <TdPageHeader title="我的课程" :showBack="true" />

    <scroll-view
      scroll-y
      class="scroll-area"
      @scroll="handleScroll"
    >
      <view class="page-content">
        <!-- 标签页（使用CapsuleTabs组件） -->
        <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight" :margin-bottom="32">
          <template #tabs>
            <CapsuleTabs
              v-model="currentTab"
              :options="tabs"
              @change="onTabChange"
            />
          </template>
        </StickyTabs>

        <!-- 课程列表 -->
        <view
          v-for="(course, index) in filteredCourses"
          :key="index"
          class="t-card t-card--bordered course-card"
        >
          <view class="t-card__body">
            <view class="course-header">
              <view class="course-icon" :style="{ background: course.gradient }">
                {{ course.icon }}
              </view>
              <view class="course-info">
                <text class="course-name">{{ course.name }}</text>
                <text class="course-meta">购买: {{ course.purchaseDate }}</text>
                <text class="course-meta">上课: {{ course.attendedCount }}次</text>
                <view
                  v-if="course.canRetrain"
                  class="t-badge--standalone t-badge--theme-success t-badge--size-small"
                >
                  可复训
                </view>
              </view>
            </view>

            <view class="course-actions">
              <view class="action-button">
                <button
                  class="t-button t-button--theme-default t-button--variant-outline t-button--size-small"
                  style="width: 100%"
                  @click="goToCourseDetail(course.id)"
                >
                  <span class="t-button__text">查看详情</span>
                </button>
              </view>
              <view class="action-button">
                <button
                  class="t-button t-button--theme-primary t-button--variant-base t-button--size-small"
                  style="width: 100%"
                  @click="goToCourseSchedule(course.id)"
                >
                  <span class="t-button__text">预约上课</span>
                </button>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="filteredCourses.length === 0" class="empty-state">
          <text class="empty-icon">📚</text>
          <text class="empty-text">暂无课程</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import CapsuleTabs from '@/components/CapsuleTabs.vue';
import StickyTabs from '@/components/StickyTabs.vue';

// 页面头部高度
const pageHeaderHeight = ref(64);

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>();

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 20;
  const navbarHeight = 44;
  pageHeaderHeight.value = statusBarHeight + navbarHeight;
});

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop);
  }
};

// 标签页数据
const tabs = ref([
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'ongoing' },
  { label: '已完成', value: 'completed' },
]);

const currentTab = ref('all');

// 标签切换事件
const onTabChange = (value: string | number) => {
  console.log('Tab changed:', value);
};

// 课程数据（Mock）
const courses = ref([
  {
    id: 'course-1',
    name: '初探班',
    icon: '📚',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    purchaseDate: '2024-01-01',
    attendedCount: 3,
    canRetrain: true,
    status: 'completed',
  },
  {
    id: 'course-2',
    name: '密训班',
    icon: '🎓',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    purchaseDate: '2023-12-15',
    attendedCount: 8,
    canRetrain: true,
    status: 'completed',
  },
  {
    id: 'course-3',
    name: '高级研修班',
    icon: '🏆',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    purchaseDate: '2024-01-15',
    attendedCount: 2,
    canRetrain: false,
    status: 'ongoing',
  },
]);

// 根据选中的标签页筛选课程
const filteredCourses = computed(() => {
  if (currentTab.value === 'all') {
    return courses.value;
  }
  return courses.value.filter((course) => course.status === currentTab.value);
});

// 跳转到课程详情
const goToCourseDetail = (courseId: string) => {
  console.log('前往课程详情:', courseId);
  uni.navigateTo({
    url: '/pages/course/detail/index?id=' + courseId,
  });
};

// 跳转到课程排期
const goToCourseSchedule = (courseId: string) => {
  console.log('前往课程排期:', courseId);
  uni.navigateTo({
    url: '/pages/course/schedule/index?id=' + courseId,
  });
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
  padding-bottom: var(--td-tab-bar-height);
}

.scroll-area {
  height: calc(100vh - var(--td-page-header-height) - var(--td-tab-bar-height));
}

.page-content {
  padding: 32rpx;
  padding-bottom: 120rpx; // 底部留白，方便滚动查看
}

// 标签切换容器
.tabs-wrapper {
  margin-bottom: 32rpx;
}

// 课程卡片样式
.course-card {
  margin-bottom: 32rpx;
}

.course-header {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.course-icon {
  width: 160rpx;
  height: 160rpx;
  border-radius: var(--td-radius-default);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
  flex-shrink: 0;
}

.course-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.course-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.course-meta {
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

.course-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.action-button {
  flex: 1;
}

// 空状态样式
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: $td-text-color-placeholder;
}
</style>
