<template>
  <view class="page-container">
    <TdPageHeader title="个人资料" :showBack="true" />

    <scroll-view class="scroll-content" scroll-y>
      <view class="page-content">
        <!-- 基本信息 -->
        <view class="t-list">
          <view class="t-list-item" @click="handleEditName">
            <view class="t-list-item__meta">姓名</view>
            <view class="t-list-item__content">{{ userInfo.name }}</view>
            <view class="t-list-item__action">›</view>
          </view>

          <view class="t-list-item" @click="handleEditPhone">
            <view class="t-list-item__meta">手机</view>
            <view class="t-list-item__content">{{ userInfo.phone }}</view>
            <view class="t-list-item__action">›</view>
          </view>

          <view class="t-list-item" @click="handleEditGender">
            <view class="t-list-item__meta">性别</view>
            <view class="t-list-item__content">{{ userInfo.gender }}</view>
            <view class="t-list-item__action">›</view>
          </view>
        </view>

        <!-- 推荐人信息 -->
        <view class="section-title">🎯 推荐人信息</view>
        <view class="t-list">
          <view class="t-list-item" @click="goToRefereeManage">
            <view class="t-list-item__meta">我的传播大使</view>
            <view class="t-list-item__content">
              <view class="referee-info">
                <text>{{ userInfo.referee.name }}</text>
                <text class="t-badge t-badge--primary">{{ userInfo.referee.level }}</text>
                <text class="t-badge t-badge--warning">{{ userInfo.referee.status }}</text>
              </view>
            </view>
            <view class="t-list-item__action">›</view>
          </view>
        </view>

        <!-- 个人信息 -->
        <view class="section-title">📝 个人信息</view>
        <view class="t-list">
          <view class="t-list-item" @click="handleEditBirthday">
            <view class="t-list-item__meta">出生八字</view>
            <view class="t-list-item__content">
              <text :class="{'placeholder-text': !userInfo.birthday}">
                {{ userInfo.birthday || '未填写' }}
              </text>
            </view>
            <view class="t-list-item__action">›</view>
          </view>

          <view class="t-list-item" @click="handleEditIndustry">
            <view class="t-list-item__meta">从事行业</view>
            <view class="t-list-item__content">{{ userInfo.industry }}</view>
            <view class="t-list-item__action">›</view>
          </view>

          <view class="t-list-item" @click="handleEditLocation">
            <view class="t-list-item__meta">所在地区</view>
            <view class="t-list-item__content">{{ userInfo.location }}</view>
            <view class="t-list-item__action">›</view>
          </view>
        </view>
      </view>

      <!-- 底部留白 -->
      <view class="bottom-spacing"></view>
    </scroll-view>

    <!-- 固定底部按钮 -->
    <view class="fixed-bottom">
      <button class="t-button t-button--primary t-button--block t-button--large" @click="handleSave">
        <text class="t-button__text">保存</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

// Mock 数据
const userInfo = ref({
  name: '张三',
  phone: '138****8000',
  gender: '男',
  birthday: '',
  industry: '互联网',
  location: '北京市',
  referee: {
    name: '李四',
    level: '青鸾大使',
    status: '未确认'
  }
})

// 跳转到推荐人管理
const goToRefereeManage = () => {
  uni.navigateTo({
    url: '/pages/mine/referee-manage/index'
  })
}

// 处理编辑姓名
const handleEditName = () => {
  uni.showToast({
    title: '编辑姓名功能',
    icon: 'none'
  })
}

// 处理编辑手机
const handleEditPhone = () => {
  uni.showToast({
    title: '编辑手机功能',
    icon: 'none'
  })
}

// 处理编辑性别
const handleEditGender = () => {
  uni.showActionSheet({
    itemList: ['男', '女'],
    success: (res) => {
      userInfo.value.gender = res.tapIndex === 0 ? '男' : '女'
    }
  })
}

// 处理编辑出生八字
const handleEditBirthday = () => {
  uni.showToast({
    title: '编辑出生八字功能',
    icon: 'none'
  })
}

// 处理编辑行业
const handleEditIndustry = () => {
  uni.showToast({
    title: '编辑行业功能',
    icon: 'none'
  })
}

// 处理编辑地区
const handleEditLocation = () => {
  uni.showToast({
    title: '编辑地区功能',
    icon: 'none'
  })
}

// 保存
const handleSave = () => {
  uni.showToast({
    title: '保存成功',
    icon: 'success'
  })
  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
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

// 列表样式
.t-list {
  background-color: #FFFFFF;
  border-radius: $td-radius-default;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.t-list-item {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1px solid $td-border-level-0;

  &:last-child {
    border-bottom: none;
  }
}

.t-list-item__meta {
  font-size: 28rpx;
  color: $td-text-color-primary;
  width: 180rpx;
  flex-shrink: 0;
}

.t-list-item__content {
  flex: 1;
  font-size: 28rpx;
  color: $td-text-color-secondary;
  text-align: right;
  padding-right: 16rpx;
}

.t-list-item__action {
  font-size: 32rpx;
  color: $td-text-color-placeholder;
  flex-shrink: 0;
}

// 头像
.t-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: $td-brand-color;
  display: flex;
  align-items: center;
  justify-content: center;
}

.t-avatar--theme-primary {
  background-color: $td-brand-color;
}

.t-avatar__text {
  font-size: 32rpx;
  color: #FFFFFF;
  font-weight: 600;
}

// 推荐人信息
.referee-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.t-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.t-badge--primary {
  background-color: $td-info-color-light;
  color: $td-brand-color;
}

.t-badge--warning {
  background-color: $td-warning-color-light;
  color: $td-warning-color;
}

// 占位文本
.placeholder-text {
  color: $td-text-color-placeholder !important;
}

// 分区标题
.section-title {
  font-size: 28rpx;
  color: $td-text-color-secondary;
  margin: 48rpx 0 24rpx 0;
  padding-left: 8rpx;
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
}

.t-button--large {
  height: 96rpx;
  line-height: 96rpx;
}

.t-button__text {
  font-size: 32rpx;
}
</style>

