<template>
  <view :style="{ width: '100%', height: '100vh', background: '#F5F5F5' }">
    <td-page-header title="协议详情" />
    
    <scroll-view 
      scroll-y 
      :style="{ 
        width: '100%',
        height: scrollHeight
      }"
    >
      <view :style="{ padding: '32rpx' }">
        
        <!-- 协议信息卡片 -->
        <view v-if="contractDetail" class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
          <view class="t-card__header">
            <view class="t-card__header-wrapper">
              <text class="t-card__title">📋 {{ contractDetail.signature.title }}</text>
            </view>
          </view>
          <view class="t-card__body">
            <view :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">协议编号：</text>
              <text :style="{ color: '#333', fontWeight: '500' }">{{ contractDetail.signature.id }}</text>
            </view>
            <view :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">协议版本：</text>
              <text :style="{ color: '#333', fontWeight: '500' }">{{ contractDetail.signature.version }}</text>
            </view>
            <view :style="{ display: 'flex', justifyContent: 'space-between', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">大使等级：</text>
              <text :style="{ color: '#333', fontWeight: '500' }">{{ contractDetail.signature.level }}</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <text class="empty-icon">📋</text>
          <text class="empty-text">暂无协议详情</text>
        </view>

        <!-- 合同期限 -->
        <view v-if="contractDetail" class="t-section-title t-section-title--simple">📆 合同期限</view>
        <view v-if="contractDetail" class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
          <view class="t-card__body">
            <view :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">合同开始：</text>
              <text :style="{ color: '#333', fontWeight: '500' }">{{ formatDate(contractDetail.signature.effective_date) }}</text>
            </view>
            <view :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '16rpx', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">合同结束：</text>
              <text :style="{ color: '#333', fontWeight: '500' }">{{ formatDate(contractDetail.signature.expiry_date) }}</text>
            </view>
            <view :style="{ display: 'flex', justifyContent: 'space-between', marginBottom: '24rpx', fontSize: '26rpx' }">
              <text :style="{ color: '#999' }">剩余天数：</text>
              <text :style="{ color: '#00A870', fontWeight: '600', fontSize: '32rpx' }">{{ remainingDays }}天</text>
            </view>

            <view :style="{ height: '2rpx', background: '#F5F5F5', margin: '24rpx 0' }"></view>

            <view :style="{ padding: '24rpx', background: '#F5F5F5', borderRadius: '12rpx' }">
              <view :style="{ fontSize: '26rpx', fontWeight: '500', color: '#333', marginBottom: '8rpx' }">合同期说明</view>
              <view :style="{ fontSize: '24rpx', color: '#666', lineHeight: '1.5' }">本协议有效期为1年，到期前30天会收到续签提醒通知</view>
            </view>
          </view>
        </view>

        <!-- 协议内容 -->
        <view v-if="contractDetail" class="t-section-title t-section-title--simple">📄 协议内容</view>
        <view v-if="contractDetail" class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
          <view class="t-card__body">
            <view
              :style="{
                maxHeight: '800rpx',
                background: '#F5F5F5',
                borderRadius: '12rpx',
                overflow: 'hidden'
              }"
            >
              <scroll-view
                scroll-y
                :style="{
                  height: '800rpx',
                  padding: '24rpx',
                  fontSize: '26rpx',
                  lineHeight: '1.8',
                  color: '#666',
                  boxSizing: 'border-box'
                }"
              >
                <view v-html="contractDetail.signature.content"></view>
              </scroll-view>
            </view>
          </view>
        </view>

        <!-- 底部留白 -->
        <view :style="{ height: '120rpx' }"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { AmbassadorApi } from '@/api'
import type { ContractDetail } from '@/api/types/ambassador'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
})

// 协议详情数据
const contractDetail = ref<ContractDetail | null>(null)

// 签署记录ID（从路由参数获取）
const signatureId = ref(0)

onMounted(() => {
  // 获取路由参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  if (options.id) {
    signatureId.value = parseInt(options.id)
    loadContractDetail()
  }
})

// 加载协议详情
const loadContractDetail = async () => {
  try {
    const result = await AmbassadorApi.getContractDetail(signatureId.value)
    contractDetail.value = result
  } catch (error) {
    console.error('获取协议详情失败:', error)
    uni.showToast({
      title: '获取协议详情失败',
      icon: 'none'
    })
  }
}

// 计算剩余天数
const remainingDays = computed(() => {
  if (!contractDetail.value?.signature?.expiry_date) return 0

  const expiryDate = new Date(contractDetail.value.signature.expiry_date)
  const today = new Date()
  const diff = expiryDate.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split(' ')[0]
}
</script>

<style scoped lang="scss">
@import '@/styles/tdesign-vars.scss';

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

