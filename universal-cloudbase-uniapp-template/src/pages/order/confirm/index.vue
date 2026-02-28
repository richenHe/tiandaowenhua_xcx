<template>
  <view class="page-container">
    <TdPageHeader title="确认订单" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <!-- 订单内容 -->
      <view v-if="!isLoading" class="page-content">
        <!-- 课程信息 -->
        <view class="t-section-title t-section-title--simple">📦 课程信息</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="course-info">
              <view class="course-icon" :style="courseInfo.coverImage ? {} : { background: courseInfo.gradient }">
                <image
                  v-if="courseInfo.coverImage"
                  :src="courseInfo.coverImage"
                  class="course-cover-img"
                  mode="aspectFill"
                />
                <text v-else>{{ courseInfo.icon }}</text>
              </view>
              <view class="course-details">
                <view class="course-name">{{ courseInfo.name }}</view>
                <view class="course-desc">{{ courseInfo.description }}</view>
                <view class="course-price">¥{{ formatPrice(courseInfo.price) }}</view>
              </view>
            </view>
          </view>
        </view>

        <!-- 个人信息 -->
        <view class="t-section-title t-section-title--simple">👤 个人信息</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="info-row">
              <text class="info-label">姓名</text>
              <text class="info-value">{{ userInfo.name }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">手机</text>
              <text class="info-value">{{ userInfo.phone }}</text>
            </view>
          </view>
        </view>

        <!-- 推荐人信息 -->
        <view class="t-section-title t-section-title--simple">🎯 推荐人信息</view>
        <view
          class="t-card t-card--bordered mb-l"
          :class="refereeLocked ? 'referee-card--locked' : 't-card--hoverable'"
          @click="goToSelectReferee"
        >
          <view class="t-card__body">
            <view class="referee-info">
              <view class="referee-left">
                <view class="t-avatar" :class="refereeLocked ? 't-avatar--theme-locked' : 't-avatar--theme-primary'">
                  <text class="t-avatar__text">{{ refereeInfo.name.charAt(0) }}</text>
                </view>
                <view class="referee-details">
                  <view class="referee-name" :class="{ 'referee-name--locked': refereeLocked }">
                    {{ refereeInfo.name }}
                  </view>
                  <view class="t-badge--standalone t-badge--theme-warning t-badge--size-small">
                    {{ refereeInfo.level }}
                  </view>
                </view>
              </view>
              <!-- 锁定状态显示锁图标+提示文字；未锁定显示右箭头 -->
              <view v-if="refereeLocked" class="locked-indicator">
                <text class="locked-icon">🔒</text>
                <text class="locked-text">无法修改</text>
              </view>
              <text v-else class="arrow-icon">›</text>
            </view>
          </view>
        </view>

        <!-- 订单金额 -->
        <view class="t-section-title t-section-title--simple">💰 订单金额</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="amount-row">
              <text class="amount-label">课程价格</text>
              <text class="amount-value">¥{{ formatPrice(courseInfo.price) }}</text>
            </view>
            <view class="amount-row">
              <text class="amount-label">优惠</text>
              <text class="amount-value">-¥{{ formatPrice(discount) }}</text>
            </view>
            <view class="t-divider t-divider--dashed"></view>
            <view class="amount-row amount-row--total">
              <text class="amount-label--total">实付金额</text>
              <text class="amount-value--total">¥{{ formatPrice(totalAmount) }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部 -->
    <view class="fixed-bottom">
      <view class="bottom-content">
        <view class="bottom-left">
          <view class="bottom-label">合计</view>
          <text class="bottom-price">¥{{ formatPrice(totalAmount) }}</text>
        </view>
        <button class="t-button t-button--theme-light t-button--size-large" @click="handleConfirm">
          <text class="t-button__text">确认支付</text>
        </button>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { UserApi, CourseApi, OrderApi } from '@/api';
import { formatPrice } from '@/utils';

// 课程信息
const courseInfo = ref({
  id: 0,
  name: '',
  description: '',
  price: 0,
  coverImage: '',
  icon: '📚',
  gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
});

// 用户信息
const userInfo = ref({
  name: '',
  phone: '',
});

// 推荐人信息
const refereeInfo = ref({
  id: 0,
  name: '',
  level: '',
});

// 推荐人是否已锁定（首次支付成功后锁定）
const refereeLocked = ref(false);

// 加载状态
const isLoading = ref(true);

// 加载页面数据
const loadPageData = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    isLoading.value = true;
    // 从URL参数获取课程ID
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options as any;
    const courseId = parseInt(options.courseId || '0');

    if (!courseId) {
      isLoading.value = false;
      uni.hideLoading();
      uni.showToast({
        title: '课程ID不存在',
        icon: 'none'
      });
      return;
    }

    // 并行加载用户信息和课程信息
    const [profile, course] = await Promise.all([
      UserApi.getProfile(),
      CourseApi.getDetail(courseId)
    ]);

    // 更新用户信息
    userInfo.value = {
      name: profile.real_name || '未设置',
      phone: profile.phone ? profile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''
    };

    // 更新课程信息
    courseInfo.value = {
      id: course.id,
      name: course.name,
      description: course.description || '',
      price: course.current_price || 0,
      coverImage: course.cover_image || '',
      icon: getCourseIcon(course.type),
      gradient: getCourseGradient(course.type)
    };

    // 如果有推荐人，直接使用返回的推荐人信息
    if (profile.referee_id && profile.referee_name) {
      refereeInfo.value = {
        id: profile.referee_id,
        name: profile.referee_name,
        level: getAmbassadorLevelName(profile.referee_level || 0)
      };
      // referee_confirmed_at 不为空表示首次支付已完成，推荐人永久锁定
      refereeLocked.value = !!profile.referee_confirmed_at;
      console.log('📌 已设置推荐人:', refereeInfo.value, '锁定状态:', refereeLocked.value);
    } else {
      console.log('📌 未设置推荐人');
    }
    uni.hideLoading();
  } catch (error) {
    console.error('加载页面数据失败:', error);
    uni.hideLoading();
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    });
  } finally {
    isLoading.value = false;
  }
};

