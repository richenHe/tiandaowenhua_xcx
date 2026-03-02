<template>
  <view class="page">
    <td-page-header title="案例详情" />

    <scroll-view class="scroll-area" scroll-y :style="{ height: scrollHeight }">
      <view v-if="caseDetail" class="page-content">
        <!-- 学员信息区 -->
        <view class="student-section">
          <view class="student-header">
            <image
              v-if="caseDetail.student_avatar"
              :src="caseDetail.student_avatar"
              class="student-avatar-img"
              mode="aspectFill"
            />
            <view
              v-else
              class="student-avatar-text"
              :class="'theme-' + (caseDetail.avatar_theme || 'default')"
            >
              {{ caseDetail.student_surname || caseDetail.student_name?.[0] || '学' }}
            </view>
            <view class="student-info">
              <view class="student-name-row">
                <text class="student-name">{{ caseDetail.student_name }}</text>
                <view
                  v-if="caseDetail.category_label"
                  class="category-badge"
                  :class="'badge-' + (caseDetail.badge_theme || 'primary')"
                >
                  {{ caseDetail.category_label }}
                </view>
              </view>
              <view v-if="caseDetail.student_title" class="student-title">{{ caseDetail.student_title }}</view>
              <view v-if="caseDetail.student_desc" class="student-desc">{{ caseDetail.student_desc }}</view>
            </view>
          </view>
        </view>

        <!-- 案例标题 -->
        <view class="case-title-section">
          <view v-if="caseDetail.is_featured" class="featured-tag">精选案例</view>
          <view class="case-title">{{ caseDetail.title }}</view>
        </view>

        <!-- 案例摘要 -->
        <view v-if="caseDetail.summary" class="summary-section">
          <text class="summary-text">{{ caseDetail.summary }}</text>
        </view>

        <!-- 视频区（有视频时显示，与图片区互不干扰） -->
        <view v-if="caseDetail.video_url" class="media-section">
          <view class="section-label">视频见证</view>
          <video
            :src="caseDetail.video_url"
            class="case-video"
            controls
            :show-center-play-btn="true"
            :enable-progress-gesture="true"
            object-fit="contain"
          />
        </view>

        <!-- 图片画廊（有图片就显示，与视频区独立，互不影响） -->
        <view v-if="caseDetail.images && caseDetail.images.length > 0" class="media-section">
          <view class="section-label">案例图片</view>
          <view class="image-gallery">
            <image
              v-for="(img, idx) in caseDetail.images"
              :key="idx"
              :src="img"
              class="gallery-img"
              mode="aspectFill"
              @tap="previewImage(idx)"
            />
          </view>
        </view>

        <!-- 学习感悟 -->
        <view v-if="caseDetail.quote" class="quote-section">
          <view class="section-label">学习感悟</view>
          <view class="quote-box">
            <view class="quote-mark">"</view>
            <text class="quote-text">{{ caseDetail.quote }}</text>
            <view class="quote-mark quote-mark-end">"</view>
          </view>
        </view>

        <!-- 成长成果 -->
        <view v-if="caseDetail.achievements && caseDetail.achievements.length > 0" class="achievements-section">
          <view class="section-label">成长成果</view>
          <view class="achievement-list">
            <view
              v-for="(item, idx) in caseDetail.achievements"
              :key="idx"
              class="achievement-item"
            >
              <view class="achievement-dot"></view>
              <text class="achievement-text">{{ item }}</text>
            </view>
          </view>
        </view>

        <!-- 详细内容 -->
        <view v-if="caseDetail.content" class="content-section">
          <view class="section-label">详细内容</view>
          <rich-text :nodes="caseDetail.content" class="rich-content" />
        </view>

        <!-- 底部信息 -->
        <view class="meta-section">
          <view class="meta-item">
            <text class="meta-label">浏览次数</text>
            <text class="meta-value">{{ caseDetail.view_count || 0 }}</text>
          </view>
          <view v-if="caseDetail.created_at" class="meta-item">
            <text class="meta-label">发布时间</text>
            <text class="meta-value">{{ formatDate(caseDetail.created_at) }}</text>
          </view>
        </view>

        <view style="height: 120rpx;"></view>
      </view>

      <!-- 加载中 -->
      <view v-else-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>

      <!-- 错误状态 -->
      <view v-else class="empty-state">
        <view class="empty-icon">😔</view>
        <view class="empty-text">案例不存在或已下架</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { CourseApi } from '@/api'

