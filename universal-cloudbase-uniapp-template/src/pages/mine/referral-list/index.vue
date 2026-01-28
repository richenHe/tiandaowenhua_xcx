<template>
  <view class="page-container">
    <TdPageHeader title="引荐人列表" :showBack="true" />

    <!-- Tab 切换头部 -->
    <view class="tab-header">
      <view 
        class="tab-header__item"
        :class="{ 'tab-header__item--active': activeTab === 0 }"
        @click="handleTabChange(0)"
      >
        <text class="tab-header__icon">🏇</text>
        <text class="tab-header__label">伯乐</text>
        <text class="tab-header__desc">我的推荐人</text>
      </view>
      <view 
        class="tab-header__item"
        :class="{ 'tab-header__item--active': activeTab === 1 }"
        @click="handleTabChange(1)"
      >
        <text class="tab-header__icon">🐎</text>
        <text class="tab-header__label">千里马</text>
        <text class="tab-header__desc">我推荐的人</text>
      </view>
    </view>

    <!-- 页面内容 -->
    <scroll-view class="scroll-content" scroll-y>
      <view class="page-content">
        <!-- 伯乐板块 (我的推荐人) -->
        <view v-if="activeTab === 0">
          <view class="section-title">🏇 我的伯乐（推荐人）</view>

          <!-- 推荐人卡片 -->
          <view class="referral-card referral-card--highlight">
            <view class="card-header">
              <view class="t-avatar t-avatar--primary t-avatar--large">
                <text class="t-avatar__text">{{ referee.name.charAt(0) }}</text>
              </view>
              <view class="card-info">
                <view class="info-name">
                  <text class="name-text">{{ referee.name }}</text>
                  <text class="level-badge">🌿</text>
                </view>
                <view class="info-level">
                  <text class="t-badge t-badge--primary">{{ referee.level }}</text>
                </view>
              </view>
            </view>

            <view class="t-divider"></view>

            <view class="card-details">
              <view class="detail-item">
                <text class="detail-label">联系方式</text>
                <text class="detail-value">{{ referee.phone }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">推荐时间</text>
                <text class="detail-value">{{ referee.date }}</text>
              </view>
            </view>
          </view>

          <!-- 说明信息 -->
          <view class="t-alert">
            <text class="alert-icon">ℹ️</text>
            <view class="alert-content">
              <text class="alert-message">伯乐是引荐您加入天道文化大家庭的人。首次购买课程后，推荐人关系将永久锁定。</text>
            </view>
          </view>
        </view>

        <!-- 千里马板块 (我推荐的人) -->
        <view v-if="activeTab === 1">
          <view class="section-title">🐎 我的千里马（推荐的人）</view>

          <!-- 统计卡片 -->
          <view class="stats-card">
            <view class="stats-item">
              <text class="stats-value">{{ stats.total }}</text>
              <text class="stats-label">总推荐人数</text>
            </view>
            <view class="stats-item">
              <text class="stats-value">{{ stats.purchased }}</text>
              <text class="stats-label">已购课程</text>
            </view>
            <view class="stats-item">
              <text class="stats-value">{{ stats.ambassador }}</text>
              <text class="stats-label">成为大使</text>
            </view>
          </view>

          <!-- 千里马列表 -->
          <view 
            v-for="person in referralList" 
            :key="person.id"
            class="referral-card"
          >
            <view class="card-header">
              <view class="t-avatar" :class="`t-avatar--${person.avatarType}`">
                <text class="t-avatar__text">{{ person.name.charAt(0) }}</text>
              </view>
              <view class="card-info">
                <view class="info-name">
                  <text class="name-text">{{ person.name }}</text>
                  <text class="level-badge level-badge--small">{{ person.icon }}</text>
                </view>
                <text class="info-date">加入时间: {{ person.joinDate }}</text>
              </view>
              <view class="t-badge" :class="`t-badge--${person.statusType}`">
                {{ person.status }}
              </view>
            </view>
          </view>

          <!-- 邀请更多 -->
          <view class="invite-more">
            <button class="t-button t-button--primary" @click="handleInvite">
              <text class="t-button__text">邀请更多好友</text>
            </button>
          </view>
        </view>
      </view>

      <!-- 底部留白 -->
      <view class="bottom-spacing"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

// Tab 状态
const activeTab = ref(0)

// 我的推荐人（伯乐）
const referee = ref({
  name: '李四',
  level: '青鸾大使',
  phone: '138****8888',
  date: '2024-01-15'
})

// 统计数据
const stats = ref({
  total: 5,
  purchased: 3,
  ambassador: 2
})

// 我推荐的人（千里马）
const referralList = ref([
  {
    id: 1,
    name: '王五',
    icon: '🌱',
    avatarType: 'success',
    joinDate: '2024-01-20',
    status: '待购课',
    statusType: 'default'
  },
  {
    id: 2,
    name: '赵六',
    icon: '🌿',
    avatarType: 'warning',
    joinDate: '2024-02-05',
    status: '已购课',
    statusType: 'success'
  },
  {
    id: 3,
    name: '钱七',
    icon: '🌿',
    avatarType: 'primary',
    joinDate: '2024-02-18',
    status: '准青鸾',
    statusType: 'primary'
  },
  {
    id: 4,
    name: '孙八',
    icon: '🍀',
    avatarType: 'error',
    joinDate: '2024-03-01',
    status: '青鸾大使',
    statusType: 'warning'
  },
  {
    id: 5,
    name: '周九',
    icon: '🌱',
    avatarType: 'default',
    joinDate: '2024-03-10',
    status: '待购课',
    statusType: 'default'
  }
])

// 切换 Tab
const handleTabChange = (index: number) => {
  activeTab.value = index
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 邀请好友
const handleInvite = () => {
  uni.showToast({
    title: '邀请功能开发中',
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

// Tab 切换头部
.tab-header {
  display: flex;
  background-color: #FFFFFF;
  border-bottom: 1px solid $td-border-level-1;
}

.tab-header__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx 24rpx;
  border-bottom: 4rpx solid transparent;
  transition: all 0.3s;
  color: $td-text-color-secondary;
}

.tab-header__item--active {
  color: $td-brand-color;
  border-bottom-color: $td-brand-color;
}

.tab-header__icon {
  font-size: 56rpx;
  margin-bottom: 8rpx;
}

.tab-header__label {
  font-size: 28rpx;
  font-weight: 500;
}

.tab-header__desc {
  font-size: 22rpx;
  margin-top: 4rpx;
  opacity: 0.8;
}

// 滚动内容
.scroll-content {
  height: calc(100vh - var(--td-page-header-height) - 180rpx);
}

.page-content {
  padding: 32rpx;
}

// 分区标题
.section-title {
  font-size: 28rpx;
  color: $td-text-color-secondary;
  margin-bottom: 24rpx;
  padding-left: 8rpx;
}

// 推荐人卡片
.referral-card {
  background-color: #FFFFFF;
  border-radius: $td-radius-default;
  border: 1px solid $td-border-level-1;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.referral-card--highlight {
  border-color: $td-brand-color;
  background: linear-gradient(135deg, rgba(0,82,217,0.02) 0%, rgba(38,111,232,0.05) 100%);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
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

.t-avatar--large {
  width: 96rpx;
  height: 96rpx;
}

.t-avatar--primary {
  background-color: $td-brand-color;
}

.t-avatar--success {
  background-color: $td-success-color;
}

.t-avatar--warning {
  background-color: $td-warning-color;
}

.t-avatar--error {
  background-color: $td-error-color;
}

.t-avatar--default {
  background-color: #F5F5F5;
  color: #999999 !important;
}

.t-avatar__text {
  font-size: 32rpx;
  color: #FFFFFF;
  font-weight: 600;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-name {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.name-text {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.level-badge {
  font-size: 32rpx;
}

.level-badge--small {
  font-size: 28rpx;
}

.info-level {
  display: flex;
  gap: 12rpx;
}

.info-date {
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

// 徽章
.t-badge {
  font-size: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  display: inline-block;
  flex-shrink: 0;
}

.t-badge--primary {
  background-color: $td-info-color-light;
  color: $td-brand-color;
}

.t-badge--success {
  background-color: $td-success-color-light;
  color: $td-success-color;
}

.t-badge--warning {
  background-color: $td-warning-color-light;
  color: $td-warning-color;
}

.t-badge--default {
  background-color: $td-bg-color-page;
  color: $td-text-color-placeholder;
}

// 分割线
.t-divider {
  height: 1px;
  background-color: $td-border-level-0;
  margin: 24rpx 0;
}

// 卡片详情
.card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.detail-label {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
}

.detail-value {
  font-size: 26rpx;
  color: $td-text-color-secondary;
}

// 提示框
.t-alert {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  background-color: $td-info-color-light;
  border-radius: $td-radius-default;
  margin-top: 24rpx;
}

.alert-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 统计卡片
.stats-card {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border-radius: $td-radius-default;
  padding: 40rpx;
  margin-bottom: 32rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32rpx;
  text-align: center;
}

.stats-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.stats-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #333333;
}

.stats-label {
  font-size: 24rpx;
  color: #666666;
}

// 邀请更多
.invite-more {
  text-align: center;
  padding: 40rpx 0;
}

// 按钮样式
.t-button {
  border: none;
  border-radius: $td-radius-default;
  font-size: 28rpx;
  font-weight: 500;
  padding: 0 64rpx;
  height: 80rpx;
  line-height: 80rpx;
  display: inline-flex;
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

// 底部留白
.bottom-spacing {
  height: 120rpx;
}
</style>

