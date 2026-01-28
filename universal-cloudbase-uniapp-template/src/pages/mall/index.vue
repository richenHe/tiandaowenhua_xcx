<template>
  <view class="page-container">
    <TdPageHeader :title="pageTitle" :showBack="false">
      <template #right>
        <text class="icon-text" @click="goToPointsDetail">📋</text>
      </template>
    </TdPageHeader>

    <scroll-view class="scroll-content" scroll-y>
      <!-- 积分横幅 -->
      <view class="points-banner">
        <view class="points-info">
          <text class="points-label">可用积分</text>
          <text class="points-value">{{ userPoints }}</text>
        </view>
        <button class="points-detail-btn" @click="goToPointsDetail">
          <text class="btn-text">积分明细</text>
        </button>
      </view>

      <view class="page-content">
        <!-- 主Tab切换：兑换商品 / 兑换课程 -->
        <view class="tabs-wrapper">
          <CapsuleTabs 
            v-model="activeMainTab" 
            :options="mainTabOptions"
            @change="handleMainTabChange"
          />
        </view>

        <!-- 兑换商品内容 -->
        <view v-if="activeMainTab === 0">
          <!-- 商品分类Tab -->
          <view class="category-tabs-wrapper">
            <CapsuleTabs 
              v-model="activeCategory" 
              :options="categoryOptions"
              @change="handleCategoryChange"
            />
          </view>

          <!-- 商品网格 -->
          <view class="product-grid">
            <view 
              v-for="product in filteredProducts" 
              :key="product.id"
              class="product-card"
              @click="handleProductClick(product)"
            >
              <view class="product-image">
                <text>{{ product.icon }}</text>
              </view>
              <view class="product-info">
                <text class="product-name">{{ product.name }}</text>
                <text class="product-stock">库存: {{ product.stock }}件</text>
                <view class="product-footer">
                  <text class="product-points">{{ product.points }}积分</text>
                  <button class="product-btn" @click.stop="handleExchange(product)">
                    <text class="btn-text">兑换</text>
                  </button>
                </view>
              </view>
            </view>
          </view>

          <!-- 加载更多 -->
          <view class="load-more">
            <button class="load-more-btn">
              <text class="btn-text">加载更多</text>
            </button>
          </view>
        </view>

        <!-- 兑换课程内容 -->
        <view v-if="activeMainTab === 1">
          <!-- 课程说明 -->
          <view class="t-alert t-alert--success">
            <text class="alert-icon">🎁</text>
            <view class="alert-content">
              <text class="alert-message">使用积分兑换课程，开启智慧之旅！兑换后可在"我的课程"中查看。</text>
            </view>
          </view>

          <!-- 课程列表 -->
          <view class="course-list">
            <view 
              v-for="course in courses" 
              :key="course.id"
              class="course-card"
              @click="handleCourseClick(course)"
            >
              <view class="course-image" :style="{ background: course.gradient }">
                <text>{{ course.icon }}</text>
              </view>
              <view class="course-info">
                <view class="course-header">
                  <text class="course-name">{{ course.name }}</text>
                  <view v-if="course.badge" class="t-badge" :class="`t-badge--${course.badgeType}`">
                    {{ course.badge }}
                  </view>
                </view>
                <text class="course-desc">{{ course.desc }}</text>
                <view class="course-footer">
                  <view class="course-price">
                    <text class="course-points">{{ course.points }}积分</text>
                    <text class="course-original">原价¥{{ course.originalPrice }}</text>
                  </view>
                  <button 
                    class="course-btn"
                    :class="{ 'course-btn--disabled': course.points > userPoints }"
                    :disabled="course.points > userPoints"
                    @click.stop="handleExchangeCourse(course)"
                  >
                    <text class="btn-text">{{ course.points > userPoints ? '积分不足' : '立即兑换' }}</text>
                  </button>
                </view>
              </view>
            </view>
          </view>

          <!-- 兑换说明 -->
          <view class="t-alert t-alert--info">
            <text class="alert-icon">ℹ️</text>
            <view class="alert-content">
              <text class="alert-title">兑换说明</text>
              <view class="alert-message">
                <text>• 兑换的课程永久有效，可无限次观看</text>
                <text>• 兑换成功后不支持退换</text>
                <text>• 积分不足时可通过参与活动获取更多积分</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部留白 -->
      <view class="bottom-spacing"></view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import CapsuleTabs from '@/components/CapsuleTabs.vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

