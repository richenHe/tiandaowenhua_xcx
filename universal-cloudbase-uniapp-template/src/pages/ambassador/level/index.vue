<template>
  <view class="page">
    <td-page-header title="大使等级" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 当前等级卡片 -->
        <view class="t-card t-card--bordered mb-l" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
          <view class="t-card__body">
            <view style="font-size: 48rpx; font-weight: 700; margin-bottom: 16rpx;">{{ getLevelIcon(userInfo.ambassador_level) }} {{ userInfo.level_name }}</view>
            <view style="opacity: 0.95; font-size: 28rpx; margin-bottom: 32rpx;">当前等级 · 已推荐{{ referralStats.total_referrals }}人</view>
            <view style="padding: 24rpx; background: rgba(255,255,255,0.2); border-radius: 12rpx;">
              <view style="font-size: 24rpx; opacity: 0.9; margin-bottom: 8rpx;">成为大使时间</view>
              <view style="font-size: 28rpx; font-weight: 500;">{{ referralStats.ambassador_start_date || '暂无' }}</view>
            </view>
          </view>
        </view>

        <!-- 功德分与积分 -->
        <view class="t-section-title t-section-title--simple">💎 我的奖励</view>
        <view style="display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx; margin-bottom: 48rpx;">
          <view @tap="goToMeritPoints">
            <view class="t-card t-card--bordered" style="cursor: pointer; transition: all 0.3s;">
              <view class="t-card__body" style="text-align: center; padding: 40rpx 24rpx;">
                <view style="font-size: 64rpx; margin-bottom: 16rpx;">🙏</view>
                <view style="font-size: 48rpx; font-weight: 600; color: var(--td-brand-color); margin-bottom: 8rpx;">{{ formatPoints(meritPoints) }}</view>
                <view style="font-size: 26rpx; color: var(--td-text-color-secondary);">功德分</view>
              </view>
            </view>
          </view>
          <view @tap="goToCashPoints">
            <view class="t-card t-card--bordered" style="cursor: pointer; transition: all 0.3s;">
              <view class="t-card__body" style="text-align: center; padding: 40rpx 24rpx;">
                <view style="font-size: 64rpx; margin-bottom: 16rpx;">💰</view>
                <view style="font-size: 48rpx; font-weight: 600; color: var(--td-success-color); margin-bottom: 8rpx;">{{ formatPoints(cashPoints) }}</view>
                <view style="font-size: 26rpx; color: var(--td-text-color-secondary);">可提现积分</view>
              </view>
            </view>
          </view>
        </view>

        <!-- 快捷入口 -->
        <view style="margin-bottom: 48rpx;">
          <!-- 升级指南 - 特效按钮 -->
          <view @tap="goToUpgradeGuide" class="upgrade-guide-wrapper" style="margin-bottom: 24rpx;">
            <view class="upgrade-glow-ring"></view>
            <view class="upgrade-guide-btn">
              <view class="upgrade-shimmer"></view>
              <view class="upgrade-particles">
                <text class="uparticle up1">◈</text>
                <text class="uparticle up2">⬡</text>
                <text class="uparticle up3">◈</text>
                <text class="uparticle up4">⬡</text>
              </view>
              <view class="upgrade-content">
                <view class="upgrade-icon-wrap">
                  <text class="upgrade-icon">🚀</text>
                </view>
                <view class="upgrade-text-wrap">
                  <view class="upgrade-title">升级指南</view>
                  <view class="upgrade-subtitle">快速晋升 · 解锁专属权益</view>
                </view>
                <view class="upgrade-arrow-wrap">
                  <view class="upgrade-new-badge">必看</view>
                  <text class="upgrade-arrow">›</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 活动报名 - 特效大按钮 -->
          <view @tap="goToActivityRecords" class="activity-signup-wrapper">
            <!-- 外层光晕层 -->
            <view class="activity-glow-ring"></view>
            <view class="activity-signup-btn">
              <!-- 流光动画层 -->
              <view class="activity-shimmer"></view>
              <!-- 粒子装饰 -->
              <view class="activity-particles">
                <text class="particle p1">✦</text>
                <text class="particle p2">★</text>
                <text class="particle p3">✦</text>
                <text class="particle p4">◆</text>
                <text class="particle p5">✦</text>
              </view>
              <!-- 内容区 -->
              <view class="activity-content">
                <view class="activity-icon-wrap">
                  <text class="activity-icon">🎪</text>
                </view>
                <view class="activity-text-wrap">
                  <view class="activity-title">活动报名</view>
                  <view class="activity-subtitle">精彩活动 · 火热进行中</view>
                </view>
                <view class="activity-arrow-wrap">
                  <view class="activity-hot-badge">HOT</view>
                  <text class="activity-arrow">›</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 等级体系 -->
        <view class="t-section-title t-section-title--simple">📊 等级体系</view>
        
        <!-- 动态渲染等级卡片 -->
        <view 
          v-for="level in levelSystem" 
          :key="level.id"
          class="t-card t-card--bordered mb-m"
          :class="{ 'current-level-highlight': level.level === userInfo.ambassador_level }"
        >
          <view class="t-card__header">
            <view class="t-card__title">
              <text style="margin-right: 16rpx;">{{ level.level_icon || getLevelIcon(level.level) }}</text>
              {{ level.level_name }}
            </view>
            <text 
              class="t-badge--standalone t-badge--size-small"
              :class="getBadgeTheme(level.level)"
            >
              Level {{ level.level }}
            </text>
          </view>
          <view class="t-card__body">
            <view style="font-size: 26rpx; line-height: 1.8; color: var(--td-text-color-secondary);">
              <!-- 等级描述（后台富文本，使用 rich-text 渲染） -->
              <view v-if="level.level_desc" class="level-desc-block">
                <rich-text :nodes="level.level_desc" />
              </view>

              <!-- 升级条件 -->
              <view v-if="level.upgrade_conditions && level.upgrade_conditions.length > 0">
                <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">
                  {{ level.level === 0 ? '成为条件：' : '升级条件：' }}
                </view>
                <view v-for="(condition, idx) in level.upgrade_conditions" :key="idx">
                  • {{ condition }}
                </view>
                <view class="t-divider" style="margin: 24rpx 0;"></view>
              </view>

              <!-- 升级权益文案（后台配置优先，title+富文本 desc） -->
              <template v-if="level.upgrade_benefits && level.upgrade_benefits.length > 0">
                <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">
                  {{ level.level === 0 ? '基础权益：' : '等级权益：' }}
                </view>
                <view
                  v-for="(item, idx) in level.upgrade_benefits"
                  :key="idx"
                  class="upgrade-benefit-item"
                >
                  <view class="upgrade-benefit-title">{{ item.title }}</view>
                  <rich-text v-if="item.desc" class="upgrade-benefit-desc" :nodes="item.desc" />
                </view>
              </template>

              <!-- 无后台权益文案时，展示自动计算的权益列表 -->
              <template v-else-if="level.benefits && level.benefits.length > 0">
                <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">
                  {{ level.level === 0 ? '基础权益：' : '等级权益：' }}
                </view>
                <view v-for="(benefit, idx) in level.benefits" :key="idx">
                  • {{ benefit }}
                </view>
              </template>
            </view>
          </view>
        </view>

        <!-- 底部留白 -->
        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { UserApi, AmbassadorApi } from '@/api'
