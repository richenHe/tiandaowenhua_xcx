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
          <view class="alert-icon"><icon type="info" size="16" color="#0052D9"/></view>
          <view class="alert-content">
            <view class="alert-message">
              为传播大使提供精美海报和宣传文案；海报图可点击看大图（全屏页长按图片用系统菜单保存）；列表缩略图也可长按保存；视频长按可保存；文案支持一键复制，用于朋友圈推广
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
              <view v-if="posterImageUrls(item).length" class="poster-grid">
                <view
                  v-for="(url, idx) in posterImageUrls(item)"
                  :key="idx"
                  class="poster-cell"
                >
                  <image
                    :src="url"
                    class="poster-thumb"
                    mode="aspectFill"
                    show-menu-by-longpress
                    @tap="openPosterPreview(posterImageUrls(item), idx)"
                    @longpress="saveImageByUrl(url)"
                  />
                </view>
              </view>
              <view v-else class="material-image placeholder">📚</view>
              <view class="material-title">{{ item.title }}</view>
              <view v-if="item.content" class="material-desc">{{ item.content }}</view>
              <view v-if="item.content" class="material-actions">
                <view @tap="copyText(item)" class="action-btn-copy">
                  <button class="t-button t-button--theme-default t-button--variant-outline t-button--block">
                    <span class="t-button__text">📋 复制文案</span>
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
              <view class="copywriting-title">{{ item.title }}</view>
              <view class="copywriting-content">{{ item.content }}</view>
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
              <video
                v-if="item.video_url"
                :src="materialVideoSrc(item.video_url)"
                class="material-video"
                controls
                show-center-play-btn
                @longpress="onVideoLongPress(item)"
              />
              <view class="material-title">{{ item.title }}</view>
              <view v-if="item.content" class="material-desc">{{ item.content }}</view>
              <view v-if="item.content" class="material-actions">
                <view @tap="copyText(item)" class="action-btn-copy">
                  <button class="t-button t-button--theme-default t-button--variant-outline t-button--block">
                    <span class="t-button__text">📋 复制文案</span>
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
          <view class="alert-icon"><icon type="warn" size="16" color="#E6A23C"/></view>
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

    <!-- 自定义全屏预览：无顶栏按钮，单击任意处关闭；image 长按出系统菜单 -->
    <view
      v-if="posterPreviewVisible"
      class="poster-preview-root"
      @touchmove.stop.prevent="preventPosterPreviewScrollThrough"
      @tap="closePosterPreview"
    >
      <swiper
        :key="posterPreviewKey"
        class="poster-preview-swiper"
        :current="posterPreviewIndex"
        circular
        @change="onPosterPreviewSwiperChange"
      >
        <swiper-item v-for="(url, pidx) in posterPreviewUrls" :key="'pv-' + pidx + '-' + posterPreviewKey">
          <!-- 原生 image 的 tap 在部分机型不冒泡到根节点，故 slide + image 均绑定关闭 -->
          <view class="poster-preview-slide" @tap="closePosterPreview">
            <image
              :src="url"
              mode="aspectFit"
              show-menu-by-longpress
              class="poster-preview-image"
              @tap="closePosterPreview"
            />
          </view>
        </swiper-item>
      </swiper>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import StickyTabs from '@/components/StickyTabs.vue'
import { CourseApi } from '@/api'
import { cloudFileIDToURL } from '@/api/modules/storage'
import type { Material } from '@/api/types/course'

/**
 * 推广视频播放地址：微信小程序对 `tcb.qcloud.la` 直连常因存储未公网读失败，故接口保留 `cloud://` 时仅在 MP 直连；
 * H5/App 等仍用 cloudFileIDToURL 得到 HTTPS。
 */
const materialVideoSrc = (url?: string): string => {
  if (!url) return ''
  if (url.startsWith('cloud://')) {
    // #ifdef MP-WEIXIN
    return url
    // #endif
    // #ifndef MP-WEIXIN
    return cloudFileIDToURL(url)
    // #endif
  }
  return cloudFileIDToURL(url)
}

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--window-top))'
})

// 页面头部高度
const pageHeaderHeight = ref(64)

/** 海报全屏预览（非 wx.previewImage，便于长按出保存菜单） */
const posterPreviewVisible = ref(false)
const posterPreviewUrls = ref<string[]>([])
const posterPreviewIndex = ref(0)
const posterPreviewKey = ref(0)

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>()

onMounted(() => {
  // 计算页面头部高度
  const systemInfo = uni.getSystemInfoSync()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navbarHeight = 44
  pageHeaderHeight.value = statusBarHeight + navbarHeight

  // 加载素材数据（仅挂载时拉取；勿在 onShow 里频繁全屏 Loading：返回本页会触发 onShow）
  loadMaterials(false)
})

/**
 * 从其它页面返回时再静默刷新列表（无全屏 Loading）
 * 页内全屏海报预览不跳转路由，不影响此处
 */
