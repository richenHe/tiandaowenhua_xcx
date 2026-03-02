<template>
  <view class="page-container">
    <TdPageHeader title="订单详情" :showBack="true" />
    
    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 订单状态卡片 -->
        <view :class="['status-card', statusClass]">
          <view class="status-icon"><icon type="cancel" size="48" color="#666"/></view>
          <view class="status-title">{{ statusTitle }}</view>
          <view class="status-desc">{{ statusDesc }}</view>
          <view v-if="orderInfo.cancelTime" class="cancel-time">
            {{ cancelTimeText }}
          </view>
        </view>

        <!-- 订单信息 -->
        <view class="t-card order-info">
          <view class="info-row">
            <text class="label">订单编号</text>
            <text class="value">{{ orderInfo.orderNo }}</text>
          </view>
          <view class="info-row">
            <text class="label">下单时间</text>
            <text class="value">{{ orderInfo.createTime }}</text>
          </view>
          <view v-if="orderInfo.cancelTime" class="info-row">
            <text class="label">{{ cancelLabel }}</text>
            <text class="value">{{ orderInfo.cancelTime }}</text>
          </view>
        </view>

        <!-- 课程信息 -->
        <view class="t-card course-info">
          <view class="course-header">
            <view :class="['course-icon', orderInfo.iconBg]">
              <text>{{ orderInfo.icon }}</text>
            </view>
            <view class="course-details">
              <view class="course-name">{{ orderInfo.courseName }}</view>
              <view class="course-price">
                <text class="price">¥{{ formatPrice(orderInfo.price) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 推荐人信息 -->
        <view v-if="orderInfo.refereeName" class="t-card referee-info">
          <view class="info-row">
            <text class="label">推荐人</text>
            <text class="value">{{ orderInfo.refereeName }}</text>
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
          <text class="t-button__text">返回订单列表</text>
        </button>
        <button 
          class="t-button t-button--theme-light t-button--size-large reorder-btn" 
          @click="handleReorder"
        >
          <text class="t-button__text">重新下单</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { OrderApi } from '@/api'
import { formatPrice } from '@/utils'

interface OrderInfo {
  orderNo: string
  courseName: string
  price: string
  createTime: string
  cancelTime: string
  refereeName: string
  icon: string
  iconBg: string
  payStatus: number
  orderType: number
  itemId: number
}

const orderInfo = ref<OrderInfo>({
  orderNo: '',
  courseName: '',
  price: '0.00',
  createTime: '',
  cancelTime: '',
  refereeName: '',
  icon: '📚',
  iconBg: 'bg-blue',
  payStatus: 2,
  orderType: 1,
  itemId: 0
})

// 课程图标样式配置
const courseStyles: Record<number, { icon: string; iconBg: string }> = {
  1: { icon: '📚', iconBg: 'bg-blue' },
  2: { icon: '🎓', iconBg: 'bg-purple' },
  3: { icon: '💼', iconBg: 'bg-orange' }
}

// 计算状态信息 - 统一显示"已取消"
const statusClass = computed(() => {
  return 'status-card--cancelled'
})

const statusIcon = computed(() => {
  return '❌'
})

const statusTitle = computed(() => {
  return '订单已取消'
})

const statusDesc = computed(() => {
  // 根据 payStatus 区分取消原因
  return orderInfo.value.payStatus === 3 
    ? '订单超过15分钟未支付，已自动取消' 
    : '订单已取消，如需购买请重新下单'
})

const cancelLabel = computed(() => {
  return '取消时间'
})

const cancelTimeText = computed(() => {
  return `取消于 ${orderInfo.value.cancelTime}`
})

// 加载订单详情
const loadOrderDetail = async (orderNo: string) => {
  try {
    uni.showLoading({ title: '加载中...' })
    
    const order = await OrderApi.getDetail(orderNo)
    
    // ⚠️ 移除状态检测和跳转逻辑，避免并发更新导致的闪退
    // 用户既然进入了这个页面，说明订单已经是取消状态
    // 不应该再根据 API 返回的状态进行跳转
    // 理由：订单列表可能先在内存中更新状态，但数据库更新有延迟
    // 导致详情接口返回旧状态，引发错误跳转
    
    const style = courseStyles[order.order_type] || courseStyles[1]
    
    orderInfo.value = {
      orderNo: order.order_no,
      courseName: order.order_name,
      price: String(order.final_amount || '0.00'),
      createTime: order.created_at,
      cancelTime: (order as any).updated_at || order.created_at,
      refereeName: order.referee_name || '',
      icon: style.icon,
      iconBg: style.iconBg,
      // ⚠️ 强制使用已取消状态（2或3），避免显示错误状态
      payStatus: order.pay_status === 0 ? 3 : order.pay_status,
      orderType: order.order_type,
      itemId: order.course_id || (order as any).related_id || 0
    }
    
    uni.hideLoading()
  } catch (error) {
    console.error('加载订单详情失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
}

// 返回订单列表
const goBack = () => {
  uni.navigateBack()
}

// 重新下单
const handleReorder = () => {
  if (orderInfo.value.orderType === 1) {
    // 课程订单 -> 跳转到课程详情
    if (orderInfo.value.itemId > 0) {
      uni.navigateTo({
        url: `/pages/course/detail/index?id=${orderInfo.value.itemId}`
      })
    } else {
      // 课程ID无效，返回首页重新选课
      uni.showToast({ title: '请重新选择课程', icon: 'none' })
      setTimeout(() => {
        uni.switchTab({ url: '/pages/index/index' })
      }, 1000)
    }
  } else if (orderInfo.value.orderType === 2) {
    // 复训订单 -> 跳转到复训列表
    uni.navigateTo({
      url: '/pages/course/retrain/index'
    })
  } else if (orderInfo.value.orderType === 3) {
    // 咨询订单 -> 跳转到咨询服务
    uni.navigateTo({
      url: '/pages/service/index'
    })
  }
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const orderNo = currentPage.$page?.options?.orderNo || currentPage.options?.orderNo
  
  if (orderNo) {
    loadOrderDetail(orderNo)
  } else {
    uni.showToast({
      title: '订单号不存在',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

onShow(() => {
  if (orderInfo.value.orderNo) {
    loadOrderDetail(orderInfo.value.orderNo)
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
  padding-bottom: 140rpx;
}

/* 状态卡片 */
.status-card {
  background: linear-gradient(135deg, $td-error-color 0%, #C43943 100%);
  border-radius: 16rpx;
  padding: 48rpx 32rpx;
  margin-bottom: 24rpx;
  text-align: center;
  color: white;
  
  &--timeout {
    background: linear-gradient(135deg, $td-warning-color 0%, #C4982A 100%);
  }
  
  &--cancelled {
    background: linear-gradient(135deg, #E8E8E8 0%, #D5D5D5 100%);
    color: $td-text-color-primary;
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

.cancel-time {
  font-size: 24rpx;
  opacity: 0.8;
  margin-top: 16rpx;
}

/* 订单信息 */
.order-info,
.referee-info {
  margin-bottom: 24rpx;
  padding: 32rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  
  &:not(:last-child) {
    border-bottom: 1rpx solid $td-border-level-1;
  }
}

.label {
  font-size: 28rpx;
  color: $td-text-color-secondary;
}

.value {
  font-size: 28rpx;
  color: $td-text-color-primary;
  font-weight: 500;
}

/* 课程信息 */
.course-info {
  margin-bottom: 24rpx;
  padding: 32rpx;
}

.course-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.course-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  flex-shrink: 0;
  
  &.bg-blue {
    background: linear-gradient(135deg, $td-brand-color-light 0%, $td-brand-color 100%);
  }
  
  &.bg-purple {
    background: linear-gradient(135deg, #9C27B0 0%, #673AB7 100%);
  }
  
  &.bg-orange {
    background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  }
}

.course-details {
  flex: 1;
  min-width: 0;
}

.course-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 12rpx;
}

.course-price {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.price {
  font-size: 40rpx;
  font-weight: 700;
  color: $td-error-color;
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

.back-btn {
  flex: 1;
}

.reorder-btn {
  flex: 2;
}
</style>


