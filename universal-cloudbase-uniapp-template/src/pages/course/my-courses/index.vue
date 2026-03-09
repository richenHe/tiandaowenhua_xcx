<template>
  <view class="page-container">
    <TdPageHeader title="我的课程" :showBack="true" />

    <scroll-view
      scroll-y
      class="scroll-area"
      lower-threshold="100"
      @scrolltolower="loadMore"
    >
      <view class="page-content">
        <!-- 课程列表 -->
        <view
          v-for="(course, index) in filteredCourses"
          :key="index"
          class="t-card t-card--bordered course-card"
        >
          <view class="t-card__body">
            <view class="course-header">
              <view class="course-icon" :style="course.cover_image ? {} : { background: course.gradient }">
                <image
                  v-if="course.cover_image"
                  :src="course.cover_image"
                  class="course-cover-img"
                  mode="aspectFill"
                />
                <text v-else>{{ course.icon }}</text>
              </view>
              <view class="course-info">
                <text class="course-name">{{ course.name }}</text>
                <text class="course-meta">购买: {{ course.purchaseDate }}</text>
                <text class="course-meta">上课: {{ course.attendedCount }}次</text>
                <view class="course-bottom-row">
                  <view
                    v-if="course.canRetrain"
                    class="t-badge--standalone t-badge--theme-success t-badge--size-small"
                  >
                    可复训
                  </view>
                  <view v-else />
                  <view
                    v-if="course.expireLabel"
                    class="expire-tag"
                    :class="course.expireExpired
                      ? 'expire-tag--danger'
                      : course.expireUrgent
                        ? 'expire-tag--warning'
                        : 'expire-tag--success'"
                  >
                    {{ course.expireLabel }}
                  </view>
                </view>
                <!-- 合同驳回原因提示 -->
                <view
                  v-if="course.contract_rejected"
                  class="contract-reject-tip"
                >
                  ❌ 合同驳回：{{ course.contract_reject_reason }}
                </view>
              </view>
            </view>

            <view class="course-actions">
              <view class="action-button">
                <button
                  class="t-button t-button--theme-default t-button--variant-outline t-button--size-small"
                  style="width: 100%"
                  @click="goToCourseDetail(course.id)"
                >
                  <span class="t-button__text">查看详情</span>
                </button>
              </view>
              <view class="action-button">
                <button
                  class="t-button t-button--size-small"
                  :class="course.isExpired
                    ? 't-button--theme-default t-button--variant-outline'
                    : 't-button--theme-primary t-button--variant-base'"
                  style="width: 100%"
                  :disabled="course.isExpired"
                  @click="!course.isExpired && goToCourseSchedule(course.id)"
                >
                  <span class="t-button__text">{{ course.isExpired ? '已过期' : '预约上课' }}</span>
                </button>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="filteredCourses.length === 0 && !loading" class="empty-state">
          <view class="empty-icon"><icon type="info" size="60" color="#ccc"/></view>
          <text class="empty-text">暂无课程</text>
        </view>

        <!-- 加载更多 -->
        <view v-if="!finished && filteredCourses.length > 0" class="load-more">
          <text class="load-more-text">{{ loading ? '加载中...' : '上拉加载更多' }}</text>
        </view>

        <!-- 已加载全部 -->
        <view v-if="finished && filteredCourses.length > 0" class="load-more">
          <text class="finished-text">已加载全部</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { UserApi } from '@/api';

// 课程数据
const courses = ref<any[]>([]);

// 分页状态
const MAX_ITEMS = 99;
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const finished = ref(false);

// 课程图标和渐变色映射
const courseStyles: Record<number, { icon: string; gradient: string }> = {
  1: { icon: '📚', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }, // 初探班
  2: { icon: '🎓', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }, // 密训班
  3: { icon: '💬', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }  // 咨询服务
};

/**
 * 计算有效期剩余文案
 * - status=3（已过期）→ 「已过期」
 * - contract_signed=1 + expire_at → 根据 expire_at 算剩余天数
 * - 未签合同时不显示任何标识
 */
