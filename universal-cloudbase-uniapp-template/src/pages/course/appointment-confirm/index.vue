<template>
  <view class="page-container">
    <TdPageHeader title="预约确认" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 课程信息 -->
        <view class="section-title section-title--simple">📚 课程信息</view>
        <view class="t-card t-card--bordered">
          <view class="t-card__body">
            <view class="info-title">{{ courseInfo.courseName }} 第{{ courseInfo.period }}期</view>
            <view class="info-details">
              <view class="info-item">📅 {{ courseInfo.startDate }} 至 {{ courseInfo.endDate }}</view>
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
            <view class="tips-item">3. 如有疑问，请联系客服：400-123-4567</view>
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
import { ref, computed, onMounted, getCurrentInstance } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';

// 课程信息（Mock）
const courseInfo = ref({
  courseId: 0,
  courseName: '初探班',
  period: 12,
  startDate: '2024-02-01',
  endDate: '2024-02-03',
  location: '北京市朝阳区',
  userAttendCount: 0, // 用户已上课次数
  retrainPrice: 500, // 复训费用
});

// 按钮文本
const buttonText = computed(() => {
  if (courseInfo.value.userAttendCount === 1) {
    return '确认预约';
  } else if (courseInfo.value.userAttendCount > 1) {
    return `确认预约并支付复训费 ¥${courseInfo.value.retrainPrice}`;
  }
  return '确认预约'; // 默认值
});

// 页面加载时获取排期信息
onMounted(() => {
  const instance = getCurrentInstance();
  const query = (instance?.proxy as any)?.$route?.query;
  const courseId = query?.courseId;
  const userAttendCount = parseInt(query?.userAttendCount || '0');

  if (courseId) {
    courseInfo.value.courseId = parseInt(courseId);
    courseInfo.value.userAttendCount = userAttendCount;
    fetchCourseDetail(courseInfo.value.courseId);
  }
});

// 模拟获取课程详情
const fetchCourseDetail = (id: number) => {
  console.log(`Fetching course detail for ID: ${id}`);
  // 模拟API请求
  setTimeout(() => {
    courseInfo.value = {
      ...courseInfo.value,
      courseId: id,
      courseName: id === 1 ? '初探班' : '密训班',
      retrainPrice: id === 1 ? 500 : 800, // 模拟复训费用
    };
  }, 500);
};

// 提交预约 - 使用弹窗确认
const handleSubmit = () => {
  // 根据上课次数显示不同的弹窗内容
  const isFirstTime = courseInfo.value.userAttendCount === 1;
  const modalContent = isFirstTime
    ? '确定要预约该课程吗？'
    : `确定要预约该课程并支付复训费 ¥${courseInfo.value.retrainPrice} 吗？`;

  uni.showModal({
    title: '预约确认',
    content: modalContent,
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 用户点击确定
        if (courseInfo.value.userAttendCount > 1) {
          // 需要支付复训费,跳转到支付页面
          uni.navigateTo({
            url: `/pages/order/payment/index?orderNo=RETRAIN_${Date.now()}`, // 模拟生成复训订单号
          });
        } else {
          // 首次预约,直接成功
          // TODO: 调用预约接口
          uni.showToast({
            title: '预约成功',
            icon: 'success',
            duration: 2000,
          });

          setTimeout(() => {
            uni.navigateBack();
          }, 2000);
        }
      }
    },
  });
};
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
