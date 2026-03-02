<template>
  <view class="page-container">
    <TdPageHeader title="申请退款" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 提示信息 -->
        <view class="tip-bar">
          <view class="tip-icon"><icon type="warn" size="16" color="#E6A23C"/></view>
          <text class="tip-text">请选择要退款的课程，已签署学习合同的课程无法退款</text>
        </view>

        <!-- 加载中 -->
        <view v-if="loading" class="loading-wrapper">
          <text class="loading-text">加载中...</text>
        </view>

        <!-- 空状态 -->
        <view v-else-if="refundableItems.length === 0" class="empty-wrapper">
          <view class="empty-icon"><icon type="info" size="60" color="#ccc"/></view>
          <text class="empty-text">暂无可退款的订单</text>
          <text class="empty-desc">已支付且未退款的课程订单才可申请退款</text>
        </view>

        <!-- 课程列表 -->
        <view v-else class="course-list">
          <view
            v-for="item in refundableItems"
            :key="item.order_no"
            :class="['course-card', { 'selected': selectedOrderNo === item.order_no, 'disabled': item.contract_signed === 1 }]"
            @click="selectCourse(item)"
          >
            <view class="card-left">
              <!-- 有封面图时显示图片，否则降级为渐变色图标 -->
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
              <view v-if="item.contract_signed === 1" class="contract-tag">
                <text class="contract-tag-text">已签合同</text>
              </view>
            </view>
            <view class="card-right">
              <view v-if="item.contract_signed !== 1" :class="['radio', { 'radio-active': selectedOrderNo === item.order_no }]">
                <text v-if="selectedOrderNo === item.order_no" class="radio-check">✓</text>
              </view>
              <text v-else class="lock-icon">🔒</text>
            </view>
          </view>
        </view>

      </view>
    </scroll-view>

    <!-- 底部弹层遮罩 -->
    <view v-if="selectedOrderNo" class="sheet-mask" @click="closeSheet" />

    <!-- 底部弹层 -->
    <view :class="['bottom-sheet', { 'bottom-sheet--visible': selectedOrderNo }]">
      <!-- 拖拽把手 -->
      <view class="sheet-handle-bar">
        <view class="sheet-handle" />
      </view>

      <!-- 弹层标题 + 课程信息 -->
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

      <!-- 退款原因 -->
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

      <!-- 底部按钮 -->
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
import { OrderApi, UserApi } from '@/api'
import { formatPrice } from '@/utils'
import { cloudFileIDToURL } from '@/api/modules/storage'

interface RefundableItem {
  order_no: string
  order_type: number
  order_name: string
  related_id: number
  final_amount: number
  pay_time: string | null
  created_at: string
  contract_signed: number
  cover_image: string
}

const loading = ref(true)
const refundableItems = ref<RefundableItem[]>([])
const selectedOrderNo = ref('')
const refundReason = ref('')

const selectedItem = computed(() =>
  refundableItems.value.find(i => i.order_no === selectedOrderNo.value) || null
)

const canSubmit = computed(() =>
  selectedOrderNo.value && refundReason.value.trim().length > 0
)

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

    // 构建 course_id → { contract_signed, cover_image } 映射
    const contractMap = new Map<number, number>()
    const coverMap = new Map<number, string>()
    for (const c of courses) {
      contractMap.set(c.course_id, c.contract_signed || 0)
      if (c.cover_image) {
        coverMap.set(c.course_id, cloudFileIDToURL(c.cover_image))
      }
    }

    // 筛选可退款订单：已支付 + 无退款记录 + 仅课程类订单（order_type 1=初探班/2=密训班/3=咨询），排除大使升级(4)等非课程类
    refundableItems.value = orders
      .filter((o: any) =>
        o.pay_status === 1 &&
        (o.refund_status === 0 || !o.refund_status) &&
        [1, 2, 3].includes(o.order_type)
      )
      .map((o: any) => ({
        order_no: o.order_no,
        order_type: o.order_type,
        order_name: o.order_name,
        related_id: o.related_id || 0,
        final_amount: o.final_amount,
        pay_time: o.pay_time,
        created_at: o.created_at,
        contract_signed: contractMap.get(o.related_id) ?? 0,
        cover_image: coverMap.get(o.related_id) || ''
      }))
  } catch (error) {
    console.error('加载数据失败:', error)
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const selectCourse = (item: RefundableItem) => {
  if (item.contract_signed === 1) {
    uni.showModal({
      title: '无法退款',
      content: '该课程已签署学习合同，无法申请退款。如有疑问请联系客服。',
      showCancel: false,
      confirmText: '我知道了'
    })
    return
  }
  selectedOrderNo.value = item.order_no
  refundReason.value = ''
}

const closeSheet = () => {
  selectedOrderNo.value = ''
  refundReason.value = ''
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  const item = selectedItem.value
  if (!item) return

  const { confirm } = await new Promise<{ confirm: boolean }>((resolve) => {
    uni.showModal({
      title: '确认退款',
      content: `确定要对"${item.order_name}"申请退款 ¥${formatPrice(item.final_amount)} 吗？`,
      confirmText: '确认退款',
      confirmColor: '#E34D59',
      success: resolve
    })
  })

  if (!confirm) return

  try {
    const result = await OrderApi.requestRefund({
      order_no: item.order_no,
      refund_reason: refundReason.value.trim()
    })

    uni.showToast({ title: '退款申请已提交', icon: 'success' })

    setTimeout(() => {
      uni.redirectTo({
        url: `/pages/order/refund-status/index?orderNo=${item.order_no}`
      })
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
  align-items: center;
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
}

.card-left {
  flex-shrink: 0;
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

.card-time {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
}

.contract-tag {
  display: inline-flex;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  background-color: $td-warning-color-light;
  border-radius: 6rpx;
}

.contract-tag-text {
  font-size: 22rpx;
  color: $td-warning-color;
}

.card-right {
  flex-shrink: 0;
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
      opacity: 0.5;
    }
  }
}

.submit-btn {
  flex: 1;
}
</style>
