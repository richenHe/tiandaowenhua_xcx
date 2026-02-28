<template>
  <view class="page">
    <!-- 标题栏 -->
    <view class="header">
      <view class="header-back" @tap="handleCancel">
        <text class="header-back-icon">‹</text>
      </view>
      <text class="header-title">手写签名</text>
      <view class="header-placeholder" />
    </view>

    <view class="tip">请在下方签字区内手写签字</view>

    <!-- 签名画布区域 -->
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
import { StorageApi } from '@/api/modules/storage'

const instance = getCurrentInstance()

// 画布状态
let canvas: any = null
let ctx: any = null
let isDrawing = false
let lastX = 0
let lastY = 0
// 画布布局尺寸（CSS px），用于坐标换算
let layoutWidth = 0
let layoutHeight = 0

const isEmpty = ref(true)
const submitting = ref(false)

onMounted(() => {
  initCanvas()
})

/** 初始化 Canvas 2D 上下文，适配 DPR */
function initCanvas() {
  const query = uni.createSelectorQuery().in(instance?.proxy)
  query
    .select('#sigCanvas')
    .fields({ node: true, size: true })
    .exec((res: any[]) => {
      const nodeInfo = res[0]
      if (!nodeInfo || !nodeInfo.node) {
        console.error('[SignaturePad] canvas node not found')
        return
      }
      canvas = nodeInfo.node
      ctx = canvas.getContext('2d')
      const dpr = uni.getSystemInfoSync().pixelRatio || 1

      // 记录 CSS 尺寸，用于触摸坐标换算
      layoutWidth = nodeInfo.width
      layoutHeight = nodeInfo.height

      // 物理像素尺寸
      canvas.width = nodeInfo.width * dpr
      canvas.height = nodeInfo.height * dpr
      ctx.scale(dpr, dpr)

      // 画笔样式
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    })
}

/** 触摸开始 */
function onTouchStart(e: any) {
  if (!ctx) return
  const touch = e.touches[0]
  lastX = touch.x
  lastY = touch.y
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  isDrawing = true
}

/** 触摸移动（绘制笔迹） */
function onTouchMove(e: any) {
  if (!ctx || !isDrawing) return
  const touch = e.touches[0]
  const x = touch.x
  const y = touch.y
  ctx.lineTo(x, y)
  ctx.stroke()
  lastX = x
  lastY = y
  if (isEmpty.value) isEmpty.value = false
}

/** 触摸结束 */
function onTouchEnd() {
  if (!ctx) return
  isDrawing = false
  ctx.closePath()
}

/** 清除画布 */
function handleClear() {
  if (!ctx || !canvas) return
  // 使用 clearRect 清除时需要用 CSS 坐标（已 scale 处理）
  ctx.clearRect(0, 0, layoutWidth, layoutHeight)
  isEmpty.value = true
}

/** 提交签名：导出 PNG → 上传云存储 → 回传 fileID */
async function handleSubmit() {
  if (isEmpty.value || submitting.value) return
  submitting.value = true

  uni.showLoading({ title: '上传签名中...' })

  try {
    // Step 1: 导出画布为临时 PNG
    const tempFilePath = await exportCanvasToPng()

    // Step 2: 上传到云存储
    const timestamp = Date.now()
    const cloudPath = `signatures/${timestamp}.png`
    const result = await StorageApi.uploadFile({ cloudPath, filePath: tempFilePath })

    uni.hideLoading()
    uni.showToast({ title: '签名上传成功', icon: 'success', duration: 1000 })

    // Step 3: 通知上一页
    setTimeout(() => {
      // 通过全局事件总线回传 fileID
      uni.$emit('signatureCompleted', { fileId: result.fileID })
      uni.navigateBack()
    }, 800)
  } catch (err: any) {
    uni.hideLoading()
    console.error('[SignaturePad] 上传签名失败:', err)
    uni.showToast({ title: '上传失败，请重试', icon: 'none' })
    submitting.value = false
  }
}

/** 取消签名，返回上一页 */
function handleCancel() {
  uni.navigateBack()
}

/** 将 canvas 内容导出为本地临时图片路径 */
function exportCanvasToPng(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.canvasToTempFilePath(
      {
        canvas,
        fileType: 'png',
        quality: 1,
        success: (res: any) => resolve(res.tempFilePath),
        fail: (err: any) => reject(err)
      },
      instance?.proxy
    )
  })
}
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
}

/* 标题栏 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
  background: #1976D2;
}

.header-back {
  width: 60rpx;
  display: flex;
  align-items: center;
}

.header-back-icon {
  font-size: 56rpx;
  color: #fff;
  line-height: 1;
  margin-top: -4rpx;
}

.header-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #fff;
}

.header-placeholder {
  width: 60rpx;
}

/* 引导文字 */
.tip {
  text-align: center;
  font-size: 26rpx;
  color: #666;
  padding: 28rpx 0 20rpx;
}

/* 画布容器 */
.canvas-wrap {
  flex: 1;
  margin: 0 32rpx;
  border: 2rpx solid #ddd;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
  background: #fff;
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
  font-size: 36rpx;
  color: #e0e0e0;
  letter-spacing: 4rpx;
}

/* 底部按钮 */
.footer {
  display: flex;
  gap: 32rpx;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  background: #fff;
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
}

.btn-clear {
  background: #f5f5f5;
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
