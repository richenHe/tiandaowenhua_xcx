<template>
  <view class="page-container">
    <TdPageHeader title="申请退款" :showBack="true" />

    <!-- Tabs 栏 -->
    <view class="tabs-wrapper">
      <CapsuleTabs
        v-model="activeTab"
        :options="tabOptions"
        @change="onTabChange"
      />
    </view>

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 提示信息（仅在未退款 tab 显示） -->
        <view v-if="activeTab === 'pending'" class="tip-bar">
          <view class="tip-icon"><icon type="warn" size="16" color="#E6A23C"/></view>
          <text class="tip-text">请选择要退款的课程，已签署学习合同的课程无法退款</text>
        </view>

        <!-- 加载中 -->
        <view v-if="loading" class="loading-wrapper">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-else-if="filteredList.length === 0" class="empty-wrapper">
          <view class="empty-icon"><icon type="info" size="60" color="#ccc"/></view>
          <text class="empty-text">{{ activeTab === 'pending' ? '暂无可退款的订单' : '暂无已退款订单' }}</text>
          <text class="empty-desc">{{ activeTab === 'pending' ? '已支付且未退款的课程订单才可申请退款' : '退款成功的订单会显示在这里' }}</text>
        </view>

        <!-- === 未退款列表 === -->
        <view v-else-if="activeTab === 'pending'" class="course-list">
          <view
            v-for="item in filteredList"
            :key="item.order_no"
            :class="['course-card', {
              'selected': selectedOrderNo === item.order_no,
              'disabled': !canSelectItem(item)
            }]"
            @click="handleCardClick(item)"
          >
            <view class="card-left">
              <image
                v-if="item.cover_image"
                :src="item.cover_image"
                class="course-cover"
                mode="aspectFill"
              />
              <view v-else :class="['course-icon', getIconBg(item.order_type)]">
                <text>{{ getIcon(item.order_type) }}</text>
              </view>
            </view>
            <view class="card-body">
              <view class="card-title">{{ item.order_name }}</view>
              <view class="card-meta">
                <text class="card-amount">¥{{ formatPrice(item.final_amount) }}</text>
                <text class="card-time">{{ item.pay_time || item.created_at }}</text>
              </view>
              <!-- 退款状态标签 -->
              <view v-if="item.refund_status === 1" class="status-tag status-pending">
                <text class="status-tag-text">退款申请中</text>
              </view>
              <view v-else-if="item.refund_status === 2" class="status-tag status-failed">
                <text class="status-tag-text">退款失败</text>
              </view>
              <view v-else-if="item.refund_status === 4" class="status-tag status-rejected">
                <text class="status-tag-text">退款被驳回</text>
              </view>
              <view v-else-if="isContractLocked(item)" class="status-tag status-contract">
                <text class="status-tag-text">已签合同</text>
              </view>
              <!-- 驳回/失败原因 -->
              <view v-if="item.refund_status === 4 && item.refund_reject_reason" class="reject-reason">
                <text class="reject-reason-text">驳回原因：{{ item.refund_reject_reason }}</text>
              </view>
              <view v-if="item.refund_status === 2" class="reject-reason">
                <text class="reject-reason-text">退款处理异常，可重新申请退款</text>
              </view>
            </view>
            <view class="card-right">
              <!-- 可选状态（refund_status=0/2/4 且未签合同） -->
              <view v-if="canSelectItem(item)" :class="['radio', { 'radio-active': selectedOrderNo === item.order_no }]">
                <text v-if="selectedOrderNo === item.order_no" class="radio-check">✓</text>
              </view>
              <!-- 申请中：显示时钟图标 -->
              <text v-else-if="item.refund_status === 1" class="status-icon-right">🕐</text>
              <!-- 已签合同（含赠课已签）：锁图标 -->
              <text v-else-if="isContractLocked(item)" class="lock-icon">🔒</text>
              <!-- 失败/驳回：重新申请箭头 -->
              <text v-else class="status-icon-right">→</text>
            </view>
          </view>
        </view>

        <!-- === 已退款列表 === -->
        <view v-else class="course-list">
          <view
            v-for="item in filteredList"
            :key="item.order_no"
            class="course-card refunded-card"
          >
            <view class="card-left">
              <image
                v-if="item.cover_image"
                :src="item.cover_image"
                class="course-cover"
                mode="aspectFill"
              />
              <view v-else :class="['course-icon', getIconBg(item.order_type)]">
                <text>{{ getIcon(item.order_type) }}</text>
              </view>
            </view>
            <view class="card-body">
              <view class="card-title">{{ item.order_name }}</view>
              <view class="card-meta">
                <text class="card-amount refunded-amount">¥{{ formatPrice(item.refund_amount || item.final_amount) }}</text>
                <text class="card-time">{{ item.refund_time || item.pay_time || item.created_at }}</text>
              </view>
              <view class="status-tag status-success">
                <text class="status-tag-text">已退款</text>
              </view>
            </view>
            <view class="card-right">
              <view
                v-if="item.invoice_url"
                class="invoice-btn"
                @click.stop="viewInvoice(item.invoice_url)"
              >
                <text class="invoice-btn-text">查看电子发票</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部弹层遮罩 -->
    <view v-if="selectedOrderNo" class="sheet-mask" @click="closeSheet" />

    <!-- 底部弹层 -->
    <view :class="['bottom-sheet', { 'bottom-sheet--visible': selectedOrderNo }]">
      <view class="sheet-handle-bar">
        <view class="sheet-handle" />
      </view>

      <view class="sheet-header">
        <text class="sheet-title">申请退款</text>
        <view class="sheet-course-info">
          <image
            v-if="selectedItem?.cover_image"
            :src="selectedItem.cover_image"
            class="sheet-course-cover"
            mode="aspectFill"
          />
          <view v-else :class="['sheet-course-icon', getIconBg(selectedItem?.order_type || 1)]">
            <text>{{ getIcon(selectedItem?.order_type || 1) }}</text>
          </view>
          <view class="sheet-course-detail">
            <text class="sheet-course-name">{{ selectedItem?.order_name }}</text>
            <text class="sheet-course-amount">退款金额：¥{{ formatPrice(selectedItem?.final_amount || 0) }}</text>
          </view>
        </view>
      </view>

      <view class="sheet-body">
        <view class="sheet-label">退款原因 <text class="required">*</text></view>
        <view class="reason-card">
          <textarea
            v-model="refundReason"
            class="reason-input"
            placeholder="请输入退款原因（必填）"
            :maxlength="200"
            :auto-height="true"
          />
          <view class="reason-counter">
            <text>{{ refundReason.length }}/200</text>
          </view>
        </view>
        <view class="sheet-note">退款将由财务审核后转账，预计3-7个工作日到账</view>
      </view>

      <view class="sheet-footer">
        <button class="cancel-btn" @click="closeSheet">
          <text>取消</text>
        </button>
        <button
          class="t-button t-button--theme-primary t-button--size-large submit-btn"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <text class="t-button__text">申请退款</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import { OrderApi, UserApi } from '@/api'
