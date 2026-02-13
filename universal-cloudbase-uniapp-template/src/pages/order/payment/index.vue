<template>
  <view class="page-container">
    <TdPageHeader title="确认支付" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <!-- 加载中占位符 -->
      <view v-if="isLoading" class="page-content">
        <view class="t-card t-card--bordered">
          <view class="t-card__body">
            <view class="loading-text">加载中...</view>
          </view>
        </view>
      </view>

      <!-- 支付内容 -->
      <view v-else class="page-content">
        <!-- 支付金额 -->
        <view class="payment-amount">
          <view class="amount-label">支付金额</view>
          <view class="amount-value">¥{{ orderInfo.amount }}</view>
        </view>

        <!-- 订单信息 -->
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="info-row">
              <text class="info-label">订单名称</text>
              <text class="info-value">{{ orderInfo.orderName }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">订单号</text>
              <text class="info-value order-no">{{ orderInfo.orderNo }}</text>
            </view>
          </view>
        </view>

        <!-- 支付方式 -->
        <view class="section-title section-title--simple">💳 支付方式</view>

        <view
          class="payment-method"
          :class="{ 'payment-method--selected': selectedPayment === 'wechat' }"
          @click="selectedPayment = 'wechat'"
        >
          <view class="payment-method__content">
            <view class="payment-method__left">
              <text class="payment-method__icon">💚</text>
              <view class="payment-method__info">
                <view class="payment-method__name">微信支付</view>
                <view class="payment-method__desc">推荐使用</view>
              </view>
            </view>
            <view
              class="payment-method__radio"
              :class="{ 'payment-method__radio--checked': selectedPayment === 'wechat' }"
            >
              <text v-if="selectedPayment === 'wechat'" class="radio-check">✓</text>
            </view>
          </view>
        </view>


        <!-- 温馨提示 -->
        <view class="t-alert t-alert--theme-warning" style="margin-top: 48rpx;">
          <view class="t-alert__icon">💡</view>
          <view class="t-alert__content">
            <view class="t-alert__message">请在15分钟内完成支付，超时订单将自动取消</view>
          </view>
        </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部 -->
    <view class="fixed-bottom">
      <button class="t-button t-button--theme-light t-button--block t-button--size-large" @click="handlePay">
        <text class="t-button__text">立即支付 ¥{{ orderInfo.amount }}</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { OrderApi } from '@/api';

// 订单信息
const orderInfo = ref({
  orderNo: '',
  orderName: '',
  orderType: 1,
  amount: 0,
});

// 选中的支付方式
const selectedPayment = ref('wechat');

// 加载状态
const isLoading = ref(true);

// 加载订单详情
const loadOrderDetail = async (orderNo: string) => {
  try {
    isLoading.value = true;
    const order = await OrderApi.getDetail(orderNo);

    orderInfo.value.orderNo = order.order_no;
    orderInfo.value.orderName = order.order_name;
    orderInfo.value.orderType = order.order_type;
    orderInfo.value.amount = order.final_amount;
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

// 处理支付
const handlePay = async () => {
  console.log('支付方式:', selectedPayment.value);

  try {
    uni.showLoading({
      title: '支付中...',
    });

    // 调用支付接口
    const payParams = await OrderApi.createPayment({
      order_no: orderInfo.value.orderNo
    });

    uni.hideLoading();

    // 调用微信支付
    uni.requestPayment({
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType,
      paySign: payParams.paySign,
      success: () => {
        uni.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 2000,
        });

        setTimeout(() => {
          uni.redirectTo({
            url: '/pages/order/detail/index?orderNo=' + orderInfo.value.orderNo,
          });
        }, 2000);
      },
      fail: (err) => {
        console.error('支付失败:', err);
        
        // 用户取消支付，返回待支付页面
        if (err.errMsg && err.errMsg.includes('cancel')) {
          uni.showToast({
            title: '已取消支付',
            icon: 'none',
            duration: 1500
          });
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          // 其他支付错误
          uni.showToast({
            title: '支付失败',
            icon: 'none',
          });
        }
      }
    });
  } catch (error) {
    uni.hideLoading();
    console.error('发起支付失败:', error);
  }
};

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = (currentPage as any).options || {};

  if (options.orderNo) {
    orderInfo.value.orderNo = options.orderNo;
    loadOrderDetail(options.orderNo);
  }
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

// 支付金额
.payment-amount {
  text-align: center;
  padding: 80rpx 0;
}

.amount-label {
  font-size: 28rpx;
  color: $td-text-color-secondary;
  margin-bottom: 16rpx;
}

.amount-value {
  font-size: 96rpx;
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

  &.order-no {
    font-family: monospace;
    font-size: 24rpx;
  }
}

// 支付方式
.payment-method {
  background: white;
  border-radius: $td-radius-large;
  padding: 32rpx;
  margin-bottom: 24rpx;
  cursor: pointer;
  transition: all 0.3s;
  border: 4rpx solid transparent;

  &--selected {
    border-color: $td-brand-color;
    background: rgba($td-brand-color, 0.05);
  }

  &:active {
    transform: scale(0.98);
  }
}

.payment-method__content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.payment-method__left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  flex: 1;
}

.payment-method__icon {
  font-size: 64rpx;
}

.payment-method__info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.payment-method__name {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.payment-method__desc {
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

.payment-method__radio {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 4rpx solid $td-border-level-1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &--checked {
    background-color: $td-brand-color;
    border-color: $td-brand-color;
  }
}

.radio-check {
  color: white;
  font-size: 24rpx;
  font-weight: bold;
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

