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
          </view>
          <view class="card-body">
            <view class="info-row">
              <text class="info-label">协议版本：</text>
              <text class="info-value">{{ contractTemplate.version }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">合同期限：</text>
              <text class="info-value">{{ contractTemplate.validity_years || 1 }}年</text>
            </view>
            <view v-if="contractTemplate.level_name" class="info-row">
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

        <!-- 电子版合同（PDF/Word） -->
        <view v-if="contractTemplate" class="t-section-title t-section-title--simple">📄 协议内容</view>

        <view v-if="contractTemplate" class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
          <view class="t-card__body">
            <view
              v-if="contractTemplate.contract_file_url"
              :style="{
                padding: '32rpx',
                background: '#F5F5F5',
                borderRadius: '12rpx',
                textAlign: 'center'
              }"
            >
              <view :style="{ fontSize: '48rpx', marginBottom: '16rpx' }">📄</view>
              <view :style="{ fontSize: '28rpx', color: '#333', marginBottom: '24rpx' }">
                请下载并查看电子版合同
              </view>
              <button
                class="t-button t-button--theme-primary t-button--variant-base t-button--size-medium"
                @tap="handleViewContract"
              >
                查看电子版合同
              </button>
            </view>
            <view
              v-else
              :style="{
                padding: '32rpx',
                textAlign: 'center',
                color: '#999',
                fontSize: '26rpx'
              }"
            >
              该协议暂无电子版文件，请联系管理员
            </view>
          </view>
        </view>

        <!-- 签署确认 -->
        <view class="t-card t-card--bordered" :style="{ marginBottom: '48rpx' }">
          <view class="t-card__body">
            <!-- 阅读同意勾选 -->
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

            <!-- 甲方信息（填入合同头部）-->
            <view class="form-section">
              <view class="form-section-title">合同甲方信息</view>
              <!-- 真实姓名 -->
              <view class="form-item">
                <text class="form-label"><text class="required-star">*</text>真实姓名</text>
                <input
                  class="form-input"
                  v-model="realName"
                  placeholder="请输入真实姓名（将填入合同甲方）"
                  maxlength="20"
                />
              </view>
              <!-- 身份证号码 -->
              <view class="form-item">
                <text class="form-label"><text class="required-star">*</text>身份证号码</text>
                <input
                  class="form-input"
                  v-model="idNumber"
                  placeholder="请输入身份证号码（将填入合同头部）"
                  maxlength="18"
                />
              </view>
            </view>

            <!-- 手写签名区域 -->
            <view :style="{ marginTop: '32rpx' }">
              <view :style="{ fontSize: '28rpx', color: '#333', marginBottom: '16rpx' }">
                <text :style="{ color: '#E34D59', marginRight: '8rpx' }">*</text>手写签名确认
              </view>

              <!-- 未签名：点击跳转签名板 -->
              <view
                v-if="!signatureFileId"
                class="signature-empty-box"
                @tap="goToSignaturePad"
              >
                <view :style="{ fontSize: '48rpx', marginBottom: '12rpx' }">✍️</view>
                <view :style="{ fontSize: '28rpx', color: '#0052D9', fontWeight: '600' }">点击手写签名</view>
                <view :style="{ fontSize: '24rpx', color: '#999', marginTop: '8rpx' }">请在签名板上手写您的签名</view>
              </view>

              <!-- 已签名：显示预览 + 重签按钮 -->
              <view v-else class="signature-preview-box">
                <image
                  :src="signaturePreviewUrl"
                  mode="aspectFit"
                  class="signature-preview-img"
                />
                <view class="signature-preview-footer">
                  <text class="signature-ok-text">✓ 签名已完成</text>
                  <text class="signature-redo-text" @tap="goToSignaturePad">重新签名</text>
                </view>
              </view>

              <view :style="{ fontSize: '24rpx', color: '#999', marginTop: '8rpx' }">
                签名将填写到合同甲方/负责人签名栏
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
              • 签署后协议立即生效，合同期{{ contractTemplate?.validity_years || 1 }}年<br/>
              • 签名将自动嵌入合同文件甲方/负责人签名栏<br/>
              • 签署记录将保存在"我的协议"中<br/>
              • 可随时查看和下载签署后的合同文件
            </view>
          </view>
        </view>

        <!-- 底部留白 -->
        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部签署按钮 -->
    <view class="fixed-bottom">
      <button class="sign-btn" @tap="handleSign">✍️ 确认签署协议</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { AmbassadorApi } from '@/api'
import { openContractDocument } from '@/utils/open-document'
import { cloudFileIDToURL } from '@/api/modules/storage'
import type { ContractTemplate } from '@/api/types/ambassador'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height) - 120rpx)'
})

