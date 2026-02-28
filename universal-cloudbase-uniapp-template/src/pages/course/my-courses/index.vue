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
              <view class="course-icon" :style="course.cover_image ? {} : { background: course.gradient }">
                <image
                  v-if="course.cover_image"
                  :src="course.cover_image"
                  class="course-cover-img"
                  mode="aspectFill"
                />
                <text v-else>{{ course.icon }}</text>
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
import { onShow } from '@dcloudio/uni-app';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import CapsuleTabs from '@/components/CapsuleTabs.vue';
import StickyTabs from '@/components/StickyTabs.vue';
import { UserApi } from '@/api';

// 页面头部高度
const pageHeaderHeight = ref(64);

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>();

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

// 课程数据
const courses = ref<any[]>([]);

// 课程图标和渐变色映射
const courseStyles: Record<number, { icon: string; gradient: string }> = {
  1: { icon: '📚', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }, // 初探班
  2: { icon: '🎓', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }, // 密训班
  3: { icon: '💬', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }  // 咨询服务
};

// 加载我的课程
const loadMyCourses = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    const result = await UserApi.getMyCourses({ page: 1, page_size: 100 });

    courses.value = result.list.map((item: any) => {
      const style = courseStyles[item.type] || courseStyles[1];
      return {
        id: item.course_id,
        name: item.title,
        cover_image: item.cover_image || '',
        icon: style.icon,
        gradient: style.gradient,
        purchaseDate: (item.purchase_date || item.buy_time || '').split(' ')[0],
        attendedCount: item.attend_count || 0,
        canRetrain: item.attend_count > 0,
        status: item.attend_count > 0 ? 'completed' : 'ongoing'
      };
    });
    uni.hideLoading();
  } catch (error) {
    console.error('加载课程列表失败:', error);
    uni.hideLoading();
  }
};

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 20;
  const navbarHeight = 44;
  pageHeaderHeight.value = statusBarHeight + navbarHeight;

  // 加载课程列表
  loadMyCourses();
});

onShow(() => {
  loadMyCourses();
});

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
    url: '/pages/course/detail/index?courseId=' + courseId,
  });
};

// 跳转到课程排期（参数名必须为 course_id，与 schedule 页一致）
const goToCourseSchedule = (courseId: string) => {
  console.log('前往课程排期:', courseId);
  uni.navigateTo({
    url: '/pages/course/schedule/index?course_id=' + courseId,
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
  overflow: hidden;
}

.course-cover-img {
  width: 100%;
  height: 100%;
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
