<template>
  <view class="page">
    <td-page-header title="升级指南" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">

        <!-- 当前等级卡片 -->
        <view class="current-level-card">
          <view class="level-icon">{{ currentLevelIcon }}</view>
          <view class="level-info">
            <view class="level-label">当前等级</view>
            <view class="level-name">{{ currentLevelName }}</view>
          </view>
        </view>

        <!-- 升级路径图 -->
        <view class="t-section-title t-section-title--simple">📍 升级路径</view>
        <view class="path-card">
          <template v-for="(step, i) in pathSteps" :key="step.level">
            <view class="path-item" :class="{ active: step.level === currentLevel }">
              <view class="path-icon" :class="{ inactive: step.level > currentLevel }">{{ step.icon }}</view>
              <view class="path-label" :class="{ current: step.level === currentLevel }">
                {{ step.name }}<template v-if="step.level === currentLevel"> (当前)</template>
              </view>
            </view>
            <view v-if="i < pathSteps.length - 1" class="path-arrow">→</view>
          </template>
        </view>

        <!-- 未加载时 loading -->
        <view v-if="loading" style="text-align:center;padding:48rpx;color:#999;">
          加载中…
        </view>

        <!-- 已到最高等级 -->
        <view v-else-if="!nextLevelName" class="alert-box info">
          <view class="alert-icon">🎉</view>
          <view class="alert-content">
            <view class="alert-title">您已达到最高等级</view>
            <view class="alert-message">感谢您长期支持天道文化的传播事业！</view>
          </view>
        </view>

        <template v-else>

          <!-- 下一等级标题 -->
          <view class="t-section-title t-section-title--simple">
            🎯 下一等级：{{ nextLevelName }}
          </view>

          <!-- 升级条件步骤卡片 -->
          <view class="upgrade-card">
            <view class="card-header">
              <view class="card-title">📋 升级条件</view>
            </view>
            <view class="card-body">

              <!-- 步骤1：申请审核 -->
              <view class="step-item">
                <view class="step-number" :class="stepClass(applicationStepStatus)">1</view>
                <view class="step-content">
                  <view class="step-title">申请成为{{ nextLevelName }}</view>

                  <!-- 未申请（null 或 undefined 均视为未申请） -->
                  <template v-if="applicationStatus == null">
                    <view class="step-desc">请提交申请，等待管理员审核</view>
                    <view @tap="goToApply">
                      <button class="t-button t-button--theme-primary t-button--variant-base t-button--block" style="margin-top:16rpx;">
                        <span class="t-button__text">📝 立即申请</span>
                      </button>
                    </view>
                  </template>

                  <!-- 待审核（status=0） -->
                  <template v-else-if="applicationStatus === 0">
                    <view class="step-desc">申请已提交，等待管理员审核…</view>
                    <view class="step-badge pending">审核中</view>
                  </template>

                  <!-- 已通过（status=1） -->
                  <template v-else-if="applicationStatus === 1">
                    <view class="step-desc">申请已通过 ✓</view>
                    <view class="step-badge success">已通过</view>
                  </template>

                  <!-- 已驳回（status=2） -->
                  <template v-else-if="applicationStatus === 2">
                    <view class="step-desc">
                      申请被驳回{{ rejectReason ? '：' + rejectReason : '' }}
                    </view>
                    <view class="step-badge error">已驳回</view>
                    <view @tap="goToApply" style="margin-top:16rpx;">
                      <button class="t-button t-button--theme-primary t-button--variant-outline t-button--block">
                        <span class="t-button__text">重新申请</span>
                      </button>
                    </view>
                  </template>
                </view>
              </view>

              <!-- 步骤2：签署协议 -->
              <view v-if="contractOption" class="step-item">
                <view class="step-number" :class="stepClass(contractStepStatus)">2</view>
                <view class="step-content">
                  <view class="step-title">签署协议</view>
                  <view class="step-desc">
                    {{ contractOption.completed ? '协议已签署 ✓'
                      : contractOption.audit_pending ? '协议审核中 ⏳'
                      : (contractOption.requirements?.join('；') || contractOption.name) }}
                  </view>
                  <!-- 待审核：不显示签署按钮，显示提示 -->
                  <template v-if="contractOption.audit_pending">
                    <view class="step-desc-reason" style="color:#ff9500;">
                      协议已提交，正在等待管理员审核，审核通过后升级自动生效
                    </view>
                  </template>
                  <!-- 已驳回：显示原因 + 重新签署按钮 -->
                  <template v-else-if="contractOption.rejected">
                    <view class="step-desc-reason" style="color:#e34d59;margin-bottom:12rpx;">
                      ❌ 协议已被驳回：{{ contractOption.reject_reason }}
                    </view>
                    <view v-if="contractOption.eligible" @tap="goToContractSign">
                      <button class="t-button t-button--theme-primary t-button--variant-base t-button--block" style="margin-top:8rpx;">
                        <span class="t-button__text">📝 重新签署</span>
                      </button>
                    </view>
                  </template>
                  <template v-else-if="contractOption.eligible">
                    <view @tap="goToContractSign">
                      <button class="t-button t-button--theme-primary t-button--variant-base t-button--block" style="margin-top:16rpx;">
                        <span class="t-button__text">📝 立即签署</span>
                      </button>
                    </view>
                  </template>
                  <template v-else-if="!contractOption.completed">
                    <view class="step-desc-reason">{{ contractOption.reason }}</view>
                  </template>
                </view>
              </view>

            </view>
          </view>

          <!-- 升级收益卡片 -->
          <view class="upgrade-card">
            <view class="card-header">
              <view class="card-title">💰 升级收益</view>
            </view>
            <view class="card-body">

              <!-- 优先使用后台配置的 upgrade_benefits -->
              <template v-if="upgradeBenefits && upgradeBenefits.length">
                <template v-for="(item, idx) in upgradeBenefits" :key="idx">
                  <view class="benefit-item">
                    <view class="benefit-icon" :style="benefitIconStyle(idx)">{{ benefitIconEmoji(idx) }}</view>
                    <view class="benefit-content">
                      <view class="benefit-title">{{ item.title }}</view>
                      <rich-text v-if="item.desc" class="benefit-desc" :nodes="item.desc" />
                    </view>
                  </view>
                  <view v-if="idx < upgradeBenefits.length - 1" class="divider"></view>
                </template>
              </template>

              <!-- 降级：使用自动计算的 benefits 字符串列表 -->
              <template v-else-if="autoBenefits && autoBenefits.length">
                <template v-for="(text, idx) in autoBenefits" :key="idx">
                  <view class="benefit-item">
                    <view class="benefit-icon" :style="benefitIconStyle(idx)">{{ benefitIconEmoji(idx) }}</view>
                    <view class="benefit-content">
                      <view class="benefit-title">{{ text }}</view>
                    </view>
                  </view>
                  <view v-if="idx < autoBenefits.length - 1" class="divider"></view>
                </template>
              </template>

              <template v-else>
                <view style="color:#999;font-size:24rpx;text-align:center;padding:24rpx;">
                  升级权益配置中…
                </view>
              </template>

            </view>
          </view>

        </template>

        <!-- 底部留白 -->
        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { AmbassadorApi, UserApi } from '@/api'