import type { LevelConfig } from '@/api/types/ambassador'
import { formatPoints } from '@/utils'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
})

// 用户信息
const userInfo = ref({
  ambassador_level: 0,
  level_name: '普通用户',
  created_at: ''
})

// 推荐统计信息
const referralStats = ref({
  total_referrals: 0,
  ambassador_start_date: null as string | null,
  total_activity_count: 0
})

// 功德分和积分
const meritPoints = ref(0)
const cashPoints = ref(0)

// 等级体系配置
const levelSystem = ref<LevelConfig[]>([])
const nextLevel = ref<LevelConfig | null>(null)

// 加载用户信息
const loadUserInfo = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const profile = await UserApi.getProfile()
    userInfo.value = {
      ambassador_level: profile.ambassador_level,
      level_name: getLevelName(profile.ambassador_level),
      created_at: profile.created_at
    }
    uni.hideLoading()
  } catch (error) {
    console.error('加载用户信息失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  }
}

// 加载推荐统计信息
const loadReferralStats = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const stats = await UserApi.getReferralStats()
    referralStats.value = stats
    uni.hideLoading()
  } catch (error) {
    console.error('加载推荐统计失败:', error)
    uni.hideLoading()
  }
}

// 加载功德分和积分
const loadPoints = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const [merit, cash] = await Promise.all([
      UserApi.getMeritPoints(),
      UserApi.getCashPoints()
    ])
    meritPoints.value = merit.balance
    cashPoints.value = cash.available
    uni.hideLoading()
  } catch (error) {
    console.error('加载积分信息失败:', error)
    uni.hideLoading()
  }
}