import { formatPrice } from '@/utils'
import { cloudFileIDToURL } from '@/api/modules/storage'

interface RefundableItem {
  id: number
  order_no: string
  order_type: number
  order_name: string
  related_id: number
  final_amount: number
  pay_time: string | null
  created_at: string
  contract_signed: number
  /** 是否被合同锁定（自身已签 或 赠课已签），在 loadData 构建时计算，避免 Vue 响应式时序问题 */
  is_locked: boolean
  cover_image: string
  refund_status: number
  refund_reason: string
  refund_reject_reason: string
  refund_amount: number
  refund_time: string | null
  invoice_url: string
}

const loading = ref(true)
const allItems = ref<RefundableItem[]>([])
const selectedOrderNo = ref('')
const refundReason = ref('')
const activeTab = ref<string | number>('pending')
// 因赠课已签合同而被锁定的父订单 ID 集合（精确匹配 source_order_id，避免锁定所有同类课程订单）
// 赠课合同锁定集合（已改为直接写入 item.is_locked，此处保留以兼容旧引用）
const giftContractLockedSet = ref(new Set<number>())

const tabOptions = [
  { label: '未退款', value: 'pending' },
  { label: '已退款', value: 'refunded' }
]

const filteredList = computed(() => {
  if (activeTab.value === 'refunded') {
    return allItems.value.filter(i => i.refund_status === 3)
  }
  // 未退款：除了 refund_status=3 之外的所有状态
  return allItems.value.filter(i => i.refund_status !== 3)
})

const selectedItem = computed(() =>
  allItems.value.find(i => i.order_no === selectedOrderNo.value) || null
)

