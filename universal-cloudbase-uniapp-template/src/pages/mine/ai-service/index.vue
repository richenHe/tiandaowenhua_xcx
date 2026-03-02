<template>
  <view class="page-container">
    <TdPageHeader title="智能客服" :showBack="true" />

    <!-- 聊天内容区域 -->
    <scroll-view scroll-y class="chat-area">
      <!-- 客服信息头部 -->
      <view class="assistant-header">
        <view class="assistant-avatar">
          <text class="assistant-emoji">🤖</text>
        </view>
        <view class="assistant-info">
          <text class="assistant-name">天道智能客服</text>
          <text class="assistant-tag">AI 智能助理</text>
        </view>
      </view>

      <!-- 消息气泡 -->
      <view class="message-bubble">
        <text class="message-text">
          智能客服功能还在开发中，暂不提供对话服务。如需帮助，请点击下方按钮前往意见反馈。
        </text>
      </view>
    </scroll-view>

    <!-- 底部固定区域：快捷操作 + 输入框 -->
    <view class="footer-fixed">
      <!-- 快捷操作按钮（可水平滑动） -->
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

      <!-- 静态输入框：单个白色圆角容器整体包裹 -->
      <view class="input-bar" @click="showTip">
        <view class="input-bar__capsule">
          <text class="capsule-plus">＋</text>
          <text class="capsule-placeholder">请输入您要咨询的内容</text>
          <text class="capsule-voice">🎙️</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

const quickActions = ref([
  { type: 'feedback', label: '意见反馈' },
  { type: 'refund', label: '退款' }
])

const handleAction = (type: string) => {
  const routeMap: Record<string, string> = {
    feedback: '/pages/mine/feedback/index',
    refund: '/pages/order/refund-apply/index'
  }
  const url = routeMap[type]
  if (url) {
    uni.navigateTo({ url })
  }
}

const showTip = () => {
  uni.showToast({
    title: '智能客服正在开发中',
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
  display: flex;
  flex-direction: column;
}

// ==================== 聊天内容区域 ====================

.chat-area {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
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

// ==================== 消息气泡 ====================

.message-bubble {
  background-color: $td-bg-color-container;
  border-radius: 4rpx $td-radius-large $td-radius-large $td-radius-large;
  padding: 28rpx 32rpx;
  margin-bottom: 32rpx;
  box-shadow: $td-shadow-1;
  margin-left: 116rpx;
  max-width: 520rpx;
}

.message-text {
  font-size: $td-font-size-base;
  color: $td-text-color-primary;
  line-height: $td-line-height-large;
}

// ==================== 底部固定区域 ====================

.footer-fixed {
  background-color: transparent;
  padding-bottom: env(safe-area-inset-bottom);
}

.t-quick-actions {
  padding: 20rpx 0 12rpx;
}

// ==================== 静态输入框（整体白色胶囊） ====================

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

.capsule-placeholder {
  flex: 1;
  font-size: $td-font-size-base;
  color: $td-text-color-placeholder;
}

.capsule-voice {
  font-size: 32rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}
</style>
