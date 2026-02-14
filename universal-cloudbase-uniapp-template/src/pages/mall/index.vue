<template>
  <view class="page-container">
    <TdPageHeader :title="pageTitle" :showBack="false">
      <template #right>
        <text class="icon-text" @click="goToPointsDetail">📋</text>
      </template>
    </TdPageHeader>

    <scroll-view
      class="scroll-content"
      :scroll-y="true"
      @scroll="handleScroll"
    >
      <!-- 积分横幅 -->
      <view class="points-banner">
        <view class="points-section">
          <view class="points-info">
            <text class="points-label">💎 功德分</text>
            <text class="points-value">{{ userMeritPoints }}</text>
          </view>
          <view class="points-info">
            <text class="points-label">💰 积分</text>
            <text class="points-value">{{ userCashPoints }}</text>
          </view>
        </view>
        <view @click="goToPointsDetail">
          <button class="t-button t-button--theme-default t-button--variant-base t-button--size-small" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.5); color: white;">
            <span class="t-button__text">明细</span>
          </button>
        </view>
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
          <!-- 分类标签（吸顶） -->
          <StickyTabs ref="stickyTabsRef" :offset-top="pageHeaderHeight" :margin-bottom="32">
            <template #tabs>
              <CapsuleTabs
                v-model="activeCategory"
                :options="categoryOptions"
                @change="handleCategoryChange"
              />
            </template>
          </StickyTabs>

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
                  <view @click.stop="handleExchange(product)">
                    <button class="t-button t-button--theme-default t-button--variant-base t-button--size-small">
                      <span class="t-button__text">兑换</span>
                    </button>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 加载更多 -->
          <view v-if="hasMore" class="load-more">
            <button 
              class="load-more-btn" 
              :disabled="isLoading"
              :loading="isLoading"
              @click="handleLoadMore"
            >
              <text class="btn-text">加载更多</text>
            </button>
          </view>
          
          <!-- 加载完毕提示 -->
          <view v-else-if="products.length > 0" class="load-more">
            <text class="no-more-text">已加载全部商品</text>
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
                    :class="{ 'course-btn--disabled': !canAfford(course.points) }"
                    :disabled="!canAfford(course.points)"
                    @click.stop="handleExchangeCourse(course)"
                  >
                    <text class="btn-text">{{ canAfford(course.points) ? '立即兑换' : '积分不足' }}</text>
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
import { ref, computed, onMounted } from 'vue';
import CapsuleTabs from '@/components/CapsuleTabs.vue';
import StickyTabs from '@/components/StickyTabs.vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { OrderApi, UserApi, SystemApi } from '@/api';
import { calculateMixedPayment } from '@/utils/mixed-payment-calculator';

// 用户功德分和积分
const userMeritPoints = ref(0);
const userCashPoints = ref(0);

// 主Tab
const mainTabs = ['兑换商品', '兑换课程']
const activeMainTab = ref(0)
const mainTabOptions = [
  { label: '兑换商品', value: 0 },
  { label: '兑换课程', value: 1 }
]

// 页面标题
const pageTitle = computed(() => mainTabs[activeMainTab.value]);

// 页面头部高度（用于吸顶偏移）
const pageHeaderHeight = ref(64);

// StickyTabs 组件引用
const stickyTabsRef = ref<InstanceType<typeof StickyTabs>>();

// 处理滚动事件
const handleScroll = (e: any) => {
  if (stickyTabsRef.value) {
    stickyTabsRef.value.updateScrollTop(e.detail.scrollTop);
  }
};

// 判断是否有足够的功德分和积分兑换
const canAfford = (requiredPoints: number) => {
  const totalAvailable = userMeritPoints.value + userCashPoints.value;
  return totalAvailable >= requiredPoints;
};

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
const products = ref<any[]>([])

// 分页相关状态
const currentPage = ref(1)
const pageSize = 20
const totalProducts = ref(0)
const hasMore = ref(true)
const isLoading = ref(false)

