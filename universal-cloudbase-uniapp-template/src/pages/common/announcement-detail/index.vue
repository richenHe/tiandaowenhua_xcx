<template>
  <view class="page-container">
    <td-page-header title="公告详情" />

    <scroll-view
      scroll-y
      :style="{ height: scrollHeight }"
    >
      <!-- 公告详情内容 -->
      <view class="page-content" v-if="announcement">
        <view class="t-card t-card--shadow">

          <!-- 头部：标题 + 日期（居中展示） -->
          <view class="t-card__header t-card__header--no-border flex flex-col items-center gap-m">
            <!-- 公告标题 -->
            <text class="t-card__title text-center">{{ announcement.title }}</text>

            <!-- 发布日期 -->
            <text class="text-secondary" :style="{ fontSize: '24rpx' }">
              {{ formatDate(announcement.published_at || announcement.created_at) }}
            </text>
          </view>

          <!-- 封面图片（全宽展示，有图才显示） -->
          <view v-if="announcement.cover_image" class="cover-image-wrap">
            <image
              :src="announcement.cover_image"
              mode="widthFix"
              class="cover-image"
            />
          </view>

          <!-- 正文 -->
          <view class="t-card__body">
            <text
              class="text-secondary break-words"
              :style="{ fontSize: '28rpx', lineHeight: '1.8', whiteSpace: 'pre-wrap' }"
            >{{ announcement.content }}</text>
          </view>

        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="!loading && !announcement">
        <view class="empty-state__icon"><icon type="info" size="60" color="#ccc"/></view>
        <text class="empty-state__text">公告不存在或已删除</text>
        <button
          class="t-button t-button--theme-primary t-button--variant-base t-button--size-large mt-m"
          @tap="goBack"
        >
          <text class="t-button__text">返回列表</text>
        </button>
      </view>

    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { SystemApi } from '@/api'
import type { Announcement } from '@/api/types/system'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
})

const announcement = ref<Announcement | null>(null)
const loading = ref(false)

onMounted(() => {
  // 从路由参数获取公告 ID
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const id = currentPage?.options?.id || currentPage?.$page?.fullPath?.split('id=')[1]

  if (id) {
    loadDetail(Number(id))
  }
})

// 加载公告详情
const loadDetail = async (id: number) => {
  loading.value = true
  try {
    const result = await SystemApi.getAnnouncementDetail(id)
    announcement.value = result
  } catch (error) {
    console.error('获取公告详情失败:', error)
    announcement.value = null
  } finally {
    loading.value = false
  }
}

/**
 * 格式化日期
 * iOS 不支持 "yyyy-MM-dd HH:mm:ss"（含空格）格式，取日期部分直接截断
 */
const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').split(' ')[0]
}

const goBack = () => {
  uni.navigateBack()
}
</script>

<style scoped lang="scss">
.cover-image-wrap {
  width: 100%;
  overflow: hidden;
}

.cover-image {
  width: 100%;
  display: block;
}
</style>
