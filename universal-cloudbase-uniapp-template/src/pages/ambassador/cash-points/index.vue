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
                <view class="record-desc" v-if="record.related_id">关联编号: {{ record.related_id }}</view>
              </view>
              <view class="record-right">
                <view
                  class="record-amount"
                  :class="getAmountClass(record.change_type)"
                >
                  <template v-if="record.change_type === 4">已打款</template>
                  <template v-else>{{ record.change_amount > 0 ? '+' : '' }}{{ formatAmount(record.change_amount) }}</template>
                </view>
                <view class="record-status" :class="getStatusClass(record.change_type)">
                  {{ getStatusText(record.change_type) }}
                </view>
              </view>
            </view>
            <view class="record-footer">
              <text>余额: {{ formatAmount(record.balance_after) }}</text>
              <text>{{ record.created_at }}</text>
            </view>
            <!-- type=4（提现成功）记录：显示查看电子发票按钮 -->
            <view v-if="record.change_type === 4 && record.invoice_url" class="invoice-row">
              <view class="invoice-btn" @tap="viewInvoice(record.invoice_url!)">
                📄 查看电子发票
              </view>
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
import { ref, computed, onMounted } from 'vue'
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

// 所有记录（原始，不过滤）
const allRecords = ref<CashPointsRecord[]>([])
// 过滤后展示的记录
const recordsList = computed(() => {
  switch (activeTab.value) {
    case 'earn':
      // 获得：type 2（可提现积分，含解冻和直接发放两种渠道）
      return allRecords.value.filter(r => r.change_type === 2)
    case 'withdraw':
      // 提现：type 4（已打款成功）
      return allRecords.value.filter(r => r.change_type === 4)
    default:
      // 全部：所有记录（type 1/2/3/4/5/6）
      return allRecords.value
  }
})
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
    allRecords.value = []
    finished.value = false
  }

  try {
    uni.showLoading({ title: '加载中...' })
    loading.value = true
    const result = await UserApi.getCashPointsHistory({
      page: page.value,
      page_size: pageSize.value
    })

    allRecords.value.push(...result.list)
    total.value = result.total
    page.value++

    if (allRecords.value.length >= result.total) {
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

// Tab 切换仅切换过滤视图，无需重新请求（computed 自动响应）

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

// 格式化积分为整数
const formatAmount = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return isNaN(num) ? '0' : String(Math.round(num))
}

// 获取记录图标和渐变色（按 type 枚举：1=冻结/2=解冻/3=提现申请/4=退回/5=已打款）
const getRecordStyle = (changeType: number | string) => {
  const type = typeof changeType === 'string' ? changeType : String(changeType)
  const styleMap: Record<string, { icon: string; gradient: string }> = {
    '1': { icon: '🎖️', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    '2': { icon: '🔓', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    '3': { icon: '💸', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    '4': { icon: '✅', gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' }, // 提现成功
    '5': { icon: '↩️', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }, // 提现失败退回
    // 旧的字符串 key 兼容
    'upgrade': { icon: '🎖️', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
    'unfreeze': { icon: '🔓', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    'referral_advanced': { icon: '🎓', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    'referral_course': { icon: '💎', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
    'withdraw': { icon: '💸', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
  }
  return styleMap[type] || { icon: '💰', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
}

// 按 type 返回金额颜色 class
const getAmountClass = (changeType: number | string) => {
  const t = Number(changeType)
  if (t === 4) return 'transfer'   // 已打款 - 蓝色
  if (t === 1) return 'warning'    // 获得冻结 - 橙色（冻结，不可立即用）
  if (t === 5) return 'warning'    // 提现失败退回 - 橙色
  if (t === 2) return 'success'    // 解冻 - 绿色
  if (t === 3) return 'error'      // 提现申请 - 红色
  return 'success'
}

// 按 type 返回状态文字
const getStatusText = (changeType: number | string) => {
  const map: Record<number, string> = {
    1: '冻结积分',
    2: '可提现',
    3: '提现申请',
    4: '银行汇款',
    5: '已退回',
  }
  return map[Number(changeType)] || '积分变动'
}

// 按 type 返回状态 class
const getStatusClass = (changeType: number | string) => {
  const t = Number(changeType)
  if (t === 2 || t === 4) return 'available'  // 绿色（解冻/已打款）
  if (t === 5) return 'warning'               // 橙色（退回，与金额色保持一致）
  return 'frozen'                             // 灰色（冻结/提现申请）
}

// 查看电子发票
const viewInvoice = (url: string) => {
  if (url.toLowerCase().includes('.pdf')) {
    uni.showModal({
      title: '查看电子发票',
      content: '即将打开 PDF 发票',
      confirmText: '打开',
      success: (res) => {
        if (res.confirm) {
          // #ifdef MP-WEIXIN
          uni.navigateTo({ url: `/pages/webview/index?url=${encodeURIComponent(url)}` })
          // #endif
          // #ifdef H5
          window.open(url, '_blank')
          // #endif
        }
      }
    })
  } else {
    uni.previewImage({ urls: [url], current: url })
  }
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

  &.success   { color: #00A870; }
  &.warning   { color: #E37318; }
  &.error     { color: #E34D59; }
  &.transfer  { color: #0052D9; font-size: 28rpx; }
}

.record-status {
  font-size: 22rpx;
  
  &.frozen {
    color: #999;
  }
  
  &.available {
    color: #00A870;
  }

  &.warning {
    color: #E37318;
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

.invoice-row {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #F5F5F5;
}

.invoice-btn {
  display: inline-flex;
  align-items: center;
  font-size: 24rpx;
  color: #0052D9;
  background: #E6F4FF;
  border-radius: 8rpx;
  padding: 10rpx 24rpx;
  gap: 8rpx;
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