// 获取课程图标
const getCourseIcon = (type: number): string => {
  const iconMap: Record<number, string> = {
    1: '📚',
    2: '🎓',
    3: '🔄'
  };
  return iconMap[type] || '📚';
};

// 获取课程渐变色
const getCourseGradient = (type: number): string => {
  const gradientMap: Record<number, string> = {
    1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    2: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    3: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  };
  return gradientMap[type] || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
};

// 获取大使等级名称
const getAmbassadorLevelName = (level: number): string => {
  const levelMap: Record<number, string> = {
    0: '普通用户',
    1: '准青鸾大使',
    2: '青鸾大使',
    3: '鸿鹄大使',
    4: '金凤大使'
  };
  return levelMap[level] || '普通用户';
};

// 页面加载时获取数据
onMounted(() => {
  loadPageData();
});

// 优惠金额
const discount = ref(0);

// 实付金额
const totalAmount = computed(() => {
  return courseInfo.value.price - discount.value;
});

// 跳转到选择推荐人页面（推荐人锁定时提示无法修改）
const goToSelectReferee = () => {
  if (refereeLocked.value) {
    uni.showToast({
      title: '推荐人已锁定，无法修改',
      icon: 'none',
      duration: 2000
    });
    return;
  }
  uni.navigateTo({
    url: '/pages/order/select-referee/index',
  });
};

