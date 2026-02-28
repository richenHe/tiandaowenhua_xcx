<template>
  <view class="page">
    <td-page-header title="申请提现" />

    <scroll-view
      class="scroll-area"
      scroll-y
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">

        <!-- 可提现积分卡片 -->
        <view class="balance-card">
          <view class="balance-label">💰 可提现积分</view>
          <view class="balance-value">{{ formatAmount(availablePoints) }}</view>
          <view class="balance-tip">1积分 = 1元人民币 · 银行汇款到账</view>
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
            <text>0手续费</text>
          </view>
          <view class="quick-amounts">
            <view
              class="quick-amount-btn"
              v-for="amt in quickAmounts"
              :key="amt"
              @tap="selectQuickAmount(amt)"
            >
              {{ amt }}
            </view>
            <view class="quick-amount-btn" @tap="selectQuickAmount('all')">全部</view>
          </view>
        </view>

        <!-- 收款银行账户 -->
        <view class="t-section-title t-section-title--simple">🏦 收款银行账户</view>
        <view class="bank-form-card">
          <view class="form-field">
            <text class="field-label">收款人姓名</text>
            <input
              class="field-input"
              v-model="bankAccountName"
              placeholder="请输入银行卡持有人姓名"
              maxlength="30"
            />
          </view>
          <view class="form-divider"></view>
          <view class="form-field">
            <text class="field-label">开户行</text>
            <input
              class="field-input"
              v-model="bankName"
              placeholder="如：中国工商银行北京分行"
              maxlength="60"
            />
          </view>
          <view class="form-divider"></view>
          <view class="form-field">
            <text class="field-label">银行卡号</text>
            <input
              class="field-input"
              v-model="bankAccountNumber"
              placeholder="请输入银行卡号"
              type="number"
              maxlength="25"
            />
          </view>
          <view class="form-divider"></view>
          <!-- 保存收款信息选项 -->
          <view class="save-row" @tap="saveAccountInfo = !saveAccountInfo">
            <view :class="['checkbox', { checked: saveAccountInfo }]">
              <text v-if="saveAccountInfo" class="check-icon">✓</text>
            </view>
            <text class="save-label">保存收款信息，下次提现免填</text>
          </view>
        </view>

        <!-- 提现说明 -->
        <view class="alert-box info">
          <view class="alert-icon">ℹ️</view>
          <view class="alert-content">
            <view class="alert-title">提现说明</view>
            <view class="alert-message">
              • 提现方式：银行汇款（公司对私转账）<br/>
              • 最低提现金额 ¥100，无上限，0手续费<br/>
              • 提交后由财务审核，打款完成后上传电子发票<br/>
              • 打款后可在提现记录中查看电子发票
            </view>
          </view>
        </view>

        <!-- 最近提现记录 -->
        <view class="t-section-title t-section-title--simple">📋 最近提现记录</view>

        <view v-for="record in withdrawRecords" :key="record.id" class="record-card">
          <view class="record-header">
            <view class="record-info">
              <view class="record-title">银行汇款</view>
              <view class="record-time">{{ record.apply_time || record.created_at }}</view>
              <view v-if="record.bank_name" class="record-bank">{{ record.bank_name }}</view>
            </view>
            <view class="record-right">
              <view class="record-amount">¥{{ formatAmount(record.amount) }}</view>
              <view class="record-status" :class="getStatusClass(record.status)">
                {{ getStatusText(record.status) }}
              </view>
            </view>
          </view>
          <!-- 已转账且有发票：展示查看按钮 -->
          <view v-if="record.status === 2 && record.invoice_url" class="invoice-row">
            <view class="invoice-btn" @tap="viewInvoice(record.invoice_url!)">
              📄 查看电子发票
            </view>
          </view>
        </view>

        <view v-if="withdrawRecords.length === 0 && !recordsLoading" class="empty-state">
          <text class="empty-icon">📝</text>
          <text class="empty-text">暂无提现记录</text>
        </view>

        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="fixed-bottom">
      <view @tap="handleWithdraw">
        <button
          class="t-button t-button--theme-primary t-button--variant-base t-button--block t-button--size-large"
          :disabled="submitting"
        >
          <span class="t-button__text">
            {{ submitting ? '提交中...' : `💰 确认申请${withdrawAmount ? ' ¥' + withdrawAmount : ''}` }}
          </span>
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
import type { WithdrawRecord } from '@/api/types/user'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height) - 120rpx)'
})

// 提现金额
const withdrawAmount = ref('')
const quickAmounts = [100, 500, 1000, 2000]
const submitting = ref(false)
const recordsLoading = ref(false)

// 可提现积分
const availablePoints = ref(0)

// 银行账户信息
const bankAccountName = ref('')
const bankName = ref('')
const bankAccountNumber = ref('')
const saveAccountInfo = ref(false)

// 提现记录
const withdrawRecords = ref<WithdrawRecord[]>([])

