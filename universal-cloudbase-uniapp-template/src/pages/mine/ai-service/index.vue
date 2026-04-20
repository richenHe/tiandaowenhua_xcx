<!--
  页面说明：客服引导页（人工/工单导向）
  功能：快捷入口跳转意见反馈、退款；联系客服时在会话区展示常用/备用微信客服二维码
-->
<template>
  <view class="page-container">
    <TdPageHeader title="客服" :showBack="true" />

    <!-- 客服说明与快捷入口（非自动对话） -->
    <!-- 高度用 windowHeight − 顶栏 − 底栏(px) 计算，否则 scroll-view 会随内容无限增高，底栏被顶到页面最下方 -->
    <scroll-view
      scroll-y
      class="chat-area"
      :style="chatScrollStyle"
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view class="assistant-header">
        <view class="assistant-avatar">
          <text class="assistant-emoji">🎧</text>
        </view>
        <view class="assistant-info">
          <text class="assistant-name">客服</text>
          <text class="assistant-tag">咨询与售后受理</text>
        </view>
      </view>

      <view class="message-wrap">
        <text class="message-hint-label">温馨提示</text>
        <view class="message-bubble">
          <text class="message-text">
            如需联系工作人员，请点击「意见反馈」留言说明问题；如需办理退款，请点击「退款」并按页面指引提交申请；添加企业微信客服请点「联系客服」查看二维码。我们会尽快处理。
          </text>
        </view>
      </view>

      <!-- 点击「联系客服」后追加的会话内容（模拟发送至聊天记录） -->
      <view
        v-for="item in chatMessages"
        :key="item.id"
        :id="'chat-msg-' + item.id"
        class="message-wrap message-wrap--dynamic"
      >
        <text v-if="item.caption" class="message-hint-label">{{ item.caption }}</text>
        <view v-if="item.type === 'text'" class="message-bubble">
          <text class="message-text">{{ item.text }}</text>
        </view>
        <view v-else-if="item.type === 'image'" class="message-bubble message-bubble--image">
          <!-- show-menu-by-longpress：微信下长按才可「识别图中二维码」，否则用户以为二维码坏了 -->
          <image
            class="qr-image"
            :src="item.src"
            mode="widthFix"
            :show-menu-by-longpress="true"
            @click="onQrImageClick(item)"
          />
        </view>
      </view>

      <!-- 占位：保证 scroll-into-view 能滚到底部 -->
      <view id="chat-bottom-anchor" class="chat-bottom-anchor" />
    </scroll-view>

    <view class="footer-fixed">
      <scroll-view scroll-x class="t-quick-actions" :show-scrollbar="false">
        <view class="t-quick-actions__inner">
          <view
            v-for="item in quickActions"
            :key="item.type"
            class="t-quick-actions__item"
            @click="handleAction(item.type)"
          >
            <text class="t-quick-actions__text">{{ item.label }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="input-bar" @click="showTip">
        <view class="input-bar__capsule input-bar__capsule--disabled">
          <text class="capsule-plus">＋</text>
          <text class="capsule-placeholder">请通过「意见反馈」或上方快捷入口联系我们</text>
        </view>
      </view>
    </view>

    <!--
      不用 uni.previewImage：代码包内 /static 路径在多个基础库下会一直转圈（1/2 黑屏）。
      全屏用本页 <image> 与列表同源路径，可正常出图并长按识别。
    -->
    <view v-if="qrViewerVisible" class="qr-viewer-mask" @click="closeQrViewer">
      <view class="qr-viewer-sheet" @click.stop>
        <view class="qr-viewer-bar">
          <text
            class="qr-viewer-tab"
            :class="{ 'qr-viewer-tab--on': qrViewerSlot === 0 }"
            @click="qrViewerSlot = 0"
          >常用</text>
          <text
            class="qr-viewer-tab"
            :class="{ 'qr-viewer-tab--on': qrViewerSlot === 1 }"
            @click="qrViewerSlot = 1"
          >备用</text>
        </view>
        <image
          class="qr-viewer-image"
          :src="qrViewerSrc"
          mode="widthFix"
          :show-menu-by-longpress="true"
        />
        <text class="qr-viewer-tip">长按图片可使用「识别图中二维码」</text>
        <text class="qr-viewer-dismiss">点击空白处关闭</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

/**
 * 二维码必须放 src/static，用 /static/ 绝对路径。
 * 勿用 import('./xxx.png')：会打进 pages/.../assets/ 且带 hash，微信开发者工具本地服务常对该 URL 返回 500，<image> 白块。
 */
const QR_PRIMARY = '/static/mine/customer-service-primary.png'
const QR_BACKUP = '/static/mine/customer-service-backup.png'

/** 与首页 scroll-view 算法一致：状态栏 + 导航条 */
const NAVBAR_HEIGHT_PX = 44
/** 底栏快捷按钮 + 输入条大致总高度（rpx），与样式留白对齐 */
const FOOTER_BLOCK_RPX = 300

const chatScrollHeightPx = ref(0)

const syncChatScrollHeight = () => {
  const si = uni.getSystemInfoSync()
  const statusBar = si.statusBarHeight ?? 20
  const headerBlock = statusBar + NAVBAR_HEIGHT_PX
  const footerPx = uni.upx2px(FOOTER_BLOCK_RPX) + (si.safeAreaInsets?.bottom ?? 0)
  chatScrollHeightPx.value = Math.max(120, si.windowHeight - headerBlock - footerPx)
}

const chatScrollStyle = computed(() =>
  chatScrollHeightPx.value > 0 ? { height: `${chatScrollHeightPx.value}px` } : {}
)

onShow(() => {
  syncChatScrollHeight()
})

type ChatMessage =
  | { id: string; type: 'text'; text: string; caption?: string }
  /** qrSlot：0 常用 / 1 备用，用于打开全屏查看层 */
  | { id: string; type: 'image'; src: string; qrSlot: 0 | 1 }

const quickActions = ref([
  { type: 'feedback', label: '意见反馈' },
  { type: 'refund', label: '退款' },
  { type: 'contact', label: '联系客服' }
])

const chatMessages = ref<ChatMessage[]>([])
const scrollIntoView = ref('')

/** 全屏二维码查看（替代 previewImage） */
const qrViewerVisible = ref(false)
const qrViewerSlot = ref<0 | 1>(0)
const qrViewerSrc = computed(() => (qrViewerSlot.value === 0 ? QR_PRIMARY : QR_BACKUP))

const openQrViewer = (slot: 0 | 1) => {
  qrViewerSlot.value = slot
  qrViewerVisible.value = true
}

const closeQrViewer = () => {
  qrViewerVisible.value = false
}

const handleAction = (type: string) => {
  if (type === 'contact') {
    appendContactQrMessages()
    return
  }
  const routeMap: Record<string, string> = {
    feedback: '/pages/mine/feedback/index',
    refund: '/pages/order/refund-apply/index'
  }
  const url = routeMap[type]
  if (url) {
    uni.navigateTo({ url })
  }
}

/**
 * 在会话区追加两条客服二维码说明（常用 → 备用），并滚动到底部
 *
 * ⛔ 不要用 getImageInfo 的 res.path 作为 <image :src>：
 * 开发者工具里常会落成 /pages/当前页/static/...，渲染层请求 500，图片白块。
 * 代码包内图始终用根路径 /static/... 即可。
 */
const appendContactQrMessages = () => {
  const base = `${Date.now()}`
  const next: ChatMessage[] = [
    { id: `${base}-t1`, type: 'text', caption: '客服', text: '以下为微信客服二维码，请长按图片使用「识别图中二维码」添加客服；也可轻点图片放大查看。' },
    { id: `${base}-t2`, type: 'text', caption: '常用客服', text: '孙膑道天道文化客服（推荐优先添加）' },
    { id: `${base}-i1`, type: 'image', src: QR_PRIMARY, qrSlot: 0 },
    { id: `${base}-t3`, type: 'text', caption: '备用客服', text: '天道文化客服号 2（常用无法添加时可尝试）' },
    { id: `${base}-i2`, type: 'image', src: QR_BACKUP, qrSlot: 1 }
  ]
  chatMessages.value = [...chatMessages.value, ...next]
  void nextTick(() => {
    scrollIntoView.value = 'chat-bottom-anchor'
    void nextTick(() => {
      scrollIntoView.value = ''
    })
  })
}

const onQrImageClick = (item: ChatMessage) => {
  if (item.type === 'image') {
    openQrViewer(item.qrSlot)
  }
}

const showTip = () => {
  uni.showToast({
    title: '请使用「意见反馈」与我们联系',
    icon: 'none'
  })
}

onMounted(() => {
  syncChatScrollHeight()
})
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.chat-area {
  width: 100%;
  padding: 32rpx;
  box-sizing: border-box;
}

.assistant-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.assistant-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $td-brand-color, $td-brand-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 82, 217, 0.2);
  flex-shrink: 0;
}