const scrollHeight = computed(() => 'calc(100vh - var(--window-top))')
const loading = ref(false)
const caseDetail = ref<any>(null)
let caseId = 0

const loadDetail = async () => {
  if (!caseId) return
  try {
    loading.value = true
    const result = await CourseApi.getCaseDetail(caseId)
    caseDetail.value = result
  } catch (error) {
    console.error('加载案例详情失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const previewImage = (index: number) => {
  if (!caseDetail.value?.images) return
  uni.previewImage({
    urls: caseDetail.value.images,
    current: index
  })
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.substring(0, 10)
}

onLoad((options: any) => {
  caseId = parseInt(options?.id) || 0
  if (caseId) loadDetail()
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
  padding: 0 0 32rpx;
}

/* 学员信息区 */
.student-section {
  background: #fff;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.student-header {
  display: flex;
  gap: 24rpx;
}

.student-avatar-img {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.student-avatar-text {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;

  &.theme-default { background: #0052D9; }
  &.theme-success { background: #00A870; }
  &.theme-primary { background: #E37318; }
}

.student-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8rpx;
}

.student-name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.student-name {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.category-badge {
  padding: 4rpx 16rpx;
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 500;
  flex-shrink: 0;

  &.badge-primary { background: #E6F4FF; color: #0052D9; }
  &.badge-warning { background: #FFF4E5; color: #E37318; }
  &.badge-success { background: #E8F8F2; color: #00A870; }
}

.student-title {
  font-size: 26rpx;
  color: #666;
}

.student-desc {
  font-size: 24rpx;
  color: #999;
}

/* 案例标题 */
.case-title-section {
  background: #fff;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.featured-tag {
  display: inline-block;
  background: linear-gradient(135deg, #FF9500, #FF6B00);
  color: #fff;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.case-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1.4;
}

/* 摘要 */
.summary-section {
  background: #fff;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.summary-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

/* 通用区块 */
.media-section,
.quote-section,
.achievements-section,
.content-section {
  background: #fff;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.section-label {
  font-size: 30rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 20rpx;
  padding-left: 16rpx;
  border-left: 6rpx solid #0052D9;
}

/* 视频 */
.case-video {
  width: 100%;
  height: 400rpx;
  border-radius: 12rpx;
  background: #000;
}

/* 图片画廊 */
.image-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.gallery-img {
  width: calc(33.33% - 8rpx);
  height: 200rpx;
  border-radius: 8rpx;
}

/* 学习感悟 */
.quote-box {
  background: #FAFAFA;
  border-left: 6rpx solid #0052D9;
  padding: 24rpx 28rpx;
  border-radius: 0 12rpx 12rpx 0;
  position: relative;
}

.quote-mark {
  font-size: 48rpx;
  color: #0052D9;
  opacity: 0.3;
  font-family: Georgia, serif;
  line-height: 1;
}

.quote-mark-end {
  text-align: right;
}

.quote-text {
  font-size: 28rpx;
  color: #444;
  line-height: 1.8;
  font-style: italic;
}

/* 成果列表 */
.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.achievement-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.achievement-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #00A870;
  flex-shrink: 0;
  margin-top: 10rpx;
}

.achievement-text {
  font-size: 28rpx;
  color: #444;
  line-height: 1.6;
  flex: 1;
}

/* 富文本内容 */
.rich-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
}

/* 底部信息 */
.meta-section {
  background: #fff;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-label {
  font-size: 26rpx;
  color: #999;
}

.meta-value {
  font-size: 26rpx;
  color: #333;
}

/* 状态 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  color: #999;
  font-size: 28rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>
