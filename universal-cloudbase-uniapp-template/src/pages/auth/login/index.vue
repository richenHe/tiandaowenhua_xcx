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
import { signInWithOpenId, auth, app } from '@/utils/cloudbase';

// 防止重复点击
const isLoggingIn = ref(false);

const handleWechatLogin = async () => {
  if (isLoggingIn.value) {
    return;
  }
  
  isLoggingIn.value = true;
  
  try {
    const userProfileRes = await uni.getUserProfile({
      desc: '用于完善会员资料和个性化服务',
    });
    
    uni.showLoading({
      title: '登录中...',
      mask: true
    });
    
    const loginState = await signInWithOpenId();
    const currentUser = await auth.getCurrentUser();
    
    if (!currentUser?.uid) {
      throw new Error('无法获取用户 ID');
    }
    
    uni.hideLoading();
    
    uni.showToast({
      title: '登录成功！',
      icon: 'success',
      duration: 2000
    });
    
    setTimeout(() => {
      uni.redirectTo({
        url: '/pages/auth/complete-profile/index'
      });
    }, 1500);
    
  } catch (error: any) {
    uni.hideLoading();
    
    if (error.errMsg && error.errMsg.includes('getUserProfile:fail cancel')) {
      uni.showToast({
        title: '您已取消授权',
        icon: 'none',
        duration: 2000
      });
    } else if (error.errMsg && error.errMsg.includes('getUserProfile')) {
      uni.showToast({
        title: '获取用户信息失败，请重试',
        icon: 'none',
        duration: 2000
      });
    } else {
      uni.showToast({
        title: error?.message || '登录失败，请稍后重试',
        icon: 'none',
        duration: 2000
      });
    }
  } finally {
    isLoggingIn.value = false;
  }
};

const goToAgreement = () => {
  uni.showToast({
    title: '用户协议',
    icon: 'none',
  });
};

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

