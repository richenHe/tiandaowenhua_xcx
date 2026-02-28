<template>
  <view class="page-container">
    <TdPageHeader title="我的协议" :showBack="true" />

    <scroll-view class="scroll-content" scroll-y>
      <view class="page-content">
        <!-- 说明提示 -->
        <view class="t-alert t-alert--info">
          <text class="alert-icon">ℹ️</text>
          <view class="alert-content">
            <text class="alert-message">仅青鸾及以上等级可查看协议记录</text>
          </view>
        </view>

        <!-- 已签署协议 -->
        <view class="t-section-title t-section-title--simple">📋 已签署协议</view>

        <!-- 协议列表 -->
        <view
          v-for="contract in contracts"
          :key="contract.id"
          class="t-card"
          @click="goToContractDetail(contract.id)"
        >
          <view class="t-card__header">
            <view class="card-title-wrapper">
              <text class="card-title">{{ contract.title }}</text>
              <text class="card-subtitle">{{ contract.level_name }}</text>
            </view>
            <view class="t-badge" :class="`t-badge--${getStatusType(contract.status)}`">
              {{ getStatusText(contract.status) }}
            </view>
          </view>

          <view class="t-card__body">
            <view class="contract-info">
              <view class="info-row">
                <text class="info-icon">📝</text>
                <text class="info-label">协议编号</text>
                <text class="info-value">{{ contract.id }}</text>
              </view>
              <view class="info-row">
                <text class="info-icon">📅</text>
                <text class="info-label">签署日期</text>
                <text class="info-value">{{ formatDate(contract.signed_at) }}</text>
              </view>
              <view class="info-row">
                <text class="info-icon">📆</text>
                <text class="info-label">合同期限</text>
                <text class="info-value">{{ formatDate(contract.effective_date) }} 至 {{ formatDate(contract.expiry_date) }}</text>
              </view>
              <view class="info-row">
                <text class="info-icon">⏰</text>
                <text class="info-label">剩余天数</text>
                <text class="info-value" :class="calculateDaysLeft(contract.expiry_date) > 0 ? 'text-success' : 'text-error'">
                  {{ calculateDaysLeft(contract.expiry_date) > 0 ? `${calculateDaysLeft(contract.expiry_date)}天` : '已到期' }}
                </text>
              </view>
            </view>
          </view>

          <view class="t-card__footer">
            <button
              v-if="contract.contract_file_url"
              class="t-button t-button--theme-primary t-button--variant-base t-button--size-medium"
              style="margin-right: 16rpx;"
              @click.stop="handleViewContract(contract)"
            >
              <text class="t-button__text">查看电子版合同</text>
            </button>
            <button class="t-button t-button--outline" @click.stop="handleViewDetail(contract.id)">
              <text class="t-button__text">查看详情</text>
            </button>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="contracts.length === 0 && !loading" class="empty-state">
          <text class="empty-icon">📋</text>
          <text class="empty-text">暂无协议记录</text>
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
import { AmbassadorApi } from '@/api'
import { openContractDocument } from '@/utils/open-document'
import type { Contract } from '@/api/types/ambassador'

// 协议列表
const contracts = ref<Contract[]>([])
const loading = ref(false)

onMounted(() => {
  loadContracts()
})

onShow(() => {
  loadContracts()
})

// 加载协议列表
const loadContracts = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    loading.value = true
    const result = await AmbassadorApi.getMyContracts()
    contracts.value = result
    uni.hideLoading()
  } catch (error) {
    console.error('获取协议列表失败:', error)
    uni.hideLoading()
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 跳转到协议详情
const goToContractDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/ambassador/contract-detail/index?id=${id}`
  })
}

// 查看详情
const handleViewDetail = (id: number) => {
  goToContractDetail(id)
}

// 查看电子版合同（下载并打开 PDF/Word）
const handleViewContract = (contract: Contract) => {
  const url = contract.contract_file_url
  if (!url) {
    uni.showToast({ title: '暂无电子版合同', icon: 'none' })
    return
  }
  openContractDocument(url, contract.title)
}

// 计算剩余天数
const calculateDaysLeft = (expiryDate: string) => {
  if (!expiryDate) return 0

  const expiry = new Date(expiryDate)
  const today = new Date()
  const diff = expiry.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// 获取状态类型
const getStatusType = (status: number) => {
  return status === 1 ? 'success' : 'default'
}

// 获取状态文本
const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    1: '有效',
    2: '已过期',
    3: '已撤销'
  }
  return statusMap[status] || '未知'
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
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

// 提示框
.t-alert {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: $td-radius-default;
  margin-bottom: 32rpx;
}

.t-alert--info {
  background-color: $td-info-color-light;
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

// 卡片样式
.t-card {
  background-color: #FFFFFF;
  border-radius: $td-radius-default;
  border: 1px solid $td-border-level-1;
  overflow: hidden;
  margin-bottom: 24rpx;
  transition: all 0.3s;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

.t-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1px solid $td-border-level-0;
}

.card-title-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.card-subtitle {
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

// 徽章样式
.t-badge {
  font-size: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  display: inline-block;
  flex-shrink: 0;
}

.t-badge--success {
  background-color: $td-success-color-light;
  color: $td-success-color;
}

.t-badge--default {
  background-color: $td-bg-color-page;
  color: $td-text-color-placeholder;
}

.t-card__body {
  padding: 24rpx;
}

// 协议信息
.contract-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 26rpx;
  line-height: 1.8;
  color: $td-text-color-secondary;
}

.info-icon {
  flex-shrink: 0;
  color: $td-text-color-placeholder;
}

.info-label {
  flex: 1;
}

.info-value {
  color: $td-text-color-primary;
  font-weight: 500;
}

.text-success {
  color: $td-success-color !important;
}

.text-error {
  color: $td-error-color !important;
}

.t-card__footer {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  border-top: 1px solid $td-border-level-0;
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

.t-button__text {
  font-size: 26rpx;
}

// 说明内容
.description-content {
  font-size: 26rpx;
  line-height: 1.8;
  color: $td-text-color-secondary;
}

.desc-section {
  margin-top: 24rpx;
  margin-bottom: 12rpx;

  &:first-child {
    margin-top: 0;
  }
}

.desc-title {
  color: $td-text-color-primary;
  font-weight: 500;
}

.desc-item {
  margin-bottom: 8rpx;
  padding-left: 8rpx;
}

.desc-bold {
  font-weight: 500;
  color: $td-text-color-primary;
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

