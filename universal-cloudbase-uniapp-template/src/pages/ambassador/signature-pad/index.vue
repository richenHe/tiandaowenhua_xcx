<template>
  <view class="page">
    <!-- 顶部导航栏 -->
    <td-page-header title="手写签名" />

    <!-- 引导说明 -->
    <view class="tip">请在下方横向区域手写签字</view>

    <!-- 签名画布：横向比例（宽远大于高，模拟合同签名栏） -->
    <view class="canvas-wrap">
      <canvas
        type="2d"
        id="sigCanvas"
        class="sig-canvas"
        @touchstart="onTouchStart"
        @touchmove.stop.prevent="onTouchMove"
        @touchend="onTouchEnd"
      />
      <!-- 引导提示（未签名时显示） -->
      <view v-if="isEmpty" class="canvas-placeholder">
        <text class="canvas-placeholder-text">在此处签名</text>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="footer">
      <button class="btn btn-clear" @tap="handleClear">清除</button>
      <button class="btn btn-submit" :disabled="isEmpty || submitting" @tap="handleSubmit">
        {{ submitting ? '提交中...' : '提交' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, getCurrentInstance } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { StorageApi } from '@/api/modules/storage'

const instance = getCurrentInstance()

let canvas: any = null
let ctx: any = null
let isDrawing = false
let layoutWidth = 0
let layoutHeight = 0

const isEmpty = ref(true)
const submitting = ref(false)

onMounted(() => {
  setTimeout(() => initCanvas(), 100)
})

/** 初始化 Canvas 2D，适配 DPR */
function initCanvas() {
  const query = uni.createSelectorQuery().in(instance?.proxy)
  query
    .select('#sigCanvas')
    .fields({ node: true, size: true })
    .exec((res: any[]) => {
      const nodeInfo = res[0]
      if (!nodeInfo?.node) {
        console.error('[SignaturePad] canvas node not found，重试中...')
        setTimeout(initCanvas, 200)
        return
      }
      canvas = nodeInfo.node
      ctx = canvas.getContext('2d')
      const dpr = uni.getSystemInfoSync().pixelRatio || 1

      layoutWidth = nodeInfo.width
      layoutHeight = nodeInfo.height

      canvas.width = nodeInfo.width * dpr
      canvas.height = nodeInfo.height * dpr
      ctx.scale(dpr, dpr)

      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    })
}

function onTouchStart(e: any) {
  if (!ctx) return
  const touch = e.touches[0]
  ctx.beginPath()
  ctx.moveTo(touch.x, touch.y)
  isDrawing = true
}

function onTouchMove(e: any) {
  if (!ctx || !isDrawing) return
  const touch = e.touches[0]
  ctx.lineTo(touch.x, touch.y)
  ctx.stroke()
  if (isEmpty.value) isEmpty.value = false
}

function onTouchEnd() {
  if (!ctx) return
  isDrawing = false
  ctx.closePath()
}

function handleClear() {
  if (!ctx || !canvas) return
  ctx.clearRect(0, 0, layoutWidth, layoutHeight)
  isEmpty.value = true
}

async function handleSubmit() {
  if (isEmpty.value || submitting.value) return
  submitting.value = true
  uni.showLoading({ title: '上传签名中...' })

  try {
    const tempFilePath = await exportCanvasToPng()
    const cloudPath = `signatures/${Date.now()}.png`
    const result = await StorageApi.uploadFile({ cloudPath, filePath: tempFilePath })

    uni.hideLoading()
    uni.showToast({ title: '签名上传成功', icon: 'success', duration: 1000 })

    setTimeout(() => {
      uni.$emit('signatureCompleted', { fileId: result.fileID })
      uni.navigateBack()
    }, 800)
  } catch (err: any) {
    uni.hideLoading()
    console.error('[SignaturePad] 上传失败:', err)
    uni.showToast({ title: '上传失败，请重试', icon: 'none' })
    submitting.value = false
  }
}

function exportCanvasToPng(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath(
      { canvas, fileType: 'png', quality: 1, success: (res: any) => resolve(res.tempFilePath), fail: reject },
      instance?.proxy
    )
  })
}
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

/* 引导文字 */
.tip {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  padding: 24rpx 0 16rpx;
}

/* 签名画布区域：固定高度 + 全宽，形成横向比例（约 3:1） */
.canvas-wrap {
  margin: 0 32rpx;
  height: 360rpx;
  border: 2rpx solid #d0d0d0;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.sig-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.canvas-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.canvas-placeholder-text {
  font-size: 40rpx;
  color: #d8d8d8;
  letter-spacing: 8rpx;
}

/* 底部按钮 */
.footer {
  display: flex;
  gap: 32rpx;
  padding: 40rpx 32rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.btn {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    border: none;
  }
}

.btn-clear {
  background: #f0f0f0;
  color: #666;
  border: 2rpx solid #ddd;
}

.btn-submit {
  background: #1976D2;
  color: #fff;

  &[disabled] {
    background: #b0c4de;
    color: #fff;
  }
}
</style>
