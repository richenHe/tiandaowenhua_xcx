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
        <view class="apply-banner">
          <!-- 动态光晕扫光层 -->
          <view class="apply-banner-shimmer" />
          <!-- 装饰粒子 -->
          <view class="apply-banner-particle p1" />
          <view class="apply-banner-particle p2" />
          <view class="apply-banner-particle p3" />
          <view class="apply-banner-particle p4" />
          <!-- 内容 -->
          <view class="apply-banner-left" @tap="goToApply">
            <view class="apply-banner-icon-wrap">
              <view class="apply-banner-icon-glow" />
              <view class="apply-banner-icon">🎯</view>
            </view>
            <view>
              <view class="apply-banner-title">申请报名活动</view>
              <view class="apply-banner-desc">查看可报名的活动岗位，获得功德分奖励</view>
            </view>
          </view>
          <view class="apply-banner-right">
            <view class="my-reg-btn" @tap.stop="openMyRegistrations">
              <text class="my-reg-btn-text">我的报名</text>
            </view>
            <view class="apply-banner-arrow-wrap" @tap="goToApply">
              <view class="apply-banner-arrow">›</view>
            </view>
          </view>
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
              <text style="font-weight: 500;">活动类型：</text>辅导员、会务义工、沙龙组织、统筹、主持、其他<br/>
              <text style="font-weight: 500;">功德分奖励：</text>根据活动岗位发放<br/>
              <text style="font-weight: 500;">适用等级：</text>所有大使都可以参与活动获得功德分
            </view>
          </view>
        </view>

        <!-- 活动类型统计 -->
        <view class="t-section-title t-section-title--simple">📈 活动类型分布</view>
        <view class="type-grid">
          <view class="type-card">
            <view class="type-icon">📋</view>
            <view class="type-label">统筹</view>
            <view class="type-count">{{ activityStats.type_stats[5] || 0 }}次</view>
          </view>
          <view class="type-card">
            <view class="type-icon">🎤</view>
            <view class="type-label">主持</view>
            <view class="type-count">{{ activityStats.type_stats[6] || 0 }}次</view>
          </view>
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

        <!-- 活动列表 -->
        <scroll-view class="modal-scroll" scroll-y>
          <view class="modal-scroll-inner">
            <view v-if="applyLoading" class="modal-loading">
              <text>加载中...</text>
            </view>
            <view v-else-if="availableActivities.length === 0" class="modal-empty">
              <text>暂无可报名的活动，请先预约课程排期</text>
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

        <!-- 确认报名按钮 -->
        <view class="modal-footer">
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
    <!-- 我的报名列表弹窗 -->
    <view v-if="showMyRegModal" class="modal-mask" @tap.self="showMyRegModal = false">
      <view class="modal-box">
        <view class="modal-header">
          <text class="modal-title">我的报名</text>
          <text class="modal-close" @tap="showMyRegModal = false">✕</text>
        </view>
        <scroll-view class="modal-scroll" scroll-y>
          <view class="modal-scroll-inner">
            <view v-if="myRegLoading" class="modal-loading">
              <text>加载中...</text>
            </view>
            <view v-else-if="myRegistrations.length === 0" class="modal-empty">
              <text>暂无活动报名</text>
            </view>
            <view v-else>
              <view v-for="reg in myRegistrations" :key="reg.registration_id" class="my-reg-card">
                <view class="my-reg-info">
                  <view class="my-reg-name">{{ reg.activity_name }}</view>
                  <view class="my-reg-meta">📅 {{ reg.schedule_date }}</view>
                  <view v-if="reg.schedule_location" class="my-reg-meta">📍 {{ reg.schedule_location }}</view>
                  <view class="my-reg-pos">岗位：{{ reg.position_name }}</view>
                </view>
                <view class="my-reg-action">
                  <button
                    v-if="reg.activity_status === 1"
                    class="t-button t-button--theme-danger t-button--size-small cancel-reg-btn"
                    :disabled="cancelSubmitting"
                    @tap="cancelMyRegistration(reg)"
                  >
                    <span class="t-button__text">取消</span>
                  </button>
                  <view v-else class="my-reg-closed">已截止</view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
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
import type { ActivityRecord, ActivityStats, AvailableActivity, ActivityPosition, MyRegistrationItem } from '@/api/types/ambassador'

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
      activityType: activityType || 0,
      page: page.value,
      pageSize: pageSize.value
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
    'all': 0, 'tutor': 1, 'volunteer': 2, 'salon': 3, 'other': 4, 'coordinator': 5, 'host': 6
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
  { label: '统筹', value: 'coordinator' },
  { label: '主持', value: 'host' },
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
  const iconMap: Record<number, string> = { 1: '👨‍🏫', 2: '🤝', 3: '🎉', 4: '✨', 5: '📋', 6: '🎤' }
  return iconMap[type] || '✨'
}

