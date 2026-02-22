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
                <view style="font-size: 48rpx; font-weight: 600; color: var(--td-brand-color); margin-bottom: 8rpx;">{{ meritPoints }}</view>
                <view style="font-size: 26rpx; color: var(--td-text-color-secondary);">功德分</view>
              </view>
            </view>
          </view>
          <view @tap="goToCashPoints">
            <view class="t-card t-card--bordered" style="cursor: pointer; transition: all 0.3s;">
              <view class="t-card__body" style="text-align: center; padding: 40rpx 24rpx;">
                <view style="font-size: 64rpx; margin-bottom: 16rpx;">💰</view>
                <view style="font-size: 48rpx; font-weight: 600; color: var(--td-success-color); margin-bottom: 8rpx;">{{ cashPoints }}</view>
                <view style="font-size: 26rpx; color: var(--td-text-color-secondary);">可提现积分</view>
              </view>
            </view>
          </view>
        </view>

        <!-- 快捷入口 -->
        <view style="display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx; margin-bottom: 48rpx;">
          <view @tap="goToUpgradeGuide">
            <button class="t-button t-button--theme-primary t-button--variant-outline t-button--block">
              <span class="t-button__text">🚀 升级指南</span>
            </button>
          </view>
          <view @tap="goToActivityRecords">
            <button class="t-button t-button--theme-default t-button--variant-outline t-button--block">
              <span class="t-button__text">📋 活动记录</span>
            </button>
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
              <!-- 等级描述 -->
              <view v-if="level.level_desc" style="margin-bottom: 24rpx; font-size: 28rpx; color: var(--td-text-color-primary);">
                {{ level.level_desc }}
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

              <!-- 权益说明 -->
              <view v-if="level.benefits && level.benefits.length > 0">
                <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">
                  {{ level.level === 0 ? '基础权益：' : '等级权益：' }}
                </view>
                <view v-for="(benefit, idx) in level.benefits" :key="idx">
                  • {{ benefit }}
                </view>
              </view>
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
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { UserApi, AmbassadorApi } from '@/api'
import type { LevelConfig } from '@/api/types/ambassador'

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
    4: '🦚'
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
</style>

