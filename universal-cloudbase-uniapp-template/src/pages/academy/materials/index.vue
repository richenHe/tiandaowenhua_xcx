<template>
  <view class="page">
    <td-page-header title="朋友圈素材" />
    
    <scroll-view
      class="scroll-area"
      scroll-y
      :style="{ height: scrollHeight }"
      @scroll="handleScroll"
    >
      <view class="page-content">

        <!-- 使用说明 -->
        <view class="alert-box info">
          <view class="alert-icon">💡</view>
          <view class="alert-content">
            <view class="alert-message">
              为传播大使提供精美海报和宣传文案，可一键保存或复制，用于朋友圈推广
            </view>
          </view>
        </view>

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

        <!-- 加载中 -->
        <view v-if="loading" class="loading-container">
          <text>加载中...</text>
        </view>

        <!-- 海报列表 -->
        <template v-if="!loading && (activeTab === 'all' || activeTab === 'poster')">
          <view v-if="posterList.length > 0">
            <view class="t-section-title t-section-title--simple">🎨 课程推广海报</view>
            <view v-for="item in posterList" :key="item.id" class="material-card">
              <image v-if="item.image_url" :src="item.image_url" class="material-image" mode="aspectFill"></image>
              <view v-else class="material-image placeholder">📚</view>
              <view class="material-title">{{ item.title }}</view>
              <view v-if="item.content" class="material-desc">{{ item.content }}</view>
              <view class="material-actions">
                <view @tap="saveMaterial(item)">
                  <button class="t-button t-button--theme-default t-button--variant-base t-button--block">
                    <span class="t-button__text">💾 保存图片</span>
                  </button>
                </view>
                <view>
                  <button class="t-button t-button--theme-default t-button--variant-outline t-button--size-small">
                    <span class="t-button__text">📤</span>
                  </button>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 文案列表 -->
        <template v-if="!loading && (activeTab === 'all' || activeTab === 'copywriting')">
          <view v-if="copywritingList.length > 0">
            <view class="t-section-title t-section-title--simple">✍️ 推广文案</view>
            <view v-for="item in copywritingList" :key="item.id" class="copywriting-card">
              <view class="copywriting-header">
                <view class="copywriting-icon blue">📝</view>
                <view class="copywriting-info">
                  <view class="copywriting-title">{{ item.title }}</view>
                </view>
              </view>
              <view class="copywriting-content" v-html="item.content"></view>
              <view @tap="copyText(item)">
                <button class="t-button t-button--theme-default t-button--variant-outline t-button--block">
                  <span class="t-button__text">📋 复制文案</span>
                </button>
              </view>
            </view>
          </view>
        </template>

        <!-- 视频列表 -->
        <template v-if="!loading && (activeTab === 'all' || activeTab === 'video')">
          <view v-if="videoList.length > 0">
            <view class="t-section-title t-section-title--simple">🎬 推广视频</view>
            <view v-for="item in videoList" :key="item.id" class="material-card">
              <video v-if="item.video_url" :src="item.video_url" class="material-video" controls></video>
              <view class="material-title">{{ item.title }}</view>
              <view v-if="item.content" class="material-desc">{{ item.content }}</view>
              <view class="material-actions">
                <view @tap="saveVideo(item)">
                  <button class="t-button t-button--theme-default t-button--variant-base t-button--block">
                    <span class="t-button__text">💾 保存视频</span>
                  </button>
                </view>
                <view>
                  <button class="t-button t-button--theme-default t-button--variant-outline t-button--size-small">
                    <span class="t-button__text">📤</span>
                  </button>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 空状态 -->
        <view v-if="!loading && allMaterials.length === 0" class="empty-container">
          <text>暂无素材</text>
        </view>

        <!-- 使用技巧 -->
        <view class="alert-box warning">
          <view class="alert-icon">💡</view>
          <view class="alert-content">
            <view class="alert-title">使用技巧</view>
            <view class="alert-message">
              • 根据朋友圈受众选择合适的素材<br/>
              • 可适当修改文案使其更个性化<br/>
              • 建议配合个人推荐二维码一起发布<br/>
              • 避免频繁发布，保持适当频率
            </view>
          </view>
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
import type { Material } from '@/api/types/course'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--window-top))'
})

// 页面头部高度
const pageHeaderHeight = ref(64)

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight
  
  // 加载素材数据
  loadMaterials()
})

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop)
  }
}

const tabs = ref([
  { label: '全部', value: 'all' },
  { label: '海报', value: 'poster' },
  { label: '文案', value: 'copywriting' },
  { label: '视频', value: 'video' }
])

const activeTab = ref('all')
const loading = ref(false)
const allMaterials = ref<Material[]>([])

// 按分类过滤素材
const posterList = computed(() => allMaterials.value.filter(m => m.category === 'poster'))
const copywritingList = computed(() => allMaterials.value.filter(m => m.category === 'copywriting'))
const videoList = computed(() => allMaterials.value.filter(m => m.category === 'video'))

// 加载素材数据
const loadMaterials = async () => {
  try {
    loading.value = true
    const result = await CourseApi.getMaterialList({ page: 1, page_size: 100 })
    allMaterials.value = result.list
  } catch (error) {
    console.error('加载素材失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onTabChange = (value: string) => {
  activeTab.value = value
}

const saveMaterial = (item: Material) => {
  if (!item.image_url) {
    uni.showToast({ title: '图片链接无效', icon: 'none' })
    return
  }
  
  uni.downloadFile({
    url: item.image_url,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            uni.showToast({ title: '保存成功', icon: 'success' })
          },
          fail: () => {
            uni.showToast({ title: '保存失败', icon: 'none' })
          }
        })
      }
    },
    fail: () => {
      uni.showToast({ title: '下载失败', icon: 'none' })
    }
  })
}

const saveVideo = (item: Material) => {
  if (!item.video_url) {
    uni.showToast({ title: '视频链接无效', icon: 'none' })
    return
  }
  
  uni.downloadFile({
    url: item.video_url,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveVideoToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            uni.showToast({ title: '保存成功', icon: 'success' })
          },
          fail: () => {
            uni.showToast({ title: '保存失败', icon: 'none' })
          }
        })
      }
    },
    fail: () => {
      uni.showToast({ title: '下载失败', icon: 'none' })
    }
  })
}

const copyText = (item: Material) => {
  if (!item.content) {
    uni.showToast({ title: '文案内容为空', icon: 'none' })
    return
  }
  
  uni.setClipboardData({
    data: item.content,
    success: () => {
      uni.showToast({ title: '文案已复制', icon: 'success' })
    }
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

.alert-box {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 48rpx;
  display: flex;
  gap: 16rpx;
  
  &.info {
    background: #E6F4FF;
  }
  
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

.tabs-wrapper {
  margin-bottom: 32rpx;
}

.material-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.material-image {
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 96rpx;
  margin-bottom: 24rpx;
  
  &.purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  &.orange {
    background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  }
  
  &.placeholder {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
}

.material-video {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80rpx 0;
  color: #999;
  font-size: 28rpx;
}

.material-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.material-desc {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 24rpx;
}

.material-actions {
  display: flex;
  gap: 16rpx;
}

.copywriting-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.copywriting-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.copywriting-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
  
  &.blue {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  }
  
  &.pink {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  }
  
  &.purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
  }
}

.copywriting-info {
  flex: 1;
}

.copywriting-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.copywriting-content {
  font-size: 26rpx;
  line-height: 1.8;
  color: #666;
  background: #F5F5F5;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

</style>







