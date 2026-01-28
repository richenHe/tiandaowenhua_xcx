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
        <view class="level-card">
          <view class="level-icon">🐦</view>
          <view class="level-info">
            <view class="level-label">当前等级</view>
            <view class="level-name">青鸾大使</view>
            <view class="level-desc">已推荐2人</view>
          </view>
          <view class="level-date">
            <view class="date-label">成为大使时间</view>
            <view class="date-value">2024-01-15</view>
          </view>
        </view>

        <!-- 功德分与积分 -->
        <view class="section-title">💎 我的奖励</view>
        <view class="reward-grid">
          <view class="reward-card" @tap="goToMeritPoints">
            <view class="reward-icon">🙏</view>
            <view class="reward-value">1250.0</view>
            <view class="reward-label">功德分</view>
          </view>
          <view class="reward-card" @tap="goToCashPoints">
            <view class="reward-icon">💰</view>
            <view class="reward-value cash">1250.0</view>
            <view class="reward-label">可提现积分</view>
          </view>
        </view>

        <!-- 快捷入口 -->
        <view class="section-title">🚀 快捷入口</view>
        <view class="action-grid-3">
          <button class="action-btn primary" @tap="goToTeam">
            👥 我的团队
          </button>
          <button class="action-btn primary" @tap="goToQrcode">
            📱 推广二维码
          </button>
          <button class="action-btn primary" @tap="goToApply">
            📝 申请大使
          </button>
        </view>
        
        <view class="action-grid">
          <button class="action-btn default" @tap="goToUpgradeGuide">
            🚀 升级指南
          </button>
          <button class="action-btn default" @tap="goToActivityRecords">
            📋 活动记录
          </button>
        </view>

        <!-- 等级体系 -->
        <view class="section-title">📊 等级体系</view>
        
        <!-- 准青鸾大使 -->
        <view class="level-system-card">
          <view class="card-header">
            <view class="card-title">
              <text class="title-icon">🥚</text>
              <text>准青鸾大使</text>
            </view>
            <view class="level-badge default">Level 1</view>
          </view>
          <view class="card-body">
            <view class="info-section">
              <view class="info-title">成为条件：</view>
              <view class="info-item">• 购买密训班课程</view>
              <view class="info-item">• 提交大使申请</view>
              <view class="info-item">• 通过面试审核</view>
            </view>
            <view class="divider"></view>
            <view class="info-section">
              <view class="info-title">特殊说明：</view>
              <view class="info-item warning">• 仅可推荐初探班学员</view>
              <view class="info-item">• 可作为推荐人但暂无推广奖励</view>
              <view class="info-item">• 无需签署协议</view>
            </view>
            <view class="divider"></view>
            <view class="info-section">
              <view class="info-title">升级条件：</view>
              <view class="info-item">• 成功推荐1位学员购买初探班</view>
              <view class="info-item">• 自动升级为青鸾大使</view>
            </view>
          </view>
        </view>

        <!-- 青鸾大使 -->
        <view class="level-system-card active">
          <view class="card-header">
            <view class="card-title">
              <text class="title-icon">🐦</text>
              <text>青鸾大使</text>
            </view>
            <view class="level-badge primary">Level 2</view>
          </view>
          <view class="card-body">
            <view class="info-section">
              <view class="info-title">成为条件：</view>
              <view class="info-item">• 准青鸾推荐1个初探班学员</view>
              <view class="info-item">• 签署《传播大使合作协议》</view>
            </view>
            <view class="divider"></view>
            <view class="info-section">
              <view class="info-title">权益说明：</view>
              <view class="info-item">• 成为时获得1688冻结积分</view>
              <view class="info-item">• 第1次推荐初探班解冻积分</view>
              <view class="info-item">• 第2次起推荐获得功德分</view>
              <view class="info-item">• 可推荐所有课程类型</view>
              <view class="info-item">• 可担任辅导员获得功德分</view>
            </view>
            <view class="divider"></view>
            <view class="info-section">
              <view class="info-title">合同期：</view>
              <view class="info-item">• 1年，到期需续签</view>
            </view>
          </view>
        </view>

        <!-- 鸿鹄大使 -->
        <view class="level-system-card">
          <view class="card-header">
            <view class="card-title">
              <text class="title-icon">🦅</text>
              <text>鸿鹄大使</text>
            </view>
            <view class="level-badge success">Level 3</view>
          </view>
          <view class="card-body">
            <view class="info-section">
              <view class="info-title">成为条件：</view>
              <view class="info-item">• 已是青鸾大使</view>
              <view class="info-item">• 支付9800元升级费用</view>
              <view class="info-item">• 签署《鸿鹄大使补充协议》</view>
            </view>
            <view class="divider"></view>
            <view class="info-section">
              <view class="info-title">权益说明：</view>
              <view class="info-item">• 获得10个初探班名额</view>
              <view class="info-item">• 获得16880冻结积分</view>
              <view class="info-item">• 推荐只获得积分（可提现）</view>
              <view class="info-item">• 可担任辅导员获得功德分</view>
            </view>
            <view class="divider"></view>
            <view class="info-section">
              <view class="info-title">积分机制：</view>
              <view class="info-item">• 推荐初探班：解冻1688积分</view>
              <view class="info-item">• 推荐其他课程：直接发放20%积分</view>
              <view class="info-item">• 解冻完毕后按比例持续获得</view>
            </view>
          </view>
        </view>

        <!-- 金凤大使 -->
        <view class="level-system-card">
          <view class="card-header">
            <view class="card-title">
              <text class="title-icon">🦚</text>
              <text>金凤大使</text>
            </view>
            <view class="level-badge warning">Level 4</view>
          </view>
          <view class="card-body">
            <view class="info-section">
              <view class="info-title">成为条件：</view>
              <view class="info-item">• 感召到一定名额（具体待定）</view>
            </view>
            <view class="divider"></view>
            <view class="info-section">
              <view class="info-title">权益说明：</view>
              <view class="info-item">• 推荐初探班：50%积分</view>
              <view class="info-item">• 推荐密训班：40%积分</view>
              <view class="info-item">• 推荐咨询：30%积分</view>
              <view class="info-item">• 推荐顾问：5%积分</view>
            </view>
            <view class="divider"></view>
            <view class="info-section">
              <view class="info-title">班主任要求：</view>
              <view class="info-item">• 积极配合商学院工作</view>
              <view class="info-item">• 不传播负面信息</view>
              <view class="info-item">• 每月组织不低于3次沙龙</view>
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
import { ref, computed } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
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

