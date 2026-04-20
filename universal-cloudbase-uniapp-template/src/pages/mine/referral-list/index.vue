<template>
  <view class="page-container">
    <TdPageHeader title="引荐人列表" :showBack="true" />

    <!-- 页面内容 -->
    <scroll-view class="scroll-content" scroll-y>
      <view class="page-content">
        <!-- 千里马板块 (我推荐的人) -->
        <view>
          <view class="t-section-title t-section-title--simple">🐎 我的千里马（推荐的人）</view>

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
              <view class="t-avatar" :class="`t-avatar--${getAvatarType(person.ambassador_level)}`">
                <text class="t-avatar__text">{{ person.real_name?.charAt(0) || '?' }}</text>
              </view>
              <view class="card-info">
                <view class="info-name">
                  <text class="name-text">{{ person.real_name || '未设置' }}</text>
                  <text class="level-badge level-badge--small">{{ getLevelIcon(person.activity_count || 0) }}</text>
                </view>
                <text class="info-date">加入时间: {{ formatDate(person.created_at) }}</text>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="referralList.length === 0 && !loading" class="empty-state">
            <text class="empty-icon">🐎</text>
            <text class="empty-text">暂无推荐记录</text>
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
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { UserApi } from '@/api'
import type { RefereeListItem } from '@/api/types/user'

// 统计数据
const stats = ref({
  total: 0,
  purchased: 0,
  ambassador: 0
})

// 我推荐的人（千里马）
const referralList = ref<RefereeListItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const finished = ref(false)

// 获取我推荐的人列表
const loadReferralList = async (reset = false) => {
  if (loading.value || finished.value) return

  if (reset) {
    page.value = 1
    referralList.value = []
    finished.value = false
  }

  try {
    uni.showLoading({ title: '加载中...' })
    loading.value = true
    const result = await UserApi.getMyReferees({
      page: page.value,
      pageSize: pageSize.value
    })

    referralList.value.push(...result.list)
    total.value = result.total
    page.value++

    // 计算统计数据
    stats.value.total = result.total
    stats.value.purchased = result.list.filter(item => item.has_purchased).length
    stats.value.ambassador = result.list.filter(item => item.ambassador_level >= 1).length

    if (referralList.value.length >= result.total) {
      finished.value = true
    }
    uni.hideLoading()
  } catch (error) {
    console.error('获取推荐人列表失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadReferralList()
})

onShow(() => {
  loadReferralList()
})

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 邀请好友
const handleInvite = () => {
  uni.navigateTo({
    url: '/pages/ambassador/qrcode/index'
  })
}

// 获取头像主题
const getAvatarType = (level: number) => {
  const typeMap: Record<number, string> = {
    0: 'default',
    1: 'default',
    2: 'primary',
    3: 'success',
    4: 'warning'
  }
  return typeMap[level] || 'default'
}

// 获取等级文本
const getLevelText = (level: number) => {
  const levelMap: Record<number, string> = {
    0: '普通用户',
    1: '准青鸾大使',
    2: '青鸾大使',
    3: '鸿鹄大使',
    4: '金凤大使'
  }
  return levelMap[level] || '普通用户'
}

// 获取成长标志图标（四进制图标计数器，与 mine/index 保持一致）
// 规则：4🌱=1🌿，4🌿=1🍀，4🍀=1🌳，4🌳=1🌟
// 示例：1次=🌱，4次=🌿，6次=🌿🌱🌱，17次=🍀🌱
const getLevelIcon = (activityCount: number): string => {
  if (activityCount <= 0) return '';
  let n = activityCount;
  let result = '';
  const levels = [
    { icon: '🌟', value: 256 },
    { icon: '🌳', value: 64 },
    { icon: '🍀', value: 16 },
    { icon: '🌿', value: 4 },
    { icon: '🌱', value: 1 }
  ];
  for (const { icon, value } of levels) {
    const count = Math.floor(n / value);
    if (count > 0) result += icon.repeat(count);
    n = n % value;
  }
  return result;
}

// 获取状态文本
const getStatusText = (item: RefereeListItem) => {
  if (item.ambassador_level >= 1) {
    return getLevelText(item.ambassador_level)
  }
  return item.has_purchased ? '已购课' : '待购课'
}

// 获取状态类型
const getStatusType = (item: RefereeListItem) => {
  if (item.ambassador_level >= 1) {
    return 'warning'
  }
  return item.has_purchased ? 'success' : 'default'
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return dateStr.split(' ')[0]
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

// 分区标题
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
  border-radius: $td-radius-round;
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

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>

