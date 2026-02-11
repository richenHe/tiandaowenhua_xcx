<template>
  <view class="page">
    <td-page-header title="签署协议" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 协议信息卡片 -->
        <view v-if="contractTemplate" class="info-card">
          <view class="card-header">
            <view class="card-title">📋 {{ contractTemplate.title }}</view>
            <view class="status-badge warning">待签署</view>
          </view>
          <view class="card-body">
            <view class="info-row">
              <text class="info-label">协议版本：</text>
              <text class="info-value">{{ contractTemplate.version }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">合同期限：</text>
              <text class="info-value">1年</text>
            </view>
            <view class="info-row">
              <text class="info-label">大使等级：</text>
              <text class="info-value">{{ contractTemplate.level_name }}</text>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <text class="empty-icon">📋</text>
          <text class="empty-text">加载协议模板中...</text>
        </view>

        <!-- 协议内容 -->
        <view v-if="contractTemplate" class="t-section-title t-section-title--simple">📄 协议内容</view>

        <view v-if="contractTemplate" class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
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
                <view v-html="contractTemplate.content"></view>
              </scroll-view>
            </view>
          </view>
        </view>

        <!-- 签署确认 -->
        <view class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
          <view class="t-card__body">
            <view 
              @tap="toggleAgree"
              :style="{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '16rpx',
                padding: '16rpx',
                background: '#F5F5F5',
                borderRadius: '12rpx',
                marginBottom: '32rpx',
                boxSizing: 'border-box'
              }"
            >
              <view :class="['checkbox', { checked: agreed }]">
                <text v-if="agreed">✓</text>
              </view>
              <text :style="{ fontSize: '26rpx', color: '#333', flex: '1', lineHeight: '1.5' }">
                我已仔细阅读并完全理解上述协议内容，自愿签署本协议
              </text>
            </view>

            <view>
              <view :style="{ fontSize: '28rpx', color: '#333', marginBottom: '16rpx' }">
                <text :style="{ color: '#E34D59', marginRight: '8rpx' }">*</text>手机号后四位确认
              </view>
              <input 
                v-model="phoneLastFour" 
                type="number" 
                maxlength="4" 
                placeholder="请输入手机号后四位"
                :style="{ 
                  width: '100%',
                  height: '88rpx',
                  background: '#F5F5F5',
                  borderRadius: '12rpx',
                  padding: '0 24rpx',
                  fontSize: '28rpx',
                  border: '2rpx solid #E5E5E5',
                  boxSizing: 'border-box'
                }"
              />
              <view :style="{ fontSize: '24rpx', color: '#999', marginTop: '8rpx' }">
                用于验证身份，确保签署安全
              </view>
            </view>
          </view>
        </view>

        <!-- 签署说明 -->
        <view 
          :style="{ 
            borderRadius: '16rpx',
            padding: '24rpx',
            marginBottom: '48rpx',
            display: 'flex',
            gap: '16rpx',
            background: '#E6F4FF',
            boxSizing: 'border-box'
          }"
        >
          <view :style="{ fontSize: '32rpx', flexShrink: '0' }">ℹ️</view>
          <view :style="{ flex: '1' }">
            <view :style="{ fontSize: '24rpx', color: '#666', lineHeight: '1.6' }">
              • 签署后协议立即生效，合同期1年<br/>
              • 签署记录将保存在"我的协议"中<br/>
              • 可随时查看和下载协议PDF文件
            </view>
          </view>
        </view>

        <!-- 底部留白 -->
        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部签署按钮 -->
    <view class="fixed-bottom">
      <view @tap="handleSign">
        <button class="t-button t-button--theme-primary t-button--variant-base t-button--block t-button--size-large">
          <span class="t-button__text">✍️ 确认签署协议</span>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { AmbassadorApi } from '@/api'
import type { ContractTemplate } from '@/api/types/ambassador'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height) - 120rpx)'
})

const agreed = ref(false)
const phoneLastFour = ref('')

// 协议模板数据
const contractTemplate = ref<ContractTemplate | null>(null)

// 目标等级（从路由参数获取）
const targetLevel = ref(2)

onMounted(() => {
  // 获取路由参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  if (options.upgradeType) {
    targetLevel.value = parseInt(options.upgradeType)
  }

  loadContractTemplate()
})

// 加载协议模板
const loadContractTemplate = async () => {
  try {
    const result = await AmbassadorApi.getContractTemplate(targetLevel.value)
    contractTemplate.value = result
  } catch (error) {
    console.error('获取协议模板失败:', error)
    uni.showToast({
      title: '获取协议模板失败',
      icon: 'none'
    })
  }
}

const toggleAgree = () => {
  agreed.value = !agreed.value
}

const handleSign = async () => {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意协议', icon: 'none' })
    return
  }
  if (!phoneLastFour.value || phoneLastFour.value.length !== 4) {
    uni.showToast({ title: '请输入手机号后四位', icon: 'none' })
    return
  }

  if (!contractTemplate.value) {
    uni.showToast({ title: '协议模板未加载', icon: 'none' })
    return
  }

  try {
    const result = await AmbassadorApi.signContract({
      templateId: contractTemplate.value.id,
      phoneLastFour: phoneLastFour.value
    })

    uni.showToast({
      title: '签署成功',
      icon: 'success',
      duration: 2000
    })

    setTimeout(() => {
      uni.navigateTo({
        url: `/pages/ambassador/contract-detail/index?id=${result.signature_id}`
      })
    }, 2000)
  } catch (error) {
    console.error('签署协议失败:', error)
  }
}
</script>

<style scoped lang="scss">
.page {
  width: 100%;
  height: 100vh;
  background: #F5F5F5;
}

.scroll-area {
  width: 100%;
}

.page-content {
  padding: 32rpx;
}

.info-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 48rpx;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 2rpx solid #F5F5F5;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.status-badge {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 22rpx;
  
  &.warning {
    background: #FFF4E5;
    color: #E37318;
  }
}

.card-body {
  padding: 32rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
  font-size: 26rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  color: #999;
}

.info-value {
  color: #333;
  font-weight: 500;
}


.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #E5E5E5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fff;
  
  &.checked {
    background: #0052D9;
    border-color: #0052D9;
    color: #fff;
    font-size: 24rpx;
  }
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
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

