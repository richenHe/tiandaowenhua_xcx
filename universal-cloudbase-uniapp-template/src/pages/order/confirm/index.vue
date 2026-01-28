<template>
  <view class="page-container">
    <TdPageHeader title="确认订单" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 课程信息 -->
        <view class="section-title section-title--simple">📦 课程信息</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="course-info">
              <view class="course-icon" :style="{ background: courseInfo.gradient }">
                {{ courseInfo.icon }}
              </view>
              <view class="course-details">
                <view class="course-name">{{ courseInfo.name }}</view>
                <view class="course-desc">{{ courseInfo.description }}</view>
                <view class="course-price">¥{{ courseInfo.price }}</view>
              </view>
            </view>
          </view>
        </view>

        <!-- 个人信息 -->
        <view class="section-title section-title--simple">👤 个人信息</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="info-row">
              <text class="info-label">姓名</text>
              <text class="info-value">{{ userInfo.name }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">手机</text>
              <text class="info-value">{{ userInfo.phone }}</text>
            </view>
          </view>
        </view>

        <!-- 推荐人信息 -->
        <view class="section-title section-title--simple">🎯 推荐人信息</view>
        <view class="t-card t-card--bordered t-card--hoverable mb-l" @click="goToSelectReferee">
          <view class="t-card__body">
            <view class="referee-info">
              <view class="referee-left">
                <view class="t-avatar t-avatar--theme-primary">
                  <text class="t-avatar__text">{{ refereeInfo.name.charAt(0) }}</text>
                </view>
                <view class="referee-details">
                  <view class="referee-name">{{ refereeInfo.name }}</view>
                  <view class="t-badge--standalone t-badge--theme-warning t-badge--size-small">
                    {{ refereeInfo.level }}
                  </view>
                </view>
              </view>
              <text class="arrow-icon">›</text>
            </view>
          </view>
        </view>

        <!-- 订单金额 -->
        <view class="section-title section-title--simple">💰 订单金额</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="amount-row">
              <text class="amount-label">课程价格</text>
              <text class="amount-value">¥{{ courseInfo.price }}</text>
            </view>
            <view class="amount-row">
              <text class="amount-label">优惠</text>
              <text class="amount-value">-¥{{ discount }}</text>
            </view>
            <view class="t-divider t-divider--dashed"></view>
            <view class="amount-row amount-row--total">
              <text class="amount-label--total">实付金额</text>
              <text class="amount-value--total">¥{{ totalAmount }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部 -->
    <view class="fixed-bottom">
      <view class="bottom-content">
        <view class="bottom-left">
          <view class="bottom-label">合计</view>
          <text class="bottom-price">¥{{ totalAmount }}</text>
        </view>
        <button class="t-button t-button--theme-light t-button--size-large" @click="handleConfirm">
          <text class="t-button__text">确认支付</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';

// 课程信息
const courseInfo = ref({
  id: 'course-1',
  name: '初探班',
  description: '系统学习天道文化基础课程',
  price: 1688,
  icon: '📚',
  gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
});

// 用户信息
const userInfo = ref({
  name: '张三',
  phone: '138****8000',
});

// 推荐人信息
const refereeInfo = ref({
  id: 'referee-1',
  name: '李四',
  level: '青鸾大使',
});

// 优惠金额
const discount = ref(0);

// 实付金额
const totalAmount = computed(() => {
  return courseInfo.value.price - discount.value;
});

// 跳转到选择推荐人页面
const goToSelectReferee = () => {
  uni.navigateTo({
    url: '/pages/order/select-referee/index',
  });
};

// 确认支付
const handleConfirm = () => {
  uni.navigateTo({
    url: '/pages/order/payment/index',
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
  padding-bottom: 120rpx; // 底部留白，方便滚动查看
}

// 章节标题
.section-title {
  font-size: 28rpx;
  font-weight: 500;
  color: $td-text-color-secondary;
  margin-bottom: 24rpx;

  &--simple {
    padding: 0;
    background: none;
    border: none;
  }
}

.mb-l {
  margin-bottom: 32rpx;
}

// 课程信息
.course-info {
  display: flex;
  gap: 24rpx;
}

.course-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: $td-radius-default;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  flex-shrink: 0;
}

.course-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.course-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 8rpx;
}

.course-desc {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  margin-bottom: 12rpx;
}

.course-price {
  font-size: 36rpx;
  font-weight: 600;
  color: $td-warning-color;
}

// 信息行
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-size: 28rpx;
  color: $td-text-color-secondary;
}

.info-value {
  font-size: 28rpx;
  font-weight: 500;
  color: $td-text-color-primary;
}

// 推荐人信息
.referee-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.referee-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  flex: 1;
}

.t-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--theme-primary {
    background-color: $td-brand-color;
  }
}

.t-avatar__text {
  font-size: 32rpx;
  color: white;
  font-weight: 500;
}

.referee-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.referee-name {
  font-size: 28rpx;
  font-weight: 500;
  color: $td-text-color-primary;
}

.arrow-icon {
  font-size: 48rpx;
  color: $td-text-color-placeholder;
}

// 金额行
.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;

  &--total {
    margin-top: 24rpx;
    margin-bottom: 0;
  }
}

.amount-label {
  font-size: 28rpx;
  color: $td-text-color-secondary;

  &--total {
    font-size: 32rpx;
    font-weight: 600;
    color: $td-text-color-primary;
  }
}

.amount-value {
  font-size: 28rpx;
  color: $td-text-color-primary;

  &--total {
    font-size: 40rpx;
    font-weight: 600;
    color: $td-warning-color;
  }
}

// 固定底部
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

.bottom-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bottom-left {
  display: flex;
  flex-direction: column;
}

.bottom-label {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  margin-bottom: 4rpx;
}

.bottom-price {
  font-size: 48rpx;
  font-weight: 600;
  color: $td-warning-color;
}

// 按钮样式
.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $td-radius-default;
  border: none;
  padding: 0 48rpx;

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
}
</style>

