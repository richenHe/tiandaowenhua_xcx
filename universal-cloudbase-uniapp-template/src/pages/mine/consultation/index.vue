<template>
  <view class="page-container">
    <TdPageHeader title="在线咨询" :showBack="true" />

    <scroll-view 
      class="chat-content" 
      scroll-y 
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view class="chat-messages">
        <view 
          v-for="(message, index) in messages" 
          :key="index"
          :id="`msg-${index}`"
          class="chat-message"
          :class="`chat-message--${message.type}`"
        >
          <view class="t-avatar" :class="`t-avatar--${message.type === 'left' ? 'primary' : 'success'}`">
            <text class="t-avatar__text">{{ message.avatar }}</text>
          </view>
          <view class="chat-bubble" :class="`chat-bubble--${message.type}`">
            <text>{{ message.content }}</text>
          </view>
        </view>
      </view>

      <!-- 底部留白 -->
      <view class="bottom-spacing"></view>
    </scroll-view>

    <!-- 固定底部输入框 -->
    <view class="fixed-bottom">
      <view class="input-wrapper">
        <input 
          class="chat-input"
          v-model="inputText"
          type="text"
          placeholder="请输入消息..."
          confirm-type="send"
          @confirm="handleSend"
        />
        <button class="t-button t-button--primary" @click="handleSend">
          <text class="t-button__text">发送</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

// 消息列表
const messages = ref([
  {
    type: 'left',
    avatar: '客',
    content: '您好！我是您的专属客服，有什么可以帮您的吗？'
  },
  {
    type: 'right',
    avatar: '我',
    content: '我想了解一下初探班的课程内容'
  },
  {
    type: 'left',
    avatar: '客',
    content: '初探班是我们的入门课程，主要学习天道文化的基础理论。课程为期3天，包含理论讲解和实践应用两部分内容。'
  }
])

// 输入框文本
const inputText = ref('')

// 滚动到的消息ID
const scrollIntoView = ref('')

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 发送消息
const handleSend = () => {
  if (!inputText.value.trim()) {
    return
  }

  // 添加用户消息
  messages.value.push({
    type: 'right',
    avatar: '我',
    content: inputText.value
  })

  // 清空输入框
  inputText.value = ''

  // 滚动到最新消息
  nextTick(() => {
    scrollIntoView.value = `msg-${messages.value.length - 1}`
  })

  // 模拟客服回复
  setTimeout(() => {
    messages.value.push({
      type: 'left',
      avatar: '客',
      content: '感谢您的咨询，我们会尽快为您解答。'
    })

    nextTick(() => {
      scrollIntoView.value = `msg-${messages.value.length - 1}`
    })
  }, 1000)
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

// 聊天内容
.chat-content {
  height: calc(100vh - var(--td-page-header-height) - 120rpx);
}

.chat-messages {
  padding: 32rpx;
}

// 聊天消息
.chat-message {
  display: flex;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.chat-message--left {
  flex-direction: row;
}

.chat-message--right {
  flex-direction: row-reverse;
}

// 头像
.t-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.t-avatar--primary {
  background-color: $td-brand-color;
}

.t-avatar--success {
  background-color: $td-success-color;
}

.t-avatar__text {
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: 500;
}

// 聊天气泡
.chat-bubble {
  max-width: 70%;
  padding: 24rpx 32rpx;
  border-radius: $td-radius-default;
  line-height: 1.5;
  font-size: 28rpx;
}

.chat-bubble--left {
  background-color: #FFFFFF;
  color: $td-text-color-primary;
}

.chat-bubble--right {
  background-color: $td-brand-color;
  color: #FFFFFF;
}

// 底部留白
.bottom-spacing {
  height: 120rpx;
}

// 固定底部
.fixed-bottom {
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background-color: #FFFFFF;
  border-top: 1px solid $td-border-level-0;
}

.input-wrapper {
  display: flex;
  gap: 16rpx;
}

.chat-input {
  flex: 1;
  padding: 24rpx;
  background-color: $td-bg-color-page;
  border: 1px solid $td-border-level-1;
  border-radius: $td-radius-default;
  font-size: 28rpx;
  color: $td-text-color-primary;
}

// 按钮样式
.t-button {
  border: none;
  border-radius: $td-radius-default;
  font-size: 28rpx;
  font-weight: 500;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &::after {
    border: none;
  }
}

.t-button--primary {
  background-color: #E6F4FF;
  color: $td-brand-color;
}

.t-button__text {
  font-size: 28rpx;
}
</style>