import type { UpgradeGuide, UpgradeBenefitItem } from '@/api/types/ambassador'

// ── 等级常量 ──
const LEVEL_ICONS: Record<number, string> = { 0: '👤', 1: '🥚', 2: '🐦', 3: '🦅', 4: '🐦‍🔥' }
const LEVEL_NAMES: Record<number, string> = {
  0: '普通用户', 1: '准青鸾大使', 2: '青鸾大使', 3: '鸿鹄大使', 4: '金凤大使'
}
const BENEFIT_ICONS = ['💎', '🎁', '💰', '👨‍🏫', '🌟', '🏆', '🎯', '✨']
const BENEFIT_STYLES = [
  'background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  'background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'background: linear-gradient(135deg, #0052d9 0%, #6c9ffc 100%)'
]

// ── 状态 ──
const loading = ref(true)
const currentLevel = ref(0)
const guideData = ref<UpgradeGuide | null>(null)

const scrollHeight = computed(() =>
  'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
)

// ── 路径图数据（从准青鸾开始，不展示普通用户） ──
const pathSteps = [
  { level: 1, name: '准青鸾', icon: '🥚' },
  { level: 2, name: '青鸾', icon: '🐦' },
  { level: 3, name: '鸿鹄', icon: '🦅' },
  { level: 4, name: '金凤', icon: '🐦‍🔥' }
]

