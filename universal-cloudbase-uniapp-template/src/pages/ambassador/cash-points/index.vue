<template>
  <view class="page">
    <td-page-header title="积分管理" />
    
    <scroll-view
      class="scroll-area"
      scroll-y
      :style="{ height: scrollHeight }"
      @scroll="handleScroll"
    >
      <view class="page-content">

        <!-- 积分余额卡片 -->
        <view class="balance-card">
          <view class="balance-label">💰 总积分余额</view>
          <view class="balance-value">{{ formatAmount(cashPointsInfo.available + cashPointsInfo.frozen) }}</view>
          <view class="balance-stats">
            <view class="stat-item">
              <view class="stat-label">冻结积分</view>
              <view class="stat-value">{{ formatAmount(cashPointsInfo.frozen) }}</view>
            </view>
            <view class="stat-item">
              <view class="stat-label">可提现积分</view>
              <view class="stat-value">{{ formatAmount(cashPointsInfo.available) }}</view>
            </view>
          </view>
        </view>

        <!-- 积分机制说明 -->
        <view class="alert-box warning">
          <view class="alert-icon">⚠️</view>
          <view class="alert-content">
            <view class="alert-title">积分解冻机制</view>
            <view class="alert-message">
              <text style="font-weight: 500;">鸿鹄大使：</text>升级时获得16880冻结积分<br/>
              <text style="font-weight: 500;">解冻方式：</text>推荐初探班解冻1688积分<br/>
              <text style="font-weight: 500;">直接发放：</text>推荐密训班/咨询直接加可提现积分<br/>
              <text style="font-weight: 500;">解冻完毕后：</text>按比例持续获得可提现积分
            </view>
          </view>
        </view>

        <!-- 积分统计卡片 -->
        <view class="stats-grid">
          <view class="stats-card">
            <view class="stats-value success">{{ formatAmount(cashPointsInfo.total_earned) }}</view>
            <view class="stats-label">累计获得</view>
          </view>
          <view class="stats-card">
            <view class="stats-value error">{{ formatAmount(cashPointsInfo.total_spent) }}</view>
            <view class="stats-label">累计提现</view>
          </view>
        </view>

        <!-- 提现按钮 -->
        <view @tap="goToWithdraw" style="margin-bottom: 48rpx;">
          <button class="t-button t-button--theme-warning t-button--variant-base t-button--block t-button--size-large">
            <span class="t-button__text">💸 申请提现（可提现: ¥{{ formatAmount(cashPointsInfo.available) }}）</span>
          </button>
        </view>

        <!-- Tab切换 -->
        <view class="tabs-wrapper">
          <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight" :margin-bottom="32">
            <template #tabs>
              <CapsuleTabs
                v-model="activeTab"
                :options="tabs"
                @change="onTabChange"
              />
            </template>
          </StickyTabs>
        </view>

        <!-- 积分明细列表 -->
        <view class="t-section-title t-section-title--simple">💰 明细记录</view>

        <!-- 记录列表 -->
        <view v-for="record in recordsList" :key="record.id" class="record-card">
          <view class="record-icon" :style="{ background: getRecordStyle(record.change_type).gradient }">
            {{ getRecordStyle(record.change_type).icon }}
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">{{ record.remark || '积分变动' }}</view>
                <view class="record-desc" v-if="record.related_id">关联ID: {{ record.related_id }}</view>
              </view>
              <view class="record-right">
                <view class="record-amount" :class="record.change_amount > 0 ? 'success' : 'error'">
                  {{ record.change_amount > 0 ? '+' : '' }}{{ formatAmount(record.change_amount) }}
                </view>
                <view class="record-status" :class="record.change_amount > 0 ? 'available' : 'frozen'">
                  {{ record.change_amount > 0 ? '可提现' : '已提现' }}
                </view>
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
          <text class="empty-text">暂无积分记录</text>
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
        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部提现按钮 -->
    <view class="fixed-bottom">
      <view @tap="goToWithdraw">
        <button class="t-button t-button--theme-primary t-button--variant-base t-button--block t-button--size-large">
          <span class="t-button__text">💰 申请提现</span>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import { UserApi } from '@/api'
import type { CashPointsInfo, CashPointsRecord } from '@/api/types/user'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--window-top) - 120rpx)'
})

// 页面头部高度
const pageHeaderHeight = ref(64)

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

// 积分信息
const cashPointsInfo = ref<CashPointsInfo>({
  available: 0,
  frozen: 0,
  withdrawing: 0,
  total_earned: 0,
  total_spent: 0
})

// 积分明细列表
const recordsList = ref<CashPointsRecord[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

// 获取积分余额
const loadCashPoints = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await UserApi.getCashPoints()
    cashPointsInfo.value = result
    uni.hideLoading()
  } catch (error) {
    console.error('获取积分余额失败:', error)
    uni.hideLoading()
  }
}

// 获取积分明细
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
    const result = await UserApi.getCashPointsHistory({
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
    console.error('获取积分明细失败:', error)
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
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight

  // 加载数据
  loadCashPoints()
  loadRecords()
})

onShow(() => {
  loadCashPoints()
  loadRecords()
})

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}

const tabs = ref([
  { label: '全部', value: 'all' },
  { label: '获得', value: 'earn' },
  { label: '解冻', value: 'unfreeze' },
  { label: '提现', value: 'withdraw' }
])

const activeTab = ref('all')

const onTabChange = (value: string | number) => {
  activeTab.value = value as string
}

const goToWithdraw = () => {
  uni.navigateTo({
    url: '/pages/ambassador/withdraw/index'
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
    'upgrade': { icon: '🎖️', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    'unfreeze': { icon: '🔓', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    'referral_advanced': { icon: '🎓', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    'referral_course': { icon: '💎', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    'withdraw': { icon: '💸', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
  }
  return styleMap[changeType] || { icon: '💰', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
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
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
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
  
  &.warning {
    background: #FFF4E5;
  }
}

.alert-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.alert-message {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.stats-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 24rpx;
  text-align: center;
}

.stats-value {
  font-size: 48rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
  
  &.success {
    color: #00A870;
  }
  
  &.error {
    color: #E34D59;
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

.record-right {
  text-align: right;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.record-amount {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
  
  &.success {
    color: #00A870;
  }
  
  &.warning {
    color: #E37318;
  }
  
  &.error {
    color: #E34D59;
  }
}

.record-status {
  font-size: 22rpx;
  
  &.frozen {
    color: #999;
  }
  
  &.available {
    color: #00A870;
  }
}

.record-badge {
  padding: 4rpx 16rpx;
  border-radius: 24rpx;
  font-size: 20rpx;
  display: inline-block;
  
  &.success {
    background: #E8F8F2;
    color: #00A870;
  }
}

.record-footer {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: #999;
}

.record-tip {
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  
  &.success {
    background: #E8F8F2;
  }
}

.tip-icon {
  font-size: 24rpx;
  color: #00A870;
  flex-shrink: 0;
}

.tip-text {
  font-size: 22rpx;
  color: #00A870;
  flex: 1;
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

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

</style>