onShow(() => {
  if (allMaterials.value.length > 0) {
    loadMaterials(true)
  }
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

/**
 * @param silent true 时不弹 uni.showLoading、不切换页面级 loading（避免从预览返回/切 Tab 时全屏遮罩反复出现）
 */
const loadMaterials = async (silent = false) => {
  try {
    if (!silent) {
      uni.showLoading({ title: '加载中...' })
      loading.value = true
    }
    const result = await CourseApi.getMaterialList({ page: 1, page_size: 100 })
    allMaterials.value = result.list
    if (!silent) uni.hideLoading()
  } catch (error) {
    console.error('加载素材失败:', error)
    if (!silent) uni.hideLoading()
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    if (!silent) loading.value = false
  }
}

const onTabChange = (value: string) => {
  activeTab.value = value
}

/** 海报素材展示用 URL 列表（接口 images 优先，兼容仅 image_url） */
const posterImageUrls = (item: Material): string[] => {
  const fromArr = Array.isArray(item.images) ? item.images.filter(Boolean) : []
  if (fromArr.length) return fromArr
  if (item.image_url) return [item.image_url]
  return []
}

const openPosterPreview = (urls: string[], startIndex: number) => {
  if (!urls.length) return
  const safe = Math.min(Math.max(0, startIndex), urls.length - 1)
  posterPreviewUrls.value = [...urls]
  posterPreviewIndex.value = safe
  posterPreviewKey.value = Date.now()
  posterPreviewVisible.value = true
}

const closePosterPreview = () => {
  posterPreviewVisible.value = false
  posterPreviewUrls.value = []
}

const onPosterPreviewSwiperChange = (e: { detail?: { current?: number } }) => {
  const cur = e.detail?.current
  if (typeof cur === 'number') posterPreviewIndex.value = cur
}

/** 全屏层阻止穿透到底层 scroll-view */
const preventPosterPreviewScrollThrough = () => {}

const onVideoLongPress = (item: Material) => {
  if (item.video_url) saveVideoByUrl(item.video_url)
}

/**
 * 将云存储 cloud:// URL 转换为可下载的临时链接
 * 普通 http/https URL 直接返回
 */
const getDownloadUrl = (url: string): Promise<string> => {
  if (!url.startsWith('cloud://')) {
    return Promise.resolve(url)
  }
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.getTempFileURL({
      fileList: [url],
      success: (res: any) => {
        const file = res.fileList?.[0]
        if (file && file.tempFileURL) {
          resolve(file.tempFileURL)
        } else {
          reject(new Error('获取临时链接失败'))
        }
      },
      fail: reject
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('当前平台不支持云存储 URL'))
    // #endif
  })
}

/**
 * 申请相册写入权限，已有权限则直接 resolve
 */
const requestAlbumPermission = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.getSetting({
      success: (settingRes: any) => {
        if (settingRes.authSetting['scope.writePhotosAlbum']) {
          resolve()
        } else {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => resolve(),
            fail: () => {
              // 用户拒绝，引导去设置页开启
              uni.showModal({
                title: '需要相册权限',
                content: '请在设置中开启相册权限，以保存图片/视频',
                confirmText: '去设置',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting({ success: () => resolve(), fail: reject })
                  } else {
                    reject(new Error('用户取消授权'))
                  }
                }
              })
            }
          })
        }
      },
      fail: reject
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve()
    // #endif
  })
}

/** 长按缩略图：保存单张到相册 */
const saveImageByUrl = async (imageUrl: string) => {
  if (!imageUrl) {
    uni.showToast({ title: '图片链接无效', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '保存中...' })
    await requestAlbumPermission()
    const downloadUrl = await getDownloadUrl(imageUrl)
    await new Promise<void>((resolve, reject) => {
      uni.downloadFile({
        url: downloadUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => resolve(),
              fail: (err) => reject(err)
            })
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        },
        fail: (err) => reject(err)
      })
    })
    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (err: any) {
    uni.hideLoading()
    if (err?.message === '用户取消授权') return
    console.error('保存图片失败:', err)
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  }
}

/** 长按视频区域：保存到相册 */
const saveVideoByUrl = async (videoUrl: string) => {
  if (!videoUrl) {
    uni.showToast({ title: '视频链接无效', icon: 'none' })
    return
  }

  try {
    uni.showLoading({ title: '保存中...' })
    await requestAlbumPermission()
    const downloadUrl = await getDownloadUrl(videoUrl)
    await new Promise<void>((resolve, reject) => {
      uni.downloadFile({
        url: downloadUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.saveVideoToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => resolve(),
              fail: (err) => reject(err)
            })
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        },
        fail: (err) => reject(err)
      })
    })
    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (err: any) {
    uni.hideLoading()
    if (err?.message === '用户取消授权') return
    console.error('保存视频失败:', err)
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  }
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

.poster-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.poster-cell {
  width: calc((100% - 32rpx) / 3);
  aspect-ratio: 1;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f0f0f0;
}

.poster-thumb {
  width: 100%;
  height: 100%;
  display: block;
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
  flex-direction: column;
  gap: 16rpx;
}

.action-btn-main,
.action-btn-copy {
  width: 100%;
}

.copywriting-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}


.copywriting-title {
  font-size: 28rpx !important;
  font-weight: 500 !important;
  color: #333;
  margin-bottom: 16rpx;
}

.copywriting-content {
  font-size: 28rpx !important;
  font-weight: 500 !important;
  line-height: 1.8;
  color: #666;
  background: #F5F5F5;
  padding: 24rpx;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}

/* 海报全屏预览（页内 swiper + image，长按出系统菜单） */
.poster-preview-root {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: #000;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.poster-preview-swiper {
  flex: 1;
  width: 100%;
  height: 0;
  min-height: 0;
}

.poster-preview-slide {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16rpx;
  box-sizing: border-box;
}

.poster-preview-image {
  width: 100%;
  height: 100%;
  max-height: 100%;
}

</style>







