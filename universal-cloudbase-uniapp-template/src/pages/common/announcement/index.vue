<template>
  <view class="page">
    <td-page-header title="平台公告" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 公告列表 -->
        <view class="announcement-card" v-for="(item, index) in announcements" :key="index" @tap="goToDetail(item)">
          <view class="announcement-header">
            <view class="announcement-icon" :class="item.type">
              {{ item.icon }}
            </view>
            <view class="announcement-info">
              <view class="announcement-title">{{ item.title }}</view>
              <view class="announcement-date">{{ item.date }}</view>
            </view>
            <view class="announcement-badge" v-if="item.isNew">NEW</view>
          </view>
          <view class="announcement-content">{{ item.summary }}</view>
          <view class="announcement-footer">
            <text class="read-more">查看详情 ›</text>
          </view>
        </view>

        <!-- 空状态 -->
        <view class="empty-state" v-if="announcements.length === 0">
          <view class="empty-icon">📢</view>
          <view class="empty-text">暂无公告</view>
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

const announcements = ref([
  {
    id: 1,
    type: 'important',
    icon: '📢',
    title: '2024年春季课程安排通知',
    summary: '各位学员，2024年春季课程安排已确定，初探班将于2月1日开课，密训班将于2月15日开课...',
    date: '2024-01-20',
    isNew: true
  },
  {
    id: 2,
    type: 'info',
    icon: '💡',
    title: '传播大使升级政策调整',
    summary: '为了更好地激励传播大使，我们对升级政策进行了优化调整，新增鸿鹄大使快速通道...',
    date: '2024-01-18',
    isNew: true
  },
  {
    id: 3,
    type: 'success',
    icon: '🎉',
    title: '学员突破5000人里程碑',
    summary: '热烈祝贺天道文化学员总数突破5000人！感谢每一位学员的信任与支持，我们将继续为大家提供优质的学习体验...',
    date: '2024-01-15',
    isNew: false
  },
  {
    id: 4,
    type: 'warning',
    icon: '⚠️',
    title: '春节假期服务安排',
    summary: '春节期间（2月10日-2月17日）客服响应时间调整为10:00-18:00，请各位学员提前安排好学习计划...',
    date: '2024-01-12',
    isNew: false
  },
  {
    id: 5,
    type: 'info',
    icon: '📚',
    title: '新增商学院学习资料',
    summary: '商学院新增了一批学习资料，包括课程讲义、案例分析、学习笔记等，欢迎大家下载学习...',
    date: '2024-01-10',
    isNew: false
  },
  {
    id: 6,
    type: 'success',
    icon: '🏆',
    title: '2023年度优秀学员表彰',
    summary: '2023年度优秀学员评选结果已公布，共有50位学员获得表彰，感谢大家的积极参与和努力学习...',
    date: '2024-01-05',
    isNew: false
  }
])

const goToDetail = (item: any) => {
  uni.showToast({
    title: '公告详情功能开发中',
    icon: 'none'
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

.announcement-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.announcement-header {
  display: flex;
  align-items: flex-start;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.announcement-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
  
  &.important {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  
  &.info {
    background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  }
  
  &.success {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  }
  
  &.warning {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }
}

.announcement-info {
  flex: 1;
  min-width: 0;
}

.announcement-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.announcement-date {
  font-size: 24rpx;
  color: #999;
}

.announcement-badge {
  padding: 4rpx 16rpx;
  border-radius: 24rpx;
  background: #E34D59;
  color: #fff;
  font-size: 20rpx;
  font-weight: 500;
  flex-shrink: 0;
}

.announcement-content {
  font-size: 26rpx;
  line-height: 1.6;
  color: #666;
  margin-bottom: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.announcement-footer {
  display: flex;
  justify-content: flex-end;
}

.read-more {
  font-size: 26rpx;
  color: #0052D9;
}

.empty-state {
  padding: 120rpx 0;
  text-align: center;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 24rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}
</style>









