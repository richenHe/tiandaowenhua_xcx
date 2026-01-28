<template>
  <view class="page">
    <td-page-header title="我的团队" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 团队统计卡片 -->
        <view class="stats-card">
          <view class="stats-value">8</view>
          <view class="stats-label">团队成员</view>
        </view>

        <!-- 团队成员列表 -->
        <view class="section-title">👥 团队成员</view>

        <view class="member-card" v-for="(member, index) in members" :key="index">
          <view class="member-avatar">{{ member.name.charAt(0) }}</view>
          <view class="member-info">
            <view class="member-name">{{ member.name }}</view>
            <view class="member-meta">
              <text>加入时间: {{ member.joinDate }}</text>
            </view>
            <view class="member-stats">
              <view class="stat-item">
                <text class="stat-label">推荐人数:</text>
                <text class="stat-value">{{ member.referralCount }}</text>
              </view>
              <view class="stat-item">
                <text class="stat-label">等级:</text>
                <text class="stat-value">{{ member.level }}</text>
              </view>
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
import { ref, computed } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height))'
})

const members = ref([
  { name: '王五', joinDate: '2024-01-10', referralCount: 2, level: '准青鸾大使' },
  { name: '李四', joinDate: '2024-01-08', referralCount: 5, level: '青鸾大使' },
  { name: '赵六', joinDate: '2024-01-05', referralCount: 1, level: '准青鸾大使' },
  { name: '孙七', joinDate: '2024-01-03', referralCount: 8, level: '青鸾大使' },
  { name: '周八', joinDate: '2023-12-28', referralCount: 3, level: '准青鸾大使' },
  { name: '吴九', joinDate: '2023-12-25', referralCount: 12, level: '鸿鹄大使' },
  { name: '郑十', joinDate: '2023-12-20', referralCount: 4, level: '青鸾大使' },
  { name: '钱一', joinDate: '2023-12-15', referralCount: 6, level: '青鸾大使' }
])
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
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx;
  text-align: center;
  margin-bottom: 48rpx;
}

.stats-value {
  font-size: 64rpx;
  font-weight: 600;
  color: #0052D9;
  margin-bottom: 8rpx;
}

.stats-label {
  font-size: 28rpx;
  color: #999;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.member-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  gap: 24rpx;
}

.member-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.member-meta {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.member-stats {
  display: flex;
  gap: 32rpx;
}

.stat-item {
  font-size: 24rpx;
}

.stat-label {
  color: #999;
  margin-right: 8rpx;
}

.stat-value {
  color: #0052D9;
  font-weight: 500;
}
</style>

