<template>
  <view class="page-container">
    <TdPageHeader title="退款详情" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 状态卡片 -->
        <view :class="['status-card', statusConfig.cardClass]">
          <view class="status-icon">{{ statusConfig.icon }}</view>
          <view class="status-title">{{ statusConfig.title }}</view>
          <view class="status-desc">{{ statusConfig.desc }}</view>
        </view>

        <!-- 退款信息 -->
        <view class="t-card order-info">
          <view class="info-row">
            <text class="label">退款金额</text>
            <text class="value refund-amount">¥{{ formatPrice(refundInfo.refund_amount || refundInfo.final_amount) }}</text>
          </view>
          <view class="info-row">
            <text class="label">退款方式</text>
            <text class="value">财务转账</text>
          </view>
          <view v-if="refundInfo.refund_time" class="info-row">
            <text class="label">退款时间</text>
            <text class="value">{{ refundInfo.refund_time }}</text>
          </view>
          <view v-if="refundInfo.refund_transfer_no" class="info-row">
            <text class="label">转账单号</text>
            <text class="value">{{ refundInfo.refund_transfer_no }}</text>
          </view>
        </view>

        <!-- 退款原因 -->
        <view v-if="refundInfo.refund_reason" class="t-card order-info">
          <view class="info-row">
            <text class="label">退款原因</text>
            <text class="value reason-text">{{ refundInfo.refund_reason }}</text>
          </view>
        </view>

        <!-- 驳回原因 -->
        <view v-if="refundInfo.refund_status === 4 && refundInfo.refund_reject_reason" class="t-card reject-card">
          <view class="reject-header">
            <text class="reject-title">驳回原因</text>
          </view>
          <view class="reject-content">
            <text>{{ refundInfo.refund_reject_reason }}</text>
          </view>
        </view>

        <!-- 订单信息 -->
        <view class="t-card order-info">
          <view class="info-row">
            <text class="label">订单编号</text>
            <text class="value">{{ refundInfo.order_no }}</text>
          </view>
          <view class="info-row">
            <text class="label">订单名称</text>
            <text class="value">{{ refundInfo.order_name }}</text>
          </view>
          <view class="info-row">
            <text class="label">下单时间</text>
            <text class="value">{{ refundInfo.created_at }}</text>
          </view>
          <view v-if="refundInfo.pay_time" class="info-row">
            <text class="label">支付时间</text>
            <text class="value">{{ refundInfo.pay_time }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="fixed-bottom">
      <view class="bottom-actions">
        <button
          class="t-button t-button--theme-default t-button--size-large back-btn"
          @click="goBack"
        >
          <text class="t-button__text">返回</text>
        </button>
        <!-- 已退款：重新下单 -->
        <button
          v-if="refundInfo.refund_status === 3"
          class="t-button t-button--theme-primary t-button--size-large action-btn"
          @click="handleReorder"
        >
          <text class="t-button__text">重新下单</text>
        </button>
        <!-- 已驳回：重新申请 -->
        <button
          v-if="refundInfo.refund_status === 4"
          class="t-button t-button--theme-primary t-button--size-large action-btn"
          @click="handleReapply"
        >
          <text class="t-button__text">重新申请</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { OrderApi } from '@/api'
import { formatPrice } from '@/utils'
import type { RefundStatusInfo } from '@/api/types/order'

const refundInfo = ref<RefundStatusInfo>({
  order_no: '',
  order_name: '',
  order_type: 1,
  final_amount: 0,
  refund_status: 0,
  refund_amount: 0,
  refund_reason: '',
  refund_reject_reason: '',
  refund_time: null,
  refund_transfer_no: null,
  refund_audit_time: null,
  invoice_url: '',
  pay_time: null,
  created_at: ''
})

interface StatusConfig {
  cardClass: string
  icon: string
  title: string
  desc: string
}

const statusConfig = computed<StatusConfig>(() => {
  switch (refundInfo.value.refund_status) {
    case 1:
      return {
        cardClass: 'status-pending',
        icon: '🕐',
        title: '退款审核中',
        desc: '您的退款申请已提交，请耐心等待审核'
      }
    case 3:
      return {
        cardClass: 'status-success',
        icon: '💰',
        title: '退款成功',
        desc: '退款已转账，请查收'
      }
    case 4:
      return {
        cardClass: 'status-rejected',
        icon: '❌',
        title: '退款被驳回',
        desc: '您的退款申请已被驳回，请查看驳回原因'
      }
    default:
      return {
        cardClass: 'status-pending',
        icon: '📋',
        title: '退款详情',
        desc: '查看退款信息'
      }
  }
})

const loadRefundStatus = async (orderNo: string) => {
  try {
    uni.showLoading({ title: '加载中...' })
    const data = await OrderApi.getRefundStatus(orderNo)
    refundInfo.value = data
    uni.hideLoading()
  } catch (error) {
    console.error('加载退款状态失败:', error)
    uni.hideLoading()
    uni.showToast({ title: '加载失败', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
}

const goBack = () => {
  uni.navigateBack()
}

const handleReorder = () => {
  uni.switchTab({ url: '/pages/index/index' })
}

const handleReapply = () => {
  uni.redirectTo({ url: '/pages/order/refund-apply/index' })
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const orderNo = currentPage.$page?.options?.orderNo || currentPage.options?.orderNo
  if (orderNo) {
    loadRefundStatus(orderNo)
  } else {
    uni.showToast({ title: '订单号不存在', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $td-bg-color-page;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
}

.page-content {
  padding: 24rpx;
  padding-bottom: 160rpx;
}

/* 状态卡片 */
.status-card {
  border-radius: 16rpx;
  padding: 48rpx 32rpx;
  margin-bottom: 24rpx;
  text-align: center;
  color: white;

  &.status-pending {
    background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  }

  &.status-success {
    background: linear-gradient(135deg, #00C48C 0%, #00A67E 100%);
  }

  &.status-rejected {
    background: linear-gradient(135deg, #E34D59 0%, #C62828 100%);
  }
}

.status-icon {
  font-size: 72rpx;
  margin-bottom: 16rpx;
}

.status-title {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.status-desc {
  font-size: 28rpx;
  opacity: 0.9;
  line-height: 1.5;
}

/* 信息卡片 */
.order-info {
  margin-bottom: 24rpx;
  padding: 32rpx;
  background-color: $td-bg-color-container;
  border-radius: 16rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20rpx 0;

  &:not(:last-child) {
    border-bottom: 1rpx solid $td-border-level-1;
  }
}

.label {
  font-size: 28rpx;
  color: $td-text-color-secondary;
  flex-shrink: 0;
  margin-right: 24rpx;
}

.value {
  font-size: 28rpx;
  color: $td-text-color-primary;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.refund-amount {
  font-size: 36rpx;
  font-weight: 700;
  color: #00A67E;
}

.reason-text {
  max-width: 400rpx;
  line-height: 1.5;
}

/* 驳回原因卡片 */
.reject-card {
  margin-bottom: 24rpx;
  padding: 32rpx;
  background-color: #FFF2F2;
  border-radius: 16rpx;
  border: 1rpx solid rgba(227, 77, 89, 0.2);
}

.reject-header {
  margin-bottom: 16rpx;
}

.reject-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $td-error-color;
}

.reject-content {
  font-size: 28rpx;
  color: $td-text-color-primary;
  line-height: 1.6;
}

/* 底部操作栏 */
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1rpx solid $td-border-level-1;
  padding: 24rpx 24rpx calc(24rpx + env(safe-area-inset-bottom));
  z-index: 100;
}

.bottom-actions {
  display: flex;
  gap: 24rpx;
}

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

  &--theme-primary {
    background-color: $td-brand-color;

    .t-button__text {
      color: white;
      font-size: 32rpx;
      font-weight: 500;
    }
  }
}

.back-btn {
  flex: 1;
}

.action-btn {
  flex: 2;
}
</style>
