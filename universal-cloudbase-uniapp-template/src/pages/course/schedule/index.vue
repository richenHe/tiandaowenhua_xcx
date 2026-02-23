<template>
  <view class="page-container">
    <TdPageHeader title="课程计划" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 即将开课标题 -->
        <view class="section-title section-title--simple">📅 即将开课</view>

        <!-- 课程计划列表 -->
        <view
          v-for="(schedule, index) in schedules"
          :key="index"
          class="t-card t-card--bordered schedule-card"
        >
          <view class="t-card__body">
            <view class="schedule-title">{{ schedule.courseName }} 第{{ schedule.period }}期</view>

            <view class="schedule-info">
              <view class="info-item">📅 {{ schedule.startDate }}{{ schedule.startTime ? ' ' + schedule.startTime : '' }}</view>
              <view class="info-item">📍 {{ schedule.location }}</view>
              <view class="info-item">👨‍🏫 {{ schedule.instructor }}</view>
              <view class="info-item">👥 剩余: {{ schedule.remainingSlots }}/{{ schedule.totalSlots }}</view>
            </view>

            <view class="t-divider"></view>

            <view class="deadline-info">报名截止: {{ schedule.registrationDeadline }}</view>

            <button
              class="t-button t-button--theme-light t-button--variant-base t-button--block"
              @click="handleAppointment(schedule.id)"
            >
              <span class="t-button__text">立即预约</span>
            </button>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="schedules.length === 0" class="empty-state">
          <text class="empty-icon">📅</text>
          <text class="empty-text">暂无课程排期</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { CourseApi } from '@/api';

// 课程排期数据
const schedules = ref<any[]>([]);

// 课程ID
const courseId = ref<number>(0);

// 加载课程排期
const loadSchedules = async () => {
  if (!courseId.value) return;

  try {
    uni.showLoading({ title: '加载中...' })
    const result = await CourseApi.getClassRecords({
      course_id: courseId.value,
      page: 1,
      page_size: 100
    });

    schedules.value = result.list.map((item: any) => ({
      id: item.id,
      courseName: item.course_name,
      period: '',
      startDate: item.class_date,
      startTime: item.start_time || '',   // 格式: "HH:mm-HH:mm"
      location: item.location,
      instructor: item.teacher,
      remainingSlots: item.available_quota,
      totalSlots: item.total_quota,
      registrationDeadline: item.class_date,
      isAppointed: item.is_appointed === 1
    }));
    uni.hideLoading()
  } catch (error) {
    console.error('加载课程排期失败:', error);
    uni.hideLoading()
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  }
};

// 处理预约
const handleAppointment = (scheduleId: number) => {
  console.log('预约课程:', scheduleId);
  uni.navigateTo({
    url: '/pages/course/appointment-confirm/index?classRecordId=' + scheduleId,
  });
};

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = (currentPage as any).options || {};

  if (options.course_id) {
    courseId.value = Number(options.course_id);
    loadSchedules();
  }
});
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

.scroll-area {
  height: calc(100vh - var(--td-page-header-height));
}

.page-content {
  padding: 32rpx;
}

// 课程排期卡片样式
.schedule-card {
  margin-bottom: 32rpx;
}

.schedule-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 16rpx;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.info-item {
  font-size: 28rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

.deadline-info {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
  margin-bottom: 24rpx;
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

// 按钮样式
.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $td-radius-default;
  border: none;

  &--theme-light {
    background-color: rgba($td-brand-color, 0.1);

    .t-button__text {
      color: $td-brand-color;
      font-size: 32rpx;
      font-weight: 500;
    }
  }

  &--block {
    width: 100%;
    height: 88rpx;
  }
}
</style>