const agreed = ref(false)
/** 手写签名图片的 cloud:// fileID */
const signatureFileId = ref('')
/** 用于预览的签名图片 HTTPS URL */
const signaturePreviewUrl = ref('')
/** 真实姓名（将填入合同甲方，从 profile 预填，用户可修改） */
const realName = ref('')
/** 身份证号码（将填入合同头部身份证字段） */
const idNumber = ref('')

// 协议模板数据
const contractTemplate = ref<ContractTemplate | null>(null)

// 目标等级（从路由参数获取）
const targetLevel = ref(2)

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const options = currentPage.options || {}

  if (options.upgradeType) {
    targetLevel.value = parseInt(options.upgradeType)
  }

  loadContractTemplate()
  loadUserProfile()

  uni.$on('signatureCompleted', onSignatureCompleted)
})

onUnmounted(() => {
  uni.$off('signatureCompleted', onSignatureCompleted)
})

/** 接收签名画板回传的 fileID */
function onSignatureCompleted(data: { fileId: string }) {
  if (!data?.fileId) return
  signatureFileId.value = data.fileId
  signaturePreviewUrl.value = cloudFileIDToURL(data.fileId)
}

// 加载大使协议模板
const loadContractTemplate = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result: any = await AmbassadorApi.getContractTemplate(targetLevel.value)
    contractTemplate.value = result.template ?? result
    uni.hideLoading()
  } catch (error) {
    console.error('获取协议模板失败:', error)
    uni.hideLoading()
    uni.showToast({ title: '获取协议模板失败', icon: 'none' })
  }
}

// 加载用户资料，预填真实姓名
const loadUserProfile = async () => {
  try {
    const { UserApi } = await import('@/api')
    const profile = await UserApi.getProfile()
    if (profile?.real_name) {
      realName.value = profile.real_name
    }
  } catch (e) {
    // 预填失败不影响主流程
  }
}

const toggleAgree = () => {
  agreed.value = !agreed.value
}

/** 跳转到手写签名画板 */
const goToSignaturePad = () => {
  uni.navigateTo({ url: '/pages/ambassador/signature-pad/index' })
}

/** 查看电子版合同 */
const handleViewContract = () => {
  const url = contractTemplate.value?.contract_file_url
  if (!url) {
    uni.showToast({ title: '暂无电子版合同', icon: 'none' })
    return
  }
  openContractDocument(url, contractTemplate.value?.title)
}

/** 提交签署 */
const handleSign = async () => {
  if (!agreed.value) {
    uni.showToast({ title: '请先阅读并同意协议', icon: 'none' })
    return
  }
  if (!realName.value.trim()) {
    uni.showToast({ title: '请填写真实姓名', icon: 'none' })
    return
  }
  if (!idNumber.value.trim()) {
    uni.showToast({ title: '请填写身份证号码', icon: 'none' })
    return
  }
  if (!signatureFileId.value) {
    uni.showToast({ title: '请先完成手写签名', icon: 'none' })
    return
  }
  if (!contractTemplate.value) {
    uni.showToast({ title: '协议模板未加载', icon: 'none' })
    return
  }

  try {
    const result: any = await AmbassadorApi.signContract({
      templateId: contractTemplate.value.id,
      signatureFileId: signatureFileId.value,
      idNumber: idNumber.value.trim(),
      agreed: true
    })

    const successMsg = result.message || `升级${result.level_name || ''}成功`
    uni.showToast({ title: successMsg, icon: 'success', duration: 2000 })
    setTimeout(() => {
      uni.redirectTo({
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

/* 未签名占位框 */
.signature-empty-box {
  border: 2rpx dashed #0052D9;
  border-radius: 12rpx;
  padding: 40rpx 24rpx;
  background: #F0F6FF;
  text-align: center;
  margin-bottom: 10rpx;
}

/* 已签名预览框 */
.signature-preview-box {
  border: 2rpx solid #d0e4ff;
  border-radius: 12rpx;
  overflow: hidden;
  background: #fff;
  margin-bottom: 10rpx;
}

.signature-preview-img {
  width: 100%;
  height: 200rpx;
  display: block;
  background: #fff;
}

.signature-preview-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #f8fbff;
  border-top: 2rpx solid #e8f0fe;
}

.signature-ok-text {
  font-size: 24rpx;
  color: #4CAF50;
  font-weight: 600;
}

.signature-redo-text {
  font-size: 24rpx;
  color: #0052D9;
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

.sign-btn {
  width: 100%;
  height: 96rpx;
  background: #1976D2;
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 48rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    border: none;
  }
}

/* 合同甲方信息表单 */
.form-section {
  background: #F8F9FB;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.form-section-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.form-item {
  margin-bottom: 20rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.required-star {
  color: #E34D59;
  margin-right: 4rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #fff;
  border: 2rpx solid #E5E5E5;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #333;
  box-sizing: border-box;
}

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
