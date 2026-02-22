<template>
  <view class="page-container">
    <TdPageHeader title="兑换记录" :showBack="true" />

    <scroll-view class="scroll-content" scroll-y>
      <view class="page-content">
        <!-- 统计卡片 -->
        <view class="stats-card">
          <view class="stats-title">📊 兑换统计</view>
          <view class="stats-grid">
            <view class="stats-item">
              <view class="stats-value">{{ totalRecords }}</view>
              <view class="stats-label">累计兑换次数</view>
            </view>
            <view class="stats-item">
              <view class="stats-value">{{ totalPoints }}</view>
              <view class="stats-label">累计消耗功德分</view>
            </view>
          </view>
        </view>

        <!-- Tab切换 -->
        <view class="tabs-wrapper">
          <view class="t-capsule-tabs">
            <view
              v-for="tab in tabs"
              :key="tab.value"
              class="t-capsule-tabs__item"
              :class="{ 't-capsule-tabs__item--active': activeTab === tab.value }"
              @click="activeTab = tab.value"
            >
              {{ tab.label }}
            </view>
          </view>
        </view>

        <!-- 兑换记录列表 -->
        <view v-if="filteredRecords.length > 0" class="records-list">
          <view v-for="(record, index) in filteredRecords" :key="record.exchange_no" class="record-card">
            <view class="record-icon" :style="{ background: getIconBg(index) }">
              {{ getGoodsIcon(record.goods_name) }}
            </view>
            <view class="record-content">
              <view class="record-header">
                <view class="record-info">
                  <view class="record-title">{{ record.goods_name }}</view>
                  <view class="record-desc">数量: {{ record.quantity }} | {{ record.status_name }}</view>
                </view>
                <view class="record-amount">
                  <view class="amount-points">-{{ record.merit_points_used }}</view>
                  <view v-if="record.cash_points_used > 0" class="amount-cash">积分 -{{ record.cash_points_used }}</view>
                </view>
              </view>
              <view class="record-footer">
                <text>兑换单号: {{ record.exchange_no }}</text>
                <text>{{ formatDateTime(record.created_at) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <view class="empty-icon">📋</view>
          <view class="empty-text">暂无兑换记录</view>
        </view>

        <!-- 加载更多 -->
        <view v-if="filteredRecords.length > 0 && !finished" class="load-more">
          <button class="t-button t-button--theme-default t-button--variant-text" @click="loadMore">
            <span class="t-button__text">加载更多</span>
          </button>
        </view>

        <!-- 底部留白 -->
        <view class="pb-xxl"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import { OrderApi } from '@/api';
import type { ExchangeRecord } from '@/api/types/order';

const activeTab = ref<number | null>(null);

const tabs = ref([
  { label: '全部', value: null },
  { label: '已兑换', value: 1 },
  { label: '已领取', value: 2 },
]);

// 兑换记录列表
const records = ref<ExchangeRecord[]>([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const finished = ref(false);

// 计算总兑换次数和消耗功德分
const totalRecords = computed(() => total.value);
const totalPoints = computed(() => {
  const sum = records.value.reduce((sum, record) => {
    const points = typeof record.merit_points_used === 'string' 
      ? parseFloat(record.merit_points_used) 
      : record.merit_points_used;
    return sum + (isNaN(points) ? 0 : points);
  }, 0);
  return sum.toFixed(1);
});

// 根据 activeTab 筛选记录
const filteredRecords = computed(() => {
  if (activeTab.value === null) {
    return records.value;
  }
  return records.value.filter((record) => record.status === activeTab.value);
});

onMounted(() => {
  loadExchangeRecords();
});

// 加载兑换记录
const loadExchangeRecords = async () => {
  if (loading.value || finished.value) return;

  try {
    uni.showLoading({ title: '加载中...' });
    loading.value = true;
    const result = await OrderApi.getExchangeRecords({
      page: page.value,
      page_size: pageSize.value,
      status: activeTab.value || undefined
    });

    records.value.push(...result.list);
    total.value = result.total;
    page.value++;

    if (records.value.length >= total.value) {
      finished.value = true;
    }
    uni.hideLoading();
  } catch (error) {
    console.error('获取兑换记录失败:', error);
    uni.hideLoading();
  } finally {
    loading.value = false;
  }
};

// 获取商品图标
const getGoodsIcon = (goodsName: string) => {
  if (goodsName.includes('茶') || goodsName.includes('茶具')) return '🍵';
  if (goodsName.includes('书') || goodsName.includes('书籍')) return '📚';
  if (goodsName.includes('课程') || goodsName.includes('复训')) return '🎓';
  if (goodsName.includes('咨询') || goodsName.includes('服务')) return '💬';
  return '🎁';
};

// 获取图标背景
const getIconBg = (index: number) => {
  const backgrounds = [
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  ];
  return backgrounds[index % backgrounds.length];
};

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  return dateStr.replace('T', ' ').substring(0, 16);
};

// 加载更多
const loadMore = () => {
  if (finished.value) {
    uni.showToast({ title: '没有更多记录了', icon: 'none' });
  } else {
    loadExchangeRecords();
  }
};
</script>

<style scoped lang="scss">
@import '@/styles/tdesign-vars.scss';

.page-container {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
}

.page-content {
  padding: 32rpx;
}

.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 48rpx;
  margin-bottom: 32rpx;
  color: #fff;
}

.stats-title {
  font-size: 28rpx;
  margin-bottom: 32rpx;
  opacity: 0.9;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.stats-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.tabs-wrapper {
  margin-bottom: 32rpx;
}

.records-list {
  margin-bottom: 32rpx;
}

.record-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  gap: 24rpx;
}

.record-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.record-desc {
  font-size: 24rpx;
  color: #999;
}

.record-amount {
  flex-shrink: 0;
  margin-left: 16rpx;
  text-align: right;
}

.amount-points {
  font-size: 36rpx;
  font-weight: 600;
  color: #e34d59;
  margin-bottom: 4rpx;
}

.amount-cash {
  font-size: 24rpx;
  color: #ff9800;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 40rpx 0;
}

</style>

