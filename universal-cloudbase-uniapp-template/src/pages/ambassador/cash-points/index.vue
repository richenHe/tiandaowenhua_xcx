<template>
  <view class="page">
    <td-page-header title="积分管理" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 积分余额卡片 -->
        <view class="balance-card">
          <view class="balance-label">💰 总积分余额</view>
          <view class="balance-value">12,536.0</view>
          <view class="balance-stats">
            <view class="stat-item">
              <view class="stat-label">冻结积分</view>
              <view class="stat-value">5,064.0</view>
            </view>
            <view class="stat-item">
              <view class="stat-label">可提现积分</view>
              <view class="stat-value">7,472.0</view>
            </view>
          </view>
        </view>

        <!-- 积分机制说明 -->
        <view class="alert-box warning">
          <view class="alert-icon">⚠️</view>
          <view class="alert-content">
            <view class="alert-title">积分解冻机制</view>
            <view class="alert-message">
              <text style="font-weight: 500;">鸿鹄大使：</text>升级时获得16880冻结积分<br/>
              <text style="font-weight: 500;">解冻方式：</text>推荐初探班解冻1688积分<br/>
              <text style="font-weight: 500;">直接发放：</text>推荐密训班/咨询直接加可提现积分<br/>
              <text style="font-weight: 500;">解冻完毕后：</text>按比例持续获得可提现积分
            </view>
          </view>
        </view>

        <!-- 积分统计卡片 -->
        <view class="stats-grid">
          <view class="stats-card">
            <view class="stats-value success">15,250.0</view>
            <view class="stats-label">累计获得</view>
          </view>
          <view class="stats-card">
            <view class="stats-value error">2,714.0</view>
            <view class="stats-label">累计提现</view>
          </view>
        </view>

        <!-- 提现按钮 -->
        <button class="withdraw-btn" @tap="goToWithdraw">
          💸 申请提现（可提现: ¥7,472）
        </button>

        <!-- Tab切换 -->
        <view class="tabs-wrapper">
          <t-capsule-tabs :tabs="tabs" :activeTab="activeTab" @change="onTabChange" />
        </view>

        <!-- 积分明细列表 -->
        <view class="section-title">💰 明细记录</view>

        <!-- 升级获得冻结积分 -->
        <view class="record-card">
          <view class="record-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
            🎖️
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">升级鸿鹄大使</view>
                <view class="record-desc">获得冻结积分</view>
              </view>
              <view class="record-right">
                <view class="record-amount warning">+16,880.0</view>
                <view class="record-status frozen">冻结</view>
              </view>
            </view>
            <view class="record-footer">
              <text>升级记录: UP202401010001</text>
              <text>2024-01-01</text>
            </view>
          </view>
        </view>

        <!-- 推荐初探班解冻 -->
        <view class="record-card">
          <view class="record-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
            🔓
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">推荐初探班课程</view>
                <view class="record-desc">学员：王五 | 解冻积分</view>
              </view>
              <view class="record-right">
                <view class="record-amount success">+1,688.0</view>
                <view class="record-status available">可提现</view>
              </view>
            </view>
            <view class="record-footer">
              <text>订单号: 202401150001</text>
              <text>2024-01-15</text>
            </view>
          </view>
        </view>

        <!-- 推荐密训班直接发放 -->
        <view class="record-card">
          <view class="record-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            🎓
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">推荐密训班课程</view>
                <view class="record-desc">学员：李四 | 直接发放20%</view>
              </view>
              <view class="record-right">
                <view class="record-amount success">+7,777.6</view>
                <view class="record-status available">可提现</view>
              </view>
            </view>
            <view class="record-footer">
              <text>订单号: 202401120001</text>
              <text>2024-01-12</text>
            </view>
          </view>
        </view>

        <!-- 解冻完毕后继续获得 -->
        <view class="record-card">
          <view class="record-icon" style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);">
            💎
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">推荐初探班课程</view>
                <view class="record-desc">学员：赵六 | 按30%发放</view>
              </view>
              <view class="record-right">
                <view class="record-amount success">+506.4</view>
                <view class="record-status available">可提现</view>
              </view>
            </view>
            <view class="record-footer">
              <text>订单号: 202401080001</text>
              <text>2024-01-08</text>
            </view>
            <view class="record-tip success">
              <view class="tip-icon">✓</view>
              <view class="tip-text">冻结积分已全部解冻，持续获得可提现积分</view>
            </view>
          </view>
        </view>

        <!-- 提现记录 -->
        <view class="record-card">
          <view class="record-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            💸
          </view>
          <view class="record-content">
            <view class="record-header">
              <view class="record-info">
                <view class="record-title">提现到微信</view>
                <view class="record-desc">提现成功</view>
              </view>
              <view class="record-right">
                <view class="record-amount error">-1,000.0</view>
                <view class="record-badge success">已到账</view>
              </view>
            </view>
            <view class="record-footer">
              <text>提现单号: TX202401050001</text>
              <text>2024-01-05</text>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view class="load-more">
          <button class="load-more-btn">加载更多</button>
        </view>

        <!-- 底部留白 -->
        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部提现按钮 -->
    <view class="fixed-bottom">
      <button class="submit-btn" @tap="goToWithdraw">申请提现</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import TCapsuleTabs from '@/components/CapsuleTabs.vue'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height) - 120rpx)'
})