const canSubmit = computed(() =>
  selectedOrderNo.value && refundReason.value.trim().length > 0
)

/**
 * 判断该订单是否因合同被锁定（自身已签 或 赠课已签）
 * is_locked 在 loadData 构建 allItems 时已计算好，直接读取避免响应式时序问题
 */
const isContractLocked = (item: RefundableItem): boolean => item.is_locked

/**
 * 判断该订单是否可以选中申请退款
 * 仅 refund_status=0/2/4 且未被合同锁定可选
 */
const canSelectItem = (item: RefundableItem): boolean => {
  if (isContractLocked(item)) return false
  return [0, 2, 4].includes(item.refund_status)
}

const getIcon = (type: number) => {
  const icons: Record<number, string> = { 1: '📚', 2: '🎓', 4: '⬆️' }
  return icons[type] || '📦'
}

const getIconBg = (type: number) => {
  const bgs: Record<number, string> = { 1: 'bg-blue', 2: 'bg-purple', 4: 'bg-orange' }
  return bgs[type] || 'bg-blue'
}

const loadData = async () => {
  loading.value = true
  try {
    const [ordersRes, coursesRes] = await Promise.all([
      OrderApi.getList({ page: 1, pageSize: 100, status: 1 }),
      UserApi.getMyCourses({ page: 1, pageSize: 100 })
    ])

    const orders = (ordersRes as any).list || []
    const courses = (coursesRes as any).list || []

    const contractMap = new Map<number, number>()
    const coverMap = new Map<number, string>()
    const lockedOrderIds = new Set<number>()
    for (const c of courses) {
      contractMap.set(c.course_id, c.contract_signed || 0)
      if (c.cover_image) {
        coverMap.set(c.course_id, cloudFileIDToURL(c.cover_image))
      }
      // 赠课已签合同 → 精确锁定创建该赠课的那一笔订单（source_order_id），而非锁定所有同类课程订单
      if (c.is_gift === 1 && c.contract_signed === 1 && c.source_order_id) {
        lockedOrderIds.add(c.source_order_id)
      }
    }
    giftContractLockedSet.value = lockedOrderIds

    // 也加载已退款订单（pay_status=4）
    let refundedOrders: any[] = []
    try {
      const refundedRes = await OrderApi.getList({ page: 1, pageSize: 100, status: 4 })
      refundedOrders = (refundedRes as any).list || []
    } catch (e) {
      console.error('加载已退款订单失败:', e)
    }

    const allOrders = [...orders, ...refundedOrders]

    // 仅展示普通课程订单（order_type=1）
    allItems.value = allOrders
      .filter((o: any) => o.order_type === 1)
      .map((o: any) => {
        const isLocked = (contractMap.get(o.related_id) ?? 0) === 1 || lockedOrderIds.has(o.id)
        // 调试：输出每条订单的锁定判断详情
        console.log(`[lock] id=${o.id}(${typeof o.id}) name=${o.order_name} locked=${isLocked} hasInSet=${lockedOrderIds.has(o.id)}`)
        return {
        id: o.id,
        order_no: o.order_no,
        order_type: o.order_type,
        order_name: o.order_name,
        related_id: o.related_id || 0,
        final_amount: o.final_amount,
        pay_time: o.pay_time,
        created_at: o.created_at,
        contract_signed: contractMap.get(o.related_id) ?? 0,
        // 合同锁定状态：自身已签 或 该订单是某赠课的 source_order_id 且赠课已签合同
        is_locked: isLocked,
        cover_image: coverMap.get(o.related_id) || '',
        refund_status: o.refund_status || 0,
        refund_reason: o.refund_reason || '',
        refund_reject_reason: o.refund_reject_reason || '',
        refund_amount: o.refund_amount || 0,
        refund_time: o.refund_time || null,
        invoice_url: o.invoice_url || ''
        }
      })
  } catch (error) {
    console.error('加载数据失败:', error)
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onTabChange = () => {
  selectedOrderNo.value = ''
  refundReason.value = ''
}

const handleCardClick = (item: RefundableItem) => {
  // 已签合同（含赠课已签）不可操作
  if (isContractLocked(item)) {
    uni.showModal({
      title: '无法退款',
      content: '该课程已签署学习合同，无法申请退款。如有疑问请联系客服。',
      showCancel: false,
      confirmText: '我知道了'
    })
    return
  }
  // 退款申请中 → 跳转到退款详情页
  if (item.refund_status === 1) {
    uni.navigateTo({
      url: `/pages/order/refund-status/index?orderNo=${item.order_no}`
    })
    return
  }
  // 可选状态（0/2/4）→ 打开申请弹层
  if (canSelectItem(item)) {
    selectedOrderNo.value = item.order_no
    refundReason.value = ''
  }
}

const closeSheet = () => {
  selectedOrderNo.value = ''
  refundReason.value = ''
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  const item = selectedItem.value
  if (!item) return

  // 前置检查：银行账户信息是否已填（财务需要该信息进行线下转账）
  try {
    const profile = await UserApi.getProfile()
    const hasBankInfo = (profile as any).bank_account_name &&
      (profile as any).bank_name &&
      (profile as any).bank_account_number

    if (!hasBankInfo) {
      uni.showModal({
        title: '请先填写收款银行账户',
        content: '退款由财务进行线下银行转账，需要您的收款银行账户信息。请前往个人资料填写后再申请退款。',
        confirmText: '去填写',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/mine/profile/index?scrollTo=bank' })
          }
        }
      })
      return
    }
  } catch (err) {
    console.error('[refund-apply] 获取银行信息失败:', err)
  }

  const isReapply = [2, 4].includes(item.refund_status)
  const confirmTitle = isReapply ? '重新申请退款' : '确认退款'

  const { confirm } = await new Promise<{ confirm: boolean }>((resolve) => {
    uni.showModal({
      title: confirmTitle,
      content: `确定要对"${item.order_name}"申请退款 ¥${formatPrice(item.final_amount)} 吗？`,
      confirmText: '确认退款',
      confirmColor: '#E34D59',
      success: resolve
    })
  })

  if (!confirm) return

  try {
    await OrderApi.requestRefund({
      order_no: item.order_no,
      refund_reason: refundReason.value.trim()
    })

    uni.showToast({ title: '退款申请已提交', icon: 'success' })
    closeSheet()

    setTimeout(() => {
      loadData()
    }, 1500)
  } catch (error: any) {
    console.error('提交退款申请失败:', error)
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none',
      duration: 3000
    })
  }
}

