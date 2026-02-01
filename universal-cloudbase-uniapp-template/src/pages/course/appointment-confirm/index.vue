<template>
  <view class="page-container">
    <TdPageHeader title="预约确认" :showBack="true" />

    <scroll-view scroll-y class="scroll-area">
      <view class="page-content">
        <!-- 课程信息 -->
        <view class="section-title section-title--simple">📚 课程信息</view>
        <view class="t-card t-card--bordered">
          <view class="t-card__body">
            <view class="info-title">{{ courseInfo.courseName }} 第{{ courseInfo.period }}期</view>
            <view class="info-details">
              <view class="info-item">📅 {{ courseInfo.startDate }} 至 {{ courseInfo.endDate }}</view>
              <view class="info-item">📍 {{ courseInfo.location }}</view>
            </view>
          </view>
        </view>

        <!-- 预约信息 -->
        <view class="section-title section-title--simple">👤 预约信息</view>
        <view class="t-card t-card--bordered">
          <view class="t-card__body">
            <!-- 真实姓名 -->
            <view class="t-form-item">
              <view class="t-form-item__label t-form-item__label--required">
                <text class="t-form-item__label-text">真实姓名</text>
              </view>
              <view class="t-form-item__control">
                <view class="t-input t-input--default">
                  <input
                    class="t-input__inner"
                    type="text"
                    placeholder="请输入真实姓名"
                    v-model="formData.realName"
                  />
                </view>
              </view>
            </view>

            <!-- 手机号 -->
            <view class="t-form-item">
              <view class="t-form-item__label t-form-item__label--required">
                <text class="t-form-item__label-text">手机号</text>
              </view>
              <view class="t-form-item__control">
                <view class="t-input t-input--default">
                  <input
                    class="t-input__inner"
                    type="number"
                    placeholder="请输入手机号"
                    v-model="formData.phone"
                  />
                </view>
              </view>
            </view>

            <!-- 电子邮箱 -->
            <view class="t-form-item">
              <view class="t-form-item__label">
                <text class="t-form-item__label-text">电子邮箱</text>
              </view>
              <view class="t-form-item__control">
                <view class="t-input t-input--default">
                  <input
                    class="t-input__inner"
                    type="text"
                    placeholder="选填"
                    v-model="formData.email"
                  />
                </view>
              </view>
            </view>

            <!-- 备注 -->
            <view class="t-form-item">
              <view class="t-form-item__label">
                <text class="t-form-item__label-text">备注</text>
              </view>
              <view class="t-form-item__control">
                <view class="t-textarea">
                  <textarea
                    class="t-textarea__inner"
                    placeholder="选填，如有特殊需求请备注"
                    v-model="formData.remark"
                    maxlength="200"
                  ></textarea>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 温馨提示 -->
        <view class="tips-card">
          <view class="tips-title">📝 温馨提示</view>
          <view class="tips-content">
            <view class="tips-item">1. 请确保填写的信息真实准确，以便后续联系</view>
            <view class="tips-item">2. 预约成功后，工作人员会在3个工作日内与您联系</view>
            <view class="tips-item">3. 如有疑问，请联系客服：400-123-4567</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 固定底部按钮 -->
    <view class="fixed-bottom">
      <button
        class="t-button t-button--theme-light t-button--variant-base t-button--block t-button--size-large"
        @click="handleSubmit"
      >
        <span class="t-button__text">确认预约</span>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, getCurrentInstance } from 'vue';
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue';

// 课程信息（Mock）
const courseInfo = ref({
  courseName: '初探班',
  period: 12,
  startDate: '2024-02-01',
  endDate: '2024-02-03',
  location: '北京市朝阳区',
});

// 表单数据
const formData = ref({
  realName: '',
  phone: '',
  email: '',
  remark: '',
});

// 页面加载时获取排期信息
onMounted(() => {
  const instance = getCurrentInstance();
  const scheduleId = (instance?.proxy as any)?.$route?.query?.scheduleId;
  if (scheduleId) {
    console.log('加载排期信息:', scheduleId);
    // TODO: 根据scheduleId获取课程排期详情
  }
});

// 提交预约
const handleSubmit = () => {
  // 验证必填项
  if (!formData.value.realName) {
    uni.showToast({
      title: '请输入真实姓名',
      icon: 'none',
    });
    return;
  }

  if (!formData.value.phone) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none',
    });
    return;
  }

  // 验证手机号格式
  const phoneReg = /^1[3-9]\d{9}$/;
  if (!phoneReg.test(formData.value.phone)) {
    uni.showToast({
      title: '手机号格式不正确',
      icon: 'none',
    });
    return;
  }

  console.log('提交预约:', formData.value);

  // TODO: 调用预约接口
  uni.showToast({
    title: '预约成功',
    icon: 'success',
    duration: 2000,
  });

  setTimeout(() => {
    uni.navigateBack();
  }, 2000);
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
}

// 信息标题和详情样式
.info-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $td-text-color-primary;
  margin-bottom: 16rpx;
}

.info-details {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-item {
  font-size: 28rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 表单项样式
.t-form-item {
  margin-bottom: 32rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.t-form-item__label {
  font-size: 28rpx;
  color: $td-text-color-primary;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;

  &--required::before {
    content: '*';
    color: $td-error-color;
    margin-right: 8rpx;
  }
}

.t-input {
  border: 2rpx solid $td-border-level-1;
  border-radius: var(--td-radius-default);
  padding: 24rpx 32rpx;
  background-color: white;

  &:focus-within {
    border-color: $td-brand-color;
  }
}

.t-input__inner {
  font-size: 28rpx;
  color: $td-text-color-primary;
  line-height: 1.5;
}

.t-textarea {
  border: 2rpx solid $td-border-level-1;
  border-radius: var(--td-radius-default);
  padding: 24rpx 32rpx;
  background-color: white;
  min-height: 200rpx;

  &:focus-within {
    border-color: $td-brand-color;
  }
}

.t-textarea__inner {
  font-size: 28rpx;
  color: $td-text-color-primary;
  line-height: 1.5;
  width: 100%;
  min-height: 160rpx;
}

// 温馨提示样式
.tips-card {
  margin-top: 32rpx;
  background-color: $td-warning-color-light;
  border-radius: var(--td-radius-default);
  padding: 32rpx;
}

.tips-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $td-warning-color;
  margin-bottom: 16rpx;
}

.tips-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.tips-item {
  font-size: 24rpx;
  color: $td-text-color-secondary;
  line-height: 1.6;
}

// 固定底部按钮
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

.t-button {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--td-radius-default);
  border: none;

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

  &--block {
    width: 100%;
  }
}
</style>
