<template>
  <view class="page-container">
    <TdPageHeader title="推荐人管理" :showBack="true" />

    <scroll-view class="scroll-content" scroll-y>
      <view class="page-content">
        <!-- 推荐人状态卡片 -->
        <view class="t-card">
          <view class="t-card__header">
            <text class="card-title">当前推荐人</text>
            <view class="t-badge" :class="`t-badge--${refereeInfo.statusType}`">
              {{ refereeInfo.status }}
            </view>
          </view>

          <view class="t-card__body">
            <view class="referee-profile">
              <view class="t-avatar t-avatar--primary t-avatar--large">
                <text class="t-avatar__text">{{ refereeInfo.name.charAt(0) }}</text>
              </view>
              <view class="profile-info">
                <text class="profile-name">{{ refereeInfo.name }}</text>
                <text class="profile-phone">手机: {{ refereeInfo.phone }}</text>
              </view>
              <view class="t-badge t-badge--primary t-badge--medium">
                {{ refereeInfo.level }}
              </view>
            </view>

            <view class="t-divider"></view>

            <view class="referee-details">
              <view class="detail-row">
                <text class="detail-label">设置时间</text>
                <text class="detail-value">{{ refereeInfo.setDate }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">最后修改</text>
                <text class="detail-value">{{ refereeInfo.lastModified }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">修改次数</text>
                <text class="detail-value">{{ refereeInfo.modifyCount }}次</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">确认状态</text>
                <text class="detail-value status-text" :class="refereeInfo.confirmed ? 'text-success' : 'text-warning'">
                  {{ refereeInfo.confirmed ? '已确认' : '待确认' }}
                </text>
              </view>
            </view>
          </view>

          <!-- 未确认状态：显示修改按钮 -->
          <view v-if="!refereeInfo.confirmed" class="t-card__footer">
            <button class="t-button t-button--primary t-button--block" @click="handleModifyReferee">
              <text class="t-button__text">修改推荐人</text>
            </button>
          </view>
        </view>

        <!-- 修改规则说明 -->
        <view class="t-alert t-alert--info">
          <text class="alert-icon">ℹ️</text>
          <view class="alert-content">
            <text class="alert-title">推荐人修改规则</text>
            <view class="alert-message">
              <text>• 支付前可多次修改推荐人</text>
              <text>• 首次购买支付成功后推荐人永久锁定</text>
              <text>• 7天内只能修改一次推荐人</text>
              <text>• 不能选择自己或自己的下级为推荐人</text>
            </view>
          </view>
        </view>

        <!-- 推荐人资格说明 -->
        <view class="t-alert t-alert--warning">
          <text class="alert-icon">⚠️</text>
          <view class="alert-content">
            <text class="alert-title">推荐人资格说明</text>
            <view class="alert-message">
              <text>• <text class="text-bold">准青鸾大使</text>：仅可推荐初探班课程</text>
              <text>• <text class="text-bold">青鸾及以上</text>：可推荐所有课程</text>
              <text>• 请根据购买课程类型选择合适的推荐人</text>
            </view>
          </view>
        </view>

        <!-- 已确认状态提示（条件显示） -->
        <view v-if="refereeInfo.confirmed" class="t-alert t-alert--success">
          <text class="alert-icon">✅</text>
          <view class="alert-content">
            <text class="alert-message">
              推荐人已永久确认，不可再修改。确认时间：{{ refereeInfo.confirmDate }}
            </text>
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

// 推荐人信息
const refereeInfo = ref({
  name: '李四',
  phone: '138****8888',
  level: '青鸾大使',
  status: '未确认',
  statusType: 'warning',
  setDate: '2024-01-15',
  lastModified: '2024-01-15',
  modifyCount: 0,
  confirmed: false,
  confirmDate: ''
})

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 修改推荐人
const handleModifyReferee = () => {
  uni.navigateTo({
    url: '/pages/order/select-referee/index'
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

// 滚动内容
.scroll-content {
  height: calc(100vh - var(--td-page-header-height));
}

.page-content {
  padding: 32rpx;
}

// 卡片样式
.t-card {
  background-color: #FFFFFF;
  border-radius: $td-radius-default;
  border: 1px solid $td-border-level-1;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.t-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1px solid $td-border-level-0;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.t-card__body {
  padding: 24rpx;
}

// 推荐人资料
.referee-profile {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

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

.t-avatar__text {
  font-size: 36rpx;
  color: #FFFFFF;
  font-weight: 600;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.profile-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.profile-phone {
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

.t-badge--medium {
  font-size: 22rpx;
  padding: 8rpx 20rpx;
}

.t-badge--primary {
  background-color: $td-info-color-light;
  color: $td-brand-color;
}

.t-badge--warning {
  background-color: $td-warning-color-light;
  color: $td-warning-color;
}

.t-badge--success {
  background-color: $td-success-color-light;
  color: $td-success-color;
}

// 分割线
.t-divider {
  height: 1px;
  background-color: $td-border-level-0;
  margin: 24rpx 0;
}

// 推荐人详情
.referee-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.detail-row {
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

.status-text {
  font-weight: 500;
}

.text-success {
  color: $td-success-color !important;
}

.text-warning {
  color: $td-warning-color !important;
}

.t-card__footer {
  padding: 24rpx;
  border-top: 1px solid $td-border-level-0;
}

// 按钮样式
.t-button {
  border: none;
  border-radius: $td-radius-default;
  font-size: 32rpx;
  font-weight: 500;
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

.t-button--block {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
}

.t-button__text {
  font-size: 32rpx;
}

// 提示框
.t-alert {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: $td-radius-default;
  margin-bottom: 24rpx;
}

.t-alert--info {
  background-color: $td-info-color-light;
}

.t-alert--warning {
  background-color: $td-warning-color-light;
}

.t-alert--success {
  background-color: $td-success-color-light;
}

.alert-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.alert-title {
  font-size: 28rpx;
  font-weight: 500;
  color: $td-text-color-primary;
}

.alert-message {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.text-bold {
  font-weight: 500;
  color: $td-text-color-primary;
}

// 底部留白
.bottom-spacing {
  height: 120rpx;
}
</style>