const tabs = ref([
  { label: '全部', value: 'all' },
  { label: '获得', value: 'earn' },
  { label: '解冻', value: 'unfreeze' },
  { label: '提现', value: 'withdraw' }
])

const activeTab = ref('all')

const onTabChange = (value: string) => {
  activeTab.value = value
}

const goToWithdraw = () => {
  uni.navigateTo({
    url: '/pages/ambassador/withdraw/index'
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

.balance-card {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 48rpx;
  color: #fff;
}

.balance-label {
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 16rpx;
}

.balance-value {
  font-size: 96rpx;
  font-weight: 700;
  margin-bottom: 32rpx;
}

.balance-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32rpx;
}

.stat-item {
  text-align: left;
}

.stat-label {
  font-size: 26rpx;
  opacity: 0.8;
  margin-bottom: 8rpx;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 600;
}

.alert-box {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 48rpx;
  display: flex;
  gap: 16rpx;
  
  &.warning {
    background: #FFF4E5;
  }
}

.alert-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.alert-message {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

.stats-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 24rpx;
  text-align: center;
}

.stats-value {
  font-size: 48rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
  
  &.success {
    color: #00A870;
  }
  
  &.error {
    color: #E34D59;
  }
}

.stats-label {
  font-size: 24rpx;
  color: #999;
}

.withdraw-btn {
  width: 100%;
  height: 88rpx;
  background: #FFF4E5;
  color: #E37318;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 500;
  margin-bottom: 48rpx;
  border: none;
  
  &::after {
    border: none;
  }
}

.tabs-wrapper {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.record-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  gap: 24rpx;
}

.record-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.record-desc {
  font-size: 24rpx;
  color: #999;
}

.record-right {
  text-align: right;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.record-amount {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
  
  &.success {
    color: #00A870;
  }
  
  &.warning {
    color: #E37318;
  }
  
  &.error {
    color: #E34D59;
  }
}

.record-status {
  font-size: 22rpx;
  
  &.frozen {
    color: #999;
  }
  
  &.available {
    color: #00A870;
  }
}

.record-badge {
  padding: 4rpx 16rpx;
  border-radius: 24rpx;
  font-size: 20rpx;
  display: inline-block;
  
  &.success {
    background: #E8F8F2;
    color: #00A870;
  }
}

.record-footer {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: #999;
}

.record-tip {
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  
  &.success {
    background: #E8F8F2;
  }
}

.tip-icon {
  font-size: 24rpx;
  color: #00A870;
  flex-shrink: 0;
}

.tip-text {
  font-size: 22rpx;
  color: #00A870;
  flex: 1;
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
}

.load-more-btn {
  background: transparent;
  color: #999;
  font-size: 26rpx;
  border: none;
  
  &::after {
    border: none;
  }
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: #FFF4E5;
  color: #E37318;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  
  &::after {
    border: none;
  }
}
</style>

