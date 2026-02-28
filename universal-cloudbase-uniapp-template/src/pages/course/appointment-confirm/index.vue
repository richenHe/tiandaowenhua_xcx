<template>
  <view class="page-container">
    <TdPageHeader title="预约确认" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 课程信息 -->
        <view class="section-title section-title--simple">📚 课程信息</view>
        <view class="t-card t-card--bordered">
          <view class="t-card__body">
            <view class="info-title">{{ courseInfo.courseName }}</view>
            <view class="info-details">
              <view class="info-item">📅 {{ courseInfo.startDate }}{{ courseInfo.startTime ? ' ' + courseInfo.startTime : '' }}</view>
              <view class="info-item">📍 {{ courseInfo.location }}</view>
              <view v-if="courseInfo.userAttendCount > 1" class="info-item price-item">
                💰 复训费用: ¥{{ courseInfo.retrainPrice }}
              </view>
            </view>
          </view>
        </view>

        <!-- 温馨提示 -->
        <view class="tips-card">
          <view class="tips-title">📝 温馨提示</view>
          <view class="tips-content">
            <view class="tips-item">1. 系统将自动获取您的注册信息进行预约</view>
            <view class="tips-item">2. 预约成功后，工作人员会在3个工作日内与您联系</view>
            <view class="tips-item">3. 如有疑问，请联系客服：{{ customerServicePhone }}</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部按钮 -->
    <view class="fixed-bottom">
      <button
        class="t-button t-button--theme-light t-button--variant-base t-button--block t-button--size-large"
        @click="handleSubmit"
      >
        <span class="t-button__text">{{ buttonText }}</span>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { CourseApi, SystemApi } from '@/api';

// 客服电话
const customerServicePhone = ref('');

// 课程信息
const courseInfo = ref({
  classRecordId: 0,
  courseId: 0,
  courseName: '',
  period: '',
  startDate: '',
  startTime: '',
  endDate: '',
  location: '',
  userAttendCount: 0,
  retrainPrice: 500,
});

// 加载状态
const loading = ref(true);

// 按钮文本
const buttonText = computed(() => {
  if (courseInfo.value.userAttendCount === 0) {
    return '确认预约';
  } else if (courseInfo.value.userAttendCount > 0) {
    return `确认预约并支付复训费 ¥${courseInfo.value.retrainPrice}`;
  }
  return '确认预约';
});

// 加载排期详情
const loadClassRecordDetail = async (classRecordId: number) => {
  try {
    uni.showLoading({ title: '加载中...' })
    loading.value = true;
    const result = await CourseApi.getClassRecords({
      course_id: courseInfo.value.courseId,
      page: 1,
      page_size: 100
    });

    const record = result.list.find((item: any) => item.id === classRecordId);
    if (record) {
      courseInfo.value.courseName = record.course_name;
      courseInfo.value.period = record.period || '';
      // start_time 格式: "HH:mm-HH:mm"，class_date 格式: "YYYY-MM-DD"
      courseInfo.value.startDate = record.class_date || '';
      courseInfo.value.startTime = record.start_time || '';
      courseInfo.value.endDate = record.class_date || '';
      courseInfo.value.location = record.location;
    }
    uni.hideLoading()
  } catch (error) {
    console.error('加载排期详情失败:', error);
    uni.hideLoading()
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 加载用户上课次数
const loadUserAttendCount = async (userCourseId: number) => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await CourseApi.getAcademyProgress();
    const userCourse = result.find((item: any) => item.id === userCourseId);
    if (userCourse) {
      courseInfo.value.userAttendCount = userCourse.attend_count || 0;
    }
    uni.hideLoading()
  } catch (error) {
    console.error('加载用户上课次数失败:', error);
    uni.hideLoading()
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  }
};

// 加载客服电话
const loadCustomerServicePhone = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await SystemApi.getSystemConfig({ key: 'customer_service_phone' });
    customerServicePhone.value = result.value;
    uni.hideLoading()
  } catch (error) {
    console.error('加载客服电话失败:', error);
    uni.hideLoading()
  }
};

// 提交预约
const handleSubmit = async () => {
  const isRetrain = courseInfo.value.userAttendCount > 0;
  const modalContent = isRetrain
    ? `确定要预约该课程并支付复训费 ¥${courseInfo.value.retrainPrice} 吗？`
    : '确定要预约该课程吗？';

  uni.showModal({
    title: '预约确认',
    content: modalContent,
    confirmText: '确定',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        if (isRetrain) {
          // 需要支付复训费，跳转到订单确认页
          uni.navigateTo({
            url: `/pages/order/confirm/index?classRecordId=${courseInfo.value.classRecordId}&isRetrain=1`,
          });
        } else {
          // 首次预约，直接调用预约接口
          try {
            await CourseApi.createAppointment({
              class_record_id: courseInfo.value.classRecordId
            });

            uni.showToast({
              title: '预约成功',
              icon: 'success',
              duration: 2000,
            });

            setTimeout(() => {
              uni.navigateBack();
            }, 2000);
          } catch (error) {
            console.error('预约失败:', error);
          }
        }
      }
    },
  });
};

onLoad((options: any) => {
  if (options?.classRecordId) {
    courseInfo.value.classRecordId = Number(options.classRecordId);
  }
  if (options?.courseId) {
    courseInfo.value.courseId = Number(options.courseId);
  }

  // 优先使用 URL 直传的展示数据（避免二次 API 请求）
  if (options?.courseName) {
    courseInfo.value.courseName = decodeURIComponent(options.courseName);
  }
  if (options?.classDate) {
    courseInfo.value.startDate = decodeURIComponent(options.classDate);
  }
  if (options?.classTime) {
    courseInfo.value.startTime = decodeURIComponent(options.classTime);
  }
  if (options?.location) {
    courseInfo.value.location = decodeURIComponent(options.location);
  }

  // 如果 URL 没有直传数据，才通过 API 加载
  if (!courseInfo.value.courseName && courseInfo.value.classRecordId && courseInfo.value.courseId) {
    loadClassRecordDetail(courseInfo.value.classRecordId);
  } else {
    loading.value = false;
  }

  const userCourseId = options?.userCourseId ? Number(options.userCourseId) : 0;
  if (userCourseId) {
    loadUserAttendCount(userCourseId);
  }

  loadCustomerServicePhone();
});
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.scroll-area {
  height: calc(100vh - var(--td-page-header-height) - 160rpx - env(safe-area-inset-bottom));
}

.page-content {
  padding: 32rpx;
}

// 信息标题和详情样式
.info-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 16rpx;
}

.info-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-item {
  font-size: 28rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;

  &.price-item {
    margin-top: 8rpx;
    padding-top: 16rpx;
    border-top: 2rpx solid $td-border-level-1;
    color: $td-error-color;
    font-weight: 600;
  }
}

// 温馨提示样式
.tips-card {
  margin-top: 32rpx;
  background-color: $td-warning-color-light;
  border-radius: var(--td-radius-default);
  padding: 32rpx;
}

.tips-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $td-warning-color;
  margin-bottom: 16rpx;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tips-item {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 固定底部按钮
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background-color: white;
  border-top: 2rpx solid $td-border-level-1;
  z-index: 100;
}

.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--td-radius-default);
  border: none;

  &--size-large {
    height: 88rpx;
  }

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
  }
}
</style>
