<template>
  <view class="page-container">
    <TdPageHeader title="选择推荐人" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 搜索框 -->
        <view class="search-box mb-l">
          <view class="t-input__wrap">
            <view class="t-input t-input--prefix">
              <text class="t-input__prefix">🔍</text>
              <input
                class="t-input__inner"
                type="text"
                placeholder="搜索推荐人姓名或手机号"
                v-model="searchKeyword"
              />
            </view>
          </view>
        </view>

        <!-- 提示信息 -->
        <view class="t-alert t-alert--theme-info mb-l">
          <view class="t-alert__icon"><icon type="info" size="16" color="#0052D9"/></view>
          <view class="t-alert__content">
            <view class="t-alert__message">支付前可多次修改推荐人，首次购买支付成功后永久锁定</view>
          </view>
        </view>

        <!-- 重要说明 -->
        <view class="t-alert t-alert--theme-warning mb-l">
          <view class="t-alert__icon"><icon type="warn" size="16" color="#E6A23C"/></view>
          <view class="t-alert__content">
            <view class="t-alert__message">
              <view class="alert-title">推荐人资格说明：</view>
              <view class="alert-desc">
                • 准青鸾大使：仅可推荐初探班课程<br/>
                • 青鸾及以上：可推荐所有课程<br/>
                • 请根据课程类型选择合适的推荐人
              </view>
            </view>
          </view>
        </view>

        <!-- 推荐人列表 -->
        <view class="section-title section-title--simple">👥 推荐人列表</view>

        <view class="t-list">
          <view
            v-for="(referee, index) in filteredReferees"
            :key="index"
            class="t-list-item t-list-item--hover"
            @click="handleSelectReferee(referee)"
          >
            <view class="t-list-item__content">
              <view class="referee-item">
                <view class="t-avatar" :class="`t-avatar--theme-${referee.avatarTheme}`">
                  <text class="t-avatar__text">{{ referee.name.charAt(0) }}</text>
                </view>
                <view class="referee-info">
                  <view class="referee-name">{{ referee.name }}</view>
                  <view class="referee-phone">手机: {{ referee.phone }}</view>
                </view>
                <view class="referee-badges">
                  <view class="t-badge--standalone" :class="`t-badge--theme-${referee.badgeTheme}`">
                    {{ referee.level }}
                  </view>
                  <view
                    v-if="referee.limitation"
                    class="t-badge--standalone t-badge--theme-warning t-badge--size-small limitation-badge"
                  >
                    {{ referee.limitation }}
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="filteredReferees.length === 0" class="empty-state">
          <text class="empty-icon">🔍</text>
          <text class="empty-text">未找到相关推荐人</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { UserApi } from '@/api';
import type { SearchRefereeItem } from '@/api/types/user';

// 搜索关键词
const searchKeyword = ref('');

// 推荐人列表
const referees = ref<SearchRefereeItem[]>([]);

// 加载状态
const loading = ref(false);

// 推荐人是否已锁定（首次支付成功后永久锁定）
const refereeLocked = ref(false);

// 获取主题颜色
const getAvatarTheme = (level: number) => {
  const themeMap: Record<number, string> = {
    0: 'default',
    1: 'default',
    2: 'primary',
    3: 'success',
    4: 'warning'
  };
  return themeMap[level] || 'default';
};

const getBadgeTheme = (level: number) => {
  const themeMap: Record<number, string> = {
    0: 'default',
    1: 'default',
    2: 'primary',
    3: 'success',
    4: 'warning'
  };
  return themeMap[level] || 'default';
};

// 筛选推荐人（本地筛选）
const filteredReferees = computed(() => {
  return referees.value.map(referee => ({
    ...referee,
    avatarTheme: getAvatarTheme(referee.ambassador_level),
    badgeTheme: getBadgeTheme(referee.ambassador_level)
  }));
});

