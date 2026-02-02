<template>
  <view class="page">
    <td-page-header title="升级指南" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 当前等级卡片 -->
        <view class="current-level-card">
          <view class="level-icon">{{ currentLevelInfo.icon }}</view>
          <view class="level-info">
            <view class="level-label">当前等级</view>
            <view class="level-name">{{ currentLevelInfo.name }}</view>
          </view>
        </view>

        <!-- 升级路径图 -->
        <view class="t-section-title t-section-title--simple">📍 升级路径</view>
        <view class="path-card">
          <view class="path-item">
            <view class="path-icon">🥚</view>
            <view class="path-label">准青鸾</view>
          </view>
          <view class="path-arrow">→</view>
          <view class="path-item active">
            <view class="path-icon">🐦</view>
            <view class="path-label current">青鸾 (当前)</view>
          </view>
          <view class="path-arrow">→</view>
          <view class="path-item">
            <view class="path-icon inactive">🦅</view>
            <view class="path-label">鸿鹄</view>
          </view>
          <view class="path-arrow">→</view>
          <view class="path-item">
            <view class="path-icon inactive">🦚</view>
            <view class="path-label">金凤</view>
          </view>
        </view>

        <!-- 下一等级标题 -->
        <view v-if="nextLevelInfo" class="t-section-title t-section-title--simple">
          🎯 下一等级：{{ nextLevelInfo.name }}
        </view>

        <!-- 升级条件 - 准青鸾升级到青鸾 -->
        <view v-if="currentLevel === 1" class="upgrade-card">
          <view class="card-header">
            <view class="card-title">📋 升级条件</view>
          </view>
          <view class="card-body">
            <!-- 步骤1：推荐初探班 -->
            <view class="step-item">
              <view class="step-number">1</view>
              <view class="step-content">
                <view class="step-title">推荐初探班课程</view>
                <view v-if="hasRecommendedCourse" class="step-desc">
                  您已成功推荐初探班课程 ✓
                </view>
                <view v-else class="step-desc">推荐1名学员报名初探班课程</view>
                <view v-if="hasRecommendedCourse" class="step-badge success">已满足</view>
              </view>
            </view>

            <!-- 步骤2：签署协议 -->
            <view v-if="canUpgradeToQingluan" class="step-item">
              <view class="step-number">2</view>
              <view class="step-content">
                <view class="step-title">签署《青鸾大使协议》</view>
                <view class="step-desc">已满足青鸾大使升级条件，请签署协议</view>
                <view @tap="goToContractSign">
                  <button class="t-button t-button--theme-primary t-button--variant-base t-button--block">
                    <span class="t-button__text">📝 立即签署协议</span>
                  </button>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 升级条件 - 青鸾升级到鸿鹄 -->
        <view v-else-if="currentLevel === 2" class="upgrade-card">
          <view class="card-header">
            <view class="card-title">📋 升级条件</view>
          </view>
          <view class="card-body">
            <!-- 步骤1 -->
            <view class="step-item">
              <view class="step-number">1</view>
              <view class="step-content">
                <view class="step-title">已是青鸾大使</view>
                <view class="step-desc">当前等级：青鸾大使 ✓</view>
                <view class="step-badge success">已满足</view>
              </view>
            </view>

            <!-- 步骤2 -->
            <view class="step-item">
              <view class="step-number">2</view>
              <view class="step-content">
                <view class="step-title">签署《鸿鹄大使补充协议》</view>
                <view class="step-desc">需要在支付升级费用前签署补充协议</view>
                <view @tap="goToContractSign">
                  <button class="t-button t-button--theme-primary t-button--variant-base t-button--block">
                    <span class="t-button__text">📝 立即签署</span>
                  </button>
                </view>
              </view>
            </view>

            <!-- 步骤3 -->
            <view class="step-item">
              <view class="step-number">3</view>
              <view class="step-content">
                <view class="step-title">支付9800元升级费用</view>
                <view class="step-desc">获得10个初探班名额（可赠送学员）</view>
                <view @tap="handleUpgrade">
                  <button class="t-button t-button--theme-primary t-button--variant-base t-button--block">
                    <span class="t-button__text">💳 支付升级费用</span>
                  </button>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 升级收益 -->
        <view class="upgrade-card">
          <view class="card-header">
            <view class="card-title">💰 升级收益</view>
          </view>
          <view class="card-body">
            
            <view class="benefit-item">
              <view class="benefit-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
                💎
              </view>
              <view class="benefit-content">
                <view class="benefit-title">获得16880冻结积分</view>
                <view class="benefit-desc">推荐初探班解冻1688积分，解冻完毕后持续获得可提现积分</view>
              </view>
            </view>

            <view class="divider"></view>

            <view class="benefit-item">
              <view class="benefit-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
                🎁
              </view>
              <view class="benefit-content">
                <view class="benefit-title">10个初探班名额</view>
                <view class="benefit-desc">可赠送给学员，每个名额价值1688元</view>
              </view>
            </view>

            <view class="divider"></view>

            <view class="benefit-item">
              <view class="benefit-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                💰
              </view>
              <view class="benefit-content">
                <view class="benefit-title">推荐只获得积分（可提现）</view>
                <view class="benefit-desc">
                  • 推荐初探班：解冻1688积分（有冻结时）<br/>
                  • 推荐密训班：直接获得20%可提现积分<br/>
                  • 推荐咨询：直接获得20%可提现积分
                </view>
              </view>
            </view>

            <view class="divider"></view>

            <view class="benefit-item">
              <view class="benefit-icon" style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);">
                👨‍🏫
              </view>
              <view class="benefit-content">
                <view class="benefit-title">可担任辅导员获得功德分</view>
                <view class="benefit-desc">辅导员、会务义工、沙龙活动等额外获得功德分</view>
              </view>
            </view>

          </view>
        </view>

        <!-- 注意事项 -->
        <view class="alert-box warning">
          <view class="alert-icon">⚠️</view>
          <view class="alert-content">
            <view class="alert-title">升级注意事项</view>
            <view class="alert-message">
              1. 升级费用9800元不退还<br/>
              2. 10个初探班名额有效期1年<br/>
              3. 合同期从签署之日起计算1年<br/>
              4. 到期前30天可续签
            </view>
          </view>
        </view>

        <!-- 升级按钮 -->
        <view v-if="nextLevelInfo" @tap="handleUpgrade">
          <button class="t-button t-button--theme-primary t-button--variant-base t-button--block t-button--size-large">
            <span class="t-button__text">🚀 立即升级为{{ nextLevelInfo.name }}</span>
          </button>
        </view>

        <!-- 底部留白 -->
        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';

