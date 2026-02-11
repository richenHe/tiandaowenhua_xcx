<template>
  <view class="page-container">
    <!-- 用户信息头部 -->
    <view class="profile-header" @click="goToProfile">
      <view class="profile-content">
        <view class="user-avatar">
          <image 
            v-if="userInfo.avatar" 
            :src="userInfo.avatar" 
            mode="aspectFill"
            class="avatar-image"
          />
          <text v-else class="avatar-text">{{ userInfo.name.charAt(0) }}</text>
        </view>
        <view class="user-info">
          <view class="user-name">
            <text>{{ userInfo.name }}</text>
            <text class="level-badge">{{ userInfo.levelBadge }}</text>
          </view>
        </view>
        <text class="arrow-icon">›</text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-section">
      <view 
        v-for="(stat, index) in stats" 
        :key="index"
        class="stat-item"
        @click="handleStatClick(stat.type)"
      >
        <text class="stat-count" :style="{ color: stat.color }">{{ stat.count }}</text>
        <text class="stat-label">{{ stat.label }}</text>
      </view>
    </view>

    <!-- 菜单列表 -->
    <scroll-view scroll-y class="scroll-area">
      <view class="scroll-content">
        <!-- 推荐与设置 -->
        <view class="t-section-title t-section-title--simple">⚙️ 推荐与设置</view>
        <view class="menu-group">
          <view 
            v-for="(item, index) in settingsMenu" 
            :key="index"
            class="menu-item"
            @click="handleMenuClick(item.type)"
          >
            <view class="menu-left">
              <text class="menu-icon">{{ item.icon }}</text>
              <text class="menu-label">{{ item.label }}</text>
            </view>
            <view class="menu-right">
              <text v-if="item.badge" class="menu-badge" :class="`badge--${item.badgeTheme}`">
                {{ item.badge }}
              </text>
              <text class="menu-arrow">›</text>
            </view>
          </view>
        </view>

        <!-- 帮助与反馈 -->
        <view class="t-section-title t-section-title--simple">💬 帮助与反馈</view>
        <view class="menu-group">
          <view 
            v-for="(item, index) in helpMenu" 
            :key="index"
            class="menu-item"
            @click="handleMenuClick(item.type)"
          >
            <view class="menu-left">
              <text class="menu-icon">{{ item.icon }}</text>
              <text class="menu-label">{{ item.label }}</text>
            </view>
            <view class="menu-right">
              <text v-if="item.badge" class="menu-badge badge--error">
                {{ item.badge }}
              </text>
              <text class="menu-arrow">›</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { UserApi } from '@/api';
import { ref, computed, onMounted } from 'vue';
import { UserApi } from '@/api';

// 用户信息
const userInfo = ref({
  name: '加载中...',
  phone: '',
  avatar: '',
  levelBadge: '🌿',
  isAmbassador: false,
  ambassadorLevel: '',
  ambassador_level: 0
  ambassadorLevel: '',
  ambassador_level: 0
});

// 数据统计
const stats = ref([
  { type: 'orders', count: 0, label: '我的订单', color: '#0052D9' },
  { type: 'appointments', count: 0, label: '我的预约', color: '#00A870' },
  { type: 'courses', count: 0, label: '我的课程', color: '#D4AF37' },
  { type: 'contracts', count: 0, label: '我的合同', color: '#E34D59' }
]);

// 加载用户信息
const loadUserProfile = async () => {
  try {
    const profile = await UserApi.getProfile();

    // 更新用户信息
    userInfo.value = {
      name: profile.real_name || '未设置',
      phone: profile.phone ? profile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
      avatar: profile.avatar || '',
      levelBadge: getLevelBadge(profile.ambassador_level),
      isAmbassador: profile.ambassador_level > 0,
      ambassadorLevel: getLevelName(profile.ambassador_level),
      ambassador_level: profile.ambassador_level
    };
  } catch (error) {
    console.error('加载用户信息失败:', error);
  }
};

