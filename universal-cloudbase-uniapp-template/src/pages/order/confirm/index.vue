<template>
  <view class="page-container">
    <TdPageHeader :title="isRetrain ? '复训费支付' : '确认订单'" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view v-if="!isLoading" class="page-content">
        <!-- 课程信息 -->
        <view class="t-section-title t-section-title--simple">📦 {{ isRetrain ? '复训课程' : '课程信息' }}</view>
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
                <view class="course-desc">{{ isRetrain ? '复训费用' : courseInfo.description }}</view>
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

        <!-- 推荐人信息已隐藏：仅后台可查看 -->
        <!--
        <template v-if="!isRetrain">
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
                <view v-if="refereeLocked" class="locked-indicator">
                  <text class="locked-icon">🔒</text>
                  <text class="locked-text">无法修改</text>
                </view>
                <text v-else class="arrow-icon">›</text>
              </view>
            </view>
          </view>
        </template>
        -->

        <!-- 复训提示（复训订单时显示） -->
        <view v-if="isRetrain" class="retrain-notice-card">
          <view class="retrain-notice-text">费用支付后无法取消预约且不退费，请确定好来上课再支付</view>
        </view>

        <!-- 订单金额 -->
        <view class="t-section-title t-section-title--simple">💰 订单金额</view>
        <view class="t-card t-card--bordered mb-l">
          <view class="t-card__body">
            <view class="amount-row">
              <text class="amount-label">{{ isRetrain ? '复训费' : '课程价格' }}</text>
              <text class="amount-value">¥{{ formatPrice(courseInfo.price) }}</text>
            </view>
            <view v-if="!isRetrain" class="amount-row">
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

const COURSE_REMINDER_TMPL_ID = 'SYdGf0v5jj40k50FjfUB4ROStOWQiSvhVidHIsAsHYc'

/** 请求订阅消息授权 */
const requestSubscribe = (): Promise<void> => {
  return new Promise((resolve) => {
    // #ifdef MP-WEIXIN
    uni.requestSubscribeMessage({
      tmplIds: [COURSE_REMINDER_TMPL_ID],
      complete: () => resolve()
    })
    // #endif
    // #ifndef MP-WEIXIN
    resolve()
    // #endif
  })
}

// 是否为复训订单
const isRetrain = ref(false);
// 复训相关参数
const classRecordId = ref(0);
const userCourseId = ref(0);

const courseInfo = ref({
  id: 0,
  name: '',
  description: '',
  price: 0,
  coverImage: '',
  icon: '📚',
  gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
});

const userInfo = ref({ name: '', phone: '' });

const isLoading = ref(true);

const loadPageData = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    isLoading.value = true;

    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options as any;
    const courseId = parseInt(options.courseId || '0');

    // 解析复训参数
    if (options.isRetrain === '1') {
      isRetrain.value = true;
      classRecordId.value = parseInt(options.classRecordId || '0');
      userCourseId.value = parseInt(options.userCourseId || '0');
    }

    if (!courseId) {
      isLoading.value = false;
      uni.hideLoading();
      uni.showToast({ title: '课程ID不存在', icon: 'none' });
      return;
    }

    const [profile, course] = await Promise.all([
      UserApi.getProfile(),
      CourseApi.getDetail(courseId)
    ]);

    userInfo.value = {
      name: profile.real_name || '未设置',
      phone: profile.phone ? profile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : ''
    };

    // 复训订单使用 retrain_price，普通订单使用 current_price
    const price = isRetrain.value
      ? (parseFloat(course.retrain_price) || 0)
      : (course.current_price || 0);

    courseInfo.value = {
      id: course.id,
      name: course.name,
      description: course.description || '',
      price,
      coverImage: course.cover_image || '',
      icon: getCourseIcon(course.type),
      gradient: getCourseGradient(course.type)
    };

    uni.hideLoading();
  } catch (error) {
    console.error('加载页面数据失败:', error);
    uni.hideLoading();
    uni.showToast({ title: '加载失败，请重试', icon: 'none' });
  } finally {
    isLoading.value = false;
    hasLoaded.value = true;
  }
};

const getCourseIcon = (type: number): string => {
  const iconMap: Record<number, string> = { 1: '📚', 2: '🎓', 3: '🔄' };
  return iconMap[type] || '📚';
};

const getCourseGradient = (type: number): string => {
  const gradientMap: Record<number, string> = {
    1: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    2: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    3: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  };
  return gradientMap[type] || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
};

// 标记是否已完成初次加载
const hasLoaded = ref(false);

onMounted(() => {
  loadPageData();
});

const discount = ref(0);

const totalAmount = computed(() => {
  return isRetrain.value ? courseInfo.value.price : courseInfo.value.price - discount.value;
});

const handleConfirm = () => {
  if (isRetrain.value) {
    handleRetrainConfirm();
  } else {
    handleCourseConfirm();
  }
};

/** 复训订单确认 */
const handleRetrainConfirm = () => {
  uni.showModal({
    title: '复训费支付',
    content: `确认支付复训费 ¥${formatPrice(totalAmount.value)} 吗？\n支付后无法取消预约且不退费。`,
    confirmText: '确定',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        try {
          const orderResult = await OrderApi.create({
            order_type: 2,
            item_id: userCourseId.value,
            class_record_id: classRecordId.value
          });

          // 跳转支付页，支付成功后回调会自动创建预约
          uni.redirectTo({
            url: `/pages/order/payment/index?orderNo=${orderResult.order_no}&isRetrain=1`,
          });
        } catch (error: any) {
          console.error('创建复训订单失败:', error);
          uni.showToast({ title: error.message || '创建订单失败', icon: 'none' });
        }
      }
    }
  });
};

/** 普通课程订单确认 - 推荐人信息已隐藏，不再前端展示和确认 */
const handleCourseConfirm = () => {
  uni.showModal({
    title: '提示',
    content: '确认下单吗？',
    confirmText: '确定',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        try {
          const orderResult = await OrderApi.create({
            order_type: 1,
            item_id: courseInfo.value.id
          });

          uni.redirectTo({
            url: `/pages/order/payment/index?orderNo=${orderResult.order_no}`,
          });
        } catch (error: any) {
          console.error('创建订单失败:', error);
          uni.showToast({ title: error.message || '创建订单失败', icon: 'none' });
        }
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

// 复训提示卡片
.retrain-notice-card {
  margin-bottom: 32rpx;
  background-color: #FFF3F0;
  border-radius: $td-radius-default;
  padding: 24rpx 32rpx;
}

.retrain-notice-text {
  font-size: 24rpx;
  color: $td-error-color;
  line-height: 1.6;
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

