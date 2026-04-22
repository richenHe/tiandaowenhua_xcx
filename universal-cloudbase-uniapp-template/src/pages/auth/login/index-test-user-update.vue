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
            <text class="t-button__text">一键快捷登录（测试 user.update）</text>
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
import { signInWithOpenId, auth } from '@/utils/cloudbase';

const isLoggingIn = ref(false);

/**
 * 方案 A：使用系统用户表的 user.update() 方法
 * 测试是否在 UniApp/小程序环境下可用
 */
const handleWechatLogin = async () => {
  if (isLoggingIn.value) {
    return;
  }
  
  isLoggingIn.value = true;
  
  try {
    // 第一步：立即获取用户信息授权
    console.log('第一步：请求用户授权...');
    const userProfileRes = await uni.getUserProfile({
      desc: '用于完善会员资料和个性化服务',
    });
    
    console.log('✅ 第一步：获取到用户信息', userProfileRes.userInfo);
    
    uni.showLoading({
      title: '登录中...',
      mask: true
    });
    
    // 第二步：OpenID 静默登录
    const loginState = await signInWithOpenId();
    console.log('✅ 第二步：OpenID 登录成功', loginState);
    
    // 第三步：尝试使用系统用户表的 update 方法
    try {
      const currentUser = await auth.getCurrentUser();
      
      console.log('✅ 第三步：获取到当前用户对象', currentUser);
      console.log('用户对象类型:', typeof currentUser);
      console.log('用户对象属性:', Object.keys(currentUser || {}));
      
      // 检查 update 方法是否存在
      if (currentUser && typeof currentUser.update === 'function') {
        console.log('✅ update 方法存在，尝试调用...');
        
        // 调用系统用户表的 update 方法
        await currentUser.update({
          name: userProfileRes.userInfo.nickName,
          picture: userProfileRes.userInfo.avatarUrl,
          gender: userProfileRes.userInfo.gender === 1 ? 'MALE' : 
                  userProfileRes.userInfo.gender === 2 ? 'FEMALE' : 'UNKNOWN'
        });
        
        console.log('✅ 第三步：系统用户表更新成功！');
        
        uni.hideLoading();
        uni.showToast({
          title: '✅ user.update() 可用！',
          icon: 'success',
          duration: 2000
        });
        
      } else {
        throw new Error('update 方法不存在或不是函数');
      }
      
    } catch (updateError: any) {
      console.error('❌ 第三步失败:', updateError);
      console.error('错误详情:', JSON.stringify(updateError));
      
      uni.hideLoading();
      uni.showModal({
        title: '测试结果',
        content: `user.update() 方法不可用\n错误: ${updateError.message || '未知错误'}\n\n需要使用数据库方案`,
        showCancel: false
      });
      
      isLoggingIn.value = false;
      return;
    }
    
    // 登录成功，跳转
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/index/index'
      });
    }, 2000);
    
  } catch (error: any) {
    console.error('❌ 登录失败:', error);
    uni.hideLoading();
    
    let errorMessage = '登录失败，请重试';
    if (error.errMsg && error.errMsg.includes('getUserProfile:fail cancel')) {
      errorMessage = '您已取消授权';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    uni.showToast({
      title: errorMessage,
      icon: 'none',
      duration: 2000
    });
  } finally {
    isLoggingIn.value = false;
  }
};

const goToAgreement = () => {
  uni.navigateTo({
    url: '/pages/agreement/user-agreement'
  });
};

const goToPrivacy = () => {
  uni.navigateTo({
    url: '/pages/agreement/privacy-policy'
  });
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx;
}

.login-container {
  width: 100%;
  max-width: 640rpx;
}

.login-logo {
  font-size: 120rpx;
  text-align: center;
  margin-bottom: 40rpx;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.login-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  margin-bottom: 16rpx;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.login-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  margin-bottom: 60rpx;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24rpx;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.t-button__icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.login-tips {
  margin-top: 32rpx;
  font-size: 24rpx;
  color: var(--td-text-color-secondary);
  text-align: center;
  line-height: 1.6;
}

.link {
  color: var(--td-brand-color);
  text-decoration: underline;
}
</style>






















