<template>
  <view class="page-container">
    <TdPageHeader title="Dialog 示例" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 示例按钮 -->
        <view class="demo-section">
          <view class="section-title">基础用法</view>
          <button class="demo-button" @click="showBasicDialog">基础弹窗</button>
          <button class="demo-button" @click="showCancelDialog">取消预约确认</button>
        </view>

        <view class="demo-section">
          <view class="section-title">不同主题</view>
          <button class="demo-button" @click="showInfoDialog">信息提示</button>
          <button class="demo-button" @click="showSuccessDialog">成功提示</button>
          <button class="demo-button" @click="showWarningDialog">警告提示</button>
          <button class="demo-button" @click="showErrorDialog">错误提示</button>
        </view>

        <view class="demo-section">
          <view class="section-title">其他配置</view>
          <button class="demo-button" @click="showNoTitleDialog">无标题</button>
          <button class="demo-button" @click="showNoCancelDialog">仅确认按钮</button>
          <button class="demo-button" @click="showCustomTextDialog">自定义按钮文字</button>
        </view>
      </view>
    </scroll-view>

    <!-- Dialog 组件 -->
    <TdDialog
      v-model:visible="dialogVisible"
      :title="dialogConfig.title"
      :content="dialogConfig.content"
      :theme="dialogConfig.theme"
      :confirm-text="dialogConfig.confirmText"
      :cancel-text="dialogConfig.cancelText"
      :show-cancel="dialogConfig.showCancel"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';
import TdDialog from '@/components/tdesign/TdDialog.vue';

const dialogVisible = ref(false);
const dialogConfig = reactive({
  title: '',
  content: '',
  theme: 'default' as 'default' | 'info' | 'success' | 'warning' | 'error',
  confirmText: '确认',
  cancelText: '取消',
  showCancel: true,
});

// 基础弹窗
const showBasicDialog = () => {
  dialogConfig.title = '提示';
  dialogConfig.content = '这是一个基础的确认弹窗';
  dialogConfig.theme = 'default';
  dialogConfig.confirmText = '确认';
  dialogConfig.cancelText = '取消';
  dialogConfig.showCancel = true;
  dialogVisible.value = true;
};

// 取消预约确认
const showCancelDialog = () => {
  dialogConfig.title = '取消预约';
  dialogConfig.content = '确定要取消预约吗？\n取消后将无法恢复';
  dialogConfig.theme = 'warning';
  dialogConfig.confirmText = '确认取消';
  dialogConfig.cancelText = '我再想想';
  dialogConfig.showCancel = true;
  dialogVisible.value = true;
};

// 信息提示
const showInfoDialog = () => {
  dialogConfig.title = '信息提示';
  dialogConfig.content = '这是一条信息提示';
  dialogConfig.theme = 'info';
  dialogConfig.confirmText = '知道了';
  dialogConfig.cancelText = '取消';
  dialogConfig.showCancel = true;
  dialogVisible.value = true;
};

// 成功提示
const showSuccessDialog = () => {
  dialogConfig.title = '操作成功';
  dialogConfig.content = '您的操作已成功完成';
  dialogConfig.theme = 'success';
  dialogConfig.confirmText = '确认';
  dialogConfig.cancelText = '取消';
  dialogConfig.showCancel = true;
  dialogVisible.value = true;
};

// 警告提示
const showWarningDialog = () => {
  dialogConfig.title = '警告';
  dialogConfig.content = '此操作存在风险，请谨慎操作';
  dialogConfig.theme = 'warning';
  dialogConfig.confirmText = '继续';
  dialogConfig.cancelText = '取消';
  dialogConfig.showCancel = true;
  dialogVisible.value = true;
};

// 错误提示
const showErrorDialog = () => {
  dialogConfig.title = '操作失败';
  dialogConfig.content = '操作失败，请稍后重试';
  dialogConfig.theme = 'error';
  dialogConfig.confirmText = '重试';
  dialogConfig.cancelText = '取消';
  dialogConfig.showCancel = true;
  dialogVisible.value = true;
};

// 无标题
const showNoTitleDialog = () => {
  dialogConfig.title = '';
  dialogConfig.content = '这是一个没有标题的弹窗';
  dialogConfig.theme = 'default';
  dialogConfig.confirmText = '确认';
  dialogConfig.cancelText = '取消';
  dialogConfig.showCancel = true;
  dialogVisible.value = true;
};

// 仅确认按钮
const showNoCancelDialog = () => {
  dialogConfig.title = '提示';
  dialogConfig.content = '这个弹窗只有确认按钮';
  dialogConfig.theme = 'default';
  dialogConfig.confirmText = '知道了';
  dialogConfig.cancelText = '取消';
  dialogConfig.showCancel = false;
  dialogVisible.value = true;
};

// 自定义按钮文字
const showCustomTextDialog = () => {
  dialogConfig.title = '删除确认';
  dialogConfig.content = '确定要删除这条记录吗？';
  dialogConfig.theme = 'error';
  dialogConfig.confirmText = '删除';
  dialogConfig.cancelText = '保留';
  dialogConfig.showCancel = true;
  dialogVisible.value = true;
};

// 确认回调
const handleConfirm = () => {
  console.log('用户点击了确认');
  uni.showToast({
    title: '已确认',
    icon: 'success',
  });
};

// 取消回调
const handleCancel = () => {
  console.log('用户点击了取消');
  uni.showToast({
    title: '已取消',
    icon: 'none',
  });
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
}

.demo-section {
  margin-bottom: 48rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 24rpx;
}

.demo-button {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 2rpx solid $td-border-level-1;
  border-radius: $td-radius-default;
  font-size: 28rpx;
  color: $td-text-color-primary;
  margin-bottom: 16rpx;

  &:active {
    background-color: $td-bg-color-container-active;
  }

  &:last-child {
    margin-bottom: 0;
  }
}
</style>


