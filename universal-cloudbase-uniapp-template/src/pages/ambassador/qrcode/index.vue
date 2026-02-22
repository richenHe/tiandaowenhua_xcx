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
            <image v-if="qrcodeInfo.qrcode_url" :src="qrcodeInfo.qrcode_url" class="qrcode-image" mode="aspectFit" />
            <view v-else class="qrcode-placeholder">📱</view>
          </view>
          <view class="qrcode-title">我的推广二维码</view>
          <view class="qrcode-code">邀请码: {{ qrcodeInfo.referee_code || '加载中...' }}</view>
        </view>

        <!-- 推广统计 -->
        <view class="stats-card">
          <view class="stats-item">
            <view class="stats-label">✅ 已推荐</view>
            <view class="stats-value">{{ stats.referralCount }}人</view>
          </view>
          <view class="divider-vertical"></view>
          <view class="stats-item">
            <view class="stats-label">💰 累计收益</view>
            <view class="stats-value">¥{{ stats.totalEarnings }}</view>
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
          <view @tap="saveQrcode">
            <button class="t-button t-button--theme-default t-button--variant-base t-button--block">
              <span class="t-button__text">💾 保存二维码</span>
            </button>
          </view>
          <view @tap="shareQrcode">
            <button class="t-button t-button--theme-default t-button--variant-outline t-button--block">
              <span class="t-button__text">📤 分享给好友</span>
            </button>
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
import { AmbassadorApi, UserApi } from '@/api'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
})

// 二维码信息
const qrcodeInfo = ref({
  qrcode_url: '',
  referee_code: '',
  share_text: ''
})

// 推广统计
const stats = ref({
  referralCount: 0,
  totalEarnings: 0
})

// 加载二维码
const loadQRCode = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await AmbassadorApi.generateQRCode({ scene_type: 'share' })

    qrcodeInfo.value.qrcode_url = result.qrcode_url
    qrcodeInfo.value.referee_code = result.referee_code
    qrcodeInfo.value.share_text = result.share_text
    uni.hideLoading()
  } catch (error) {
    console.error('加载二维码失败:', error)
    uni.hideLoading()
  }
}

// 加载推广统计
const loadStats = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const referees = await UserApi.getMyReferees({ page: 1, pageSize: 1 })
    stats.value.referralCount = referees.total || 0

    // 累计收益需要从其他接口获取
    const profile = await UserApi.getProfile()
    stats.value.totalEarnings = profile.cash_points_available || 0
    uni.hideLoading()
  } catch (error) {
    console.error('加载统计失败:', error)
    uni.hideLoading()
  }
}

const saveQrcode = () => {
  if (!qrcodeInfo.value.qrcode_url) {
    uni.showToast({
      title: '二维码加载中',
      icon: 'none'
    })
    return
  }

  uni.downloadFile({
    url: qrcodeInfo.value.qrcode_url,
    success: (res) => {
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => {
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          })
        },
        fail: () => {
          uni.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      })
    }
  })
}

const shareQrcode = () => {
  uni.showShareMenu({
    withShareTicket: true,
    success: () => {
      console.log('分享成功')
    }
  })
}

onMounted(() => {
  loadQRCode()
  loadStats()
})
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

</style>

