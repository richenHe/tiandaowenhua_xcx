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
          <view class="alert-icon">ℹ️</view>
          <view class="alert-content">
            <view class="alert-message">
              <text style="font-weight: 500;">活动类型：</text>辅导员、会务义工、沙龙组织、其他<br/>
              <text style="font-weight: 500;">功德分奖励：</text>根据活动类型和时长发放<br/>
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
          <text class="empty-icon">📦</text>
          <text class="empty-text">暂无活动记录</text>
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
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import { AmbassadorApi } from '@/api'
import type { ActivityRecord, ActivityStats } from '@/api/types/ambassador'

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
    uni.showLoading({ title: '加载中...' })
    const stats = await AmbassadorApi.getActivityStats()
    activityStats.value = stats
    uni.hideLoading()
  } catch (error) {
    console.error('加载活动统计失败:', error)
    uni.hideLoading()
  }
}

// 加载活动记录
const loadActivityRecords = async (activityType?: number) => {
  if (loading.value || !hasMore.value) return

  try {
    uni.showLoading({ title: '加载中...' })
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
    uni.hideLoading()
  } catch (error) {
    console.error('加载活动记录失败:', error)
    uni.hideLoading()
  } finally {
    loading.value = false
  }
}

// 获取活动类型对应的值（与数据库 ambassador_activity_records.activity_type 一致：1辅导员/2会务义工/3沙龙组织/4其他）
const getActivityTypeValue = (tabValue: string): number => {
  const typeMap: Record<string, number> = {
    'all': 0,
    'tutor': 1,
    'volunteer': 2,
    'salon': 3,
    'other': 4
  }
  return typeMap[tabValue] || 0
}

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight

  // 加载数据
  loadActivityStats()
  loadActivityRecords()
})

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}

// tabs 与数据库 ambassador_activity_records.activity_type 对齐：1辅导员/2会务义工/3沙龙组织/4其他
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
  const iconMap: Record<number, string> = {
    1: '👨‍🏫',
    2: '🤝',
    3: '🎉',
    4: '✨'
  }
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

.tabs-wrapper {
  margin-bottom: 32rpx;
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

.activity-badges {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.badge {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 20rpx;
  
  &.success {
    background: #E8F8F2;
    color: #00A870;
  }
  
  &.primary {
    background: #E6F4FF;
    color: #0052D9;
  }
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
}

</style>

