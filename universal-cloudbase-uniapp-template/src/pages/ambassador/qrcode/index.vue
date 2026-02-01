<template>
  <view class="page">
    <td-page-header title="我的二维码" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 二维码展示 -->
        <view class="qrcode-section">
          <view class="qrcode-box">
            <view class="qrcode-placeholder">📱</view>
          </view>
          <view class="qrcode-title">我的推广二维码</view>
          <view class="qrcode-code">邀请码: TDWH8888</view>
        </view>

        <!-- 推广统计 -->
        <view class="stats-card">
          <view class="stats-item">
            <view class="stats-label">✅ 已推荐</view>
            <view class="stats-value">8人</view>
          </view>
          <view class="divider-vertical"></view>
          <view class="stats-item">
            <view class="stats-label">💰 累计收益</view>
            <view class="stats-value">¥15,250</view>
          </view>
        </view>

        <!-- 使用说明 -->
        <view class="t-section-title t-section-title--simple">📖 使用说明</view>
        <view class="info-card">
          <view class="info-item">
            <view class="info-icon">1️⃣</view>
            <view class="info-text">长按保存二维码图片</view>
          </view>
          <view class="info-item">
            <view class="info-icon">2️⃣</view>
            <view class="info-text">分享给好友扫码注册</view>
          </view>
          <view class="info-item">
            <view class="info-icon">3️⃣</view>
            <view class="info-text">好友购买课程后获得奖励</view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="action-buttons">
          <button class="action-btn primary" @tap="saveQrcode">保存二维码</button>
          <button class="action-btn default" @tap="shareQrcode">分享给好友</button>
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

const saveQrcode = () => {
  uni.showToast({
    title: '保存成功',
    icon: 'success'
  })
}

const shareQrcode = () => {
  uni.showToast({
    title: '分享功能开发中',
    icon: 'none'
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

.qrcode-section {
  text-align: center;
  padding: 80rpx 0;
}

.qrcode-box {
  width: 400rpx;
  height: 400rpx;
  margin: 0 auto 48rpx;
  background: #fff;
  border: 2rpx solid #E5E5E5;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-placeholder {
  font-size: 160rpx;
}

.qrcode-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.qrcode-code {
  font-size: 26rpx;
  color: #999;
}

.stats-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
  display: flex;
  align-items: center;
}

.stats-item {
  flex: 1;
  text-align: center;
}

.stats-label {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 12rpx;
}

.stats-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #0052D9;
}

.divider-vertical {
  width: 2rpx;
  height: 80rpx;
  background: #E5E5E5;
}

.info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.info-icon {
  font-size: 40rpx;
  flex-shrink: 0;
}

.info-text {
  font-size: 28rpx;
  color: #666;
  flex: 1;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.action-btn {
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  border: none;
  
  &.primary {
    background: #E6F4FF;
    color: #0052D9;
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
</style>