// 从个人资料预填银行账户信息
const loadProfile = async () => {
  try {
    const profile = await UserApi.getProfile()
    if (profile) {
      if (profile.bank_account_name) bankAccountName.value = profile.bank_account_name
      if (profile.bank_name) bankName.value = profile.bank_name
      if (profile.bank_account_number) bankAccountNumber.value = profile.bank_account_number
    }
  } catch (err) {
    console.error('[withdraw] 加载资料失败:', err)
  }
}

// 获取可提现积分
const loadAvailablePoints = async () => {
  try {
    const result = await UserApi.getCashPoints()
    availablePoints.value = result.available
  } catch (error) {
    console.error('[withdraw] 获取可提现积分失败:', error)
  }
}

// 获取提现记录
const loadWithdrawRecords = async () => {
  recordsLoading.value = true
  try {
    const result = await UserApi.getWithdrawRecords({ page: 1, pageSize: 5 })
    withdrawRecords.value = result.list
  } catch (error) {
    console.error('[withdraw] 获取提现记录失败:', error)
  } finally {
    recordsLoading.value = false
  }
}

onMounted(async () => {
  uni.showLoading({ title: '加载中...' })
  await Promise.all([loadAvailablePoints(), loadProfile(), loadWithdrawRecords()])
  uni.hideLoading()
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

const handleWithdraw = async () => {
  if (!withdrawAmount.value) {
    uni.showToast({ title: '请输入提现金额', icon: 'none' })
    return
  }
  if (!bankAccountName.value.trim()) {
    uni.showToast({ title: '请填写收款人姓名', icon: 'none' })
    return
  }
  if (!bankName.value.trim()) {
    uni.showToast({ title: '请填写开户行', icon: 'none' })
    return
  }
  if (!bankAccountNumber.value.trim() || bankAccountNumber.value.replace(/\s/g, '').length < 10) {
    uni.showToast({ title: '请填写正确的银行卡号', icon: 'none' })
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

  const cardMask = bankAccountNumber.value.replace(/\s/g, '').replace(/^(\d{4})\d+(\d{4})$/, '$1****$2')

  uni.showModal({
    title: '确认提现申请',
    content: `提现 ¥${withdrawAmount.value}\n收款：${bankAccountName.value}\n卡号：${cardMask}\n\n提交后由财务审核处理`,
    confirmText: '确认提交',
    success: async (res) => {
      if (res.confirm) {
        submitting.value = true
        try {
          await UserApi.applyWithdraw({
            amount,
            bankAccountName: bankAccountName.value.trim(),
            bankName: bankName.value.trim(),
            bankAccountNumber: bankAccountNumber.value.replace(/\s/g, ''),
            saveAccountInfo: saveAccountInfo.value
          })

          uni.showToast({ title: '提现申请已提交', icon: 'success', duration: 2000 })
          withdrawAmount.value = ''

          setTimeout(() => {
            loadAvailablePoints()
            loadWithdrawRecords()
          }, 500)
        } catch (error: any) {
          uni.showToast({ title: error?.message || '提交失败，请重试', icon: 'none', duration: 3000 })
        } finally {
          submitting.value = false
        }
      }
    }
  })
}

// 查看电子发票
const viewInvoice = (url: string) => {
  // PDF 打开下载，图片直接预览
  if (url.toLowerCase().includes('.pdf')) {
    uni.showModal({
      title: '查看电子发票',
      content: '即将在浏览器中打开 PDF 发票',
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

// 积分/金额格式化为整数
const formatAmount = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return isNaN(num) ? '0' : String(Math.round(num))
}

// 状态文本（与 withdrawals.status 对应：0待审核/1审核通过待转账/2已转账/3已拒绝）
const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待审核',
    1: '审核通过',
    2: '已打款',
    3: '已驳回'
  }
  return map[status] ?? '未知'
}

// 状态样式
const getStatusClass = (status: number) => {
  const map: Record<number, string> = {
    0: 'pending',
    1: 'approved',
    2: 'success',
    3: 'error'
  }
  return map[status] ?? ''
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

/* 银行账户表单 */
.bank-form-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 0 32rpx;
  margin-bottom: 48rpx;
}

.form-field {
  display: flex;
  align-items: center;
  padding: 32rpx 0;
  gap: 24rpx;
}

.field-label {
  font-size: 28rpx;
  color: #333;
  white-space: nowrap;
  min-width: 160rpx;
}

.field-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  text-align: right;
}

.form-divider {
  height: 1rpx;
  background: #F5F5F5;
}

.save-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 28rpx 0;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #DCDCDC;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.checked {
    background: #0052D9;
    border-color: #0052D9;
  }
}

.check-icon {
  font-size: 24rpx;
  color: #fff;
  font-weight: 700;
}

.save-label {
  font-size: 26rpx;
  color: #666;
}

/* 提示框 */
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
  line-height: 1.7;
}

/* 提现记录 */
.record-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.record-bank {
  font-size: 22rpx;
  color: #aaa;
  margin-top: 4rpx;
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

  &.success  { color: #00A870; }
  &.approved { color: #0052D9; }
  &.pending  { color: #E37318; }
  &.error    { color: #E34D59; }
}

/* 查看发票按钮 */
.invoice-row {
  margin-top: 20rpx;
  padding-top: 20rpx;
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
