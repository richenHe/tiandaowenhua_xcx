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
              <view class="stats-value">12</view>
              <view class="stats-text">累计活动</view>
            </view>
            <view class="stats-item">
              <view class="stats-value">3,850</view>
              <view class="stats-text">功德分</view>
            </view>
            <view class="stats-item">
              <view class="stats-value">5</view>
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
            <view class="type-count">5次</view>
          </view>
          <view class="type-card">
            <view class="type-icon">🤝</view>
            <view class="type-label">会务义工</view>
            <view class="type-count">4次</view>
          </view>
          <view class="type-card">
            <view class="type-icon">🎉</view>
            <view class="type-label">沙龙组织</view>
            <view class="type-count">2次</view>
          </view>
          <view class="type-card">
            <view class="type-icon">✨</view>
            <view class="type-label">其他活动</view>
            <view class="type-count">1次</view>
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

        <!-- 辅导员记录 -->
        <view class="activity-card">
          <view class="activity-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            👨‍🏫
          </view>
          <view class="activity-content">
            <view class="activity-header">
              <view class="activity-info">
                <view class="activity-title">担任辅导员</view>
                <view class="activity-desc">初探班第12期</view>
              </view>
              <view class="activity-right">
                <view class="activity-amount">+500.0</view>
                <view class="activity-label">功德分</view>
              </view>
            </view>
            <view class="activity-meta">
              <view class="meta-item">📍 北京市朝阳区</view>
              <view class="meta-item">⏰ 2024-01-15 09:00</view>
              <view class="meta-item">⏱️ 时长: 3天</view>
              <view class="meta-item">👥 学员: 30人</view>
            </view>
            <view class="activity-note">
              协助讲师教学，解答学员疑问，组织课堂讨论，效果良好
            </view>
          </view>
        </view>

        <!-- 会务义工记录 -->
        <view class="activity-card">
          <view class="activity-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            🤝
          </view>
          <view class="activity-content">
            <view class="activity-header">
              <view class="activity-info">
                <view class="activity-title">会务义工</view>
                <view class="activity-desc">商学院年度总结会</view>
              </view>
              <view class="activity-right">
                <view class="activity-amount">+300.0</view>
                <view class="activity-label">功德分</view>
              </view>
            </view>
            <view class="activity-meta">
              <view class="meta-item">📍 北京国际会议中心</view>
              <view class="meta-item">⏰ 2024-01-10 14:00</view>
              <view class="meta-item">⏱️ 时长: 5小时</view>
              <view class="meta-item">👥 参会: 200人</view>
            </view>
            <view class="activity-note">
              负责签到、场地布置、茶歇服务、会场秩序维护等工作
            </view>
          </view>
        </view>

        <!-- 沙龙组织记录 -->
        <view class="activity-card">
          <view class="activity-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
            🎉
          </view>
          <view class="activity-content">
            <view class="activity-header">
              <view class="activity-info">
                <view class="activity-title">组织沙龙活动</view>
                <view class="activity-desc">天道文化学习沙龙（第3期）</view>
              </view>
              <view class="activity-right">
                <view class="activity-amount">+800.0</view>
                <view class="activity-label">功德分</view>
              </view>
            </view>
            <view class="activity-meta">
              <view class="meta-item">📍 北京市海淀区</view>
              <view class="meta-item">⏰ 2024-01-08 15:00</view>
              <view class="meta-item">⏱️ 时长: 3小时</view>
              <view class="meta-item">👥 参与: 25人</view>
            </view>
            <view class="activity-note">
              策划组织线下学习沙龙，分享天道文化学习心得，促进学员交流
            </view>
            <view class="activity-badges">
              <view class="badge success">活动圆满</view>
              <view class="badge primary">好评率95%</view>
            </view>
          </view>
        </view>

        <!-- 其他活动记录 -->
        <view class="activity-card">
          <view class="activity-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
            ✨
          </view>
          <view class="activity-content">
            <view class="activity-header">
              <view class="activity-info">
                <view class="activity-title">协助推广活动</view>
                <view class="activity-desc">春季招生推广</view>
              </view>
              <view class="activity-right">
                <view class="activity-amount">+200.0</view>
                <view class="activity-label">功德分</view>
              </view>
            </view>
            <view class="activity-meta">
              <view class="meta-item">📍 线上活动</view>
              <view class="meta-item">⏰ 2024-01-05</view>
              <view class="meta-item">⏱️ 持续: 7天</view>
              <view class="meta-item">📈 转化: 12人</view>
            </view>
            <view class="activity-note">
              制作宣传素材，朋友圈推广，社群维护，成功转化12位学员
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view class="load-more">
          <button class="t-button t-button--theme-default t-button--variant-text">
            <span class="t-button__text">加载更多</span>
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

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--window-top))'
})

// 页面头部高度
const pageHeaderHeight = ref(64)

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight
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
  { label: '沙龙', value: 'salon' }
])

const activeTab = ref('all')

const onTabChange = (value: string) => {
  activeTab.value = value
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

