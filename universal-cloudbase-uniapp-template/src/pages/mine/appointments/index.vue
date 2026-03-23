<template>
  <view class="page-container">
    <TdPageHeader title="我的预约" :showBack="true" />

    <scroll-view
      class="scroll-content"
      scroll-y
      lower-threshold="100"
      @scroll="handleScroll"
      @scrolltolower="loadMore"
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

        <!-- 预约列表 -->
        <view v-if="filteredAppointments.length > 0" class="appointment-list">
          <view 
            v-for="appointment in filteredAppointments" 
            :key="appointment.id"
            class="t-card"
          >
            <view class="t-card__body">
              <view class="card-header">
                <text class="card-title">{{ appointment.title }}</text>
                <view v-if="appointment.statusTag" class="t-badge" :class="`t-badge--${appointment.statusType}`">
                  {{ appointment.statusTag }}
                </view>
              </view>

              <view class="card-info">
                <view class="info-item">
                  <text class="info-icon">📅</text>
                  <text class="info-text">上课时间: {{ appointment.time }}</text>
                </view>
                <view class="info-item">
                  <text class="info-icon">📍</text>
                  <text class="info-text">上课地点: {{ appointment.location }}</text>
                </view>
                <view class="info-item">
                  <text class="info-icon">👨‍🏫</text>
                  <text class="info-text">授课老师: {{ appointment.teacher }}</text>
                </view>
              </view>

              <!-- 取消预约区域：仅待上课状态显示 -->
              <view v-if="appointment.dbStatus === 0" class="cancel-section">
                <text class="cancel-hint">{{ appointment.cancelHint }}</text>
                <view
                  class="cancel-btn"
                  :class="{ 'cancel-btn--disabled': !appointment.canCancel }"
                  @tap="handleCancelAppointment(appointment)"
                >
                  {{ appointment.canCancel ? '取消预约' : '无法取消预约' }}
                </view>
              </view>

              <!-- 复训费退款按钮：仅在符合条件的已取消复训预约上显示 -->
              <view v-if="appointment.showRetrainRefundBtn" class="cancel-section">
                <text class="cancel-hint">复训费可保留用于下次上课，也可申请退款</text>
                <view
                  class="retrain-refund-btn"
                  :class="{ 'retrain-refund-btn--disabled': retrainRefundLoading }"
                  @tap="handleRetrainRefund(appointment)"
                >
                  复训费退款
                </view>
              </view>
            </view>
          </view>

          <!-- 提示信息 -->
          <view class="t-alert">
            <view class="alert-icon"><icon type="info" size="16" color="#0052D9"/></view>
            <view class="alert-content">
              <text class="alert-message">可复训课程支持多次预约上课</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="filteredAppointments.length === 0 && !loading" class="empty-state">
          <view class="empty-icon"><icon type="info" size="60" color="#ccc"/></view>
          <text class="empty-text">暂无预约</text>
        </view>

        <!-- 加载更多 -->
        <view v-if="!finished && filteredAppointments.length > 0" class="load-more">
          <text class="load-more-text">{{ loading ? '加载中...' : '上拉加载更多' }}</text>
        </view>

        <!-- 已加载全部 -->
        <view v-if="finished && filteredAppointments.length > 0" class="load-more">
          <text class="finished-text">已加载全部</text>
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
import { CourseApi, UserApi } from '@/api'
import { OrderApi } from '@/api'

const pageHeaderHeight = ref(64)
const scrollViewHeight = ref(0)
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
  const { scrollTop, scrollHeight } = e.detail
  if (scrollViewHeight.value > 0 && scrollHeight - scrollTop - scrollViewHeight.value < 100) {
    loadMore()
  }
}

const activeTab = ref(-1)
const tabOptions = [
  { label: '全部', value: -1 },
  { label: '进行中', value: 0 },
  { label: '已结课', value: 1 },
  { label: '已取消', value: 3 },
  { label: '缺席', value: 4 }
]

const appointments = ref<any[]>([])
const MAX_ITEMS = 99
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

/**
 * 计算非沙龙课程的展示标签和样式
 * 优先级：已取消 > 缺席 > 已结课 > 今日已签到 > 待上课 > 无标签
 * 复训退款相关徽章（退款中/已退款）在 filteredAppointments 中按 orderNo 最新取消记录单独覆盖
 */
const getNonSalonDisplay = (item: any) => {
  const today = new Date().toISOString().slice(0, 10)

  if (item.status === 3) return { tag: '已取消', type: 'default' }
  if (item.status === 4) return { tag: '缺席', type: 'danger' }
  if (item.status === 1 || (item.class_end_date && item.class_end_date < today)) {
    return { tag: '已结课', type: 'default' }
  }
  if (item.today_checked_in) return { tag: '今日已签到', type: 'success' }
  if (!item.has_ever_checked_in) return { tag: '待上课', type: 'warning' }
  return { tag: '', type: '' }
}