const calcExpireInfo = (item: any) => {
  const isSalon = item.course_type === 4 || item.type === 4;

  if (isSalon) return { label: '', urgent: false, expired: false };

  if (item.status === 3) {
    return { label: '已过期', urgent: true, expired: true };
  }

  // 未签合同：不显示标识
  if (item.contract_signed === 0) {
    return { label: '', urgent: false, expired: false };
  }

  // 已签合同且有效 → 计算剩余天数
  if (!item.expire_at) return { label: '', urgent: false, expired: false };

  const parts = item.expire_at.split(' ')[0].split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return { label: '', urgent: false, expired: false };

  const expireMs = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((expireMs - todayMs) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return { label: '已过期', urgent: true, expired: true };
  if (diffDays > 365) {
    const years = Math.floor(diffDays / 365);
    const remainDays = diffDays % 365;
    return { label: remainDays > 0 ? `${years}年${remainDays}天` : `${years}年`, urgent: false, expired: false };
  }
  if (diffDays > 30) return { label: `${diffDays}天`, urgent: false, expired: false };
  return { label: `${diffDays}天`, urgent: true, expired: false };
};

const mapCourseItem = (item: any) => {
  const style = courseStyles[item.type] || courseStyles[1];
  const expireInfo = calcExpireInfo(item);
  return {
    id: item.course_id,
    name: item.title,
    cover_image: item.cover_image || '',
    icon: style.icon,
    gradient: style.gradient,
    purchaseDate: (item.purchase_date || item.buy_time || '').split(' ')[0],
    attendedCount: item.attend_count || 0,
    canRetrain: item.attend_count >= 1 && item.status !== 3,
    expireLabel: expireInfo.label,
    expireUrgent: expireInfo.urgent,
    expireExpired: expireInfo.expired,
    isExpired: item.status === 3,
    status: item.status,
    contract_audit_pending: item.contract_audit_pending || false,
    contract_rejected: item.contract_rejected || false,
    contract_reject_reason: item.contract_reject_reason || null
  };
};

// 加载我的课程（reset=true 时重置分页从头加载）
const loadMyCourses = async (reset = false) => {
  if (reset) {
    currentPage.value = 1;
    courses.value = [];
    finished.value = false;
  }

  if (loading.value || finished.value) return;

  try {
    if (currentPage.value === 1) {
      uni.showLoading({ title: '加载中...' });
    }
    loading.value = true;

    const result = await UserApi.getMyCourses({
      page: currentPage.value,
      page_size: pageSize.value
    });

    const newItems = result.list.map(mapCourseItem);
    courses.value.push(...newItems);
    total.value = result.total || 0;
    currentPage.value++;

    if (
      newItems.length === 0 ||
      newItems.length < pageSize.value ||
      courses.value.length >= total.value ||
      courses.value.length >= MAX_ITEMS
    ) {
      finished.value = true;
      if (courses.value.length > MAX_ITEMS) {
        courses.value = courses.value.slice(0, MAX_ITEMS);
      }
    }

    if (currentPage.value === 2) {
      uni.hideLoading();
    }
  } catch (error) {
    console.error('加载课程列表失败:', error);
    uni.hideLoading();
    uni.showToast({ title: '加载失败，请重试', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (!finished.value && !loading.value) {
    loadMyCourses();
  }
};

onMounted(() => {
  loadMyCourses();
});

onShow(() => {
  loadMyCourses(true);
});

const filteredCourses = computed(() => courses.value);

// 跳转到课程详情
const goToCourseDetail = (courseId: string) => {
  console.log('前往课程详情:', courseId);
  uni.navigateTo({
    url: '/pages/course/detail/index?courseId=' + courseId,
  });
};

// 跳转到课程排期（参数名必须为 course_id，与 schedule 页一致）
const goToCourseSchedule = (courseId: string) => {
  console.log('前往课程排期:', courseId);
  uni.navigateTo({
    url: '/pages/course/schedule/index?course_id=' + courseId,
  });
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  height: 100vh;
  background-color: $td-bg-color-page;
  display: flex;
  flex-direction: column;
}

.scroll-area {
  flex: 1;
  overflow: hidden;
}

.page-content {
  padding: 32rpx;
  padding-bottom: 120rpx; // 底部留白，方便滚动查看
}

// 课程卡片样式
.course-card {
  margin-bottom: 32rpx;
}

.course-header {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.course-icon {
  width: 160rpx;
  height: 160rpx;
  border-radius: var(--td-radius-default);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
  flex-shrink: 0;
  overflow: hidden;
}

.course-cover-img {
  width: 100%;
  height: 100%;
}

.course-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.course-name {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
}

.course-meta {
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

.course-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4rpx;
}

.course-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.action-button {
  flex: 1;
}

.expire-tag {
  flex-shrink: 0;
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  line-height: 1.4;
  white-space: nowrap;

  &--success {
    color: #00a870;
    background-color: #e3f9e9;
  }

  &--warning {
    color: #e37318;
    background-color: #fef3e6;
  }

  &--danger {
    color: #d54941;
    background-color: #fdecee;
  }

  &--info {
    color: $td-brand-color;
    background-color: #e8f0fd;
  }
}

.contract-reject-tip {
  font-size: 22rpx;
  color: #d54941;
  margin-top: 8rpx;
  line-height: 1.5;
}

// 加载更多
.load-more {
  text-align: center;
  padding: 40rpx 0;
}

.load-more-text {
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

.finished-text {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
}

// 空状态样式
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: $td-text-color-placeholder;
}
</style>
