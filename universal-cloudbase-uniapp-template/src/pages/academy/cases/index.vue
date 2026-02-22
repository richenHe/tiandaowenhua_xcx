<template>
  <view class="page">
    <td-page-header title="学员案例" />
    
    <scroll-view
      class="scroll-area"
      scroll-y
      :style="{ height: scrollHeight }"
      @scroll="handleScroll"
    >
      <view class="page-content">

        <!-- Tab切换 -->
        <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight" :margin-bottom="32">
          <template #tabs>
            <CapsuleTabs
              v-model="activeTab"
              :options="tabs"
              @change="onTabChange"
            />
          </template>
        </StickyTabs>

        <!-- 案例列表 -->
        <view class="t-section-title t-section-title--simple">⭐ 优秀学员</view>

        <!-- 动态渲染案例列表 -->
        <view v-for="caseItem in caseList" :key="caseItem.id" class="case-card">
          <view class="case-header">
            <view 
              class="case-avatar" 
              :class="caseItem.avatar_theme || 'default'"
            >
              {{ caseItem.student_surname || caseItem.student_name?.[0] || '学' }}
            </view>
            <view class="case-info">
              <view class="case-name">{{ caseItem.student_name }}</view>
              <view class="case-desc">{{ caseItem.student_desc || caseItem.student_title }}</view>
            </view>
            <view 
              class="case-badge" 
              :class="caseItem.badge_theme || 'primary'"
            >
              {{ caseItem.category_label || '学员' }}
            </view>
          </view>

          <view class="divider"></view>

      <!-- 视频见证 - 动态显示 -->
      <view class="case-section" v-if="caseItem.video_url">
        <view class="section-label">🎬 视频见证</view>
        <video 
          :src="caseItem.video_url" 
          class="case-video"
          controls
          :poster="caseItem.cover_image || ''"
          :show-center-play-btn="true"
          :enable-progress-gesture="true"
        ></video>
      </view>

      <view class="case-section" v-if="caseItem.quote">
        <view class="section-label">💡 学习感悟</view>
        <view class="quote-box">
          "{{ caseItem.quote }}"
        </view>
      </view>

      <view class="case-section" v-if="caseItem.achievements && caseItem.achievements.length > 0">
            <view class="section-label">📈 成长成果</view>
            <view class="achievement-list">
              <view 
                v-for="(achievement, index) in caseItem.achievements" 
                :key="index" 
                class="achievement-item"
              >
                <text class="check-icon">✓</text>
                <text class="achievement-text">{{ achievement }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="caseList.length === 0" class="empty-state">
          <view class="empty-icon">📋</view>
          <view class="empty-text">暂无案例</view>
        </view>

        <!-- 行动号召 -->
        <view class="alert-box success">
          <view class="alert-icon">🎯</view>
          <view class="alert-content">
            <view class="alert-title">你也可以成为下一个成功案例</view>
            <view class="alert-message">
              天道文化已经帮助5000+学员改变人生。无论你是企业家、创业者还是职场人，都能在这里找到适合自己的成长路径。
            </view>
          </view>
        </view>

        <!-- CTA按钮 -->
        <view @tap="goToCourseDetail">
          <button class="t-button t-button--theme-default t-button--variant-base t-button--block t-button--size-large">
            <span class="t-button__text">🚀 立即开始学习</span>
          </button>
        </view>

        <!-- 底部留白 -->
        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import { CourseApi } from '@/api'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--window-top))'
})

// 页面头部高度
const pageHeaderHeight = ref(64)

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}

const tabs = ref([
  { label: '全部', value: 'all' },
  { label: '企业家', value: 'entrepreneur' },
  { label: '创业者', value: 'startup' },
  { label: '职场人', value: 'workplace' }
])

const activeTab = ref('all')

// 案例列表
const caseList = ref<any[]>([])

// 加载案例列表
const loadCaseList = async (category?: string) => {
  try {
    uni.showLoading({ title: '加载中...' })
    const params: any = { page: 1, page_size: 100 }
    if (category && category !== 'all') {
      params.category = category
    }

    const result = await CourseApi.getCaseList(params)
    caseList.value = result.list || []
    uni.hideLoading()
  } catch (error) {
    console.error('加载案例列表失败:', error)
    uni.hideLoading()
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    })
  }
}

const onTabChange = (value: string) => {
  activeTab.value = value
  loadCaseList(value)
}

const goToCourseDetail = () => {
  uni.navigateTo({
    url: '/pages/course/detail/index'
  })
}

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight

  // 加载案例列表
  loadCaseList()
})
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

.tabs-wrapper {
  margin-bottom: 32rpx;
}

.case-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.case-header {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.case-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #0052D9;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: 600;
  flex-shrink: 0;
  
  &.success {
    background: #00A870;
  }
  
  &.primary {
    background: #E37318;
  }
}

.case-info {
  flex: 1;
  min-width: 0;
}

.case-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.case-desc {
  font-size: 24rpx;
  color: #999;
}

.case-badge {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 22rpx;
  flex-shrink: 0;
  
  &.warning {
    background: #FFF4E5;
    color: #E37318;
  }
  
  &.success {
    background: #E8F8F2;
    color: #00A870;
  }
  
  &.primary {
    background: #E6F4FF;
    color: #0052D9;
  }
}

.divider {
  height: 2rpx;
  background: #F5F5F5;
  margin: 24rpx 0;
}

.case-section {
  margin-bottom: 24rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-label {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 16rpx;
}

.quote-box {
  font-size: 26rpx;
  line-height: 1.8;
  color: #666;
  background: #F5F5F5;
  padding: 24rpx;
  border-radius: 12rpx;
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: 24rpx;
}

.check-icon {
  color: #00A870;
  font-size: 28rpx;
  flex-shrink: 0;
}

.achievement-text {
  color: #666;
  flex: 1;
}

.alert-box {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 48rpx;
  display: flex;
  gap: 16rpx;
  
  &.success {
    background: #E8F8F2;
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

/* 动态视频播放器样式 */
.case-video {
  width: 100%;
  height: 400rpx;
  border-radius: 12rpx;
  background-color: #000;
  margin-top: 16rpx;
}

</style>







