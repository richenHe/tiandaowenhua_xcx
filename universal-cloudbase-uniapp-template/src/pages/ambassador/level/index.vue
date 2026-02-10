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
            <view style="font-size: 48rpx; font-weight: 700; margin-bottom: 16rpx;">🐦 青鸾大使</view>
            <view style="opacity: 0.95; font-size: 28rpx; margin-bottom: 32rpx;">当前等级 · 已推荐2人</view>
            <view style="padding: 24rpx; background: rgba(255,255,255,0.2); border-radius: 12rpx;">
              <view style="font-size: 24rpx; opacity: 0.9; margin-bottom: 8rpx;">成为大使时间</view>
              <view style="font-size: 28rpx; font-weight: 500;">2024-01-15</view>
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
                <view style="font-size: 48rpx; font-weight: 600; color: var(--td-brand-color); margin-bottom: 8rpx;">1250.0</view>
                <view style="font-size: 26rpx; color: var(--td-text-color-secondary);">功德分</view>
              </view>
            </view>
          </view>
          <view @tap="goToCashPoints">
            <view class="t-card t-card--bordered" style="cursor: pointer; transition: all 0.3s;">
              <view class="t-card__body" style="text-align: center; padding: 40rpx 24rpx;">
                <view style="font-size: 64rpx; margin-bottom: 16rpx;">💰</view>
                <view style="font-size: 48rpx; font-weight: 600; color: var(--td-success-color); margin-bottom: 8rpx;">1250.0</view>
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
        
        <!-- 准青鸾大使 -->
        <view class="t-card t-card--bordered mb-m">
          <view class="t-card__header">
            <view class="t-card__title">
              <text style="margin-right: 16rpx;">🥚</text>
              准青鸾大使
            </view>
            <text class="t-badge--standalone t-badge--theme-default t-badge--size-small">Level 1</text>
          </view>
          <view class="t-card__body">
            <view style="font-size: 26rpx; line-height: 1.8; color: var(--td-text-color-secondary);">
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">成为条件：</view>
              <view>• 购买密训班课程</view>
              <view>• 提交大使申请</view>
              <view>• 通过面试审核</view>
              
              <view class="t-divider" style="margin: 24rpx 0;"></view>
              
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">特殊说明：</view>
              <view>• <text style="color: var(--td-warning-color); font-weight: 500;">仅可推荐初探班学员</text></view>
              <view>• 可作为推荐人但暂无推广奖励</view>
              <view>• 无需签署协议</view>
              
              <view class="t-divider" style="margin: 24rpx 0;"></view>
              
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">升级条件：</view>
              <view>• 成功推荐1位学员购买初探班</view>
              <view>• 自动升级为青鸾大使</view>
            </view>
          </view>
        </view>

        <!-- 青鸾大使 -->
        <view class="t-card t-card--bordered mb-m current-level-highlight">
          <view class="t-card__header">
            <view class="t-card__title">
              <text style="margin-right: 16rpx;">🐦</text>
              青鸾大使
            </view>
            <text class="t-badge--standalone t-badge--theme-primary t-badge--size-small">Level 2</text>
          </view>
          <view class="t-card__body">
            <view style="font-size: 26rpx; line-height: 1.8; color: var(--td-text-color-secondary);">
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">成为条件：</view>
              <view>• 准青鸾推荐1个初探班学员</view>
              <view>• 签署《传播大使合作协议》</view>
              
              <view class="t-divider" style="margin: 24rpx 0;"></view>
              
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">权益说明：</view>
              <view>• 成为时获得1688冻结积分</view>
              <view>• 第1次推荐初探班解冻积分</view>
              <view>• 第2次起推荐获得功德分</view>
              <view>• 可推荐所有课程类型</view>
              <view>• 可担任辅导员获得功德分</view>
              
              <view class="t-divider" style="margin: 24rpx 0;"></view>
              
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">合同期：</view>
              <view>• 1年，到期需续签</view>
            </view>
          </view>
        </view>

        <!-- 鸿鹄大使 -->
        <view class="t-card t-card--bordered mb-m">
          <view class="t-card__header">
            <view class="t-card__title">
              <text style="margin-right: 16rpx;">🦅</text>
              鸿鹄大使
            </view>
            <text class="t-badge--standalone t-badge--theme-success t-badge--size-small">Level 3</text>
          </view>
          <view class="t-card__body">
            <view style="font-size: 26rpx; line-height: 1.8; color: var(--td-text-color-secondary);">
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">成为条件：</view>
              <view>• 已是青鸾大使</view>
              <view>• 支付9800元升级费用</view>
              <view>• 签署《鸿鹄大使补充协议》</view>
              
              <view class="t-divider" style="margin: 24rpx 0;"></view>
              
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">权益说明：</view>
              <view>• 获得10个初探班名额</view>
              <view>• 获得16880冻结积分</view>
              <view>• 推荐只获得积分（可提现）</view>
              <view>• 可担任辅导员获得功德分</view>
              
              <view class="t-divider" style="margin: 24rpx 0;"></view>
              
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">积分机制：</view>
              <view>• 推荐初探班：解冻1688积分</view>
              <view>• 推荐其他课程：直接发放20%积分</view>
              <view>• 解冻完毕后按比例持续获得</view>
            </view>
          </view>
        </view>

        <!-- 金凤大使 -->
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__header">
            <view class="t-card__title">
              <text style="margin-right: 16rpx;">🦚</text>
              金凤大使
            </view>
            <text class="t-badge--standalone t-badge--theme-warning t-badge--size-small">Level 4</text>
          </view>
          <view class="t-card__body">
            <view style="font-size: 26rpx; line-height: 1.8; color: var(--td-text-color-secondary);">
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">成为条件：</view>
              <view>• 感召到一定名额（具体待定）</view>
              
              <view class="t-divider" style="margin: 24rpx 0;"></view>
              
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">权益说明：</view>
              <view>• 推荐初探班：50%积分</view>
              <view>• 推荐密训班：40%积分</view>
              <view>• 推荐咨询：30%积分</view>
              <view>• 推荐顾问：5%积分</view>
              
              <view class="t-divider" style="margin: 24rpx 0;"></view>
              
              <view style="font-weight: 500; color: var(--td-text-color-primary); margin-bottom: 16rpx;">班主任要求：</view>
              <view>• 积极配合商学院工作</view>
              <view>• 不传播负面信息</view>
              <view>• 每月组织不低于3次沙龙</view>
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

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
})

// 用户信息
const userInfo = ref({
  ambassador_level: 0,
  level_name: '普通用户',
  created_at: ''
})

// 功德分和积分
const meritPoints = ref(0)
const cashPoints = ref(0)

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const profile = await UserApi.getProfile()
    userInfo.value = {
      ambassador_level: profile.ambassador_level,
      level_name: getLevelName(profile.ambassador_level),
      created_at: profile.created_at
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 加载功德分和积分
const loadPoints = async () => {
  try {
    const [merit, cash] = await Promise.all([
      UserApi.getMeritPoints(),
      UserApi.getCashPoints()
    ])
    meritPoints.value = merit.balance
    cashPoints.value = cash.available
  } catch (error) {
    console.error('加载积分信息失败:', error)
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

// 页面加载时获取数据
onMounted(() => {
  loadUserInfo()
  loadPoints()
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

