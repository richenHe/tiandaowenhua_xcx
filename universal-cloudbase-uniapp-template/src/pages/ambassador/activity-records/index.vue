<template>
  <view class="page">
    <td-page-header title="活动记录" />
    
    <scroll-view
      class="scroll-area"
      scroll-y
      :style="{ height: scrollHeight }"
      @scroll="handleScroll"
    >
      <view class="page-content">

        <!-- 申请报名入口卡片 -->
        <view class="apply-banner" @tap="goToApply">
          <view class="apply-banner-left">
            <view class="apply-banner-icon">🎯</view>
            <view>
              <view class="apply-banner-title">申请报名活动</view>
              <view class="apply-banner-desc">查看可报名的活动岗位，获得功德分奖励</view>
            </view>
          </view>
          <view class="apply-banner-arrow">›</view>
        </view>

        <!-- 活动统计卡片 -->
        <view class="stats-card">
          <view class="stats-label">📊 活动统计</view>
          <view class="stats-grid">
            <view class="stats-item">
              <view class="stats-value">{{ activityStats.total_count }}</view>
              <view class="stats-text">累计活动</view>
            </view>
            <view class="stats-item">
              <view class="stats-value">{{ activityStats.total_merit_points }}</view>
              <view class="stats-text">功德分</view>
            </view>
            <view class="stats-item">
              <view class="stats-value">{{ activityStats.month_count }}</view>
              <view class="stats-text">本月活动</view>
            </view>
          </view>
        </view>

        <!-- 活动说明 -->
        <view class="alert-box info">
          <view class="alert-icon"><icon type="info" size="16" color="#0052D9"/></view>
          <view class="alert-content">
            <view class="alert-message">
              <text style="font-weight: 500;">活动类型：</text>辅导员、会务义工、沙龙组织、其他<br/>
              <text style="font-weight: 500;">功德分奖励：</text>根据活动岗位发放<br/>
              <text style="font-weight: 500;">适用等级：</text>所有大使都可以参与活动获得功德分
            </view>
          </view>
        </view>

        <!-- 活动类型统计 -->
        <view class="t-section-title t-section-title--simple">📈 活动类型分布</view>
        <view class="type-grid">
          <view class="type-card">
            <view class="type-icon">👨‍🏫</view>
            <view class="type-label">辅导员</view>
            <view class="type-count">{{ activityStats.type_stats[1] || 0 }}次</view>
          </view>
          <view class="type-card">
            <view class="type-icon">🤝</view>
            <view class="type-label">会务义工</view>
            <view class="type-count">{{ activityStats.type_stats[2] || 0 }}次</view>
          </view>
          <view class="type-card">
            <view class="type-icon">🎉</view>
            <view class="type-label">沙龙组织</view>
            <view class="type-count">{{ activityStats.type_stats[3] || 0 }}次</view>
          </view>
          <view class="type-card">
            <view class="type-icon">✨</view>
            <view class="type-label">其他活动</view>
            <view class="type-count">{{ activityStats.type_stats[4] || 0 }}次</view>
          </view>
        </view>

        <!-- Tab切换 -->
        <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight" :margin-bottom="32">
          <template #tabs>
            <CapsuleTabs
              v-model="activeTab"
              :options="tabs"
              @change="onTabChange"
            />
          </template>
        </StickyTabs>

        <!-- 活动记录列表 -->
        <view class="t-section-title t-section-title--simple">📝 活动明细</view>

        <!-- 动态活动记录 -->
        <view v-for="record in activityRecords" :key="record.id" class="activity-card">
          <view class="activity-icon" :style="{ background: getActivityGradient(record.activity_type) }">
            {{ getActivityIcon(record.activity_type) }}
          </view>
          <view class="activity-content">
            <view class="activity-header">
              <view class="activity-info">
                <view class="activity-title">{{ record.activity_name }}</view>
                <view class="activity-desc">{{ record.activity_desc }}</view>
              </view>
              <view class="activity-right">
                <view class="activity-amount">+{{ record.merit_points }}</view>
                <view class="activity-label">功德分</view>
              </view>
            </view>
            <view class="activity-meta">
              <view v-if="record.location" class="meta-item">📍 {{ record.location }}</view>
              <view class="meta-item">⏰ {{ record.start_time }}</view>
              <view v-if="record.duration" class="meta-item">⏱️ 时长: {{ record.duration }}</view>
              <view v-if="record.participant_count" class="meta-item">👥 参与: {{ record.participant_count }}人</view>
            </view>
            <view v-if="record.note" class="activity-note">
              {{ record.note }}
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && activityRecords.length === 0" class="empty-state">
          <view class="empty-icon"><icon type="info" size="60" color="#ccc"/></view>
          <text class="empty-text">暂无活动记录</text>
          <view style="margin-top: 32rpx;" @tap="goToApply">
            <button class="t-button t-button--theme-primary t-button--variant-outline">
              <span class="t-button__text">去报名活动</span>
            </button>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="hasMore && activityRecords.length > 0" class="load-more">
          <button class="t-button t-button--theme-default t-button--variant-text" @click="loadActivityRecords(getActivityTypeValue(activeTab))">
            <span class="t-button__text">{{ loading ? '加载中...' : '加载更多' }}</span>
          </button>
        </view>

        <!-- 底部留白 -->
        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>

    <!-- 报名活动弹窗 -->
    <view v-if="showApplyModal" class="modal-mask" @tap.self="showApplyModal = false">
      <view class="modal-box">
        <view class="modal-header">
          <text class="modal-title">申请报名活动</text>
          <text class="modal-close" @tap="showApplyModal = false">✕</text>
        </view>

        <!-- 活动列表 / 当前报名 -->
        <scroll-view class="modal-scroll" scroll-y>
          <view class="modal-scroll-inner">
            <view v-if="applyLoading" class="modal-loading">
              <text>加载中...</text>
            </view>
            <view v-else-if="myActiveRegistration" class="active-reg-block">
              <view class="active-reg-title">当前报名</view>
              <view class="active-reg-card">
                <view class="active-reg-name">{{ myActiveRegistration.activity_name }}</view>
                <view class="active-reg-date">📅 {{ myActiveRegistration.schedule_date }}</view>
                <view v-if="myActiveRegistration.schedule_location" class="active-reg-loc">📍 {{ myActiveRegistration.schedule_location }}</view>
                <view class="active-reg-pos">岗位：{{ myActiveRegistration.position_name }}</view>
              </view>
              <view class="active-reg-tip">每人同一时期只能报名一个活动，排期结束后可报名其他活动</view>
              <button
                class="t-button t-button--theme-danger t-button--block cancel-btn"
                :disabled="cancelSubmitting"
                @tap="cancelRegistration"
              >
                <span class="t-button__text">{{ cancelSubmitting ? '取消中...' : '取消当前报名' }}</span>
              </button>
            </view>
            <view v-else-if="availableActivities.length === 0" class="modal-empty">
              <text>暂无可报名的活动</text>
            </view>
            <view v-else>
              <view
                v-for="act in availableActivities"
                :key="act.id"
                class="apply-activity-card"
                :class="{ 'selected': selectedActivity?.id === act.id }"
                @tap="selectActivity(act)"
              >
                <view class="apply-act-header">
                  <view class="apply-act-name">{{ act.schedule_name }}</view>
                  <view class="apply-act-date">{{ act.schedule_date }}</view>
                </view>
                <view v-if="act.schedule_location" class="apply-act-loc">📍 {{ act.schedule_location }}</view>

                <!-- 岗位列表 -->
                <view class="apply-positions">
                  <view
                    v-for="pos in act.positions"
                    :key="pos.name"
                    class="position-item"
                    :class="{
                      'position-full': pos.remaining <= 0,
                      'position-locked': !pos.can_apply,
                      'position-selected': selectedActivity?.id === act.id && selectedPosition === pos.name
                    }"
                    @tap.stop="selectPosition(act, pos)"
                  >
                    <view class="pos-name">{{ pos.name }}</view>
                    <view class="pos-info">
                      <!-- 等级门槛提示 -->
                      <text v-if="!pos.can_apply" class="pos-lock-tip">
                        🔒 需{{ pos.required_level_name }}
                      </text>
                      <text v-else-if="pos.remaining <= 0" class="pos-quota pos-full">已满</text>
                      <text v-else class="pos-quota">余{{ pos.remaining }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <!-- 确认报名按钮（无当前报名时才显示） -->
        <view v-if="!myActiveRegistration" class="modal-footer">
          <button
            class="t-button t-button--theme-primary t-button--block"
            :disabled="!selectedActivity || !selectedPosition"
            @tap="confirmApply"
          >
            <span class="t-button__text">
              {{ applySubmitting ? '报名中...' : (selectedPosition ? `报名「${selectedPosition}」岗位` : '请选择岗位') }}
            </span>
          </button>
        </view>
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
import { AmbassadorApi } from '@/api'
import type { ActivityRecord, ActivityStats, AvailableActivity, ActivityPosition, MyActiveRegistration } from '@/api/types/ambassador'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--window-top))'
})

