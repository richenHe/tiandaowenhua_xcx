<template>
  <view class="page">
    <TdPageHeader title="功德分管理" :showBack="true" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
      @scroll="handleScroll"
    >
      <view class="page-content">
        
        <!-- 功德分余额卡片 -->
        <view class="balance-card">
          <view class="balance-label">💎 功德分余额</view>
          <view class="balance-value">2,566.4</view>
          <view class="balance-stats">
            <view class="stat-item">
              <view class="stat-label">累计获得</view>
              <view class="stat-value">3,580.0</view>
            </view>
            <view class="stat-item">
              <view class="stat-label">累计兑换</view>
              <view class="stat-value">1,013.6</view>
            </view>
          </view>
        </view>

        <!-- 功德分说明 -->
        <view class="alert-box info">
          <view class="alert-icon">ℹ️</view>
          <view class="alert-content">
            <view class="alert-message">
              • 功德分无上限，持续获得<br/>
              • 可兑换课程、复训、咨询服务、商城用品<br/>
              • 青鸾大使推荐（第2次起）可获得功德分<br/>
              • 所有大使担任辅导员/义工可获得功德分
            </view>
          </view>
        </view>

        <!-- 功能按钮 -->
        <view class="action-grid">
          <view @tap="goToMall">
            <button class="t-button t-button--theme-primary t-button--variant-outline t-button--block">
              <span class="t-button__text">🎁 兑换商品/课程</span>
            </button>
          </view>
          <view @tap="goToExchangeRecords">
            <button class="t-button t-button--theme-default t-button--variant-outline t-button--block">
              <span class="t-button__text">📋 兑换记录</span>
            </button>
          </view>
        </view>

        <!-- 获得途径统计 -->
        <view class="t-section-title t-section-title--simple">📊 获得途径统计</view>
        <view class="stats-card">
          <view class="stats-grid">
            <view class="stats-item">
              <view class="stats-value primary">1,850.0</view>
              <view class="stats-label">推荐课程</view>
            </view>
            <view class="stats-item">
              <view class="stats-value success">1,730.0</view>
              <view class="stats-label">辅导员/义工</view>
            </view>
          </view>
        </view>

        <!-- Tab切换 - 吸顶 -->
        <view class="tabs-wrapper">
          <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight">
            <template #tabs>
              <CapsuleTabs
                v-model="activeTab"
                :options="tabs"
              />
            </template>
          </StickyTabs>
        </view>

        <!-- 功德分明细列表 -->
        <view class="t-section-title t-section-title--simple">💎 明细记录</view>

        <!-- 推荐奖励记录 -->
        <view class="record-card">
          <view class="record-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            📚
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">推荐初探班课程</view>
                <view class="record-desc">学员：王五</view>
              </view>
              <view class="record-amount success">+506.4</view>
            </view>
            <view class="record-footer">
              <text>订单号: 202401150001</text>
              <text>2024-01-15</text>
            </view>
          </view>
        </view>

        <!-- 推荐密训班记录 -->
        <view class="record-card">
          <view class="record-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            🎓
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">推荐密训班课程</view>
                <view class="record-desc">学员：李四</view>
              </view>
              <view class="record-amount success">+7,777.6</view>
            </view>
            <view class="record-footer">
              <text>订单号: 202401120001</text>
              <text>2024-01-12</text>
            </view>
          </view>
        </view>

        <!-- 辅导员活动记录 -->
        <view class="record-card">
          <view class="record-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
            👨‍🏫
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">担任辅导员</view>
                <view class="record-desc">初探班第11期</view>
              </view>
              <view class="record-amount success">+500.0</view>
            </view>
            <view class="record-footer">
              <text>活动地点：北京市</text>
              <text>2024-01-10</text>
            </view>
          </view>
        </view>

        <!-- 义工活动记录 -->
        <view class="record-card">
          <view class="record-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
            🤝
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">会务义工</view>
                <view class="record-desc">商学院年度总结会</view>
              </view>
              <view class="record-amount success">+300.0</view>
            </view>
            <view class="record-footer">
              <text>活动地点：北京市</text>
              <text>2024-01-08</text>
            </view>
          </view>
        </view>

        <!-- 兑换记录 -->
        <view class="record-card">
          <view class="record-icon" style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);">
            🎁
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">兑换复训费</view>
                <view class="record-desc">初探班第12期复训</view>
              </view>
              <view class="record-amount error">-500.0</view>
            </view>
            <view class="record-footer">
              <text>兑换单号: DH202401050001</text>
              <text>2024-01-05</text>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view class="load-more">
          <button class="t-button t-button--theme-default t-button--variant-text">
            <span class="t-button__text">加载更多</span>
          </button>
        </view>

        <!-- 底部留白 -->
        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'

const activeTab = ref('all')

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

// 页面头部高度
const pageHeaderHeight = ref(64)

const tabs = ref([
  { label: '全部明细', value: 'all' },
  { label: '推荐', value: 'referral' },
  { label: '活动', value: 'activity' },
  { label: '兑换', value: 'exchange' }
])

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  // 计算页面头部高度（状态栏 + 导航栏）
  pageHeaderHeight.value = statusBarHeight + 44
})

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--window-top))'
})

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}

const goToMall = () => {
  uni.switchTab({
    url: '/pages/mall/index'
  })
}

const goToExchangeRecords = () => {
  uni.navigateTo({
    url: '/pages/ambassador/exchange-records/index'
  })
}
</script>

<style scoped lang="scss">
.page {
  width: 100%;
  height: 100vh;
  background: #F5F5F5;
}

.scroll-area {
  width: 100%;
}

.page-content {
  padding: 32rpx;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 48rpx;
  color: #fff;
}

.balance-label {
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 16rpx;
}

.balance-value {
  font-size: 96rpx;
  font-weight: 700;
  margin-bottom: 32rpx;
}

.balance-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32rpx;
}

.stat-item {
  text-align: left;
}

.stat-label {
  font-size: 26rpx;
  opacity: 0.8;
  margin-bottom: 8rpx;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 600;
}

.alert-box {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 48rpx;
  display: flex;
  gap: 16rpx;
  
  &.info {
    background: #E6F4FF;
  }
}

.alert-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.stats-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32rpx;
}

.stats-item {
  text-align: center;
}

.stats-value {
  font-size: 48rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
  
  &.primary {
    color: #0052D9;
  }
  
  &.success {
    color: #00A870;
  }
}

.stats-label {
  font-size: 24rpx;
  color: #999;
}

.tabs-wrapper {
  margin-bottom: 32rpx;
}

.record-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  gap: 24rpx;
}

.record-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.record-desc {
  font-size: 24rpx;
  color: #999;
}

.record-amount {
  font-size: 36rpx;
  font-weight: 600;
  flex-shrink: 0;
  margin-left: 16rpx;
  
  &.success {
    color: #00A870;
  }
  
  &.error {
    color: #E34D59;
  }
}

.record-footer {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
}

</style>