// ── 派生数据 ──
const currentLevelIcon = computed(() => LEVEL_ICONS[currentLevel.value] || '👤')
const currentLevelName = computed(() => LEVEL_NAMES[currentLevel.value] || '普通用户')
const nextLevelName = computed(() => {
  if (!guideData.value) return ''
  return guideData.value.target_level?.name || ''
})

// null/undefined 均视为"未申请"
const applicationStatus = computed<number | null>(() => {
  const s = guideData.value?.application_status
  return s != null ? Number(s) : null
})
const rejectReason = computed(() => guideData.value?.application_reject_reason || '')

const contractOption = computed(() =>
  guideData.value?.upgrade_options.find(o => o.type === 'contract') || null
)

// 升级收益文案
const upgradeBenefits = computed<UpgradeBenefitItem[] | null>(() => {
  const ub = guideData.value?.target_level?.upgrade_benefits
  return Array.isArray(ub) && ub.length > 0 ? ub : null
})
const autoBenefits = computed<string[]>(() =>
  guideData.value?.target_level?.benefits || []
)

// ── 步骤状态（用于圆圈颜色） ──
// DB 状态：null=未申请, 0=待审核, 1=已通过, 2=已驳回
// 'done' | 'active' | 'pending' | 'error'
const applicationStepStatus = computed(() => {
  if (applicationStatus.value === 1) return 'done'   // 已通过
  if (applicationStatus.value === 2) return 'error'  // 已驳回
  if (applicationStatus.value === 0) return 'active' // 审核中
  return 'pending'
})
const contractStepStatus = computed(() => {
  if (!contractOption.value) return 'pending'
  if (contractOption.value.completed) return 'done'
  if (contractOption.value.eligible) return 'active'
  return 'pending'
})
function stepClass(status: string) {
  return {
    'step-done': status === 'done',
    'step-active': status === 'active',
    'step-error': status === 'error',
    'step-pending': status === 'pending'
  }
}

function benefitIconEmoji(idx: number) {
  return BENEFIT_ICONS[idx % BENEFIT_ICONS.length]
}
function benefitIconStyle(idx: number) {
  return BENEFIT_STYLES[idx % BENEFIT_STYLES.length]
}

// ── 加载数据 ──
// onLoad 接收 URL 参数，支持 /upgrade-guide/index?targetLevel=2
let _urlTargetLevel: number | null = null
onLoad(async (options) => {
  _urlTargetLevel = options?.targetLevel ? Number(options.targetLevel) : null
  await fetchGuide(_urlTargetLevel)
})

// onShow 在从申请页返回后刷新状态（onLoad 只触发一次，onShow 每次显示都触发）
onShow(async () => {
  // guideData 已有说明页面曾经加载过，刷新最新申请状态
  if (guideData.value !== null) {
    await fetchGuide(_urlTargetLevel)
  }
})

