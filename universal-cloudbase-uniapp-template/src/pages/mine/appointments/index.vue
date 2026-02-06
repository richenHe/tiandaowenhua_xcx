<template>
  <view class="page-container">
    <TdPageHeader title="我的预约" :showBack="true" />

    <scroll-view
      class="scroll-content"
      scroll-y
      @scroll="handleScroll"
    >
      <view class="page-content">
        <!-- 筛选标签 -->
        <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight" :margin-bottom="32">
          <template #tabs>
            <CapsuleTabs
              v-model="activeTab"
              :options="tabOptions"
              @change="handleTabChange"
            />
          </template>
        </StickyTabs>

        <!-- 预约列表 -->
        <view class="appointment-list">
          <view 
            v-for="appointment in filteredAppointments" 
            :key="appointment.id"
            class="t-card"
            @click="goToAppointmentDetail(appointment.id)"
          >
            <view class="t-card__body">
              <view class="card-header">
                <text class="card-title">{{ appointment.title }}</text>
                <view class="t-badge" :class="`t-badge--${appointment.statusType}`">
                  {{ appointment.status }}
                </view>
              </view>

              <view class="card-info">
                <view class="info-item">
                  <text class="info-icon">📅</text>
                  <text class="info-text">上课时间: {{ appointment.time }}</text>
                </view>
                <view class="info-item">
                  <text class="info-icon">📍</text>
                  <text class="info-text">上课地点: {{ appointment.location }}</text>
                </view>
                <view class="info-item">
                  <text class="info-icon">👨‍🏫</text>
                  <text class="info-text">授课老师: {{ appointment.teacher }}</text>
                </view>
                <view v-if="appointment.phone" class="info-item">
                  <text class="info-icon">📞</text>
                  <text class="info-text">联系电话: {{ appointment.phone }}</text>
                </view>
              </view>

              <!-- 待上课状态：显示取消预约按钮 -->
              <view v-if="appointment.appointmentStatus === 'pending'">
                <view class="t-divider"></view>
                <view class="card-actions">
                  <button class="t-button t-button--outline t-button--block" @click.stop="handleCancel(appointment.id)">
                    <text class="t-button__text">取消预约</text>
                  </button>
                </view>
              </view>

              <!-- 已完成状态：显示评价 -->
              <view v-if="appointment.appointmentStatus === 'completed'">
                <view class="t-divider"></view>
                <view class="card-footer">
                  <text class="rating-text">评价: {{ appointment.rating }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 提示信息 -->
        <view class="t-alert">
          <text class="alert-icon">💡</text>
          <view class="alert-content">
            <text class="alert-message">可复训课程支持多次预约上课</text>
          </view>
        </view>
      </view>

      <!-- 底部留白 -->
      <view class="bottom-spacing"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

// 页面头部高度
const pageHeaderHeight = ref(64)

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight
})

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}

// Tab 标签
const tabs = ['全部', '待上课', '已完成', '已取消']
const activeTab = ref(0)
const tabOptions = [
  { label: '全部', value: 0 },
  { label: '待上课', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已取消', value: 3 }
]

// Mock 预约数据
const appointments = ref([
  {
    id: 1,
    title: '初探班 第12期',
    time: '2024-02-01 09:00',
    location: '北京市朝阳区天道文化中心',
    teacher: '张老师',
    phone: '010-12345678',
    status: '待上课',
    statusType: 'warning',
    appointmentStatus: 'pending'
  },
  {
    id: 2,
    title: '初探班 第11期（复训）',
    time: '2024-01-15 09:00',
    location: '北京市朝阳区天道文化中心',
    teacher: '张老师',
    phone: '',
    status: '已完成',
    statusType: 'success',
    appointmentStatus: 'completed',
    rating: '⭐⭐⭐⭐⭐'
  }
])

// 过滤预约
const filteredAppointments = computed(() => {
  if (activeTab.value === 0) {
    return appointments.value
  } else if (activeTab.value === 1) {
    return appointments.value.filter(item => item.appointmentStatus === 'pending')
  } else if (activeTab.value === 2) {
    return appointments.value.filter(item => item.appointmentStatus === 'completed')
  } else if (activeTab.value === 3) {
    return appointments.value.filter(item => item.appointmentStatus === 'cancelled')
  }
  return appointments.value
})

// 切换 Tab
const handleTabChange = (value: number) => {
  activeTab.value = value
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 跳转到预约详情
const goToAppointmentDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/course/appointment-confirm/index?id=${id}`
  })
}

// 取消预约
const handleCancel = (id: number) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消预约吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '取消成功',
          icon: 'success'
        })
      }
    }
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
  padding-bottom: 0;
}

// 标签切换容器
.tabs-wrapper {
  margin-bottom: 32rpx;
}

// 预约列表
.appointment-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-bottom: 48rpx;
}

// 卡片样式
.t-card {
  background-color: #FFFFFF;
  border-radius: $td-radius-default;
  border: 1px solid $td-border-level-1;
  overflow: hidden;
  transition: all 0.3s;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

.t-card__body {
  padding: 24rpx;
}

// 卡片头部
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

// 徽章样式
.t-badge {
  font-size: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.t-badge--warning {
  background-color: $td-warning-color-light;
  color: $td-warning-color;
}

.t-badge--success {
  background-color: $td-success-color-light;
  color: $td-success-color;
}

// 卡片信息
.card-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  font-size: 26rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

.info-icon {
  flex-shrink: 0;
}

.info-text {
  flex: 1;
}

// 分割线
.t-divider {
  height: 1px;
  background-color: $td-border-level-0;
  margin: 24rpx 0;
}

// 卡片操作按钮
.card-actions {
  display: flex;
  gap: 16rpx;
}

// 卡片底部
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rating-text {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
}

// 按钮样式
.t-button {
  flex: 1;
  border: none;
  border-radius: $td-radius-default;
  font-size: 26rpx;
  font-weight: 500;
  height: 64rpx;
  line-height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &::after {
    border: none;
  }
}

.t-button--outline {
  background-color: #FFFFFF;
  border: 1px solid $td-border-level-1;
  color: $td-text-color-primary;
}

.t-button--primary {
  background-color: #E6F4FF;
  color: $td-brand-color;
}

.t-button--text {
  background-color: transparent;
  color: $td-brand-color;
  flex: none;
  padding: 0 16rpx;
}

.t-button--block {
  width: 100%;
}

.t-button__text {
  font-size: 26rpx;
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
  font-size: 26rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 底部留白
.bottom-spacing {
  height: 120rpx;
}
</style>

