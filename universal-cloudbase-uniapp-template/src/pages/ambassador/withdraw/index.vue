<template>
  <view class="page">
    <td-page-header title="申请提现" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 可提现金额卡片 -->
        <view class="balance-card">
          <view class="balance-label">💰 可提现积分</view>
          <view class="balance-value">{{ formatAmount(availablePoints) }}</view>
          <view class="balance-tip">1积分 = 1元人民币</view>
        </view>

        <!-- 提现金额 -->
        <view class="t-section-title t-section-title--simple">💵 提现金额</view>
        <view class="amount-card">
          <view class="amount-input-wrapper">
            <text class="amount-symbol">¥</text>
            <input 
              class="amount-input" 
              v-model="withdrawAmount" 
              type="digit" 
              placeholder="请输入提现金额"
            />
          </view>
          <view class="amount-tips">
            <text>最低提现: ¥100</text>
            <text>手续费: 0%</text>
          </view>
          <view class="quick-amounts">
            <view 
              class="quick-amount-btn" 
              v-for="amount in quickAmounts" 
              :key="amount"
              @tap="selectQuickAmount(amount)"
            >
              {{ amount }}
            </view>
            <view class="quick-amount-btn" @tap="selectQuickAmount('all')">全部</view>
          </view>
        </view>

        <!-- 提现方式 -->
        <view class="t-section-title t-section-title--simple">💳 提现方式</view>
        <view class="method-card" @tap="selectMethod('wechat')">
          <view class="method-icon">💚</view>
          <view class="method-info">
            <view class="method-name">微信零钱</view>
            <view class="method-desc">实时到账，无手续费</view>
          </view>
          <view :class="['method-radio', { active: withdrawMethod === 'wechat' }]">
            <view class="radio-dot" v-if="withdrawMethod === 'wechat'"></view>
          </view>
        </view>

        <!-- 提现说明 -->
        <view class="alert-box info">
          <view class="alert-icon">ℹ️</view>
          <view class="alert-content">
            <view class="alert-title">提现说明</view>
            <view class="alert-message">
              • 提现金额最低100元，无上限<br/>
              • 提现到微信零钱，实时到账<br/>
              • 暂不收取手续费<br/>
              • 每日可提现1次
            </view>
          </view>
        </view>

        <!-- 提现记录 -->
        <view class="t-section-title t-section-title--simple">📋 最近提现记录</view>

        <!-- 记录列表 -->
        <view v-for="record in withdrawRecords" :key="record.id" class="record-card">
          <view class="record-header">
            <view class="record-info">
              <view class="record-title">提现到{{ record.withdraw_type === 'wechat' ? '微信' : '支付宝' }}</view>
              <view class="record-time">{{ record.created_at }}</view>
            </view>
            <view class="record-right">
              <view class="record-amount">¥{{ formatAmount(record.amount) }}</view>
              <view class="record-status" :class="getStatusClass(record.status)">
                {{ getStatusText(record.status) }}
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="withdrawRecords.length === 0" class="empty-state">
          <text class="empty-icon">📝</text>
          <text class="empty-text">暂无提现记录</text>
        </view>

        <!-- 底部留白 -->
        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="fixed-bottom">
      <view @tap="handleWithdraw">
        <button class="t-button t-button--theme-primary t-button--variant-base t-button--block t-button--size-large">
          <span class="t-button__text">💰 确认提现 {{ withdrawAmount ? '¥' + withdrawAmount : '' }}</span>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { UserApi } from '@/api'
import type { CashPointsInfo, WithdrawRecord } from '@/api/types/user'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height) - 120rpx)'
})

const withdrawAmount = ref('')
const withdrawMethod = ref('wechat')
const quickAmounts = [100, 500, 1000, 2000]

// 可提现积分
const availablePoints = ref(0)

// 提现记录列表
const withdrawRecords = ref<WithdrawRecord[]>([])

