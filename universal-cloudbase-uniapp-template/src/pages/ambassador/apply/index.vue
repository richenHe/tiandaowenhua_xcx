<template>
  <view class="page">
    <td-page-header :title="pageTitle" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 申请目标等级标签 -->
        <view v-if="targetLevelNum" class="target-badge">
          <view class="badge-label">申请目标等级</view>
          <view class="badge-value">{{ targetLevelName }}</view>
        </view>

        <!-- 用户信息不完整提示 -->
        <view v-if="profileIncomplete" class="alert-box warning">
          <view class="alert-icon">⚠️</view>
          <view class="alert-content">
            <view class="alert-title">请先完善个人资料</view>
            <view class="alert-message">申请大使需要姓名和手机号，请前往个人中心完善资料后再提交申请。</view>
          </view>
        </view>

        <!-- 动态申请问题列表 -->
        <template v-if="applyQuestions.length > 0">
          <view class="t-section-title t-section-title--simple">💬 申请问题</view>
          <view 
            v-for="(q, index) in applyQuestions" 
            :key="index" 
            class="form-item"
          >
            <view class="form-label" :class="{ required: index === 0 }">{{ q.question }}</view>
            <textarea 
              class="form-textarea" 
              v-model="answers[index]" 
              :placeholder="`请填写您的回答${index === 0 ? '' : '（选填）'}…`"
              :maxlength="500"
            />
          </view>
        </template>

        <!-- 无动态问题时显示默认申请理由 -->
        <template v-else>
          <view class="t-section-title t-section-title--simple">💬 申请说明</view>
          <view class="form-item">
            <view class="form-label required">申请理由</view>
            <textarea 
              class="form-textarea" 
              v-model="applyReason" 
              placeholder="请分享您的申请理由和动机..."
              :maxlength="500"
            />
          </view>
        </template>

        <!-- 底部留白 -->
        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="fixed-bottom">
      <view @tap="handleSubmit">
        <button 
          class="t-button t-button--theme-primary t-button--variant-base t-button--block t-button--size-large"
          :disabled="profileIncomplete"
        >
          <span class="t-button__text">✅ 提交申请</span>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { AmbassadorApi, UserApi } from '@/api'
import type { ApplyQuestion } from '@/api/types/ambassador'

// 等级名称映射（兜底用）
const LEVEL_NAMES: Record<number, string> = {
  1: '准青鸾大使',
  2: '青鸾大使',
  3: '鸿鹄大使',
  4: '金凤大使'
}

const targetLevelNum = ref<number>(0)
const applyQuestions = ref<ApplyQuestion[]>([])
const answers = ref<string[]>([])
/** 无动态问题时的默认申请理由 */
const applyReason = ref('')

/** 从 users 表自动加载的用户信息，提交时使用 */
const userProfile = ref({
  real_name: '',
  phone: '',
  wechat_id: '',
  city: '',
  occupation: ''
})

/** 用户基本信息不完整（缺姓名或手机号） */
const profileIncomplete = computed(() =>
  !userProfile.value.real_name || !userProfile.value.phone
)

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any)?.options || {}
  if (options.targetLevel) {
    targetLevelNum.value = Number(options.targetLevel) || 0
  }

  await Promise.all([loadUserProfile(), loadApplyQuestions()])
})

/** 从 users 表加载用户信息，避免重复填写 */
const loadUserProfile = async () => {
  try {
    const profile = await UserApi.getProfile()
    userProfile.value = {
      real_name: profile.real_name || '',
      phone: profile.phone || '',
      wechat_id: profile.wechat_id || '',
      city: profile.city || '',
      occupation: profile.occupation || ''
    }
  } catch (e) {
    console.error('加载用户信息失败:', e)
  }
}

/** 通过 getLevelSystem 获取目标等级的 apply_questions */
const loadApplyQuestions = async () => {
  if (!targetLevelNum.value) return
  try {
    const result = await AmbassadorApi.getLevelSystem()
    const levelConfig = (result.levels || []).find(l => l.level === targetLevelNum.value)
    if (levelConfig?.apply_questions && levelConfig.apply_questions.length > 0) {
      applyQuestions.value = levelConfig.apply_questions
      answers.value = levelConfig.apply_questions.map(() => '')
    }
  } catch (e) {
    console.error('加载申请问题失败:', e)
  }
}

const targetLevelName = computed(() =>
  targetLevelNum.value ? LEVEL_NAMES[targetLevelNum.value] || `等级${targetLevelNum.value}` : ''
)

const pageTitle = computed(() =>
  targetLevelName.value ? `申请成为${targetLevelName.value}` : '申请传播大使'
)

const scrollHeight = computed(() =>
  'calc(100vh - var(--status-bar-height) - var(--td-page-header-height) - 120rpx)'
)

/** 提交申请 */
const handleSubmit = async () => {
  if (profileIncomplete.value) {
    uni.showToast({ title: '请先完善个人资料（姓名和手机号）', icon: 'none' })
    return
  }

  // 有动态问题时校验第一项
  if (applyQuestions.value.length > 0 && !answers.value[0]?.trim()) {
    uni.showToast({ title: '请回答第一个问题', icon: 'none' })
    return
  }

  // 无动态问题时校验申请理由
  if (applyQuestions.value.length === 0 && !applyReason.value.trim()) {
    uni.showToast({ title: '请填写申请理由', icon: 'none' })
    return
  }

  uni.showLoading({ title: '提交中...' })

  // 构建申请理由文本
  let finalReason = applyReason.value
  if (applyQuestions.value.length > 0) {
    finalReason = applyQuestions.value
      .map((q, i) => `【${q.question}】${answers.value[i] || '（未填）'}`)
      .join('\n')
  }

  try {
    await AmbassadorApi.apply({
      real_name: userProfile.value.real_name,
      phone: userProfile.value.phone,
      wechat_id: userProfile.value.wechat_id || undefined,
      city: userProfile.value.city || undefined,
      occupation: userProfile.value.occupation || undefined,
      apply_reason: finalReason,
      targetLevel: targetLevelNum.value || undefined
    })

    uni.hideLoading()
    uni.showToast({ title: '申请提交成功', icon: 'success', duration: 2000 })
    setTimeout(() => uni.navigateBack(), 2000)
  } catch (error: any) {
    uni.hideLoading()
    uni.showToast({ title: error?.message || '提交失败，请重试', icon: 'none' })
    console.error('提交申请失败:', error)
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

.target-badge {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  margin-bottom: 32rpx;

  .badge-label {
    font-size: 24rpx;
    color: rgba(255,255,255,0.8);
  }

  .badge-value {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
  }
}

.alert-box {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
  display: flex;
  gap: 16rpx;

  &.warning {
    background: #FFF4E5;
  }
}

.alert-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.alert-message {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;

  &.required::before {
    content: '*';
    color: #E34D59;
    margin-right: 8rpx;
  }
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  border: 2rpx solid #E5E5E5;
  box-sizing: border-box;
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
</style>
