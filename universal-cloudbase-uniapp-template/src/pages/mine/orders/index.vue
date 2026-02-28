<template>
  <view class="page-container">
    <TdPageHeader title="我的订单" :showBack="true" />

    <scroll-view
      class="scroll-content"
      scroll-y
      @scroll="handleScroll"
    >
      <view class="page-content">
        <!-- 筛选标签 -->
        <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight" :margin-bottom="32">
          <template #tabs>
            <CapsuleTabs
              v-model="activeTab"
              :options="tabOptions"
              @change="handleTabChange"
            />
          </template>
        </StickyTabs>

        <!-- 订单列表 -->
        <view class="order-list">
          <view 
            v-for="order in filteredOrders" 
            :key="order.id"
            class="t-card"
            @click="goToOrderDetail(order.id, order.orderStatus)"
          >
            <view class="t-card__body">
              <view class="order-content">
                <view class="order-icon" :style="{ background: order.iconBg }">
                  <text>{{ order.icon }}</text>
                </view>
                <view class="order-info">
                  <view class="order-title">{{ order.title }}</view>
                  <view class="order-time">{{ order.time }}</view>
                  <view class="order-footer">
                    <text class="order-price">¥{{ formatPrice(order.price) }}</text>
                    <view class="t-badge" :class="`t-badge--${order.statusType}`">
                      {{ order.status }}
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="filteredOrders.length === 0" class="empty-state">
          <text class="empty-icon">📦</text>
          <text class="empty-text">暂无订单</text>
        </view>
      </view>

      <!-- 底部留白 -->
      <view class="bottom-spacing"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { UserApi } from '@/api'
import { formatPrice } from '@/utils'

// 页面头部高度
const pageHeaderHeight = ref(64)

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}

// Tab 标签（value=-1表示全部；其余值与数据库 orders.pay_status 一致：0待支付/1已支付/2已取消/3已关闭/4已退款）
const activeTab = ref(-1)
const tabOptions = [
  { label: '全部', value: -1 },
  { label: '待支付', value: 0 },
  { label: '已支付', value: 1 },
  { label: '已取消', value: 2 },
  { label: '已退款', value: 4 }
]

// 订单数据
const orders = ref<any[]>([])

// 课程图标和渐变色映射
const courseStyles: Record<number, { icon: string; iconBg: string }> = {
  1: { icon: '📚', iconBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }, // 初探班
  2: { icon: '🎓', iconBg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }, // 密训班
  3: { icon: '💬', iconBg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }  // 咨询服务
}

// 订单状态映射（与数据库 orders.pay_status 一致：0待支付/1已支付/2已取消/3已关闭/4已退款）
const statusMap: Record<number, { text: string; type: string; orderStatus: string }> = {
  0: { text: '待支付', type: 'warning', orderStatus: 'pending' },
  1: { text: '已支付', type: 'success', orderStatus: 'completed' },
  2: { text: '已取消', type: 'default', orderStatus: 'cancelled' },
  3: { text: '已关闭', type: 'default', orderStatus: 'closed' },
  4: { text: '已退款', type: 'danger', orderStatus: 'refunded' }
}

// 加载订单列表
const loadOrders = async (tabValue?: number) => {
  try {
    uni.showLoading({ title: '加载中...' })
    // tabValue=-1表示全部，否则直接传入数据库 pay_status 值
    const params: any = { page: 1, pageSize: 100 }
    if (tabValue !== undefined && tabValue >= 0) {
      params.status = tabValue
    }

    const result = await UserApi.getMyOrders(params)

    orders.value = result.list.map((item: any) => {
      const style = courseStyles[item.order_type] || courseStyles[1]
      const statusInfo = statusMap[item.pay_status] || statusMap[0]

      const orderData = {
        id: item.order_no,
        title: item.order_name,
        time: item.created_at,
        price: item.final_amount,
        status: statusInfo.text,
        statusType: statusInfo.type,
        icon: style.icon,
        iconBg: style.iconBg,
        orderStatus: statusInfo.orderStatus,
        payStatus: item.pay_status
      }
      
      console.log('🔍 [订单映射] 订单号:', item.order_no, 
                  '| pay_status:', item.pay_status, 
                  '| 显示状态:', statusInfo.text,
                  '| orderStatus:', orderData.orderStatus)
      
      return orderData
    })
    uni.hideLoading()
  } catch (error) {
    console.error('加载订单列表失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  }
}

// 过滤订单（activeTab 直接对应数据库 pay_status，-1 表示全部）
const filteredOrders = computed(() => {
  if (activeTab.value === -1) {
    return orders.value
  }
  return orders.value.filter(order => order.payStatus === activeTab.value)
})

// 切换 Tab
const handleTabChange = (value: number) => {
  activeTab.value = value
  loadOrders(value)
}

// 跳转到订单详情
const goToOrderDetail = (orderNo: string, orderStatus: string) => {
  console.log('🚀 [订单跳转] 订单号:', orderNo, '| orderStatus:', orderStatus)
  
  // 待支付订单跳转到待支付页面
  if (orderStatus === 'pending') {
    console.log('✅ 跳转到待支付页面')
    uni.navigateTo({
      url: `/pages/order/pending/index?orderNo=${orderNo}`
    })
  } else if (orderStatus === 'cancelled' || orderStatus === 'closed') {
    // 已取消/已超时/已关闭订单跳转到已取消页面
    console.log('✅ 跳转到已取消页面')
    uni.navigateTo({
      url: `/pages/order/cancelled/index?orderNo=${orderNo}`
    })
  } else if (orderStatus === 'refunded') {
    // 已退款订单跳转到退款详情页面
    console.log('✅ 跳转到退款详情页面')
    uni.navigateTo({
      url: `/pages/order/refunded/index?orderNo=${orderNo}`
    })
  } else {
    // 其他状态订单（已完成）跳转到订单详情页面
    console.log('✅ 跳转到订单详情页面（已完成）| orderStatus:', orderStatus)
    uni.navigateTo({
      url: `/pages/order/detail/index?orderNo=${orderNo}`
    })
  }
}

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight

  // 加载订单列表
  loadOrders()
})

// 每次页面显示时重新加载订单（确保超时订单状态更新）
onShow(() => {
  console.log('[Orders] 页面显示，重新加载订单列表');
  loadOrders(activeTab.value);
})

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

// 滚动内容
.scroll-content {
  height: calc(100vh - var(--td-page-header-height));
}

.page-content {
  padding: 32rpx;
  padding-bottom: 0;
}

// 标签切换容器
.tabs-wrapper {
  margin-bottom: 32rpx;
}

// 订单列表
.order-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

// 卡片样式
.t-card {
  background-color: #FFFFFF;
  border-radius: $td-radius-default;
  border: 1px solid $td-border-level-1;
  overflow: hidden;
  transition: all 0.3s;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

.t-card__body {
  padding: 24rpx;
}

// 订单内容
.order-content {
  display: flex;
  gap: 24rpx;
}

.order-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: $td-radius-default;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  flex-shrink: 0;
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.order-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 8rpx;
}

.order-time {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  margin-bottom: 16rpx;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-price {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-warning-color;
}

// 徽章样式
.t-badge {
  font-size: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.t-badge--success {
  background-color: $td-success-color-light;
  color: $td-success-color;
}

.t-badge--default {
  background-color: $td-bg-color-page;
  color: $td-text-color-placeholder;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 128rpx;
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: $td-text-color-placeholder;
}

// 底部留白
.bottom-spacing {
  height: 120rpx;
}
</style>