const viewInvoice = (url: string) => {
  if (!url) {
    uni.showToast({ title: '暂无电子发票', icon: 'none' })
    return
  }
  // 预览文件（PDF/图片）
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
  if (isImage) {
    uni.previewImage({ urls: [url], current: url })
  } else {
    // #ifdef MP-WEIXIN
    uni.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode === 200) {
          uni.openDocument({
            filePath: res.tempFilePath,
            showMenu: true
          })
        }
      },
      fail: () => {
        uni.showToast({ title: '文件打开失败', icon: 'none' })
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    window.open(url, '_blank')
    // #endif
  }
}

onMounted(() => {
  loadData()
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

/* Tabs 区域 */
.tabs-wrapper {
  display: flex;
  justify-content: center;
  padding: 20rpx 24rpx 12rpx;
  background-color: $td-bg-color-container;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
}

.page-content {
  padding: 24rpx;
}

/* 提示条 */
.tip-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 24rpx;
  background-color: $td-warning-color-light;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

.tip-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.tip-text {
  font-size: 26rpx;
  color: $td-text-color-secondary;
  line-height: 1.5;
}

/* 加载 & 空状态 */
.loading-wrapper,
.empty-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: $td-text-color-placeholder;
}

.empty-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 32rpx;
  color: $td-text-color-primary;
  margin-bottom: 12rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: $td-text-color-placeholder;
}

/* 课程卡片 */
.course-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.course-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 28rpx 24rpx;
  background-color: $td-bg-color-container;
  border-radius: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s ease;

  &.selected {
    border-color: $td-brand-color;
    background-color: $td-bg-color-container-select;
  }

  &.disabled {
    opacity: 0.6;
  }

  &.refunded-card {
    opacity: 0.85;
  }
}

.card-left {
  flex-shrink: 0;
  padding-top: 4rpx;
}