const getSalonDisplay = (item: any) => {
  const map: Record<number, { tag: string; type: string }> = {
    0: { tag: '待上课', type: 'warning' },
    1: { tag: '已签到', type: 'success' },
    2: { tag: '已结课', type: 'default' },
    3: { tag: '已取消', type: 'default' }
  }
  return map[item.status] || map[0]
}

const mapAppointmentItem = (item: any) => {
  const isSalon = item.course_type === 4 || item.is_salon
  const display = isSalon ? getSalonDisplay(item) : getNonSalonDisplay(item)

  const cancelDeadlineDays = item.cancel_deadline_days || 0
  const classDate = item.class_date || ''
  const isRetrain = item.is_retrain === 1

  // 计算是否可取消：当前日期 < class_date - cancel_deadline_days
  let canCancel = false
  let cancelHint = ''
  if (item.status === 0 && classDate && cancelDeadlineDays > 0) {
    const classDateTime = new Date(classDate + 'T00:00:00').getTime()
    const deadlineTime = classDateTime - cancelDeadlineDays * 24 * 60 * 60 * 1000
    const now = Date.now()
    if (now < deadlineTime) {
      canCancel = true
      cancelHint = `上课前${cancelDeadlineDays}天将无法取消预约`
    } else {
      cancelHint = '已超过取消截止日期，无法取消预约'
    }
  }

  return {
    id: item.id,
    courseId: item.course_id,
    classRecordId: item.class_record_id,
    title: item.course_name || '',
    time: `${classDate} ${item.start_time || item.class_time || ''}`,
    location: item.location || '',
    teacher: item.teacher || '',
    statusTag: display.tag,
    statusType: display.type,
    dbStatus: item.status,
    isSalon,
    isRetrain,
    canCancel,
    cancelHint,
    cancelDeadlineDays,
    // 复训专用字段
    orderNo: item.order_no || '',
    retrainCreditStatus: item.retrain_credit_status,
    retrainRefundStatus: item.retrain_refund_status,
    cancelledAt: item.cancelled_at || ''
  }
}

const loadAppointments = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    appointments.value = []
    finished.value = false
  }

  if (loading.value || finished.value) return

  try {
    if (currentPage.value === 1) {
      uni.showLoading({ title: '加载中...' })
    }
    loading.value = true

    const params: any = { page: currentPage.value, page_size: pageSize.value }
    if (activeTab.value >= 0) {
      params.status = activeTab.value
    }

    const result = await CourseApi.getMyAppointments(params)
    const newItems = result.list.map(mapAppointmentItem)
    appointments.value.push(...newItems)
    total.value = result.total || 0
    currentPage.value++

    if (
      newItems.length === 0 ||
      newItems.length < pageSize.value ||
      appointments.value.length >= total.value ||
      appointments.value.length >= MAX_ITEMS
    ) {
      finished.value = true
      if (appointments.value.length > MAX_ITEMS) {
        appointments.value = appointments.value.slice(0, MAX_ITEMS)
      }
    }

    if (currentPage.value === 2) {
      uni.hideLoading()
    }
  } catch (error) {
    console.error('加载预约列表失败:', error)
    uni.hideLoading()
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  if (!finished.value && !loading.value) {
    loadAppointments()
  }
}

const filteredAppointments = computed(() => {
  const list = activeTab.value === -1
    ? appointments.value
    : appointments.value.filter(item => item.dbStatus === activeTab.value)

  // 第一步：找出每个 orderNo 中取消时间最新的那条（所有已取消复训预约，不限条件）
  // 用于：① 徽章覆盖（退款中/已退款） ② 退款按钮显示
  const orderNoBadgeWinnerMap: Record<string, { cancelledAt: string; id: number }> = {}
  for (const item of list) {
    if (!item.isRetrain || item.dbStatus !== 3 || !item.orderNo) continue
    const current = orderNoBadgeWinnerMap[item.orderNo]
    if (
      !current ||
      item.cancelledAt > current.cancelledAt ||
      (item.cancelledAt === current.cancelledAt && item.id > current.id)
    ) {
      orderNoBadgeWinnerMap[item.orderNo] = { cancelledAt: item.cancelledAt, id: item.id }
    }
  }

  // 第二步：退款按钮额外条件（资格保留 + 未申请/已驳回）
  const eligibleForBtn = (item: any) =>
    item.dbStatus === 3 &&
    item.isRetrain &&
    item.orderNo &&
    item.retrainCreditStatus === 1 &&
    (item.retrainRefundStatus === 0 || item.retrainRefundStatus === 4)

  return list.map(item => {
    const isBadgeWinner =
      item.isRetrain &&
      item.dbStatus === 3 &&
      item.orderNo &&
      orderNoBadgeWinnerMap[item.orderNo]?.id === item.id

    // 只有「最新取消」那条才覆盖徽章，其余已取消的复训预约保持「已取消」不变
    let statusTag = item.statusTag
    let statusType = item.statusType
    if (isBadgeWinner) {
      if (item.retrainRefundStatus === 3) { statusTag = '已退款'; statusType = 'success' }
      else if (item.retrainRefundStatus === 1) { statusTag = '退款中'; statusType = 'warning' }
    }

    return {
      ...item,
      statusTag,
      statusType,
      showRetrainRefundBtn: eligibleForBtn(item) && isBadgeWinner
    }
  })
})

