<template>
  <view class="login-page">
    <view class="login-container">
      <!-- Logo -->
      <view class="login-logo">🏛️</view>
      
      <!-- 标题 -->
      <view class="login-title">天道文化课程平台</view>
      <view class="login-subtitle">传承国学智慧 · 弘扬天道文化</view>
      
      <!-- 登录卡片 -->
      <view class="t-card t-card--bordered login-card">
        <view class="t-card__body">
          <button
            class="t-button t-button--theme-light t-button--variant-base t-button--block t-button--size-large"
            @click="handleWechatLogin"
          >
            <text class="t-button__icon">🔐</text>
            <text class="t-button__text">微信一键登录</text>
          </button>
          
          <view class="login-tips">
            登录即代表同意<text class="link" @click="goToAgreement">《用户协议》</text>和<text class="link" @click="goToPrivacy">《隐私政策》</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';

/**
 * 微信一键登录
 */
const handleWechatLogin = async () => {
  try {
    // 获取用户授权
    const res = await uni.getUserProfile({
      desc: '用于完善会员资料',
    });
    
    console.log('用户信息', res.userInfo);
    
    // 模拟登录成功，跳转到完善资料页
    uni.navigateTo({
      url: '/pages/auth/complete-profile/index',
    });
  } catch (error) {
    console.error('登录失败', error);
    uni.showToast({
      title: '登录已取消',
      icon: 'none',
    });
  }
};

/**
 * 查看用户协议
 */
const goToAgreement = () => {
  uni.showToast({
    title: '用户协议',
    icon: 'none',
  });
};

/**
 * 查看隐私政策
 */
const goToPrivacy = () => {
  uni.showToast({
    title: '隐私政策',
    icon: 'none',
  });
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 32rpx;
  width: 100%;
}

.login-logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 48rpx;
  background: linear-gradient(135deg, $td-brand-color, $td-brand-color-light);
  border-radius: $td-radius-large;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 72rpx;
  box-shadow: 0 8rpx 40rpx rgba(0, 82, 217, 0.3);
}

.login-title {
  font-size: 48rpx;
  font-weight: 600;
  color: white;
  margin-bottom: 16rpx;
  text-align: center;
}

.login-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 80rpx;
  text-align: center;
}

.login-card {
  width: 100%;
  max-width: 680rpx;
}

.login-tips {
  margin-top: 32rpx;
  font-size: 24rpx;
  color: $td-text-color-placeholder;
  text-align: center;
  line-height: 1.5;

  .link {
    color: $td-brand-color;
    text-decoration: none;
  }
}

// 按钮样式
.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $td-radius-default;
  border: none;

  &--size-large {
    height: 88rpx;
  }

  &--theme-light {
    background-color: rgba($td-brand-color, 0.1);

    .t-button__text,
    .t-button__icon {
      color: $td-brand-color;
      font-size: 32rpx;
      font-weight: 500;
    }
  }

  &--block {
    width: 100%;
  }
}
</style>