.assistant-emoji {
  font-size: 48rpx;
}

.assistant-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.assistant-name {
  font-size: $td-font-size-m;
  font-weight: $td-font-weight-semibold;
  color: $td-text-color-primary;
}

.assistant-tag {
  font-size: $td-font-size-xs;
  color: $td-brand-color;
  background-color: $td-info-color-light;
  padding: 2rpx 12rpx;
  border-radius: $td-radius-small;
  align-self: flex-start;
}

.message-wrap {
  margin-bottom: 32rpx;
  margin-left: 116rpx;
  max-width: 520rpx;
}

.message-wrap--dynamic {
  max-width: 560rpx;
}

.message-hint-label {
  display: block;
  font-size: $td-font-size-xs;
  font-weight: $td-font-weight-medium;
  color: $td-text-color-secondary;
  margin-bottom: 8rpx;
}

.message-bubble {
  background-color: $td-bg-color-container;
  border-radius: 4rpx $td-radius-large $td-radius-large $td-radius-large;
  padding: 28rpx 32rpx;
  box-shadow: $td-shadow-1;
}

.message-bubble--image {
  padding: 16rpx;
}

.message-text {
  font-size: $td-font-size-base;
  color: $td-text-color-primary;
  line-height: $td-line-height-large;
}

.qr-image {
  display: block;
  width: 100%;
  max-width: 440rpx;
  border-radius: $td-radius-medium;
}