.level-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 48rpx;
  color: #fff;
}

.level-icon {
  font-size: 96rpx;
  margin-bottom: 24rpx;
}

.level-info {
  margin-bottom: 32rpx;
}

.level-label {
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 8rpx;
}

.level-name {
  font-size: 48rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.level-desc {
  font-size: 28rpx;
  opacity: 0.95;
}

.level-date {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12rpx;
  padding: 24rpx;
}

.date-label {
  font-size: 24rpx;
  opacity: 0.9;
  margin-bottom: 8rpx;
}

.date-value {
  font-size: 28rpx;
  font-weight: 500;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.reward-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.reward-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 24rpx;
  text-align: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.reward-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.reward-value {
  font-size: 48rpx;
  font-weight: 600;
  color: #0052D9;
  margin-bottom: 8rpx;
  
  &.cash {
    color: #00A870;
  }
}

.reward-label {
  font-size: 26rpx;
  color: #999;
}

.action-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.action-btn {
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.primary {
    background: #E6F4FF;
    color: #0052D9;
    border: none;
  }
  
  &.default {
    background: #fff;
    color: #333;
    border: 2rpx solid #E5E5E5;
  }
  
  &::after {
    border: none;
  }
}

.level-system-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  
  &.active {
    border: 4rpx solid #0052D9;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 2rpx solid #F5F5F5;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.title-icon {
  margin-right: 16rpx;
  font-size: 36rpx;
}

.level-badge {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 22rpx;
  font-weight: 500;
  
  &.default {
    background: #F5F5F5;
    color: #666;
  }
  
  &.primary {
    background: #E6F4FF;
    color: #0052D9;
  }
  
  &.success {
    background: #E8F8F2;
    color: #00A870;
  }
  
  &.warning {
    background: #FFF4E5;
    color: #E37318;
  }
}

.card-body {
  padding: 32rpx;
}

.info-section {
  margin-bottom: 24rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.info-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
}

.info-item {
  font-size: 26rpx;
  color: #666;
  line-height: 1.8;
  margin-bottom: 8rpx;
  
  &.warning {
    color: #E37318;
    font-weight: 500;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
}

.divider {
  height: 2rpx;
  background: #F5F5F5;
  margin: 24rpx 0;
}
</style>