// 加载等级体系配置
const loadLevelSystem = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await AmbassadorApi.getLevelSystem()
    levelSystem.value = result.levels || []
    nextLevel.value = result.next_level || null
    uni.hideLoading()
  } catch (error) {
    console.error('加载等级体系失败:', error)
    uni.hideLoading()
  }
}

// 获取等级名称
const getLevelName = (level: number): string => {
  const levelMap: Record<number, string> = {
    0: '普通用户',
    1: '准青鸾大使',
    2: '青鸾大使',
    3: '鸿鹄大使',
    4: '金凤大使'
  }
  return levelMap[level] || '普通用户'
}

// 获取等级图标
const getLevelIcon = (level: number): string => {
  const iconMap: Record<number, string> = {
    0: '🌿',
    1: '🥚',
    2: '🐦',
    3: '🦅',
    4: '🐦‍🔥'
  }
  return iconMap[level] || '🌿'
}

// 获取徽章主题色
const getBadgeTheme = (level: number): string => {
  const themeMap: Record<number, string> = {
    0: 't-badge--theme-default',
    1: 't-badge--theme-default',
    2: 't-badge--theme-primary',
    3: 't-badge--theme-warning',
    4: 't-badge--theme-success'
  }
  return themeMap[level] || 't-badge--theme-default'
}

// 页面加载时获取数据
onMounted(() => {
  loadUserInfo()
  loadReferralStats()
  loadPoints()
  loadLevelSystem()
})

onShow(() => {
  loadUserInfo()
  loadReferralStats()
  loadPoints()
  loadLevelSystem()
})

const goToMeritPoints = () => {
  uni.navigateTo({
    url: '/pages/ambassador/merit-points/index'
  })
}

const goToCashPoints = () => {
  uni.navigateTo({
    url: '/pages/ambassador/cash-points/index'
  })
}

const goToUpgradeGuide = () => {
  uni.navigateTo({
    url: '/pages/ambassador/upgrade-guide/index'
  })
}

const goToActivityRecords = () => {
  uni.navigateTo({
    url: '/pages/ambassador/activity-records/index'
  })
}

const goToTeam = () => {
  uni.navigateTo({
    url: '/pages/ambassador/team/index'
  })
}

const goToQrcode = () => {
  uni.navigateTo({
    url: '/pages/ambassador/qrcode/index'
  })
}

const goToApply = () => {
  uni.navigateTo({
    url: '/pages/ambassador/apply/index'
  })
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

.mb-l {
  margin-bottom: 32rpx;
}

.mb-m {
  margin-bottom: 24rpx;
}

// 当前等级高亮样式
.current-level-highlight {
  border: 4rpx solid #0052D9 !important;
  background: #F3F6FF !important;
}

// 等级描述富文本块
.level-desc-block {
  margin-bottom: 24rpx;
  font-size: 28rpx;
  color: var(--td-text-color-primary);
  line-height: 1.7;
}

// 后台配置的升级权益条目
.upgrade-benefit-item {
  margin-bottom: 16rpx;
  padding: 16rpx 20rpx;
  background: #F8F9FF;
  border-radius: 12rpx;

  .upgrade-benefit-title {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--td-text-color-primary);
    margin-bottom: 6rpx;
  }

  .upgrade-benefit-desc {
    font-size: 24rpx;
    color: var(--td-text-color-secondary);
    line-height: 1.6;
  }
}