.chat-bottom-anchor {
  height: 1rpx;
  width: 100%;
}

/* 固定在视口底部，避免随聊天记录变长被顶到页面末尾；与 scroll-view 预留高度配合 */
.footer-fixed {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background-color: $td-bg-color-page;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.06);
}

.t-quick-actions {
  padding: 20rpx 0 12rpx;
}

.input-bar {
  padding: 12rpx 24rpx 20rpx;
}

.input-bar__capsule {
  display: flex;
  align-items: center;
  height: 80rpx;
  background-color: $td-bg-color-container;
  border-radius: $td-radius-round;
  padding: 0 24rpx;
  box-shadow: $td-shadow-1;
}

.capsule-plus {
  font-size: 36rpx;
  color: $td-text-color-secondary;
  flex-shrink: 0;
  margin-right: 16rpx;
}

.input-bar__capsule--disabled {
  opacity: 0.92;
}

.capsule-placeholder {
  flex: 1;
  font-size: $td-font-size-base;
  color: $td-text-color-placeholder;
}

.qr-viewer-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background-color: rgba(0, 0, 0, 0.86);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  box-sizing: border-box;
}

.qr-viewer-sheet {
  width: 100%;
  max-width: 640rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.qr-viewer-bar {
  display: flex;
  gap: 24rpx;
  align-self: stretch;
  justify-content: center;
}

.qr-viewer-tab {
  font-size: $td-font-size-base;
  color: rgba(255, 255, 255, 0.55);
  padding: 12rpx 32rpx;
  border-radius: $td-radius-round;
  border-width: 2rpx;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.35);
}

.qr-viewer-tab--on {
  color: $td-bg-color-container;
  border-color: $td-bg-color-container;
  background-color: rgba(255, 255, 255, 0.12);
}

.qr-viewer-image {
  width: 100%;
  max-width: 560rpx;
  border-radius: $td-radius-large;
  background-color: $td-bg-color-container;
}

.qr-viewer-tip {
  font-size: $td-font-size-s;
  color: rgba(255, 255, 255, 0.75);
  text-align: center;
}

.qr-viewer-dismiss {
  font-size: $td-font-size-xs;
  color: rgba(255, 255, 255, 0.45);
}
</style>
