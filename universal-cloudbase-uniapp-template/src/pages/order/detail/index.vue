<template>
  <view class="page-container">
    <TdPageHeader title="订单详情" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <!-- 加载中占位符 -->
      <view v-if="isLoading" class="page-content">
        <view class="t-card t-card--bordered">
          <view class="t-card__body">
            <view class="loading-text">加载中...</view>
          </view>
        </view>
      </view>

      <!-- 订单内容 -->
      <view v-else class="page-content">
        <!-- 支付状态 -->
        <view class="status-card">
          <view class="status-icon">✓</view>
          <view class="status-title">支付成功</view>
          <view class="status-desc">感谢您的购买，祝您学习愉快！</view>
        </view>

        <!-- 订单信息 -->
        <view class="section-title section-title--simple">📋 订单信息</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="info-row">
              <text class="info-label">订单号</text>
              <text class="info-value order-no">{{ orderDetail.orderNo }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">下单时间</text>
              <text class="info-value">{{ orderDetail.createTime }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">支付时间</text>
              <text class="info-value">{{ orderDetail.payTime }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">支付方式</text>
              <text class="info-value">{{ orderDetail.payMethod }}</text>
            </view>
          </view>
        </view>

        <!-- 课程信息 -->
        <view class="section-title section-title--simple">📚 课程信息</view>
        <view class="t-card t-card--bordered t-card--hoverable mb-l" @click="goToCourseDetail">
          <view class="t-card__body">
            <view class="course-info">
              <view class="course-icon" :style="{ background: orderDetail.course.gradient }">
                {{ orderDetail.course.icon }}
              </view>
              <view class="course-details">
                <view class="course-name">{{ orderDetail.course.name }}</view>
                <view class="course-desc">{{ orderDetail.course.description }}</view>
                <view class="course-badge">
                  <text class="t-badge t-badge--success">已购买</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 用户信息 -->
        <view class="section-title section-title--simple">👤 用户信息</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="info-row">
              <text class="info-label">姓名</text>
              <text class="info-value">{{ orderDetail.user.name }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">手机</text>
              <text class="info-value">{{ orderDetail.user.phone }}</text>
            </view>
          </view>
        </view>

        <!-- 推荐人信息 -->
        <view class="section-title section-title--simple">🎯 推荐人信息</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="referee-info">
              <view class="t-avatar t-avatar--theme-primary">
                <text class="t-avatar__text">{{ orderDetail.referee.name.charAt(0) }}</text>
              </view>
              <view class="referee-details">
                <view class="referee-name">{{ orderDetail.referee.name }}</view>
                <view class="t-badge--standalone t-badge--theme-warning t-badge--size-small">
                  {{ orderDetail.referee.level }}
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 金额明细 -->
        <view class="section-title section-title--simple">💰 金额明细</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="amount-row">
              <text class="amount-label">课程价格</text>
              <text class="amount-value">¥{{ orderDetail.amount.coursePrice }}</text>
            </view>
            <view class="amount-row">
              <text class="amount-label">优惠</text>
              <text class="amount-value">-¥{{ orderDetail.amount.discount }}</text>
            </view>
            <view class="t-divider t-divider--dashed"></view>
            <view class="amount-row amount-row--total">
              <text class="amount-label--total">实付金额</text>
              <text class="amount-value--total">¥{{ orderDetail.amount.totalAmount }}</text>
            </view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <button
            class="t-button t-button--theme-light t-button--variant-base t-button--block action-button"
            @click="goToMyCourses"
          >
            <text class="t-button__text">查看课程</text>
          </button>
          <!-- TODO: 下个版本开发 - 在线客服功能（通过WebSocket实现，不需要数据库） -->
          <!-- <button
            class="t-button t-button--theme-default t-button--variant-outline t-button--block action-button"
            @click="goToConsultation"
          >
            <text class="t-button__text">联系客服</text>
          </button> -->
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { OrderApi } from '@/api';

// 订单详情
const orderDetail = ref({
  orderNo: '',
  createTime: '',
  payTime: '',
  payMethod: '微信支付',
  course: {
    id: 0,
    name: '',
    description: '',
    icon: '📚',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  user: {
    name: '',
    phone: '',
  },
  referee: {
    id: 0,
    name: '',
    level: '',
  },
  amount: {
    coursePrice: 0,
    discount: 0,
    totalAmount: 0,
  },
});

// 加载状态
const isLoading = ref(true);

// 大使等级映射
const levelNames: Record<number, string> = {
  0: '普通用户',
  1: '准青鸾大使',
  2: '青鸾大使',
  3: '鸿鹄大使'
};

// 加载订单详情
const loadOrderDetail = async (orderNo: string) => {
  try {
    isLoading.value = true;
    const order = await OrderApi.getDetail(orderNo);

    orderDetail.value.orderNo = order.order_no;
    orderDetail.value.createTime = order.created_at;
    orderDetail.value.payTime = order.pay_time || '';
    orderDetail.value.payMethod = order.pay_method === 'wechat' ? '微信支付' : '其他';

    orderDetail.value.user.name = order.user_name || '';
    orderDetail.value.user.phone = order.user_phone || '';

    orderDetail.value.referee.name = order.referee_name || '';
    orderDetail.value.referee.level = levelNames[order.referee_level || 0] || '';

    orderDetail.value.amount.coursePrice = order.original_amount || 0;
    orderDetail.value.amount.discount = order.discount_amount || 0;
    orderDetail.value.amount.totalAmount = order.final_amount || 0;

    orderDetail.value.course.name = order.order_name || '';
  } catch (error) {
    console.error('加载订单详情失败:', error);
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    });
  } finally {
    isLoading.value = false;
  }
};

// 页面加载时获取订单信息
onMounted(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = (currentPage as any).options || {};

  if (options.orderNo) {
    loadOrderDetail(options.orderNo);
  } else {
    // 没有订单号，显示错误并停止加载
    isLoading.value = false;
    uni.showToast({
      title: '订单号不存在',
      icon: 'none'
    });
  }
});

// 跳转到课程详情
const goToCourseDetail = () => {
  uni.navigateTo({
    url: '/pages/course/detail/index?courseId=' + orderDetail.value.course.id,
  });
};

// 跳转到我的课程
const goToMyCourses = () => {
  uni.navigateTo({
    url: '/pages/course/my-courses/index',
  });
};

// TODO: 下个版本开发 - 在线客服功能（通过WebSocket实现，不需要数据库）
// 跳转到在线咨询
// const goToConsultation = () => {
//   uni.navigateTo({
//     url: '/pages/mine/consultation/index',
//   });
// };
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
  padding-bottom: 120rpx; // 底部留白，方便滚动查看
}

// 加载占位符
.loading-text {
  text-align: center;
  color: $td-text-color-placeholder;
  font-size: 28rpx;
  padding: 64rpx 0;
}

.mb-l {
  margin-bottom: 32rpx;
}

// 支付状态卡片
.status-card {
  text-align: center;
  padding: 64rpx 32rpx;
  background: linear-gradient(135deg, $td-success-color, #00c47d);
  color: white;
  border-radius: $td-radius-large;
  margin-bottom: 32rpx;
}

.status-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.status-title {
  font-size: 40rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.status-desc {
  font-size: 28rpx;
  opacity: 0.9;
}

// 信息行
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;

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
  color: $td-text-color-primary;

  &.order-no {
    font-family: monospace;
    font-size: 26rpx;
  }
}

// 课程信息
.course-info {
  display: flex;
  gap: 24rpx;
}

.course-icon {
  width: 160rpx;
  height: 160rpx;
  border-radius: $td-radius-default;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
  flex-shrink: 0;
}

.course-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
}

.course-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.course-desc {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  margin-bottom: 8rpx;
}

.course-badge {
  display: inline-block;
}

.t-badge {
  display: inline-block;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  font-weight: normal;
}

.t-badge--success {
  background-color: $td-success-color-light;
  color: $td-success-color;
}

// 推荐人信息
.referee-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
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

// 徽章
.t-badge--standalone {
  padding: 4rpx 12rpx;
  border-radius: $td-radius-small;
  font-size: 20rpx;
  font-weight: normal;
  display: inline-block;

  &.t-badge--size-small {
    font-size: 18rpx;
    padding: 2rpx 8rpx;
  }

  &.t-badge--theme-success {
    background-color: rgba($td-success-color, 0.1);
    color: $td-success-color;
  }

  &.t-badge--theme-warning {
    background-color: rgba($td-warning-color, 0.1);
    color: $td-warning-color;
  }
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

// 操作按钮
.action-buttons {
  display: flex;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.action-button {
  flex: 1;
}

// 按钮样式
.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $td-radius-default;
  border: none;
  height: 88rpx;

  &--theme-light {
    background-color: rgba($td-brand-color, 0.1);

    .t-button__text {
      color: $td-brand-color;
      font-size: 28rpx;
      font-weight: 500;
    }
  }

  &--theme-default {
    background-color: transparent;

    .t-button__text {
      color: $td-text-color-secondary;
      font-size: 28rpx;
    }
  }

  &--variant-outline {
    border: 2rpx solid $td-border-level-1;
  }

  &--block {
    width: 100%;
  }
}
</style>

