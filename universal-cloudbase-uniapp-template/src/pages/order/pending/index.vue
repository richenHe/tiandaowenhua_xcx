<template>
  <view class="page-container">
    <TdPageHeader title="订单详情" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 订单状态 -->
        <view class="status-card status-card--pending">
          <view class="status-icon"><icon type="waiting" size="48" color="#F57C00"/></view>
          <view class="status-title">等待支付</view>
          <view class="status-desc">请在15分钟内完成支付，超时订单将自动取消</view>
          <view v-if="countdown > 0" class="countdown">
            剩余时间：{{ formatCountdown(countdown) }}
          </view>
        </view>

        <!-- 订单信息 -->
        <view class="t-section-title t-section-title--simple">📦 订单信息</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="info-row">
              <text class="info-label">订单编号</text>
              <text class="info-value order-no">{{ orderInfo.orderNo }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">订单名称</text>
              <text class="info-value">{{ orderInfo.orderName }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">下单时间</text>
              <text class="info-value">{{ orderInfo.createdAt }}</text>
            </view>
          </view>
        </view>

        <!-- 支付金额 -->
        <view class="t-section-title t-section-title--simple">💰 支付金额</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="amount-display">
              <view class="amount-label">应付金额</view>
              <view class="amount-value">¥{{ orderInfo.amount }}</view>
            </view>
          </view>
        </view>

        <!-- 推荐人信息（如果有） -->
        <view v-if="orderInfo.refereeName" class="t-section-title t-section-title--simple">🎯 推荐人信息</view>
        <view v-if="orderInfo.refereeName" class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="info-row">
              <text class="info-label">推荐人</text>
              <text class="info-value">{{ orderInfo.refereeName }}</text>
            </view>
          </view>
        </view>

        <!-- 温馨提示 -->
        <view class="t-alert t-alert--theme-warning">
          <view class="t-alert__icon"><icon type="warn" size="16" color="#E6A23C"/></view>
          <view class="t-alert__content">
            <view class="t-alert__message">支付成功后，您可以在"我的课程"中查看课程详情</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部 -->
    <view class="fixed-bottom">
      <view class="bottom-actions">
        <button class="t-button t-button--theme-default t-button--size-large cancel-btn" @click="handleCancel">
          <text class="t-button__text">取消订单</text>
        </button>
        <button class="t-button t-button--theme-light t-button--size-large pay-btn" @click="handlePay">
          <text class="t-button__text">立即支付</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { OrderApi } from '@/api';
import { useCountdownTimer } from '@/utils/timer';

// 订单信息
const orderInfo = ref({
  orderNo: '',
  orderName: '',
  orderType: 1,
  amount: 0,
  createdAt: '',
  refereeName: '',
});

// 倒计时（秒）
const countdown = ref(0);

// 使用统一的倒计时工具：到期后自动返回
const { start: startCountdown, stop: stopCountdown } = useCountdownTimer(
  () => countdown.value,
  (v) => { countdown.value = v; },
  () => {
    // 订单已超时，静默返回（订单会在后台自动取消）
    uni.navigateBack();
  }
);

// 当前订单号（用于页面显示时重新加载）
let currentOrderNo = '';
// 是否已经首次加载
let isFirstLoad = true;

// 格式化倒计时
const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// 加载订单详情
const loadOrderDetail = async (orderNo: string) => {
  try {
    // 停止旧的倒计时
    stopCountdown();

    uni.showLoading({
      title: '加载中...',
    });

    const order = await OrderApi.getDetail(orderNo);

    // 检查订单状态：如果已支付，跳转到订单详情页
    if (order.pay_status === 1) {
      uni.hideLoading();
      uni.redirectTo({
        url: `/pages/order/detail/index?orderNo=${orderNo}`,
      });
      return;
    }

    // 检查订单状态：已取消（含超时自动取消）或已关闭（旧数据兼容）
    if (order.pay_status === 2 || order.pay_status === 3) {
      uni.hideLoading();
      uni.showToast({
        title: '订单已取消',
        icon: 'none',
        duration: 1500
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
      return;
    }

    orderInfo.value = {
      orderNo: order.order_no,
      orderName: order.order_name,
      orderType: order.order_type,
      amount: order.final_amount,
      createdAt: order.created_at,
      refereeName: order.referee?.real_name || '',
    };

    // 计算剩余时间（15分钟）
    // iOS WebKit 不支持 "YYYY-MM-DD HH:MM:SS" 空格格式，需替换为 'T' 分隔符才能正确解析
    const createdTimeStr = (order.created_at || '').replace(' ', 'T');
    const createdTime = new Date(createdTimeStr).getTime();
    const now = Date.now();

    if (isNaN(createdTime)) {
      // 日期解析失败时，默认给足 15 分钟，避免误回退
      console.warn('[pending] created_at 解析失败，给足默认倒计时:', order.created_at);
      countdown.value = 15 * 60;
      startCountdown();
    } else {
      const elapsed = Math.floor((now - createdTime) / 1000);
      const remaining = 15 * 60 - elapsed;

      if (remaining > 0) {
        countdown.value = remaining;
        startCountdown();
      } else {
        // 订单已超时（前端兜底判断），提示后返回
        uni.showToast({ title: '订单已超时', icon: 'none', duration: 1500 });
        setTimeout(() => uni.navigateBack(), 1500);
      }
    }

    uni.hideLoading();
  } catch (error) {
    uni.hideLoading();
    console.error('加载订单详情失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none',
    });
  }
};

// 处理取消订单
const handleCancel = () => {
  uni.showModal({
    title: '提示',
    content: '确定要取消此订单吗？',
    confirmText: '确定取消',
    cancelText: '我再想想',
    success: (res) => {
      if (res.confirm) {
        // 调用实际的取消逻辑
        executeCancelOrder();
      }
    }
  });
};

// 执行取消订单
const executeCancelOrder = async () => {
  try {
    uni.showLoading({
      title: '取消中...',
    });

    await OrderApi.cancel({
      order_no: orderInfo.value.orderNo
    });

    uni.hideLoading();
    uni.showToast({
      title: '订单已取消',
      icon: 'success',
      duration: 2000,
    });

    setTimeout(() => {
      uni.navigateBack();
    }, 2000);
  } catch (error: any) {
    uni.hideLoading();
    console.error('取消订单失败:', error);
    uni.showToast({
      title: error.message || '取消失败',
      icon: 'none',
    });
  }
};

// 处理支付
const handlePay = () => {
  // 跳转到支付页面
  uni.navigateTo({
    url: `/pages/order/payment/index?orderNo=${orderInfo.value.orderNo}`,
  });
};

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = (currentPage as any).options || {};

  if (options.orderNo) {
    currentOrderNo = options.orderNo;
    loadOrderDetail(currentOrderNo);
  } else {
    uni.showToast({
      title: '订单号不存在',
      icon: 'none',
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
});

// 页面显示时重新加载订单（从支付页面返回时触发）
onShow(() => {
  // 跳过首次加载（onMounted 已经加载过）
  if (isFirstLoad) {
    isFirstLoad = false;
    return;
  }
  
  // 如果已经有订单号，重新加载订单数据
  if (currentOrderNo) {
    console.log('页面显示，重新加载订单:', currentOrderNo);
    loadOrderDetail(currentOrderNo);
  }
});

// useCountdownTimer 内部已在 onUnmounted 自动清理，无需手动处理
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
  padding-bottom: 120rpx;
}

.mb-l {
  margin-bottom: 32rpx;
}

// 订单状态卡片
.status-card {
  background: white;
  border-radius: $td-radius-large;
  padding: 48rpx 32rpx;
  text-align: center;
  margin-bottom: 32rpx;

  &--pending {
    border: 4rpx solid rgba($td-warning-color, 0.2);
    background: linear-gradient(180deg, rgba($td-warning-color, 0.05) 0%, white 100%);
  }
}

.status-icon {
  font-size: 96rpx;
  margin-bottom: 16rpx;
}

.status-title {
  font-size: 40rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 12rpx;
}

.status-desc {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

.countdown {
  margin-top: 24rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: $td-warning-color;
  font-family: monospace;
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

  &.order-no {
    font-family: monospace;
    font-size: 24rpx;
  }
}

// 金额展示
.amount-display {
  text-align: center;
  padding: 32rpx 0;
}

.amount-label {
  font-size: 28rpx;
  color: $td-text-color-secondary;
  margin-bottom: 16rpx;
}

.amount-value {
  font-size: 80rpx;
  font-weight: 600;
  color: $td-warning-color;
}

// Alert 组件
.t-alert {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  border-radius: $td-radius-default;

  &--theme-warning {
    background-color: $td-warning-color-light;
    border: 2rpx solid rgba($td-warning-color, 0.2);
  }
}

.t-alert__icon {
  font-size: 32rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.t-alert__content {
  flex: 1;
}

.t-alert__message {
  font-size: 24rpx;
  color: $td-text-color-primary;
  line-height: 1.6;
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

.bottom-actions {
  display: flex;
  gap: 24rpx;
}

// 按钮样式
.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $td-radius-default;
  border: none;

  &--size-large {
    height: 88rpx;
  }

  &--theme-default {
    background-color: $td-bg-color-container-hover;

    .t-button__text {
      color: $td-text-color-primary;
      font-size: 32rpx;
      font-weight: 500;
    }
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

.cancel-btn {
  flex: 1;
}

.pay-btn {
  flex: 2;
}
</style>

