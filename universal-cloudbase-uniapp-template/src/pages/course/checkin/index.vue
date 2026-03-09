<template>
  <view class="page-container">
    <TdPageHeader title="课程签到" :showBack="true" />

    <view class="checkin-wrapper">
      <!-- 加载中 -->
      <view v-if="status === 'loading'" class="status-box">
        <view class="status-icon loading-icon"><icon type="waiting" size="60" color="#D4AF37"/></view>
        <text class="status-title">正在签到...</text>
        <text class="status-desc">请稍候</text>
      </view>

      <!-- 签到成功 -->
      <view v-else-if="status === 'success'" class="status-box">
        <view class="status-icon success-icon"><icon type="success" size="60" color="#00A870"/></view>
        <text class="status-title">{{ successTitle }}</text>
        <text class="status-desc">{{ checkinTime }}</text>
      </view>

      <!-- 签到失败 -->
      <view v-else-if="status === 'error'" class="status-box">
        <view class="status-icon error-icon"><icon type="cancel" size="60" color="#E34D59"/></view>
        <text class="status-title">签到失败</text>
        <text class="status-desc">{{ errorMsg }}</text>
      </view>

      <!-- 参数错误 -->
      <view v-else class="status-box">
        <view class="status-icon error-icon"><icon type="warn" size="60" color="#E6A23C"/></view>
        <text class="status-title">无效的签到码</text>
        <text class="status-desc">请通过扫描正确的签到二维码进入</text>
      </view>

      <button
        class="t-button t-button--theme-light t-button--variant-base back-btn"
        @click="goHome"
      >
        <span class="t-button__text">返回首页</span>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { CourseApi } from '@/api'

const status = ref<'loading' | 'success' | 'error' | 'invalid'>('loading')
const errorMsg = ref('')
const checkinTime = ref('')
const successTitle = ref('今日签到成功')

/**
 * 解析 scene 参数，格式 ci={classRecordId}
 */
function parseScene(scene: string): number | null {
  if (!scene) return null
  const decoded = decodeURIComponent(scene)
  const match = decoded.match(/ci=(\d+)/)
  return match ? parseInt(match[1]) : null
}

onLoad((options: any) => {
  const scene = options?.scene || ''
  const classRecordId = parseScene(scene)

  if (!classRecordId) {
    status.value = 'invalid'
    return
  }

  doCheckin(classRecordId)
})

async function doCheckin(classRecordId: number) {
  status.value = 'loading'
  try {
    const result = await CourseApi.scanCheckin(classRecordId)
    status.value = 'success'
    checkinTime.value = result.checkin_at || ''
    successTitle.value = result.already_checked ? '今日已签到' : '今日签到成功'
  } catch (err: any) {
    const msg = err?.message || '签到失败，请稍后重试'
    if (msg.includes('不在签到时间内')) {
      status.value = 'invalid'
    } else {
      status.value = 'error'
      errorMsg.value = msg
    }
  }
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: $td-bg-color-page;
}

.checkin-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 48rpx 48rpx;
}

.status-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}

.status-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.status-title {
  font-size: 36rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 16rpx;
}

.status-desc {
  font-size: 26rpx;
  color: $td-text-color-placeholder;
  text-align: center;
}

.back-btn {
  width: 400rpx;
}
</style>