// ===== 活动报名特效按钮 =====
@keyframes shimmer-flow {
  0% { transform: translateX(-100%) skewX(-20deg); }
  100% { transform: translateX(300%) skewX(-20deg); }
}

@keyframes glow-breathe {
  0%, 100% {
    box-shadow:
      0 0 24rpx rgba(220, 38, 38, 0.55),
      0 0 48rpx rgba(234, 88, 12, 0.35),
      0 0 80rpx rgba(251, 191, 36, 0.2);
  }
  50% {
    box-shadow:
      0 0 40rpx rgba(220, 38, 38, 0.75),
      0 0 70rpx rgba(234, 88, 12, 0.55),
      0 0 110rpx rgba(251, 191, 36, 0.35);
  }
}

@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.04); opacity: 0.25; }
}

@keyframes particle-float {
  0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
  50% { transform: translateY(-12rpx) scale(1.2); opacity: 1; }
}

@keyframes arrow-bounce {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(8rpx); }
}

@keyframes hot-badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.activity-signup-wrapper {
  position: relative;
  border-radius: 24rpx;
}

// 外层光晕环
.activity-glow-ring {
  position: absolute;
  inset: -6rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, #DC2626, #EA580C, #D97706, #F59E0B, #EA580C, #DC2626);
  background-size: 300% 300%;
  animation: ring-pulse 2.5s ease-in-out infinite;
  z-index: 0;
  opacity: 0.6;
}

.activity-signup-btn {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #7F1D1D 0%, #991B1B 15%, #B91C1C 30%, #C2410C 50%, #B45309 70%, #D97706 85%, #B45309 100%);
  background-size: 200% auto;
  animation: glow-breathe 2.5s ease-in-out infinite;
  padding: 36rpx 32rpx;
  active-opacity: 0.85;
}

// 流光效果层
.activity-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 60rpx;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  animation: shimmer-flow 3s ease-in-out infinite;
  pointer-events: none;
}

// 粒子装饰
.activity-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  color: rgba(255, 235, 59, 0.85);
  font-size: 22rpx;
  font-weight: 700;
}

.p1 { top: 12rpx; left: 20rpx; animation: particle-float 2.2s ease-in-out infinite 0s; }
.p2 { top: 14rpx; right: 120rpx; animation: particle-float 2.6s ease-in-out infinite 0.4s; font-size: 18rpx; }
.p3 { bottom: 14rpx; left: 80rpx; animation: particle-float 2.4s ease-in-out infinite 0.8s; }
.p4 { bottom: 16rpx; right: 160rpx; animation: particle-float 2.8s ease-in-out infinite 0.2s; font-size: 16rpx; }
.p5 { top: 50%; right: 220rpx; animation: particle-float 2s ease-in-out infinite 0.6s; font-size: 20rpx; }

// 内容区布局
.activity-content {
  display: flex;
  align-items: center;
  gap: 24rpx;
  position: relative;
  z-index: 2;
}

// 图标容器
.activity-icon-wrap {
  width: 88rpx;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.activity-icon {
  font-size: 44rpx;
}

// 文字区
.activity-text-wrap {
  flex: 1;
}

.activity-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #FFFBEB;
  letter-spacing: 4rpx;
  margin-bottom: 8rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.activity-subtitle {
  font-size: 24rpx;
  color: rgba(255, 235, 180, 0.9);
  letter-spacing: 2rpx;
}

// 右侧操作区
.activity-arrow-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}

// HOT 徽章
.activity-hot-badge {
  background: linear-gradient(135deg, #FFF176, #FFD700);
  color: #7C2D12;
  font-size: 20rpx;
  font-weight: 900;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  letter-spacing: 2rpx;
  animation: hot-badge-pulse 1.8s ease-in-out infinite;
  box-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.5);
}