// 加载商城商品
const loadMallGoods = async (isLoadMore = false) => {
  if (isLoading.value) return
  
  try {
    if (!isLoadMore) {
      uni.showLoading({ title: '加载中...' })
    }
    isLoading.value = true
    const page = isLoadMore ? currentPage.value + 1 : 1
    
    const result = await OrderApi.getMallGoods({ page: page, page_size: pageSize })

    const newProducts = result.list.map((item: any) => ({
      id: item.id,
      name: item.goods_name,
      icon: '🎁',
      stock: item.stock_quantity === -1 ? 999 : item.stock_quantity,
      points: item.merit_points_price,
      category: 'stationery'
    }))
    
    if (isLoadMore) {
      // 加载更多：追加数据
      products.value = [...products.value, ...newProducts]
      currentPage.value = page
    } else {
      // 首次加载：替换数据
      products.value = newProducts
      currentPage.value = 1
    }
    
    totalProducts.value = result.total || 0
    hasMore.value = products.value.length < totalProducts.value
    if (!isLoadMore) {
      uni.hideLoading()
    }
  } catch (error) {
    console.error('加载商城商品失败:', error)
    if (!isLoadMore) {
      uni.hideLoading()
    }
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

// 加载更多
const handleLoadMore = () => {
  if (hasMore.value && !isLoading.value) {
    loadMallGoods(true)
  }
}

// 加载用户积分
const loadUserPoints = async () => {
  try {
    const points = await SystemApi.getUserPoints()
    userMeritPoints.value = points.meritPoints || 0
    userCashPoints.value = points.cashPointsAvailable || 0
  } catch (error) {
    console.error('加载用户积分失败:', error)
  }
}

// 过滤商品
const filteredProducts = computed(() => {
  if (activeCategory.value === 0) {
    return products.value
  }
  const categoryMap = ['all', 'stationery', 'life', 'peripheral']
  const category = categoryMap[activeCategory.value]
  return products.value.filter(p => p.category === category)
})

onMounted(() => {
  // 获取系统信息计算实际的头部高度
  const systemInfo = uni.getSystemInfoSync();
  const statusBarHeight = systemInfo.statusBarHeight || 20;
  const navbarHeight = 44;
  pageHeaderHeight.value = statusBarHeight + navbarHeight;

  // 加载数据
  loadMallGoods()
  loadMallCourses()
  loadUserPoints()
});

// 课程列表
const courses = ref<any[]>([])

// 加载商城课程
const loadMallCourses = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    const result = await OrderApi.getMallCourses({ page: 1, page_size: 100 })

    courses.value = result.list.map((item: any) => ({
      id: item.id,
      name: item.name,
      icon: getCourseIcon(item.type),
      gradient: getCourseGradient(item.type),
      desc: `${item.nickname} - 课程`,
      points: item.currentPrice * 100, // 假设1元=100积分
      originalPrice: item.originalPrice,
      badge: item.soldCount > 100 ? '热门' : '',
      badgeType: item.soldCount > 100 ? 'success' : ''
    }))
    uni.hideLoading()
  } catch (error) {
    console.error('加载商城课程失败:', error)
    uni.hideLoading()
  }
}

// 获取课程图标
const getCourseIcon = (type: number): string => {
  const iconMap: Record<number, string> = {
    1: '📚',
    2: '🎓',
    3: '🔄'
  }
  return iconMap[type] || '📚'
}

// 获取课程渐变色
const getCourseGradient = (type: number): string => {
  const gradientMap: Record<number, string> = {
    1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    2: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    3: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
  return gradientMap[type] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
}

// 切换主Tab
const handleMainTabChange = (value: number) => {
  activeMainTab.value = value
}

// 切换分类
const handleCategoryChange = (value: number) => {
  activeCategory.value = value
}

// 跳转积分明细（功德分管理页面）
const goToPointsDetail = () => {
  uni.navigateTo({
    url: '/pages/ambassador/merit-points/index'
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
  const productPoints = product.points;
  const meritPoints = userMeritPoints.value;
  const cashPoints = userCashPoints.value;

  // 情况1：功德分和积分都不足（单独看都不够）
  if (meritPoints < productPoints && cashPoints < productPoints) {
    uni.showModal({
      title: '提示',
      content: '功德分或积分不够',
      showCancel: false,
    });
    return;
  }

  // 情况2：功德分不足，但积分足够 - 只用积分支付
  if (meritPoints < productPoints && cashPoints >= productPoints) {
    uni.showModal({
      title: '提示',
      content: '功德分不足，需要用积分兑换商品吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 只用积分支付
          const paymentPlan = {
            meritPointsToUse: 0,
            cashPointsToUse: productPoints,
            needsCashPayment: false,
            remainingMeritPoints: meritPoints,
            remainingCashPoints: cashPoints - productPoints
          };
          // 调用后端API兑换
          performExchange('goods', product.id, paymentPlan);
        }
      },
    });
    return;
  }

  // 情况3：功德分充足 - 只用功德分支付
  uni.showModal({
    title: '提示',
    content: '确定用功德分兑换商品吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 只用功德分支付
        const paymentPlan = {
          meritPointsToUse: productPoints,
          cashPointsToUse: 0,
          needsCashPayment: false,
          remainingMeritPoints: meritPoints - productPoints,
          remainingCashPoints: cashPoints
        };
        // 调用后端API兑换
        performExchange('goods', product.id, paymentPlan);
      }
    },
  });
};

