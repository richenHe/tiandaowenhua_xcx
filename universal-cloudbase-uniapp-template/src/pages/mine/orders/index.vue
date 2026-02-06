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
            @click="goToOrderDetail(order.id)"
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
                    <text class="order-price">¥{{ order.price }}</text>
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
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

// 页面头部高度
const pageHeaderHeight = ref(64)

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight
})

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}

// Tab 标签
const tabs = ['全部', '已完成', '已取消']
const activeTab = ref(0)
const tabOptions = [
  { label: '全部', value: 0 },
  { label: '已完成', value: 1 },
  { label: '已取消', value: 2 }
]

// Mock 订单数据
const orders = ref([
  {
    id: 1,
    title: '初探班',
    time: '2024-01-01 10:30',
    price: '1688',
    status: '已支付',
    statusType: 'success',
    icon: '📚',
    iconBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    orderStatus: 'completed'
  },
  {
    id: 2,
    title: '密训班',
    time: '2023-12-15 14:20',
    price: '38888',
    status: '已支付',
    statusType: 'success',
    icon: '🎓',
    iconBg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    orderStatus: 'completed'
  },
  {
    id: 3,
    title: '深研班',
    time: '2023-11-20 09:15',
    price: '8888',
    status: '已取消',
    statusType: 'default',
    icon: '📖',
    iconBg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    orderStatus: 'cancelled'
  }
])

// 过滤订单
const filteredOrders = computed(() => {
  if (activeTab.value === 0) {
    return orders.value
  } else if (activeTab.value === 1) {
    return orders.value.filter(order => order.orderStatus === 'completed')
  } else if (activeTab.value === 2) {
    return orders.value.filter(order => order.orderStatus === 'cancelled')
  }
  return orders.value
})

// 切换 Tab
const handleTabChange = (value: number) => {
  activeTab.value = value
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 跳转到订单详情
const goToOrderDetail = (orderId: number) => {
  uni.navigateTo({
    url: `/pages/order/detail/index?id=${orderId}`
  })
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