// 搜索推荐人
const searchReferees = async () => {
  const keyword = searchKeyword.value.trim();

  if (!keyword) {
    referees.value = [];
    return;
  }

  if (keyword.length < 2) {
    uni.showToast({
      title: '请输入至少2个字符',
      icon: 'none'
    });
    return;
  }

  try {
    loading.value = true;
    const result = await UserApi.searchReferees({ keyword });
    referees.value = result.list;

    if (result.list.length === 0) {
      uni.showToast({
        title: '未找到相关推荐人',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('搜索推荐人失败:', error);
  } finally {
    loading.value = false;
  }
};

// 显示锁定弹窗（仅确认按钮）
const showLockedDialog = () => {
  uni.showModal({
    title: '提示',
    content: '推荐人已锁定，无法修改',
    showCancel: false,
    confirmText: '确认'
  });
};

// 页面挂载时检查推荐人锁定状态
onMounted(async () => {
  try {
    const profile = await UserApi.getProfile();
    refereeLocked.value = !!profile.referee_confirmed_at;

    if (refereeLocked.value) {
      // 推荐人已锁定，立即弹出提示
      showLockedDialog();
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
});

// 监听搜索关键词变化，实时搜索
let searchTimer: number | null = null;
watch(searchKeyword, () => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    searchReferees();
  }, 500) as unknown as number;
});

// 选择推荐人
const handleSelectReferee = async (referee: SearchRefereeItem) => {
  // 推荐人已锁定时弹出提示，不允许修改
  if (refereeLocked.value) {
    showLockedDialog();
    return;
  }

  console.log('选择推荐人:', referee);

  try {
    await UserApi.updateReferee({
      refereeCode: referee.referee_code
    });

    uni.showToast({
      title: `已选择 ${referee.name}`,
      icon: 'success',
    });

    setTimeout(() => {
      uni.navigateBack();
    }, 1000);
  } catch (error) {
    console.error('选择推荐人失败:', error);
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

.scroll-area {
  height: calc(100vh - var(--td-page-header-height));
}

.page-content {
  padding: 32rpx;
  padding-bottom: 120rpx; // 底部留白，方便滚动查看
}

.mb-l {
  margin-bottom: 32rpx;
}

// 搜索框
.search-box {
  .t-input__wrap {
    position: relative;
  }

  .t-input {
    display: flex;
    align-items: center;
    background-color: white;
    border: 2rpx solid $td-border-level-1;
    border-radius: $td-radius-default;
    padding: 0 24rpx;
    transition: all 0.2s;

    &:focus-within {
      border-color: $td-brand-color;
    }

    &--prefix {
      padding-left: 16rpx;
    }
  }

  .t-input__prefix {
    font-size: 32rpx;
    margin-right: 16rpx;
  }

  .t-input__inner {
    flex: 1;
    height: 88rpx;
    font-size: 28rpx;
    color: $td-text-color-primary;
    background: transparent;
    border: none;
  }
}

// Alert 组件
.t-alert {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  border-radius: $td-radius-default;

  &--theme-info {
    background-color: rgba($td-brand-color, 0.1);
    border: 2rpx solid rgba($td-brand-color, 0.2);
  }

  &--theme-warning {
    background-color: $td-warning-color-light;
    border: 2rpx solid rgba($td-warning-color, 0.2);
  }
}

.t-alert__icon {
  font-size: 32rpx;
  margin-right: 16rpx;
  flex-shrink: 0;
}

.t-alert__content {
  flex: 1;
}

.t-alert__message {
  font-size: 24rpx;
  color: $td-text-color-primary;
  line-height: 1.6;
}

.alert-title {
  font-weight: 500;
  margin-bottom: 8rpx;
}

.alert-desc {
  font-size: 24rpx;
  line-height: 1.8;
}

// 列表
.t-list {
  background-color: white;
  border-radius: $td-radius-default;
  overflow: hidden;
}

.t-list-item {
  border-bottom: 2rpx solid $td-border-level-1;

  &:last-child {
    border-bottom: none;
  }

  &--hover:active {
    background-color: $td-bg-color-container-active;
  }
}

.t-list-item__content {
  padding: 24rpx;
}

// 推荐人项
.referee-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.t-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--theme-default {
    background-color: $td-bg-color-container;
  }

  &--theme-primary {
    background-color: $td-brand-color;
  }

  &--theme-success {
    background-color: $td-success-color;
  }

  &--theme-warning {
    background-color: $td-warning-color;
  }
}

.t-avatar__text {
  font-size: 32rpx;
  color: white;
  font-weight: 500;
}

.referee-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.referee-name {
  font-size: 28rpx;
  font-weight: 500;
  color: $td-text-color-primary;
}

.referee-phone {
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

.referee-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.t-badge--standalone {
  padding: 4rpx 12rpx;
  border-radius: $td-radius-small;
  font-size: 20rpx;
  font-weight: normal;
  white-space: nowrap;

  &.t-badge--size-small {
    font-size: 18rpx;
    padding: 2rpx 8rpx;
  }

  &.t-badge--theme-default {
    background-color: $td-bg-color-container;
    color: $td-text-color-secondary;
  }

  &.t-badge--theme-primary {
    background-color: rgba($td-brand-color, 0.1);
    color: $td-brand-color;
  }

  &.t-badge--theme-success {
    background-color: rgba($td-success-color, 0.1);
    color: $td-success-color;
  }

  &.t-badge--theme-warning {
    background-color: rgba($td-warning-color, 0.1);
    color: $td-warning-color;
  }
}

.limitation-badge {
  background-color: rgba($td-warning-color, 0.1);
  color: $td-warning-color;
}

// 空状态
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