// 箭头
.activity-arrow {
  font-size: 48rpx;
  font-weight: 300;
  color: rgba(255, 251, 235, 0.9);
  line-height: 1;
  animation: arrow-bounce 1.5s ease-in-out infinite;
}

// ===== 升级指南特效按钮 =====
@keyframes upgrade-glow-breathe {
  0%, 100% {
    box-shadow:
      0 0 24rpx rgba(79, 70, 229, 0.55),
      0 0 48rpx rgba(124, 58, 237, 0.35),
      0 0 80rpx rgba(6, 182, 212, 0.2);
  }
  50% {
    box-shadow:
      0 0 40rpx rgba(79, 70, 229, 0.75),
      0 0 70rpx rgba(124, 58, 237, 0.55),
      0 0 110rpx rgba(6, 182, 212, 0.35);
  }
}

@keyframes upgrade-ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.55; }
  50% { transform: scale(1.04); opacity: 0.2; }
}

@keyframes uparticle-float {
  0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.6; }
  50% { transform: translateY(-10rpx) rotate(180deg) scale(1.15); opacity: 1; }
}

@keyframes upgrade-badge-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

.upgrade-guide-wrapper {
  position: relative;
  border-radius: 24rpx;
}

.upgrade-glow-ring {
  position: absolute;
  inset: -6rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, #4F46E5, #7C3AED, #0891B2, #06B6D4, #7C3AED, #4F46E5);
  background-size: 300% 300%;
  animation: upgrade-ring-pulse 2.5s ease-in-out infinite;
  z-index: 0;
  opacity: 0.55;
}

.upgrade-guide-btn {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #1E1B4B 0%, #312E81 20%, #3730A3 40%, #1D4ED8 60%, #0369A1 80%, #0891B2 100%);
  background-size: 200% auto;
  animation: upgrade-glow-breathe 2.5s ease-in-out infinite;
  padding: 36rpx 32rpx;
}

.upgrade-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 60rpx;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(167, 243, 208, 0.3), transparent);
  animation: shimmer-flow 3.5s ease-in-out infinite 1.5s;
  pointer-events: none;
}

.upgrade-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.uparticle {
  position: absolute;
  color: rgba(165, 243, 252, 0.75);
  font-size: 20rpx;
}

.up1 { top: 14rpx; left: 18rpx; animation: uparticle-float 2.4s ease-in-out infinite 0s; }
.up2 { top: 16rpx; right: 130rpx; animation: uparticle-float 2.8s ease-in-out infinite 0.5s; font-size: 16rpx; }
.up3 { bottom: 16rpx; left: 90rpx; animation: uparticle-float 2.6s ease-in-out infinite 1s; }
.up4 { bottom: 18rpx; right: 170rpx; animation: uparticle-float 2.2s ease-in-out infinite 0.3s; font-size: 16rpx; }

.upgrade-content {
  display: flex;
  align-items: center;
  gap: 24rpx;
  position: relative;
  z-index: 2;
}

.upgrade-icon-wrap {
  width: 88rpx;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(165, 243, 252, 0.35);
  flex-shrink: 0;
}

.upgrade-icon {
  font-size: 44rpx;
}

.upgrade-text-wrap {
  flex: 1;
}

.upgrade-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #EFF6FF;
  letter-spacing: 4rpx;
  margin-bottom: 8rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.35);
}

.upgrade-subtitle {
  font-size: 24rpx;
  color: rgba(186, 230, 253, 0.9);
  letter-spacing: 2rpx;
}

.upgrade-arrow-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}

// 必看徽章
.upgrade-new-badge {
  background: linear-gradient(135deg, #A5F3FC, #67E8F9);
  color: #0C4A6E;
  font-size: 20rpx;
  font-weight: 900;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  letter-spacing: 2rpx;
  animation: upgrade-badge-pulse 2s ease-in-out infinite;
  box-shadow: 0 2rpx 8rpx rgba(6, 182, 212, 0.45);
}

.upgrade-arrow {
  font-size: 48rpx;
  font-weight: 300;
  color: rgba(224, 242, 254, 0.9);
  line-height: 1;
  animation: arrow-bounce 1.5s ease-in-out infinite 0.3s;
}
</style>