// 用户积分
const userPoints = ref(2580)

// 主Tab
const mainTabs = ['兑换商品', '兑换课程']
const activeMainTab = ref(0)
const mainTabOptions = [
  { label: '兑换商品', value: 0 },
  { label: '兑换课程', value: 1 }
]

// 页面标题
const pageTitle = computed(() => mainTabs[activeMainTab.value])

// 商品分类
const categories = ['全部', '文具', '生活', '周边']
const activeCategory = ref(0)
const categoryOptions = [
  { label: '全部', value: 0 },
  { label: '文具', value: 1 },
  { label: '生活', value: 2 },
  { label: '周边', value: 3 }
]

// 商品列表
const products = ref([
  { id: 1, name: '天道文化笔记本', icon: '📚', stock: 50, points: 500, category: 'stationery' },
  { id: 2, name: '精美书签套装', icon: '🎁', stock: 100, points: 300, category: 'stationery' },
  { id: 3, name: '荣誉证书框', icon: '🏆', stock: 30, points: 800, category: 'peripheral' },
  { id: 4, name: '定制保温杯', icon: '☕', stock: 20, points: 1200, category: 'life' },
  { id: 5, name: '文化帆布袋', icon: '🎒', stock: 45, points: 600, category: 'peripheral' },
  { id: 6, name: '国学挂画', icon: '🖼️', stock: 15, points: 2000, category: 'peripheral' },
  { id: 7, name: '冥想垫', icon: '🧘', stock: 25, points: 1500, category: 'life' },
  { id: 8, name: '经典书籍套装', icon: '📖', stock: 10, points: 3000, category: 'stationery' }
])

// 过滤商品
const filteredProducts = computed(() => {
  if (activeCategory.value === 0) {
    return products.value
  }
  const categoryMap = ['all', 'stationery', 'life', 'peripheral']
  const category = categoryMap[activeCategory.value]
  return products.value.filter(p => p.category === category)
})

// 课程列表
const courses = ref([
  {
    id: 1,
    name: '天道文化入门精讲',
    icon: '📚',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    desc: '系统讲解天道文化的核心理念，适合初学者入门学习。共10节课，时长约5小时。',
    points: 5000,
    originalPrice: 299,
    badge: '热门',
    badgeType: 'success'
  },
  {
    id: 2,
    name: '孙膑兵法精解',
    icon: '🎓',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    desc: '深入解读孙膑兵法的智慧精髓，将古代智慧应用于现代商业。共15节课。',
    points: 8000,
    originalPrice: 499,
    badge: '推荐',
    badgeType: 'primary'
  },
  {
    id: 3,
    name: '修身养性七日课',
    icon: '🧘',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    desc: '通过七天的系统学习，掌握修身养性的核心方法，提升身心状态。',
    points: 2000,
    originalPrice: 99,
    badge: '',
    badgeType: ''
  },
  {
    id: 4,
    name: '易经智慧入门',
    icon: '☯️',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    desc: '从零开始学习易经，掌握中华文化的智慧源头。共8节课。',
    points: 3500,
    originalPrice: 199,
    badge: '',
    badgeType: ''
  },
  {
    id: 5,
    name: '商道智慧分享',
    icon: '💼',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    desc: '成功企业家分享商业智慧，结合天道文化理念的实战经验。',
    points: 1500,
    originalPrice: 79,
    badge: '限时',
    badgeType: 'warning'
  }
])

// 切换主Tab
const handleMainTabChange = (value: number) => {
  activeMainTab.value = value
}

// 切换分类
const handleCategoryChange = (value: number) => {
  activeCategory.value = value
}

// 跳转积分明细
const goToPointsDetail = () => {
  uni.showToast({
    title: '跳转积分明细',
    icon: 'none'
  })
}

// 点击商品
const handleProductClick = (product: any) => {
  uni.showToast({
    title: `查看${product.name}`,
    icon: 'none'
  })
}

