<template>
  <view class="page-container">
    <view class="page-placeholder">
      <text class="placeholder-icon">✅</text>
      <text class="placeholder-title">预约确认</text>
      <text class="placeholder-desc">页面开发中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
// 预约确认页面 - 待开发
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx;
}

.placeholder-icon {
  font-size: 120rpx;
  margin-bottom: 40rpx;
}

.placeholder-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.placeholder-desc {
  font-size: 28rpx;
  color: #999;
}
</style>

