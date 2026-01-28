<template>
  <view class="page-container">
    <TdPageHeader title="初探班详情" :showBack="true">
      <template #action>
        <text class="action-icon" @click="handleShare">📤</text>
      </template>
    </TdPageHeader>

    <scroll-view scroll-y class="scroll-area">
      <!-- 封面图片 -->
      <view class="cover-image">📚</view>

      <view class="page-content">
        <!-- 课程基本信息 -->
        <view class="t-card t-card--bordered">
          <view class="t-card__body">
            <view class="course-title">{{ courseInfo.name }}</view>
            <view class="course-meta">
              <text class="course-price">¥{{ courseInfo.price }}</text>
              <view class="t-badge--standalone t-badge--theme-success">
                已有{{ courseInfo.soldCount }}人购买
              </view>
            </view>
          </view>
        </view>

        <!-- 标签页 -->
        <view class="t-tabs">
          <view class="t-tabs__header t-is-top">
            <view class="t-tabs__nav">
              <view class="t-tabs__nav-container">
                <view class="t-tabs__nav-wrap">
                  <view
                    class="t-tabs__bar"
                    :style="{ left: activeTabIndex * 160 + 'rpx', width: '160rpx' }"
                  ></view>
                  <view
                    v-for="(tab, index) in tabs"
                    :key="index"
                    class="t-tabs__nav-item"
                    :class="{ 't-is-active': activeTabIndex === index }"
                    @click="activeTabIndex = index"
                  >
                    <text>{{ tab.label }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view class="t-tabs__content">
            <view class="t-card t-card--bordered">
              <view class="t-card__body">
                <!-- 课程介绍 -->
                <view v-if="activeTabIndex === 0">
                  <view class="section-heading">📖 课程介绍</view>
                  <view class="section-text">{{ courseInfo.description }}</view>
                </view>

                <!-- 课程大纲 -->
                <view v-if="activeTabIndex === 1">
                  <view class="section-heading">📋 课程大纲</view>
                  <view class="section-list">
                    <view v-for="(item, index) in courseInfo.outline" :key="index" class="list-item">
                      {{ item }}
                    </view>
                  </view>
                </view>

                <!-- 讲师介绍 -->
                <view v-if="activeTabIndex === 2">
                  <view class="section-heading">👨‍🏫 讲师介绍</view>
                  <view class="section-text">{{ courseInfo.instructor }}</view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部 -->
    <view class="fixed-bottom">
      <text class="bottom-price">¥{{ courseInfo.price }}</text>
      <button
        class="t-button t-button--theme-light t-button--variant-base t-button--size-large"
        @click="handleBuy"
      >
        <text class="t-button__text">立即购买</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';

// 当前选中的标签页
const activeTabIndex = ref(0);

// 标签页列表
const tabs = [
  { label: '课程介绍' },
  { label: '课程大纲' },
  { label: '讲师介绍' },
];

// 课程信息（mock数据）
const courseInfo = ref({
  name: '初探班',
  price: 1688,
  soldCount: 500,
  description: '这是一门系统性学习天道文化的课程，帮助学员深入理解国学智慧，传承中华文化。',
  outline: [
    '第一天:基础理论',
    '第二天:实践应用',
    '第三天:深度解析',
  ],
  instructor: '资深讲师，从事国学教育20余年，有丰富的教学经验。',
});

/**
 * 分享
 */
const handleShare = () => {
  uni.showShareMenu({
    withShareTicket: true,
  });
};

/**
 * 立即购买
 */
const handleBuy = () => {
  uni.navigateTo({
    url: '/pages/order/confirm/index',
  });
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
  display: flex;
  flex-direction: column;
}

.action-icon {
  font-size: 36rpx;
  cursor: pointer;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
}

.cover-image {
  width: 100%;
  height: 420rpx;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 128rpx;
}

.page-content {
  padding: 32rpx;
  padding-bottom: calc(152rpx + env(safe-area-inset-bottom)); // 为固定底部预留空间 + 额外留白
}

// 课程基本信息
.course-title {
  font-size: 48rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  color: $td-text-color-primary;
}

.course-meta {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.course-price {
  color: $td-warning-color;
  font-size: 56rpx;
  font-weight: 600;
}

.t-badge--standalone {
  padding: 8rpx 16rpx;
  border-radius: $td-radius-default;
  font-size: 20rpx;
  display: inline-flex;
  align-items: center;

  &.t-badge--theme-success {
    background-color: rgba($td-success-color, 0.1);
    color: $td-success-color;
  }
}

// 标签页样式
.t-tabs {
  margin-top: 32rpx;
}

.t-tabs__header {
  background: white;
  border-radius: $td-radius-default;
  overflow: hidden;
  margin-bottom: 32rpx;
}

.t-tabs__nav-wrap {
  display: flex;
  position: relative;
  padding: 8rpx;
}

.t-tabs__bar {
  position: absolute;
  bottom: 8rpx;
  height: 4rpx;
  background-color: $td-brand-color;
  border-radius: 2rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.t-tabs__nav-item {
  flex: 1;
  padding: 24rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: $td-text-color-secondary;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &.t-is-active {
    color: $td-brand-color;
    font-weight: 600;
  }

  &:active {
    opacity: 0.7;
  }
}

// 标签页内容
.section-heading {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 24rpx;
}

.section-text {
  color: $td-text-color-secondary;
  line-height: 1.8;
  font-size: 28rpx;
}

.section-list {
  margin-left: 40rpx;

  .list-item {
    color: $td-text-color-secondary;
    line-height: 1.8;
    font-size: 28rpx;
    list-style: disc;
    display: list-item;

    &::before {
      content: '• ';
      color: $td-brand-color;
      font-weight: bold;
      margin-right: 8rpx;
    }
  }
}

// 固定底部
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: white;
  border-top: 2rpx solid $td-border-level-1;
  z-index: 100;
}

.bottom-price {
  color: $td-warning-color;
  font-size: 48rpx;
  font-weight: 600;
}

.t-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $td-radius-default;
  border: none;
  padding: 0 48rpx;

  &--size-large {
    height: 88rpx;
  }

  &--theme-light {
    background-color: rgba($td-brand-color, 0.1);

    .t-button__text {
      color: $td-brand-color;
      font-size: 32rpx;
      font-weight: 500;
    }
  }
}
</style>