// 获取活动类型渐变色
const getActivityGradient = (type: number): string => {
  const gradientMap: Record<number, string> = {
    1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    2: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    3: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    4: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    5: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    6: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)'
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
const cancelSubmitting = ref(false)

// 我的报名列表
const showMyRegModal = ref(false)
const myRegLoading = ref(false)
const myRegistrations = ref<MyRegistrationItem[]>([])

// 打开报名弹窗
const goToApply = async () => {
  showApplyModal.value = true
  selectedActivity.value = null
  selectedPosition.value = ''
  await loadAvailableActivities()
}

// 加载可报名活动
const loadAvailableActivities = async () => {
  applyLoading.value = true
  try {
    const result = await AmbassadorApi.getAvailableActivities({ pageSize: 50 })
    availableActivities.value = result.list || []
  } catch (error) {
    console.error('获取可报名活动失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    applyLoading.value = false
  }
}

// 打开我的报名列表
const openMyRegistrations = async () => {
  showMyRegModal.value = true
  myRegLoading.value = true
  try {
    const result = await AmbassadorApi.getMyRegistrations()
    myRegistrations.value = result.list || []
  } catch (error) {
    console.error('获取报名列表失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    myRegLoading.value = false
  }
}

// 取消某条报名
const cancelMyRegistration = async (reg: MyRegistrationItem) => {
  if (cancelSubmitting.value) return

  uni.showModal({
    title: '取消报名',
    content: `确定要取消「${reg.activity_name}」的「${reg.position_name}」岗位报名吗？`,
    success: async (res) => {
      if (!res.confirm) return
      cancelSubmitting.value = true
      try {
        await AmbassadorApi.cancelActivityRegistration({
          activityId: reg.activity_id
        })
        uni.showToast({ title: '已取消报名', icon: 'success' })
        await openMyRegistrations()
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
    const msg = error?.message || '报名失败，请稍后重试'
    uni.showModal({ title: '提示', content: msg, showCancel: false })
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

/* ===== 申请报名入口横幅 + 动态特效 ===== */

@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes shimmerSweep {
  0%   { transform: translateX(-120%); }
  100% { transform: translateX(320%); }
}

@keyframes particleFloat {
  0%   { transform: translateY(0) scale(1); opacity: 0.6; }
  50%  { transform: translateY(-20rpx) scale(1.3); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 0.6; }
}

@keyframes iconPulse {
  0%   { transform: scale(1) rotate(0deg); }
  25%  { transform: scale(1.12) rotate(-8deg); }
  50%  { transform: scale(1.08) rotate(6deg); }
  75%  { transform: scale(1.15) rotate(-4deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes glowPulse {
  0%   { opacity: 0.5; transform: scale(1); }
  50%  { opacity: 1; transform: scale(1.4); }
  100% { opacity: 0.5; transform: scale(1); }
}

@keyframes arrowBounce {
  0%   { transform: translateX(0); }
  40%  { transform: translateX(8rpx); }
  60%  { transform: translateX(2rpx); }
  80%  { transform: translateX(6rpx); }
  100% { transform: translateX(0); }
}

@keyframes bannerGlow {
  0%   { box-shadow: 0 8rpx 40rpx rgba(0, 82, 217, 0.35); }
  50%  { box-shadow: 0 12rpx 60rpx rgba(38, 111, 232, 0.55), 0 0 40rpx rgba(120, 180, 255, 0.25); }
  100% { box-shadow: 0 8rpx 40rpx rgba(0, 82, 217, 0.35); }
}

.apply-banner {
  background: linear-gradient(135deg, #003BB5 0%, #0052D9 30%, #266FE8 65%, #4D9BFF 100%);
  background-size: 200% 200%;
  border-radius: 24rpx;
  padding: 36rpx 40rpx;
  margin-bottom: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  position: relative;
  overflow: hidden;
  animation: gradientShift 4s ease infinite, bannerGlow 3s ease-in-out infinite;
}

/* 扫光效果 */
.apply-banner-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 30%;
  height: 100%;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(255, 255, 255, 0.18) 50%,
    transparent 80%
  );
  animation: shimmerSweep 3s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

/* 装饰粒子通用样式 */
.apply-banner-particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1;
  background: rgba(255, 255, 255, 0.7);
}

.apply-banner-particle.p1 {
  width: 12rpx;
  height: 12rpx;
  top: 24rpx;
  right: 120rpx;
  animation: particleFloat 2.2s ease-in-out infinite;
}

.apply-banner-particle.p2 {
  width: 8rpx;
  height: 8rpx;
  bottom: 28rpx;
  right: 180rpx;
  animation: particleFloat 2.8s ease-in-out infinite 0.5s;
  background: rgba(255, 255, 255, 0.5);
}

.apply-banner-particle.p3 {
  width: 16rpx;
  height: 16rpx;
  top: 50%;
  right: 80rpx;
  background: rgba(255, 230, 100, 0.8);
  animation: particleFloat 3.2s ease-in-out infinite 1s;
}

.apply-banner-particle.p4 {
  width: 10rpx;
  height: 10rpx;
  top: 30rpx;
  right: 200rpx;
  background: rgba(180, 220, 255, 0.9);
  animation: particleFloat 2.5s ease-in-out infinite 1.5s;
}

.apply-banner-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  position: relative;
  z-index: 2;
  flex: 1;
  min-width: 0;
}

.apply-banner-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
  position: relative;
  z-index: 2;
  flex-shrink: 0;
}

.my-reg-btn {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 24rpx;
  padding: 10rpx 24rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.4);
}

.my-reg-btn-text {
  font-size: 22rpx;
  color: #fff;
  white-space: nowrap;
}

/* 图标容器 */
.apply-banner-icon-wrap {
  position: relative;
  flex-shrink: 0;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图标光晕背景 */
.apply-banner-icon-glow {
  position: absolute;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  animation: glowPulse 2s ease-in-out infinite;
}

.apply-banner-icon {
  font-size: 56rpx;
  animation: iconPulse 3.5s ease-in-out infinite;
  display: block;
  position: relative;
  z-index: 1;
}

.apply-banner-title {
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.apply-banner-desc {
  font-size: 24rpx;
  opacity: 0.9;
}

/* 箭头容器 */
.apply-banner-arrow-wrap {
  position: relative;
  z-index: 2;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.apply-banner-arrow {
  font-size: 40rpx;
  font-weight: 700;
  animation: arrowBounce 1.8s ease-in-out infinite;
  display: block;
  line-height: 1;
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
  grid-template-columns: repeat(3, 1fr);
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

/* 我的报名列表卡片 */
.my-reg-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-radius: 16rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
}

.my-reg-info {
  flex: 1;
  min-width: 0;
}

.my-reg-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.my-reg-meta {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.my-reg-pos {
  font-size: 24rpx;
  color: #0052D9;
  margin-top: 8rpx;
  font-weight: 500;
}

.my-reg-action {
  flex-shrink: 0;
  margin-left: 16rpx;
}

.cancel-reg-btn {
  background: #fff !important;
  border: 2rpx solid #E34D59 !important;
  color: #E34D59 !important;
  padding: 8rpx 24rpx !important;
  font-size: 22rpx !important;
}

.my-reg-closed {
  font-size: 22rpx;
  color: #999;
  padding: 8rpx 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
}
</style>