// 点击课程
const handleCourseClick = (course: any) => {
  uni.showToast({
    title: `查看${course.name}`,
    icon: 'none'
  })
}

// 兑换课程
const handleExchangeCourse = (course: any) => {
  // 计算混合支付方案
  const paymentPlan = calculateMixedPayment(
    course.points,
    userMeritPoints.value,
    userCashPoints.value
  );

  // 如果需要现金支付，提示用户
  if (paymentPlan.needsCashPayment) {
    uni.showModal({
      title: '功德分和积分不足',
      content: `兑换《${course.name}》需要${course.points}功德分。您的功德分和积分不足以完成兑换，请先充值或获取更多积分。`,
      showCancel: false,
    });
    return;
  }

  // 构建确认内容
  let confirmContent = `兑换课程: ${course.name}\n`;
  confirmContent += `需要功德分: ${course.points}\n\n`;
  
  // 如果需要使用积分抵扣，增加明确提示
  if (paymentPlan.cashPointsToUse > 0) {
    confirmContent += `⚠️ 功德分不足，需要积分抵扣\n\n`;
  }
  
  confirmContent += `将扣除:\n`;
  confirmContent += `• 功德分: ${paymentPlan.meritPointsToUse}\n`;
  if (paymentPlan.cashPointsToUse > 0) {
    confirmContent += `• 积分(抵扣): ${paymentPlan.cashPointsToUse}\n`;
  }
  confirmContent += `\n剩余:\n`;
  confirmContent += `• 功德分: ${paymentPlan.remainingMeritPoints}\n`;
  confirmContent += `• 积分: ${paymentPlan.remainingCashPoints}`;

  uni.showModal({
    title: '确认兑换',
    content: confirmContent,
    confirmText: '确认兑换',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 调用后端API兑换
        performExchange('course', course.id, paymentPlan);
      }
    },
  });
};

// 执行兑换
const performExchange = async (
  type: 'goods' | 'course',
  itemId: number,
  paymentPlan: ReturnType<typeof calculateMixedPayment>
) => {
  console.log('Performing exchange:', { type, itemId, paymentPlan });

  // 模拟API调用
  uni.showLoading({ title: '兑换中...' });

  setTimeout(() => {
    uni.hideLoading();

    // 更新本地功德分和积分
    userMeritPoints.value = paymentPlan.remainingMeritPoints;
    userCashPoints.value = paymentPlan.remainingCashPoints;

    uni.showToast({
      title: '兑换成功',
      icon: 'success',
      duration: 2000,
    });

    // 实际应该调用: POST /api/merit-points/exchange
    // body: {
    //   goods_id: itemId (if type === 'goods'),
    //   course_id: itemId (if type === 'course'),
    //   merit_points_used: paymentPlan.meritPointsToUse,
    //   cash_points_used: paymentPlan.cashPointsToUse
    // }
  }, 1500);
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
  position: relative;
}

.icon-text {
  font-size: 36rpx;
  color: $td-text-color-primary;
}

// 滚动内容
.scroll-content {
  height: calc(100vh - var(--window-top));
  box-sizing: border-box;
}

// 积分横幅
.points-banner {
  background: linear-gradient(135deg, $td-warning-color, #f5a623);
  padding: 32rpx;
  margin: 32rpx; // 恢复四周边距
  border-radius: $td-radius-default;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.points-section {
  display: flex;
  gap: 48rpx;
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

.page-content {
  padding: 0 32rpx 32rpx;
}

// 标签切换容器
.tabs-wrapper {
  margin-bottom: 24rpx;
  margin-top: 0;
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

// 加载更多
.load-more {
  text-align: center;
  padding: 40rpx 0;
}

.load-more-btn {
  background-color: #FFFFFF;
  border: 1px solid $td-border-level-1;
  border-radius: $td-radius-default;
  padding: 16rpx 48rpx;
  font-size: 28rpx;
  color: $td-text-color-primary;
  
  &:disabled {
    opacity: 0.6;
  }
  
  &::after {
    border: none;
  }
}

.no-more-text {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
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