const cancelLoading = ref(false)
const retrainRefundLoading = ref(false)

/**
 * 申请复训费退款
 */
const handleRetrainRefund = async (appointment: any) => {
  if (retrainRefundLoading.value) return

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
    console.error('[appointments] 获取银行信息失败:', err)
  }

  uni.showModal({
    title: '申请复训费退款',
    content: '退款后，您下次复训将需要重新支付复训费。若不退款，复训费将自动保留，下次上课时可免费复训。',
    confirmText: '确定退款',
    cancelText: '保留资格',
    confirmColor: '#d54941',
    success: async (res) => {
      if (!res.confirm) return
      retrainRefundLoading.value = true
      try {
        await OrderApi.requestRefund({
          order_no: appointment.orderNo,
          refund_reason: '申请复训费退款'
        })
        uni.showToast({ title: '退款申请已提交，请等待审核', icon: 'none', duration: 2500 })
        loadAppointments(true)
      } catch (error: any) {
        uni.showToast({ title: error.message || '申请失败，请稍后重试', icon: 'none' })
      } finally {
        retrainRefundLoading.value = false
      }
    }
  })
}

const handleCancelAppointment = (appointment: any) => {
  if (!appointment.canCancel || cancelLoading.value) return

  const confirmContent = appointment.isRetrain
    ? '取消后，您已支付的复训费将保留至下期预约使用，确定取消吗？'
    : '确定要取消该预约吗？'

  uni.showModal({
    title: '取消预约',
    content: confirmContent,
    confirmText: '确定取消',
    confirmColor: '#d54941',
    success: async (res) => {
      if (!res.confirm) return
      cancelLoading.value = true
      try {
        const result = await CourseApi.cancelAppointment({ appointmentId: appointment.id })
        const msg = result?.has_retrain_credit
          ? '预约已取消，复训费已保留至下期'
          : '预约已取消'
        uni.showToast({ title: msg, icon: 'none', duration: 2000 })
        loadAppointments(true)
      } catch (error: any) {
        uni.showToast({ title: error.message || '取消失败', icon: 'none' })
      } finally {
        cancelLoading.value = false
      }
    }
  })
}

const handleTabChange = (value: number) => {
  activeTab.value = value
  loadAppointments(true)
}

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight
  scrollViewHeight.value = systemInfo.windowHeight - pageHeaderHeight.value

  loadAppointments()
})

onShow(() => {
  loadAppointments(true)
})
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  height: 100vh;
  background-color: $td-bg-color-page;
  display: flex;
  flex-direction: column;
}

.scroll-content {
  flex: 1;
  overflow: hidden;
}

.page-content {
  padding: 32rpx;
  padding-bottom: 0;
}

.tabs-wrapper {
  margin-bottom: 32rpx;
}

.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.t-card {
  background-color: #FFFFFF;
  border-radius: $td-radius-default;
  border: 1px solid $td-border-level-1;
  overflow: hidden;
  transition: all 0.3s;
}

.t-card__body {
  padding: 24rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.t-badge {
  font-size: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.t-badge--warning {
  background-color: $td-warning-color-light;
  color: $td-warning-color;
}

.t-badge--success {
  background-color: $td-success-color-light;
  color: $td-success-color;
}

.t-badge--danger {
  background-color: #fde2e2;
  color: #d54941;
}

.t-badge--default {
  background-color: #f3f3f3;
  color: #999;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  font-size: 26rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

.info-icon {
  flex-shrink: 0;
}

.info-text {
  flex: 1;
}

.t-alert {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  background-color: $td-info-color-light;
  border-radius: $td-radius-default;
  margin-top: 32rpx;
}

.alert-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 26rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
}

.load-more-text {
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

.finished-text {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
}

.bottom-spacing {
  height: 120rpx;
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
  color: $td-text-color-placeholder;
}

.cancel-section {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1px solid $td-border-level-1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cancel-hint {
  font-size: 22rpx;
  color: $td-text-color-placeholder;
  flex: 1;
  margin-right: 16rpx;
}

.cancel-btn {
  font-size: 24rpx;
  color: #d54941;
  padding: 8rpx 24rpx;
  border: 1px solid #d54941;
  border-radius: 32rpx;
  flex-shrink: 0;
}

.cancel-btn--disabled {
  color: #bbb;
  border-color: #ddd;
  background-color: #f5f5f5;
}

.retrain-refund-btn {
  font-size: 24rpx;
  color: #e37318;
  padding: 8rpx 24rpx;
  border: 1px solid #e37318;
  border-radius: 32rpx;
  flex-shrink: 0;
}

.retrain-refund-btn--disabled {
  color: #bbb;
  border-color: #ddd;
  background-color: #f5f5f5;
}
</style>