// 加载统计数据
const loadStats = async () => {
  try {
    // 并行加载各项统计数据
    const [orders, courses, appointments] = await Promise.all([
      UserApi.getMyOrders({ page: 1, page_size: 1 }),
      UserApi.getMyCourses({ page: 1, page_size: 1 }),
      // 预约数据需要从课程模块获取，这里暂时使用0
      Promise.resolve({ total: 0 })
    ]);

    stats.value = [
      { type: 'orders', count: orders.total || 0, label: '我的订单', color: '#0052D9' },
      { type: 'appointments', count: appointments.total || 0, label: '我的预约', color: '#00A870' },
      { type: 'courses', count: courses.total || 0, label: '我的课程', color: '#D4AF37' },
      { type: 'contracts', count: 0, label: '我的合同', color: '#E34D59' }
    ];
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
};

// 获取等级徽章
const getLevelBadge = (level: number): string => {
  const badges: Record<number, string> = {
    0: '🌿',
    1: '🥉',
    2: '🥈',
    3: '🥇',
    4: '👑'
  };
  return badges[level] || '🌿';
};

// 获取等级名称
const getLevelName = (level: number): string => {
  const names: Record<number, string> = {
    0: '',
    1: '初级大使',
    2: '中级大使',
    3: '高级大使',
    4: '特级大使'
  };
  return names[level] || '';
};

// 页面加载时获取数据
onMounted(() => {
  loadUserProfile();
  loadStats();
});

// 推荐与设置菜单
const settingsMenu = computed(() => [
  { 
    type: 'referral-list', 
    icon: '🏇', 
    label: '引荐人列表', 
    badge: '5人', 
    badgeTheme: 'primary' 
  },
  { 
    type: 'ambassador', 
    icon: '🎖️', 
    label: '传播大使',
    badge: userInfo.value.ambassadorLevel || '准青鸾大使',
    badgeTheme: 'warning'
  },
  { 
    type: 'profile', 
    icon: '👤', 
    label: '个人资料' 
  }
]);

// 帮助与反馈菜单
const helpMenu = ref([
  // { type: 'consultation', icon: '💬', label: '在线咨询' }, // 暂时隐藏在线咨询功能
  { type: 'feedback', icon: '📝', label: '意见反馈' },
  { type: 'announcement', icon: '📢', label: '平台公告', badge: '3', badgeTheme: 'error' }
]);

// 跳转到个人资料
const goToProfile = () => {
  uni.navigateTo({
    url: '/pages/mine/profile/index'
  });
};

// 处理统计项点击
const handleStatClick = (type: string) => {
  const routeMap: Record<string, string> = {
    'orders': '/pages/mine/orders/index',
    'appointments': '/pages/mine/appointments/index',
    'courses': '/pages/course/my-courses/index',
    'contracts': '/pages/mine/contracts/index'
  };
  
  const url = routeMap[type];
  if (url) {
    uni.navigateTo({ url });
  }
};

// 处理菜单点击
const handleMenuClick = (type: string) => {
  const routeMap: Record<string, string> = {
    'referral-list': '/pages/mine/referral-list/index',
    'referee-manage': '/pages/mine/referee-manage/index',
    'ambassador': '/pages/ambassador/level/index',
    'profile': '/pages/mine/profile/index',
    'consultation': '/pages/mine/consultation/index',
    'feedback': '/pages/mine/feedback/index',
    'announcement': '/pages/common/announcement/index'
  };
  
  const url = routeMap[type];
  if (url) {
    uni.navigateTo({ url });
  }
};
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  width: 100%;
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

// 用户信息头部
.profile-header {
  background: linear-gradient(135deg, $td-brand-color, $td-brand-color-light);
  padding: 48rpx 32rpx;
  padding-top: calc(48rpx + var(--status-bar-height));
  color: white;
}

.profile-content {
  display: flex;
  align-items: center;
  gap: 32rpx;
}

.user-avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-text {
  font-size: 48rpx;
  font-weight: 600;
  color: $td-brand-color;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.level-badge {
  font-size: 32rpx;
}

.user-phone {
  font-size: 26rpx;
  opacity: 0.9;
}

.arrow-icon {
  font-size: 40rpx;
  opacity: 0.8;
  color: white;
}

.menu-arrow {
  font-size: 32rpx;
  color: $td-text-color-placeholder;
  opacity: 0.5;
}

// 数据统计
.stats-section {
  background-color: white;
  padding: 32rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32rpx;
  border-bottom: 16rpx solid $td-bg-color-page;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.stat-count {
  font-size: 40rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: $td-text-color-secondary;
}

// 滚动区域
.scroll-area {
  height: calc(100vh - 394rpx - var(--status-bar-height));
}

.scroll-content {
  padding-bottom: 120rpx; // 底部留白，方便滚动查看
}

// 分节标题
// 菜单组
.menu-group {
  background-color: white;
  margin-bottom: 16rpx;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  background-color: white;
  border-bottom: 2rpx solid $td-border-level-1;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:active {
    background-color: $td-bg-color-container-active;
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 24rpx;
  flex: 1;
}

.menu-icon {
  font-size: 40rpx;
}

.menu-label {
  font-size: $td-font-size-m;
  font-weight: normal;
  color: $td-text-color-primary;
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.menu-badge {
  padding: 4rpx 12rpx;
  border-radius: $td-radius-small;
  font-size: 20rpx;
  font-weight: normal;
  
  &.badge--primary {
    background-color: white;
    color: $td-brand-color;
    border: 1rpx solid $td-brand-color;
  }
  
  &.badge--warning {
    background-color: $td-warning-color-light;
    color: $td-warning-color;
  }
  
  &.badge--error {
    background-color: $td-error-color;
    color: white;
    padding: 8rpx;
    border-radius: 50%;
    min-width: 36rpx;
    min-height: 36rpx;
    width: 36rpx;
    height: 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 1;
  }
}
</style>