const fetchGuide = async (urlTargetLevel: number | null = null) => {
  loading.value = true
  try {
    let resolvedTargetLevel: number

    if (urlTargetLevel && urlTargetLevel >= 1 && urlTargetLevel <= 4) {
      resolvedTargetLevel = urlTargetLevel
    } else {
      const profile = await UserApi.getProfile()
      const actualLevel = profile.ambassador_level || 0
      currentLevel.value = actualLevel
      // 普通用户(0)看 target=1（准青鸾即时升级页），准青鸾(1)看 target=2（青鸾）
      resolvedTargetLevel = actualLevel === 0 ? 1 : actualLevel + 1
    }

    if (resolvedTargetLevel > 4) {
      loading.value = false
      return
    }

    const result = await AmbassadorApi.getUpgradeGuide(resolvedTargetLevel)
    guideData.value = result
    currentLevel.value = result.current_level.level
  } catch (error: any) {
    console.error('获取升级指南失败:', error)
    uni.showToast({ title: error?.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// ── 导航函数 ──
const goToApply = () => {
  // 普通用户和准青鸾的 target_level 均为 2（青鸾），青鸾的为 3（鸿鹄）
  const tl = currentLevel.value <= 1 ? 2 : currentLevel.value + 1
  uni.navigateTo({
    url: `/pages/ambassador/apply/index?targetLevel=${tl}`
  })
}

const goToContractSign = () => {
  const tl = currentLevel.value + 1
  uni.navigateTo({
    url: `/pages/ambassador/contract-sign/index?upgradeType=${tl}`
  })
}
</script>

<style scoped lang="scss">
.page {
  width: 100%;
  height: 100vh;
  background: #F5F5F5;
}

.scroll-area { width: 100%; }

.page-content { padding: 32rpx; }

// 当前等级卡片
.current-level-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 48rpx;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 32rpx;
}
.level-icon { font-size: 96rpx; }
.level-info { flex: 1; }
.level-label { font-size: 28rpx; opacity: 0.9; margin-bottom: 8rpx; }
.level-name { font-size: 48rpx; font-weight: 700; }

// 升级路径图
.path-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  gap: 8rpx;
}
.path-item { text-align: center; flex: 1; min-width: 0; }
.path-icon { font-size: 56rpx; margin-bottom: 8rpx; &.inactive { opacity: 0.4; } }
.path-label { font-size: 22rpx; color: #999; &.current { color: #0052D9; font-weight: 600; } }
.path-arrow { color: #999; font-size: 28rpx; }

// 卡片
.upgrade-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}
.card-header { padding: 32rpx; border-bottom: 2rpx solid #F5F5F5; }
.card-title { font-size: 32rpx; font-weight: 600; color: #333; }
.card-body { padding: 32rpx; }

// 步骤
.step-item {
  display: flex;
  gap: 24rpx;
  margin-bottom: 48rpx;
  &:last-child { margin-bottom: 0; }
}
.step-number {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  flex-shrink: 0;
  
  &.step-done   { background: linear-gradient(135deg, #00a870 0%, #6edea0 100%); }
  &.step-active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  &.step-error  { background: linear-gradient(135deg, #e34d59 0%, #ff8a8a 100%); }
  &.step-pending { background: #ccc; }
}
.step-content { flex: 1; min-width: 0; }
.step-title { font-size: 28rpx; font-weight: 500; color: #333; margin-bottom: 12rpx; }
.step-desc { font-size: 24rpx; color: #666; line-height: 1.6; margin-bottom: 12rpx; }
.step-desc-reason { font-size: 22rpx; color: #e34d59; margin-top: 8rpx; }
.step-badge {
  display: inline-block;
  padding: 6rpx 20rpx;
  border-radius: 24rpx;
  font-size: 22rpx;
  &.success { background: #E8F8F2; color: #00A870; }
  &.pending { background: #FFF4E5; color: #D4AF37; }
  &.error   { background: #FFECEC; color: #E34D59; }
}

// 权益
.benefit-item {
  display: flex;
  gap: 24rpx;
  align-items: flex-start;
}
.benefit-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}
.benefit-content { flex: 1; min-width: 0; }
.benefit-title { font-size: 28rpx; font-weight: 500; color: #333; margin-bottom: 8rpx; }
.benefit-desc { font-size: 24rpx; color: #999; line-height: 1.5; }
.divider { height: 2rpx; background: #F5F5F5; margin: 32rpx 0; }

// 提示框
.alert-box {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 48rpx;
  display: flex;
  gap: 16rpx;
  &.info { background: #E6F4FF; }
}
.alert-icon { font-size: 32rpx; flex-shrink: 0; }
.alert-content { flex: 1; }
.alert-title { font-size: 28rpx; font-weight: 500; color: #333; margin-bottom: 12rpx; }
.alert-message { font-size: 24rpx; color: #666; line-height: 1.6; }
</style>
