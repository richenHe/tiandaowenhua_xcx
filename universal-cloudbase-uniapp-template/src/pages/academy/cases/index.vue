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
        <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight" :margin-bottom="32">
          <template #tabs>
            <CapsuleTabs
              v-model="activeTab"
              :options="tabs"
              @change="onTabChange"
            />
          </template>
        </StickyTabs>

        <view v-if="caseList.length > 0" class="case-list">
          <view
            v-for="caseItem in caseList"
            :key="caseItem.id"
            class="case-card"
          >
            <!-- 精选标记 -->
            <view v-if="caseItem.is_featured" class="featured-badge">精选</view>

            <!-- header/body/footer 点击跳详情；视频区域不参与，单独在线播放 -->
            <view class="card-header" @tap="goToDetail(caseItem.id)">
              <!-- 头像：优先真实图片，否则姓氏首字 -->
              <image
                v-if="caseItem.student_avatar"
                :src="caseItem.student_avatar"
                class="avatar-img"
                mode="aspectFill"
              />
              <view
                v-else
                class="avatar-text"
                :class="'theme-' + (caseItem.avatar_theme || 'default')"
              >
                {{ caseItem.student_surname || caseItem.student_name?.[0] || '学' }}
              </view>

              <view class="header-info">
                <view class="student-name">{{ caseItem.student_name }}</view>
                <view class="student-title">{{ caseItem.student_desc || caseItem.student_title || '' }}</view>
              </view>

              <view
                v-if="caseItem.category_label"
                class="category-badge"
                :class="'badge-' + (caseItem.badge_theme || 'primary')"
              >
                {{ caseItem.category_label }}
              </view>
            </view>

            <!-- 案例标题 + 摘要 -->
            <view class="card-body" @tap="goToDetail(caseItem.id)">
              <view class="case-title">{{ caseItem.title }}</view>
              <view v-if="caseItem.summary" class="case-summary">{{ caseItem.summary }}</view>
            </view>

            <!-- 媒体区域：有视频展示视频（可内嵌播放，@tap.stop 阻止冒泡，不触发跳转）
                         无视频展示封面图（点击跳详情）
                         两者完全互斥，不重叠 -->
            <view v-if="caseItem.video_url" class="card-cover">
              <video
                :src="caseItem.video_url"
                class="cover-video"
                controls
                :show-center-play-btn="true"
                :enable-progress-gesture="true"
                object-fit="cover"
                @tap.stop
              />
            </view>
            <view v-else-if="caseItem.cover_image" class="card-cover" @tap="goToDetail(caseItem.id)">
              <image :src="caseItem.cover_image" class="cover-img" mode="aspectFill" />
            </view>

            <!-- 底部信息 -->
            <view class="card-footer" @tap="goToDetail(caseItem.id)">
              <view class="footer-left">
                <text v-if="caseItem.course_name" class="course-tag">{{ caseItem.course_name }}</text>
              </view>
              <view class="footer-right">
                <text class="view-count">{{ caseItem.view_count || 0 }} 次浏览</text>
              </view>
            </view>
          </view>
        </view>

        <view v-else-if="!loading" class="empty-state">
          <view class="empty-icon"><icon type="info" size="60" color="#ccc"/></view>
          <view class="empty-text">暂无案例</view>
        </view>

        <view class="cta-section">
          <view class="cta-box">
            <view class="cta-title">你也可以成为下一个成功案例</view>
            <view class="cta-desc">
              天道文化已经帮助众多学员实现蜕变。无论你是企业家、创业者还是职场人，都能找到适合自己的成长路径。
            </view>
          </view>
        </view>

        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import { CourseApi } from '@/api'

const scrollHeight = computed(() => 'calc(100vh - var(--window-top))')
const pageHeaderHeight = ref(64)
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()
const loading = ref(false)

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
const caseList = ref<any[]>([])

const loadCaseList = async (category?: string) => {
  try {
    loading.value = true
    const params: any = { page: 1, page_size: 100 }
    if (category && category !== 'all') {
      params.category = category
    }
    const result = await CourseApi.getCaseList(params)
    caseList.value = result.list || []
  } catch (error) {
    console.error('加载案例列表失败:', error)
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onTabChange = (value: string) => {
  activeTab.value = value
  loadCaseList(value)
}

const goToDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/academy/cases/detail?id=${id}` })
}

const goToMall = () => {
  uni.switchTab({ url: '/pages/mall/index' })
}

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  pageHeaderHeight.value = statusBarHeight + 44
  loadCaseList()
})

onShow(() => {
  loadCaseList(activeTab.value)
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

.case-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.case-card {
  position: relative;
  background: #fff;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.featured-badge {
  position: absolute;
  top: 0;
  right: 32rpx;
  background: linear-gradient(135deg, #FF9500, #FF6B00);
  color: #fff;
  font-size: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 0 0 8rpx 8rpx;
  font-weight: 500;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.avatar-img {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatar-text {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;

  &.theme-default { background: #0052D9; }
  &.theme-success { background: #00A870; }
  &.theme-primary { background: #E37318; }
}

.header-info {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 6rpx;
}

.student-title {
  font-size: 24rpx;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-badge {
  padding: 6rpx 18rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  flex-shrink: 0;
  font-weight: 500;

  &.badge-primary {
    background: #E6F4FF;
    color: #0052D9;
  }
  &.badge-warning {
    background: #FFF4E5;
    color: #E37318;
  }
  &.badge-success {
    background: #E8F8F2;
    color: #00A870;
  }
}

.card-body {
  margin-bottom: 20rpx;
}

.case-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.case-summary {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-cover {
  position: relative;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 320rpx;
  display: block;
}

.cover-video {
  width: 100%;
  height: 320rpx;
  display: block;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16rpx;
  border-top: 1rpx solid #F0F0F0;
}

.course-tag {
  font-size: 22rpx;
  color: #0052D9;
  background: #E6F4FF;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
}

.view-count {
  font-size: 22rpx;
  color: #BBB;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.cta-section {
  margin-top: 48rpx;
}

.cta-box {
  background: #E8F8F2;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
}

.cta-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #1A1A1A;
  margin-bottom: 12rpx;
}

.cta-desc {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}
</style>
