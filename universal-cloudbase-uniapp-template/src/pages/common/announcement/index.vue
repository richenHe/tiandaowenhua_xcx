<template>
  <view class="page">
    <td-page-header title="平台公告" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 公告列表 -->
        <view class="announcement-card" :class="{ 'is-top': item.is_top === 1 }" v-for="item in announcements" :key="item.id" @tap="goToDetail(item)">
          <view class="announcement-header">
            <!-- 封面图片缩略图（有图时显示，否则显示分类图标） -->
            <view v-if="item.cover_image" class="announcement-thumb">
              <image :src="item.cover_image" mode="aspectFill" class="announcement-thumb__img" />
            </view>
            <view v-else class="announcement-icon" :class="getAnnouncementType(item.category)">
              {{ getAnnouncementIcon(item.category) }}
            </view>
            <view class="announcement-info">
              <view class="announcement-title">
                {{ item.title }}<text v-if="item.is_top === 1" class="top-badge">置顶</text>
              </view>
              <view class="announcement-date">{{ formatDate(item.published_at || item.created_at) }}</view>
            </view>
            <view class="announcement-badge" v-if="isNewAnnouncement(item.published_at)">NEW</view>
          </view>
          <view class="announcement-content">{{ item.summary || item.content }}</view>
          <view class="announcement-footer">
            <text class="read-more">查看详情 ›</text>
          </view>
        </view>

        <!-- 空状态 -->
        <view class="empty-state" v-if="announcements.length === 0 && !loading">
          <view class="empty-icon"><icon type="info" size="60" color="#ccc"/></view>
          <view class="empty-text">暂无公告</view>
        </view>

        <!-- 底部留白 -->
        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { SystemApi } from '@/api'
import type { Announcement } from '@/api/types/system'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
})

// 公告列表
const announcements = ref<Announcement[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const finished = ref(false)

onMounted(() => {
  loadAnnouncements()
})

onShow(() => {
  loadAnnouncements()
})

// 加载公告列表
const loadAnnouncements = async () => {
  if (loading.value || finished.value) return

  try {
    uni.showLoading({ title: '加载中...' })
    loading.value = true
    const result = await SystemApi.getAnnouncementList({
      page: page.value,
      page_size: pageSize.value
    })

    announcements.value.push(...result.list)
    total.value = result.total
    page.value++

    if (announcements.value.length >= total.value) {
      finished.value = true
    }
    uni.hideLoading()
  } catch (error) {
    console.error('获取公告列表失败:', error)
    uni.hideLoading()
  } finally {
    loading.value = false
  }
}

// 获取公告图标
const getAnnouncementIcon = (category: string) => {
  const iconMap: Record<string, string> = {
    'important': '📢',
    'urgent': '⚠️',
    'general': '💡'
  }
  return iconMap[category] || '📢'
}

// 获取公告类型样式
const getAnnouncementType = (category: string) => {
  const typeMap: Record<string, string> = {
    'important': 'important',
    'urgent': 'warning',
    'general': 'info'
  }
  return typeMap[category] || 'info'
}

// 判断是否为新公告（3天内）
// iOS 不支持 "yyyy-MM-dd HH:mm:ss" 格式，需将空格替换为 T
const isNewAnnouncement = (publishedAt: string | null) => {
  if (!publishedAt) return false
  const normalized = publishedAt.replace(' ', 'T')
  const publishDate = new Date(normalized)
  if (isNaN(publishDate.getTime())) return false
  const now = new Date()
  const diffDays = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 3
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split(' ')[0]
}

// 跳转到公告详情
const goToDetail = (item: Announcement) => {
  uni.navigateTo({
    url: `/pages/common/announcement-detail/index?id=${item.id}`
  })
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

.announcement-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;

  &.is-top {
    border-left: 6rpx solid #D4AF37;
    padding-left: 26rpx;
  }
}

.announcement-header {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.announcement-thumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  overflow: hidden;
  flex-shrink: 0;

  &__img {
    width: 80rpx;
    height: 80rpx;
  }
}

.announcement-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
  
  &.important {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  
  &.info {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  }
  
  &.success {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }
  
  &.warning {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }
}

.announcement-info {
  flex: 1;
  min-width: 0;
}

.announcement-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-badge {
  display: inline-block;
  font-size: 20rpx;
  font-weight: 500;
  color: #D4AF37;
  background: rgba(212, 175, 55, 0.12);
  border: 1rpx solid rgba(212, 175, 55, 0.4);
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
  margin-left: 10rpx;
  vertical-align: middle;
  line-height: 1.6;
}

.announcement-date {
  font-size: 24rpx;
  color: #999;
}

.announcement-badge {
  padding: 4rpx 16rpx;
  border-radius: 24rpx;
  background: #E34D59;
  color: #fff;
  font-size: 20rpx;
  font-weight: 500;
  flex-shrink: 0;
}

.announcement-content {
  font-size: 26rpx;
  line-height: 1.6;
  color: #666;
  margin-bottom: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.announcement-footer {
  display: flex;
  justify-content: flex-end;
}

.read-more {
  font-size: 26rpx;
  color: #0052D9;
}

.empty-state {
  padding: 120rpx 0;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>



