// 用户当前等级: 1=准青鸾, 2=青鸾, 3=鸿鹄, 4=金凤
const currentLevel = ref(1);

// 是否推荐初探班成功
const hasRecommendedCourse = ref(true);

// 是否已签署协议
const hasSignedContract = ref(false);

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))';
});

// 当前等级信息
const currentLevelInfo = computed(() => {
  const levels = [
    { id: 0, name: '普通用户', icon: '👤' },
    { id: 1, name: '准青鸾大使', icon: '🥚' },
    { id: 2, name: '青鸾大使', icon: '🐦' },
    { id: 3, name: '鸿鹄大使', icon: '🦅' },
    { id: 4, name: '金凤大使', icon: '🦚' },
  ];
  return levels.find((l) => l.id === currentLevel.value) || levels[0];
});

// 下一等级信息
const nextLevelInfo = computed(() => {
  const nextId = currentLevel.value + 1;
  const levels = [
    { id: 1, name: '准青鸾大使', icon: '🥚' },
    { id: 2, name: '青鸾大使', icon: '🐦' },
    { id: 3, name: '鸿鹄大使', icon: '🦅' },
    { id: 4, name: '金凤大使', icon: '🦚' },
  ];
  return levels.find((l) => l.id === nextId);
});

// 是否满足青鸾大使升级条件
const canUpgradeToQingluan = computed(() => {
  return currentLevel.value === 1 && hasRecommendedCourse.value;
});

onMounted(() => {
  fetchUserUpgradeStatus();
});

// 模拟获取用户升级状态
const fetchUserUpgradeStatus = () => {
  console.log('Fetching user upgrade status...');
  // 实际应该调用 API 获取用户等级、推荐记录、协议签署状态等
  // API: GET /api/ambassador/upgrade-status
};

const goToContractSign = () => {
  // 跳转到签署协议页面，传递升级类型参数
  uni.navigateTo({
    url: `/pages/ambassador/contract-sign/index?upgradeType=${currentLevel.value + 1}`,
  });
};

const handleUpgrade = () => {
  if (currentLevel.value === 1 && canUpgradeToQingluan.value) {
    // 准青鸾升级到青鸾，只需签署协议
    goToContractSign();
  } else if (currentLevel.value === 2) {
    // 青鸾升级到鸿鹄，需要支付费用，跳转到订单确认页
    uni.navigateTo({
      url: '/pages/order/confirm/index?upgradeType=3&amount=9800',
    });
  }
};
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

.current-level-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 48rpx;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.level-icon {
  font-size: 96rpx;
}

.level-info {
  flex: 1;
}

.level-label {
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 8rpx;
}

.level-name {
  font-size: 48rpx;
  font-weight: 700;
}

.path-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16rpx;
}

.path-item {
  text-align: center;
  flex: 1;
  min-width: 120rpx;
}

.path-icon {
  font-size: 64rpx;
  margin-bottom: 8rpx;
  
  &.inactive {
    opacity: 0.4;
  }
}

.path-label {
  font-size: 22rpx;
  color: #999;
  
  &.current {
    color: #0052D9;
    font-weight: 600;
  }
}

.path-arrow {
  color: #999;
  font-size: 28rpx;
}

.upgrade-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.card-header {
  padding: 32rpx;
  border-bottom: 2rpx solid #F5F5F5;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.card-body {
  padding: 32rpx;
}

.step-item {
  display: flex;
  gap: 24rpx;
  margin-bottom: 48rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.step-number {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.step-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
  margin-bottom: 16rpx;
}

.step-badge {
  display: inline-block;
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 22rpx;
  
  &.success {
    background: #E8F8F2;
    color: #00A870;
  }
}

.benefit-item {
  display: flex;
  gap: 24rpx;
  align-items: flex-start;
}

.benefit-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}

.benefit-content {
  flex: 1;
  min-width: 0;
}

.benefit-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.benefit-desc {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
}

.divider {
  height: 2rpx;
  background: #F5F5F5;
  margin: 32rpx 0;
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

</style>