.course-cover {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.course-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;

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

.card-body {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.card-amount {
  font-size: 28rpx;
  font-weight: 600;
  color: $td-error-color;
}

.refunded-amount {
  color: #00A67E;
}

.card-time {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
}

/* 退款状态标签 */
.status-tag {
  display: inline-flex;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;

  &.status-pending {
    background-color: #FFF7E6;
  }

  &.status-failed {
    background-color: #FFF2F2;
  }

  &.status-rejected {
    background-color: #FFF2F2;
  }

  &.status-success {
    background-color: #E8F8F0;
  }

  &.status-contract {
    background-color: $td-warning-color-light;
  }
}

.status-tag-text {
  font-size: 22rpx;

  .status-pending & {
    color: #FF9800;
  }

  .status-failed & {
    color: $td-error-color;
  }

  .status-rejected & {
    color: $td-error-color;
  }

  .status-success & {
    color: #00A67E;
  }

  .status-contract & {
    color: $td-warning-color;
  }
}

/* 驳回/失败原因 */
.reject-reason {
  margin-top: 8rpx;
  padding: 8rpx 12rpx;
  background-color: #FFF8F8;
  border-radius: 8rpx;
  border-left: 4rpx solid $td-error-color;
}

.reject-reason-text {
  font-size: 22rpx;
  color: $td-error-color;
  line-height: 1.5;
}

.card-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding-top: 4rpx;
}

.radio {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 2rpx solid $td-border-level-1;
  display: flex;
  align-items: center;
  justify-content: center;

  &.radio-active {
    border-color: $td-brand-color;
    background-color: $td-brand-color;
  }
}

.radio-check {
  font-size: 24rpx;
  color: white;
  font-weight: bold;
}

.lock-icon {
  font-size: 36rpx;
}

.status-icon-right {
  font-size: 32rpx;
}

/* 查看电子发票按钮 */
.invoice-btn {
  padding: 10rpx 20rpx;
  background-color: $td-brand-color;
  border-radius: 8rpx;
  white-space: nowrap;
}

.invoice-btn-text {
  font-size: 22rpx;
  color: white;
  font-weight: 500;
}

/* 底部弹层遮罩 */
.sheet-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
}

/* 底部弹层 */
.bottom-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: $td-bg-color-container;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 300;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  padding-bottom: env(safe-area-inset-bottom);

  &--visible {
    transform: translateY(0);
  }
}

.sheet-handle-bar {
  display: flex;
  justify-content: center;
  padding: 16rpx 0 8rpx;
}

.sheet-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 4rpx;
  background-color: $td-border-level-2;
}

/* 弹层头部 */
.sheet-header {
  padding: 16rpx 32rpx 24rpx;
  border-bottom: 1rpx solid $td-border-level-1;
}

.sheet-title {
  font-size: 34rpx;
  font-weight: 700;
  color: $td-text-color-primary;
  display: block;
  margin-bottom: 20rpx;
}

.sheet-course-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: $td-bg-color-page;
  border-radius: 16rpx;
  padding: 20rpx;
}

.sheet-course-cover {
  width: 72rpx;
  height: 72rpx;
  border-radius: 14rpx;
  flex-shrink: 0;
}

.sheet-course-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
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

.sheet-course-detail {
  flex: 1;
  min-width: 0;
}

.sheet-course-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6rpx;
}

.sheet-course-amount {
  font-size: 26rpx;
  color: $td-error-color;
  font-weight: 600;
}

/* 弹层内容 */
.sheet-body {
  padding: 28rpx 32rpx 16rpx;
}

.sheet-label {
  font-size: 28rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 16rpx;
}

.required {
  color: $td-error-color;
  margin-left: 4rpx;
}

.reason-card {
  background-color: $td-bg-color-page;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  border: 1rpx solid $td-border-level-1;
}

.reason-input {
  width: 100%;
  min-height: 140rpx;
  font-size: 28rpx;
  color: $td-text-color-primary;
  line-height: 1.6;
}

.reason-counter {
  text-align: right;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $td-text-color-placeholder;
}

.sheet-note {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: $td-text-color-placeholder;
  line-height: 1.5;
}

/* 弹层底部按钮 */
.sheet-footer {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 32rpx 28rpx;
}

.cancel-btn {
  flex: 0 0 160rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $td-bg-color-page;
  border-radius: $td-radius-default;
  border: 1rpx solid $td-border-level-2;

  text {
    font-size: 30rpx;
    color: $td-text-color-secondary;
  }
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

  &--theme-primary {
    background-color: $td-brand-color;

    .t-button__text {
      color: white;
      font-size: 32rpx;
      font-weight: 500;
    }

    &[disabled] {
      opacity: 1;
      background-color: #bbbbbb;
    }
  }
}

.submit-btn {
  flex: 1;
}
</style>
