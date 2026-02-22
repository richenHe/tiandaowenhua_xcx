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
          <view class="balance-value">{{ formatAmount(meritPointsInfo.balance) }}</view>
          <view class="balance-stats">
            <view class="stat-item">
              <view class="stat-label">累计获得</view>
              <view class="stat-value">{{ formatAmount(meritPointsInfo.total_earned) }}</view>
            </view>
            <view class="stat-item">
              <view class="stat-label">累计兑换</view>
              <view class="stat-value">{{ formatAmount(meritPointsInfo.total_spent) }}</view>
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

        <!-- 记录列表 -->
        <view v-for="record in recordsList" :key="record.id" class="record-card">
          <view class="record-icon" :style="{ background: getRecordStyle(record.change_type).gradient }">
            {{ getRecordStyle(record.change_type).icon }}
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">{{ record.remark || '功德分变动' }}</view>
                <view class="record-desc" v-if="record.related_id">关联ID: {{ record.related_id }}</view>
              </view>
              <view class="record-amount" :class="record.change_amount > 0 ? 'success' : 'error'">
                {{ record.change_amount > 0 ? '+' : '' }}{{ formatAmount(record.change_amount) }}
              </view>
            </view>
            <view class="record-footer">
              <text>余额: {{ formatAmount(record.balance_after) }}</text>
              <text>{{ record.created_at }}</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="recordsList.length === 0 && !loading" class="empty-state">
          <text class="empty-icon">📝</text>
          <text class="empty-text">暂无功德分记录</text>
        </view>

        <!-- 加载更多 -->
        <view v-if="!finished && recordsList.length > 0" class="load-more">
          <button class="t-button t-button--theme-default t-button--variant-text" @tap="loadMore">
            <span class="t-button__text">{{ loading ? '加载中...' : '加载更多' }}</span>
          </button>
        </view>

        <!-- 已加载全部 -->
        <view v-if="finished && recordsList.length > 0" class="load-more">
          <text class="finished-text">已加载全部</text>
        </view>

        <!-- 底部留白 -->
        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import { UserApi } from '@/api'
import type { MeritPointsInfo, MeritPointsRecord } from '@/api/types/user'

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

// 功德分信息
const meritPointsInfo = ref<MeritPointsInfo>({
  balance: 0,
  total_earned: 0,
  total_spent: 0
})

// 功德分明细列表
const recordsList = ref<MeritPointsRecord[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

// 获取功德分余额
const loadMeritPoints = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await UserApi.getMeritPoints()
    meritPointsInfo.value = result
    uni.hideLoading()
  } catch (error) {
    console.error('获取功德分余额失败:', error)
    uni.hideLoading()
  }
}

// 获取功德分明细
const loadRecords = async (reset = false) => {
  if (loading.value || finished.value) return

  if (reset) {
    page.value = 1
    recordsList.value = []
    finished.value = false
  }

  try {
    uni.showLoading({ title: '加载中...' })
    loading.value = true
    const result = await UserApi.getMeritPointsHistory({
      page: page.value,
      pageSize: pageSize.value
    })

    recordsList.value.push(...result.list)
    total.value = result.total
    page.value++

    if (recordsList.value.length >= result.total) {
      finished.value = true
    }
    uni.hideLoading()
  } catch (error) {
    console.error('获取功德分明细失败:', error)
    uni.hideLoading()
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = () => {
  loadRecords()
}

// 监听Tab切换，重新加载数据
watch(activeTab, () => {
  loadRecords(true)
})

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  // 计算页面头部高度（状态栏 + 导航栏）
  pageHeaderHeight.value = statusBarHeight + 44

  // 加载数据
  loadMeritPoints()
  loadRecords()
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

// 格式化金额
const formatAmount = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return isNaN(num) ? '0.0' : num.toFixed(1)
}

// 获取记录图标和渐变色
const getRecordStyle = (changeType: string) => {
  const styleMap: Record<string, { icon: string; gradient: string }> = {
    'referral_course': { icon: '📚', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    'referral_advanced': { icon: '🎓', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    'tutor': { icon: '👨‍🏫', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    'volunteer': { icon: '🤝', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    'exchange': { icon: '🎁', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' }
  }
  return styleMap[changeType] || { icon: '💎', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.finished-text {
  font-size: 24rpx;
  color: #999;
}

</style>

