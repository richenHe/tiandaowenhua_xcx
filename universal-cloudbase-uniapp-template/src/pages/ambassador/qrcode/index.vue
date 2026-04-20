<template>
  <view class="page">
    <td-page-header title="我的二维码" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 二维码展示（长按可保存图片） -->
        <view class="qrcode-section">
          <view class="qrcode-box">
            <image
              v-if="qrcodeInfo.qrcode_url"
              :src="qrcodeInfo.qrcode_url"
              class="qrcode-image"
              mode="aspectFit"
              @longpress="handleLongPressQrcode"
            />
            <view v-else class="qrcode-placeholder">📱</view>
          </view>
          <view class="qrcode-title">我的推广二维码</view>
        </view>

        <!-- 底部留白 -->
        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { AmbassadorApi } from '@/api'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
})

// 二维码信息
const qrcodeInfo = ref({
  qrcode_url: '',
  referee_code: '',
  share_text: ''
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

// 长按二维码 → 弹出自定义菜单，只保留"保存图片"
const handleLongPressQrcode = () => {
  uni.showActionSheet({
    itemList: ['保存图片'],
    success: (res) => {
      if (res.tapIndex === 0) {
        saveQrcode()
      }
    }
  })
}

const saveQrcode = () => {
  if (!qrcodeInfo.value.qrcode_url) {
    uni.showToast({ title: '二维码加载中', icon: 'none' })
    return
  }
  uni.showLoading({ title: '保存中...' })
  uni.downloadFile({
    url: qrcodeInfo.value.qrcode_url,
    success: (res) => {
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: () => {
          uni.hideLoading()
          uni.showToast({ title: '保存成功', icon: 'success' })
        },
        fail: () => {
          uni.hideLoading()
          uni.showToast({ title: '保存失败，请检查相册权限', icon: 'none' })
        }
      })
    },
    fail: () => {
      uni.hideLoading()
      uni.showToast({ title: '下载失败', icon: 'none' })
    }
  })
}

onMounted(() => {
  loadQRCode()
})

onShow(() => {
  loadQRCode()
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


</style>