// 获取可提现积分
const loadAvailablePoints = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await UserApi.getCashPoints()
    availablePoints.value = result.available
    uni.hideLoading()
  } catch (error) {
    console.error('获取可提现积分失败:', error)
    uni.hideLoading()
  }
}

// 获取提现记录
const loadWithdrawRecords = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await UserApi.getWithdrawRecords({
      page: 1,
      pageSize: 5
    })
    withdrawRecords.value = result.list
    uni.hideLoading()
  } catch (error) {
    console.error('获取提现记录失败:', error)
    uni.hideLoading()
  }
}

onMounted(() => {
  loadAvailablePoints()
  loadWithdrawRecords()
})

onShow(() => {
  loadAvailablePoints()
  loadWithdrawRecords()
})

const selectQuickAmount = (amount: number | string) => {
  if (amount === 'all') {
    withdrawAmount.value = String(availablePoints.value)
  } else {
    withdrawAmount.value = String(amount)
  }
}

const selectMethod = (method: string) => {
  withdrawMethod.value = method
}

const handleWithdraw = async () => {
  if (!withdrawAmount.value) {
    uni.showToast({ title: '请输入提现金额', icon: 'none' })
    return
  }

  const amount = parseFloat(withdrawAmount.value)
  if (amount < 100) {
    uni.showToast({ title: '最低提现金额为100元', icon: 'none' })
    return
  }

  if (amount > availablePoints.value) {
    uni.showToast({ title: '提现金额超过可用余额', icon: 'none' })
    return
  }

  uni.showModal({
    title: '确认提现',
    content: `确认提现 ¥${withdrawAmount.value} 到微信零钱？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await UserApi.applyWithdraw({
            amount,
            withdrawType: 'wechat',
            accountInfo: {
              name: '',
              account: ''
            }
          })

          uni.showToast({
            title: '提现申请已提交',
            icon: 'success',
            duration: 2000
          })

          setTimeout(() => {
            uni.navigateBack()
          }, 2000)
        } catch (error) {
          console.error('提现申请失败:', error)
        }
      }
    }
  })
}

// 格式化金额
const formatAmount = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return isNaN(num) ? '0.0' : num.toFixed(1)
}

// 获取提现状态文本
const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待审核',
    1: '已到账',
    2: '已拒绝'
  }
  return statusMap[status] || '未知'
}

// 获取提现状态样式
const getStatusClass = (status: number) => {
  const classMap: Record<number, string> = {
    0: 'pending',
    1: 'success',
    2: 'error'
  }
  return classMap[status] || ''
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
  text-align: center;
}

.balance-label {
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 16rpx;
}

.balance-value {
  font-size: 96rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}

.balance-tip {
  font-size: 24rpx;
  opacity: 0.8;
}

.amount-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 4rpx solid #0052D9;
  padding-bottom: 16rpx;
  margin-bottom: 16rpx;
}

.amount-symbol {
  font-size: 48rpx;
  font-weight: 600;
  color: #333;
  margin-right: 16rpx;
}

.amount-input {
  flex: 1;
  font-size: 64rpx;
  font-weight: 600;
  color: #333;
}

.amount-tips {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
  margin-bottom: 24rpx;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
}

.quick-amount-btn {
  height: 72rpx;
  background: #F5F5F5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #333;
}

.method-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.method-icon {
  font-size: 64rpx;
  flex-shrink: 0;
}

.method-info {
  flex: 1;
  min-width: 0;
}

.method-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.method-desc {
  font-size: 24rpx;
  color: #999;
}

.method-radio {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #E5E5E5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.active {
    border-color: #0052D9;
  }
}

.radio-dot {
  width: 24rpx;
  height: 24rpx;
  background: #0052D9;
  border-radius: 50%;
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

.record-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.record-time {
  font-size: 24rpx;
  color: #999;
}

.record-right {
  text-align: right;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.record-amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.record-status {
  font-size: 22rpx;

  &.success {
    color: #00A870;
  }

  &.pending {
    color: #E37318;
  }

  &.error {
    color: #E34D59;
  }
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

