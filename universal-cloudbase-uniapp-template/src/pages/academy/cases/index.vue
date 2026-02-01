<template>
  <view class="page">
    <td-page-header title="学员案例" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 数据统计 -->
        <view class="stats-card">
          <view class="stats-label">📊 学员成就</view>
          <view class="stats-grid">
            <view class="stats-item">
              <view class="stats-value">5,000+</view>
              <view class="stats-text">累计学员</view>
            </view>
            <view class="stats-item">
              <view class="stats-value">98%</view>
              <view class="stats-text">好评率</view>
            </view>
            <view class="stats-item">
              <view class="stats-value">1,200+</view>
              <view class="stats-text">成功案例</view>
            </view>
          </view>
        </view>

        <!-- Tab切换 -->
        <view class="tabs-wrapper">
          <t-capsule-tabs :tabs="tabs" :activeTab="activeTab" @change="onTabChange" />
        </view>

        <!-- 案例列表 -->
        <view class="t-section-title t-section-title--simple">⭐ 优秀学员</view>

        <!-- 案例1：企业家 -->
        <view class="case-card">
          <view class="case-header">
            <view class="case-avatar">王</view>
            <view class="case-info">
              <view class="case-name">王总</view>
              <view class="case-desc">某科技公司CEO · 初探班+密训班学员</view>
            </view>
            <view class="case-badge warning">企业家</view>
          </view>

          <view class="divider"></view>

          <view class="case-section">
            <view class="section-label">💡 学习感悟</view>
            <view class="quote-box">
              "天道文化的学习让我重新认识了企业管理的本质。以前总是追求短期利益，学习后明白了顺应天道、厚德载物的重要性。现在公司发展更稳健，员工更有凝聚力，营收增长了300%。"
            </view>
          </view>

          <view class="case-section">
            <view class="section-label">📈 成长成果</view>
            <view class="achievement-list">
              <view class="achievement-item">
                <text class="check-icon">✓</text>
                <text class="achievement-text">企业营收3年增长300%</text>
              </view>
              <view class="achievement-item">
                <text class="check-icon">✓</text>
                <text class="achievement-text">成功转型升级，开拓新业务</text>
              </view>
              <view class="achievement-item">
                <text class="check-icon">✓</text>
                <text class="achievement-text">获得行业优秀企业家称号</text>
              </view>
              <view class="achievement-item">
                <text class="check-icon">✓</text>
                <text class="achievement-text">成为金凤大使，帮助更多学员</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 案例2：创业者 -->
        <view class="case-card">
          <view class="case-header">
            <view class="case-avatar success">李</view>
            <view class="case-info">
              <view class="case-name">李女士</view>
              <view class="case-desc">连续创业者 · 密训班学员</view>
            </view>
            <view class="case-badge success">创业者</view>
          </view>

          <view class="divider"></view>

          <view class="case-section">
            <view class="section-label">💡 学习感悟</view>
            <view class="quote-box">
              "之前创业两次都失败了，非常迷茫。学习天道文化后，我找到了失败的根本原因——没有顺势而为。现在第三次创业，运用天道思维，半年就实现盈利，团队士气高涨！"
            </view>
          </view>

          <view class="case-section">
            <view class="section-label">📈 成长成果</view>
            <view class="achievement-list">
              <view class="achievement-item">
                <text class="check-icon">✓</text>
                <text class="achievement-text">创业项目半年实现盈利</text>
              </view>
              <view class="achievement-item">
                <text class="check-icon">✓</text>
                <text class="achievement-text">获得天使轮融资500万</text>
              </view>
              <view class="achievement-item">
                <text class="check-icon">✓</text>
                <text class="achievement-text">团队规模扩大到30人</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 案例3：职场人 -->
        <view class="case-card">
          <view class="case-header">
            <view class="case-avatar primary">张</view>
            <view class="case-info">
              <view class="case-name">张先生</view>
              <view class="case-desc">某大厂产品经理 · 初探班学员</view>
            </view>
            <view class="case-badge primary">职场人</view>
          </view>

          <view class="divider"></view>

          <view class="case-section">
            <view class="section-label">💡 学习感悟</view>
            <view class="quote-box">
              "在大厂工作压力很大，经常焦虑。学习天道文化后，我学会了顺应变化、调整心态。不再为一时得失焦虑，而是着眼长远。现在工作更从容，也得到了晋升机会。"
            </view>
          </view>

          <view class="case-section">
            <view class="section-label">📈 成长成果</view>
            <view class="achievement-list">
              <view class="achievement-item">
                <text class="check-icon">✓</text>
                <text class="achievement-text">晋升为高级产品经理</text>
              </view>
              <view class="achievement-item">
                <text class="check-icon">✓</text>
                <text class="achievement-text">主导的产品MAU增长200%</text>
              </view>
              <view class="achievement-item">
                <text class="check-icon">✓</text>
                <text class="achievement-text">工作生活平衡，家庭更和谐</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 视频见证 -->
        <view class="t-section-title t-section-title--simple">🎬 视频见证</view>
        <view class="video-card">
          <view class="video-placeholder">
            <view class="play-icon">▶️</view>
            <view class="play-text">点击播放学员见证视频</view>
          </view>
          <view class="video-title">学员真实反馈合集</view>
          <view class="video-desc">30位学员的真实学习感悟和成长故事</view>
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
        <button class="cta-btn" @tap="goToCourseDetail">
          🚀 立即开始学习
        </button>

        <!-- 底部留白 -->
        <view style="height: 120rpx;"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import TCapsuleTabs from '@/components/CapsuleTabs.vue'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
})

const tabs = ref([
  { label: '全部', value: 'all' },
  { label: '企业家', value: 'entrepreneur' },
  { label: '创业者', value: 'startup' },
  { label: '职场人', value: 'workplace' }
])

const activeTab = ref('all')

const onTabChange = (value: string) => {
  activeTab.value = value
}

const goToCourseDetail = () => {
  uni.navigateTo({
    url: '/pages/course/detail/index'
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

.stats-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 48rpx;
  color: #fff;
}

.stats-label {
  font-size: 28rpx;
  opacity: 0.9;
  margin-bottom: 24rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32rpx;
}

.stats-item {
  text-align: center;
}

.stats-value {
  font-size: 56rpx;
  font-weight: 700;
  margin-bottom: 8rpx;
}

.stats-text {
  font-size: 24rpx;
  opacity: 0.9;
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

.video-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 48rpx;
}

.video-placeholder {
  width: 100%;
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.play-icon {
  font-size: 96rpx;
  color: #fff;
  margin-bottom: 16rpx;
}

.play-text {
  font-size: 28rpx;
  color: #fff;
  opacity: 0.9;
}

.video-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.video-desc {
  font-size: 24rpx;
  color: #999;
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

.cta-btn {
  width: 100%;
  height: 88rpx;
  background: #E6F4FF;
  color: #0052D9;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  margin-bottom: 48rpx;
  
  &::after {
    border: none;
  }
}
</style>







