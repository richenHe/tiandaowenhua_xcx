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

        <!-- 素材分类 -->
        <view class="t-section-title t-section-title--simple">🎨 课程推广海报</view>

        <!-- 初探班海报 -->
        <view class="material-card">
          <view class="material-image">📚</view>
          <view class="material-title">初探班招生海报</view>
          <view class="material-desc">适用于初探班课程推广，包含课程亮点和报名方式</view>
          <view class="material-actions">
            <view @tap="saveMaterial">
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

        <!-- 密训班海报 -->
        <view class="material-card">
          <view class="material-image purple">🎓</view>
          <view class="material-title">密训班招生海报</view>
          <view class="material-desc">适用于密训班课程推广，突出深度学习和VIP服务</view>
          <view class="material-actions">
            <view @tap="saveMaterial">
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

        <!-- 学员见证海报 -->
        <view class="material-card">
          <view class="material-image orange">⭐</view>
          <view class="material-title">学员见证海报</view>
          <view class="material-desc">真实学员反馈和成长故事，增强可信度</view>
          <view class="material-actions">
            <view @tap="saveMaterial">
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

        <!-- 宣传文案 -->
        <view class="t-section-title t-section-title--simple">✍️ 推广文案</view>

        <!-- 文案1 -->
        <view class="copywriting-card">
          <view class="copywriting-header">
            <view class="copywriting-icon blue">📝</view>
            <view class="copywriting-info">
              <view class="copywriting-title">初探班推广文案</view>
            </view>
          </view>
          <view class="copywriting-content">
            🌟 天道文化初探班即将开课！<br/><br/>
            ✨ 系统学习国学智慧<br/>
            ✨ 掌握天道思维模式<br/>
            ✨ 提升人生格局境界<br/><br/>
            📅 开课时间：2024年2月1日<br/>
            📍 地点：北京市朝阳区<br/>
            💰 限时优惠：¥1688<br/><br/>
            🎯 名额有限，扫码报名！
          </view>
          <view @tap="copyText('初探班推广文案')">
            <button class="t-button t-button--theme-default t-button--variant-outline t-button--block">
              <span class="t-button__text">📋 复制文案</span>
            </button>
          </view>
        </view>

        <!-- 文案2 -->
        <view class="copywriting-card">
          <view class="copywriting-header">
            <view class="copywriting-icon pink">📝</view>
            <view class="copywriting-info">
              <view class="copywriting-title">学员见证文案</view>
            </view>
          </view>
          <view class="copywriting-content">
            💫 学习天道文化，改变从这里开始！<br/><br/>
            👤 学员王总分享：<br/>
            "通过初探班的学习，我重新认识了自己，找到了企业发展的新方向。天道思维让我豁然开朗，强烈推荐！"<br/><br/>
            🎓 已有5000+学员受益<br/>
            ⭐ 好评率98%<br/><br/>
            📲 扫码了解更多精彩课程
          </view>
          <button class="copy-btn" @tap="copyText('学员见证文案')">📋 复制文案</button>
        </view>

        <!-- 活动通知 -->
        <view class="t-section-title t-section-title--simple">📢 活动通知</view>

        <!-- 活动文案 -->
        <view class="copywriting-card">
          <view class="copywriting-header">
            <view class="copywriting-icon purple">🎉</view>
            <view class="copywriting-info">
              <view class="copywriting-title">沙龙活动通知</view>
            </view>
          </view>
          <view class="copywriting-content">
            🍵 天道文化学习沙龙邀请函<br/><br/>
            📅 时间：本周六下午3点<br/>
            📍 地点：北京市海淀区文化空间<br/>
            👥 人数：限25人<br/><br/>
            💬 活动内容：<br/>
            • 天道文化主题分享<br/>
            • 学员经验交流<br/>
            • 茶歇社交<br/><br/>
            🎁 参与即送精美礼品<br/>
            报名请私信或扫码！
          </view>
          <button class="copy-btn" @tap="copyText('沙龙活动通知')">📋 复制文案</button>
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

const onTabChange = (value: string) => {
  activeTab.value = value
}

const saveMaterial = () => {
  uni.showToast({
    title: '保存成功',
    icon: 'success'
  })
}

const copyText = (type: string) => {
  uni.setClipboardData({
    data: `${type}已复制`,
    success: () => {
      uni.showToast({
        title: '文案已复制',
        icon: 'success'
      })
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