// 兑换商品
const handleExchange = (product: any) => {
  if (userPoints.value < product.points) {
    uni.showToast({
      title: '积分不足',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '确认兑换',
    content: `确定使用${product.points}积分兑换${product.name}吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '兑换成功',
          icon: 'success'
        })
      }
    }
  })
}

// 点击课程
const handleCourseClick = (course: any) => {
  uni.showToast({
    title: `查看${course.name}`,
    icon: 'none'
  })
}

// 兑换课程
const handleExchangeCourse = (course: any) => {
  if (userPoints.value < course.points) {
    uni.showToast({
      title: '积分不足',
      icon: 'none'
    })
    return
  }

  uni.showModal({
    title: '确认兑换',
    content: `确定使用${course.points}积分兑换《${course.name}》课程吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '兑换成功',
          icon: 'success'
        })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

.icon-text {
  font-size: 36rpx;
  color: $td-text-color-primary;
}

// 滚动内容
.scroll-content {
  height: calc(100vh - var(--td-page-header-height));
}

// 积分横幅
.points-banner {
  background: linear-gradient(135deg, $td-warning-color, #f5a623);
  padding: 32rpx;
  margin: 32rpx;
  border-radius: $td-radius-default;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.points-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.points-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

.points-value {
  font-size: 48rpx;
  font-weight: 700;
  color: #FFFFFF;
}

.points-detail-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: #FFFFFF;
  padding: 12rpx 32rpx;
  border-radius: $td-radius-default;
  font-size: 26rpx;

  &::after {
    border: none;
  }
}

.page-content {
  padding: 0 32rpx 32rpx;
}

// 标签切换容器
.tabs-wrapper {
  margin-bottom: 32rpx;
  margin-top: 32rpx;
}

// 分类Tab包装器
.category-tabs-wrapper {
  margin-bottom: 32rpx;
}

// 商品网格
.product-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.product-card {
  background-color: #FFFFFF;
  border-radius: $td-radius-default;
  border: 1px solid $td-border-level-1;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 240rpx;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 96rpx;
}

.product-info {
  padding: 24rpx;
}

.product-name {
  font-size: 28rpx;
  font-weight: 500;
  color: $td-text-color-primary;
  margin-bottom: 8rpx;
  display: block;
}

.product-stock {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  margin-bottom: 16rpx;
  display: block;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-points {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-warning-color;
}

.product-btn {
  background-color: #E6F4FF;
  color: $td-brand-color;
  padding: 8rpx 24rpx;
  border-radius: $td-radius-default;
  font-size: 24rpx;
  border: none;

  &::after {
    border: none;
  }
}

// 加载更多
.load-more {
  text-align: center;
  padding: 40rpx 0;
}

.load-more-btn {
  background: transparent;
  color: $td-text-color-secondary;
  font-size: 26rpx;
  border: none;

  &::after {
    border: none;
  }
}

// 提示框
.t-alert {
  display: flex;
  gap: 16rpx;
  padding: 24rpx;
  border-radius: $td-radius-default;
  margin-bottom: 32rpx;
}

.t-alert--success {
  background-color: $td-success-color-light;
}

.t-alert--info {
  background-color: $td-info-color-light;
}

.alert-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.alert-title {
  font-size: 28rpx;
  font-weight: 500;
  color: $td-text-color-primary;
}

.alert-message {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

// 课程列表
.course-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.course-card {
  background-color: #FFFFFF;
  border-radius: $td-radius-default;
  border: 1px solid $td-border-level-1;
  overflow: hidden;
}

.course-image {
  width: 100%;
  height: 280rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 96rpx;
}

.course-info {
  padding: 32rpx;
}

.course-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.course-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.t-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.t-badge--success {
  background-color: $td-success-color-light;
  color: $td-success-color;
}

.t-badge--primary {
  background-color: $td-info-color-light;
  color: $td-brand-color;
}

.t-badge--warning {
  background-color: $td-warning-color-light;
  color: $td-warning-color;
}

.course-desc {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.5;
  margin-bottom: 24rpx;
  display: block;
}

.course-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.course-price {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.course-points {
  font-size: 40rpx;
  font-weight: 700;
  color: $td-warning-color;
}

.course-original {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
  text-decoration: line-through;
}

.course-btn {
  background-color: #E6F4FF;
  color: $td-brand-color;
  padding: 12rpx 32rpx;
  border-radius: $td-radius-default;
  font-size: 26rpx;
  border: none;

  &::after {
    border: none;
  }
}

.course-btn--disabled {
  opacity: 0.6;
}

.btn-text {
  font-size: inherit;
}

// 底部留白
.bottom-spacing {
  height: 120rpx;
}
</style>