// 页面头部高度
const pageHeaderHeight = ref(64)

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

// 活动统计数据
const activityStats = ref<ActivityStats>({
  total_count: 0,
  total_merit_points: 0,
  month_count: 0,
  type_stats: {}
})

// 活动记录列表
const activityRecords = ref<ActivityRecord[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

// 加载活动统计
const loadActivityStats = async () => {
  try {
    const stats = await AmbassadorApi.getActivityStats()
    activityStats.value = stats
  } catch (error) {
    console.error('加载活动统计失败:', error)
  }
}

// 加载活动记录
const loadActivityRecords = async (activityType?: number) => {
  if (loading.value || !hasMore.value) return

  try {
    loading.value = true
    const result = await AmbassadorApi.getActivityRecords({
      activity_type: activityType || 0,
      page: page.value,
      page_size: pageSize.value
    })

    if (page.value === 1) {
      activityRecords.value = result.list
    } else {
      activityRecords.value.push(...result.list)
    }

    hasMore.value = activityRecords.value.length < result.total
    page.value++
  } catch (error) {
    console.error('加载活动记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取活动类型对应的值
const getActivityTypeValue = (tabValue: string): number => {
  const typeMap: Record<string, number> = {
    'all': 0, 'tutor': 1, 'volunteer': 2, 'salon': 3, 'other': 4
  }
  return typeMap[tabValue] || 0
}

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight

  loadActivityStats()
  loadActivityRecords()
})

onShow(() => {
  loadActivityStats()
})

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}

const tabs = ref([
  { label: '全部', value: 'all' },
  { label: '辅导员', value: 'tutor' },
  { label: '义工', value: 'volunteer' },
  { label: '沙龙', value: 'salon' },
  { label: '其他', value: 'other' }
])

const activeTab = ref('all')

const onTabChange = (value: string) => {
  activeTab.value = value
  page.value = 1
  hasMore.value = true
  activityRecords.value = []
  loadActivityRecords(getActivityTypeValue(value))
}

// 获取活动类型图标
const getActivityIcon = (type: number): string => {
  const iconMap: Record<number, string> = { 1: '👨‍🏫', 2: '🤝', 3: '🎉', 4: '✨' }
  return iconMap[type] || '✨'
}

// 获取活动类型渐变色
const getActivityGradient = (type: number): string => {
  const gradientMap: Record<number, string> = {
    1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    2: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    3: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    4: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  }
  return gradientMap[type] || 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
}

// ==================== 申请报名功能 ====================
const showApplyModal = ref(false)
const applyLoading = ref(false)
const availableActivities = ref<AvailableActivity[]>([])
const selectedActivity = ref<AvailableActivity | null>(null)
const selectedPosition = ref<string>('')
const applySubmitting = ref(false)
// 用户当前全局有效报名（跨活动唯一报名）
const myActiveRegistration = ref<MyActiveRegistration | null>(null)
const cancelSubmitting = ref(false)

// 打开报名弹窗
const goToApply = async () => {
  showApplyModal.value = true
  selectedActivity.value = null
  selectedPosition.value = ''
  await loadAvailableActivities()
}

// 加载可报名活动（同时获取用户全局报名状态）
const loadAvailableActivities = async () => {
  applyLoading.value = true
  try {
    const result = await AmbassadorApi.getAvailableActivities({ pageSize: 50 })
    availableActivities.value = result.list || []
    myActiveRegistration.value = result.my_active_registration || null
  } catch (error) {
    console.error('获取可报名活动失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    applyLoading.value = false
  }
}

// 取消当前报名
const cancelRegistration = async () => {
  if (!myActiveRegistration.value || cancelSubmitting.value) return

  uni.showModal({
    title: '取消报名',
    content: `确定要取消「${myActiveRegistration.value.activity_name}」的「${myActiveRegistration.value.position_name}」岗位报名吗？`,
    success: async (res) => {
      if (!res.confirm) return
      cancelSubmitting.value = true
      try {
        await AmbassadorApi.cancelActivityRegistration({
          activityId: myActiveRegistration.value!.activity_id
        })
        uni.showToast({ title: '已取消报名', icon: 'success' })
        // 刷新状态
        await loadAvailableActivities()
      } catch (error: any) {
        uni.showToast({ title: error?.message || '取消失败', icon: 'none' })
      } finally {
        cancelSubmitting.value = false
      }
    }
  })
}

// 选择活动
const selectActivity = (act: AvailableActivity) => {
  if (act.my_registration) return  // 已报名则不响应
  selectedActivity.value = act
  selectedPosition.value = ''
}

// 选择岗位（含等级门槛校验）
const selectPosition = (act: AvailableActivity, pos: ActivityPosition) => {
  // 等级门槛检查
  if (!pos.can_apply) {
    uni.showToast({
      title: `需要「${pos.required_level_name}」等级大使才能报名该岗位`,
      icon: 'none',
      duration: 2000
    })
    return
  }
  if (pos.remaining <= 0) {
    uni.showToast({ title: '该岗位名额已满', icon: 'none' })
    return
  }
  selectedActivity.value = act
  selectedPosition.value = pos.name
}

// 确认报名
const confirmApply = async () => {
  if (!selectedActivity.value || !selectedPosition.value) return
  if (applySubmitting.value) return

  applySubmitting.value = true
  try {
    await AmbassadorApi.applyForActivity({
      activityId: selectedActivity.value.id,
      positionName: selectedPosition.value
    })
    uni.showToast({ title: '报名成功', icon: 'success' })
    showApplyModal.value = false
    // 刷新活动列表
    loadAvailableActivities()
  } catch (error: any) {
    uni.showToast({ title: error?.message || '报名失败', icon: 'none' })
  } finally {
    applySubmitting.value = false
  }
}
</script>

<style scoped lang="scss">
.page {
  width: 100%;
  height: 100vh;
  background: #F5F5F5;
  position: relative;
}

.scroll-area {
  width: 100%;
}

.page-content {
  padding: 32rpx;
}

/* 申请报名入口横幅 */
.apply-banner {
  background: linear-gradient(135deg, #0052D9 0%, #266FE8 100%);
  border-radius: 24rpx;
  padding: 32rpx 40rpx;
  margin-bottom: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
}

.apply-banner-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.apply-banner-icon {
  font-size: 64rpx;
  flex-shrink: 0;
}

.apply-banner-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.apply-banner-desc {
  font-size: 24rpx;
  opacity: 0.85;
}

.apply-banner-arrow {
  font-size: 48rpx;
  opacity: 0.7;
}

/* 统计卡片 */
.stats-card {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 48rpx;
}

.stats-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 24rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32rpx;
}

.stats-item {
  text-align: center;
}

.stats-value {
  font-size: 56rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 8rpx;
}

.stats-text {
  font-size: 24rpx;
  color: #666;
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

.type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.type-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  text-align: center;
}

.type-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.type-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.type-count {
  font-size: 40rpx;
  font-weight: 600;
  color: #0052D9;
}

.activity-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  gap: 24rpx;
}

.activity-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.activity-desc {
  font-size: 24rpx;
  color: #999;
}

.activity-right {
  text-align: right;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.activity-amount {
  font-size: 36rpx;
  font-weight: 600;
  color: #00A870;
  margin-bottom: 4rpx;
}

.activity-label {
  font-size: 22rpx;
  color: #999;
}

.activity-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #999;
}

.activity-note {
  font-size: 24rpx;
  color: #666;
  line-height: 1.5;
  background: #F5F5F5;
  padding: 16rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
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

/* 报名弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.modal-box {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  height: 60vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 48rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  padding: 0 8rpx;
}

.modal-scroll {
  flex: 1;
  min-height: 0;
}

/* scroll-view 内容区，使用 padding 替代 scroll-view 上的 padding，确保小程序两侧对称 */
.modal-scroll-inner {
  padding: 24rpx 32rpx;
}

.modal-loading,
.modal-empty {
  text-align: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

.modal-footer {
  padding: 24rpx 32rpx 48rpx;
  border-top: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

/* 可报名活动卡片 */
.apply-activity-card {
  box-sizing: border-box;
  overflow: hidden;
  background: #f8f9fa;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.selected {
    border-color: #0052D9;
    background: #EEF3FF;
  }
}

.apply-act-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.apply-act-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.apply-act-date {
  font-size: 24rpx;
  color: #999;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.apply-act-loc {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.apply-act-registered {
  font-size: 26rpx;
  color: #00A870;
  padding: 12rpx 0;
}

/* 岗位列表 */
.apply-positions {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}

.position-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #fff;
  border: 2rpx solid #dcdcdc;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  cursor: pointer;
  transition: all 0.2s;

  &.position-full {
    opacity: 0.5;
    pointer-events: none;
  }

  &.position-locked {
    opacity: 0.55;
    background: #f5f5f5;
    border-color: #e0e0e0;
    cursor: not-allowed;
  }

  &.position-selected {
    border-color: #0052D9;
    background: #E6F4FF;
  }
}

.pos-name {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.pos-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.pos-quota {
  font-size: 20rpx;
  color: #999;

  &.pos-full {
    color: #E34D59;
  }
}

.pos-lock-tip {
  font-size: 20rpx;
  color: #E65100;
  white-space: nowrap;
}

/* 当前报名区块 */
.active-reg-block {
  padding: 8rpx 0 24rpx;
}

.active-reg-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.active-reg-card {
  background: #EEF3FF;
  border-radius: 16rpx;
  padding: 28rpx 32rpx;
  border: 2rpx solid #0052D9;
  margin-bottom: 20rpx;
}

.active-reg-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #0052D9;
  margin-bottom: 12rpx;
}

.active-reg-date,
.active-reg-loc {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.active-reg-pos {
  font-size: 26rpx;
  color: #333;
  margin-top: 12rpx;
  font-weight: 500;
}

.active-reg-tip {
  font-size: 22rpx;
  color: #999;
  line-height: 1.6;
  margin-bottom: 28rpx;
}

.cancel-btn {
  background: #fff !important;
  border: 2rpx solid #E34D59 !important;
  color: #E34D59 !important;
}
</style>