// 点击确认支付按钮 - 显示原生确认弹窗
const handleConfirm = () => {
  // 检查推荐人是否已设置
  if (refereeInfo.value.id === 0 || refereeInfo.value.name === '未设置') {
    uni.showToast({
      title: '请选择推荐人',
      icon: 'none',
      duration: 2000
    });
    return;
  }

  uni.showModal({
    title: '提示',
    content: `确认推荐人为【${refereeInfo.value.name}】吗？\n\n一旦支付则无法修改！`,
    confirmText: '确定',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        // 用户点击确定，创建订单
        try {
          const orderResult = await OrderApi.create({
            order_type: 1, // 课程订单
            item_id: courseInfo.value.id,
            referee_id: refereeInfo.value.id || undefined
          });

          // 创建订单成功，跳转到支付页面
          uni.navigateTo({
            url: `/pages/order/payment/index?orderNo=${orderResult.order_no}`,
          });
        } catch (error: any) {
          console.error('创建订单失败:', error);
          uni.showToast({
            title: error.message || '创建订单失败',
            icon: 'none'
          });
        }
      } else if (res.cancel) {
        // 用户点击取消
        console.log('用户取消了支付');
      }
    }
  });
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.scroll-area {
  height: calc(100vh - var(--td-page-header-height) - 160rpx - env(safe-area-inset-bottom));
}

.page-content {
  padding: 32rpx;
  padding-bottom: 120rpx; // 底部留白，方便滚动查看
}

.mb-l {
  margin-bottom: 32rpx;
}

// 课程信息
.course-info {
  display: flex;
  gap: 24rpx;
}

.course-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: $td-radius-default;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  flex-shrink: 0;
  overflow: hidden;

  .course-cover-img {
    width: 100%;
    height: 100%;
  }
}

.course-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.course-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 8rpx;
}

.course-desc {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  margin-bottom: 12rpx;
}

.course-price {
  font-size: 36rpx;
  font-weight: 600;
  color: $td-warning-color;
}

// 信息行
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-size: 28rpx;
  color: $td-text-color-secondary;
}

.info-value {
  font-size: 28rpx;
  font-weight: 500;
  color: $td-text-color-primary;
}

// 推荐人卡片 - 锁定态
.referee-card--locked {
  opacity: 0.7;
  background-color: $td-bg-color-container;
  cursor: not-allowed;
}

// 推荐人信息
.referee-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.referee-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  flex: 1;
}

.t-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--theme-primary {
    background-color: $td-brand-color;
  }

  &--theme-locked {
    background-color: $td-text-color-placeholder;
  }
}

.t-avatar__text {
  font-size: 32rpx;
  color: white;
  font-weight: 500;
}

.referee-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.referee-name {
  font-size: 28rpx;
  font-weight: 500;
  color: $td-text-color-primary;

  &--locked {
    color: $td-text-color-secondary;
  }
}

.arrow-icon {
  font-size: 48rpx;
  color: $td-text-color-placeholder;
}

// 锁定状态指示器
.locked-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.locked-icon {
  font-size: 32rpx;
}

.locked-text {
  font-size: 20rpx;
  color: $td-text-color-placeholder;
}

// 金额行
.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;

  &--total {
    margin-top: 24rpx;
    margin-bottom: 0;
  }
}

.amount-label {
  font-size: 28rpx;
  color: $td-text-color-secondary;

  &--total {
    font-size: 32rpx;
    font-weight: 600;
    color: $td-text-color-primary;
  }
}

.amount-value {
  font-size: 28rpx;
  color: $td-text-color-primary;

  &--total {
    font-size: 40rpx;
    font-weight: 600;
    color: $td-warning-color;
  }
}

// 固定底部
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background-color: white;
  border-top: 2rpx solid $td-border-level-1;
  z-index: 100;
}

.bottom-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bottom-left {
  display: flex;
  flex-direction: column;
}

.bottom-label {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  margin-bottom: 4rpx;
}

.bottom-price {
  font-size: 48rpx;
  font-weight: 600;
  color: $td-warning-color;
}

// 按钮样式
.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $td-radius-default;
  border: none;
  padding: 0 48rpx;

  &--size-large {
    height: 88rpx;
  }

  &--theme-light {
    background-color: rgba($td-brand-color, 0.1);

    .t-button__text {
      color: $td-brand-color;
      font-size: 32rpx;
      font-weight: 500;
    }
  }
}
</style>

