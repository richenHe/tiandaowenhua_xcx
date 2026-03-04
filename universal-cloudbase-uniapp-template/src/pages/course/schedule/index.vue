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
            <view class="schedule-title">{{ schedule.courseName }}</view>

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
              @click="handleAppointment(schedule)"
            >
              <span class="t-button__text">立即预约</span>
            </button>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="schedules.length === 0" class="empty-state">
          <view class="empty-icon"><icon type="info" size="60" color="#ccc"/></view>
          <text class="empty-text">暂无课程排期</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { CourseApi, AmbassadorApi, UserApi } from '@/api';

// 课程排期数据
const schedules = ref<any[]>([]);

// 课程ID
const courseId = ref<number>(0);
// 课程类型（4=沙龙，通过 URL 参数传入）
const courseType = ref<number>(0);

// 加载课程排期
const loadSchedules = async () => {
  if (!courseId.value) return;

  try {
    uni.showLoading({ title: '加载中...' })

    // 非沙龙课：防御性校验用户课程状态（防止通过 URL 直接访问过期课程）
    if (courseType.value !== 4) {
      const myCoursesResult = await UserApi.getMyCourses({ page: 1, page_size: 100 });
      const courseRecord = (myCoursesResult?.list || []).find(
        (uc: any) => uc.course_id === courseId.value && uc.status === 1
      );
      if (!courseRecord) {
        uni.hideLoading();
        uni.showModal({
          title: '无法预约',
          content: '您未购买该课程或课程已过期，无法查看排期',
          showCancel: false,
          success: () => uni.navigateBack()
        });
        return;
      }
    }

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

// 跳转到预约确认页
const goToAppointmentConfirm = (schedule: any) => {
  const q = [
    `classRecordId=${schedule.id}`,
    `courseId=${courseId.value}`,
    `courseType=${courseType.value}`,
    `courseName=${encodeURIComponent(schedule.courseName || '')}`,
    `classDate=${encodeURIComponent(schedule.startDate || '')}`,
    `classTime=${encodeURIComponent(schedule.startTime || '')}`,
    `location=${encodeURIComponent(schedule.location || '')}`
  ].join('&')
  uni.navigateTo({
    url: `/pages/course/appointment-confirm/index?${q}`,
  });
};

// 处理预约（沙龙课程跳过合同检查，其余类型需检查合同签署状态）
const handleAppointment = async (schedule: any) => {
  if (courseType.value !== 4) {
    try {
      uni.showLoading({ title: '检查中...' })
      const checkResult = await AmbassadorApi.checkCourseContract(courseId.value)
      uni.hideLoading()

      if (checkResult.needSign) {
        uni.showModal({
          title: '签署学习合同',
          content: '您需要签署学习服务协议后才能参加学习，是否立即签署？',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: `/pages/ambassador/contract-sign/index?courseId=${courseId.value}&templateId=${checkResult.templateId}`
              })
            }
          }
        })
        return
      }
    } catch (e) {
      uni.hideLoading()
      console.error('检查合同状态失败:', e)
    }
  }

  goToAppointmentConfirm(schedule)
};

onLoad((options: any) => {
  const id = options?.course_id ?? options?.courseId ?? options?.id;
  if (id) {
    courseId.value = Number(id);
    loadSchedules();
  }
  const type = options?.course_type ?? options?.courseType;
  if (type) {
    courseType.value = Number(type);
  }
});

onShow(() => {
  loadSchedules();
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
