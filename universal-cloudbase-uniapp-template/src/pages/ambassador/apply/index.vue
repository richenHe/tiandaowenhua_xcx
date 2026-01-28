<template>
  <view class="page">
    <td-page-header title="申请传播大使" />
    
    <scroll-view 
      class="scroll-area" 
      scroll-y 
      :style="{ height: scrollHeight }"
    >
      <view class="page-content">
        
        <!-- 申请条件提示 -->
        <view class="alert-box info">
          <view class="alert-icon">ℹ️</view>
          <view class="alert-content">
            <view class="alert-title">申请条件</view>
            <view class="alert-message">
              • 已购买密训班课程<br/>
              • 认可孙膑道天道文化价值<br/>
              • 愿意花时间帮助他人<br/>
              • 通过面试审核
            </view>
          </view>
        </view>

        <!-- 基本信息 -->
        <view class="section-title">📝 基本信息</view>
        
        <view class="form-item">
          <view class="form-label required">真实姓名</view>
          <input class="form-input" v-model="formData.name" placeholder="请输入真实姓名" />
        </view>

        <view class="form-item">
          <view class="form-label required">手机号</view>
          <input class="form-input" v-model="formData.phone" type="number" placeholder="请输入手机号" />
        </view>

        <view class="form-item">
          <view class="form-label required">微信号</view>
          <input class="form-input" v-model="formData.wechat" placeholder="请输入微信号" />
        </view>

        <view class="form-item">
          <view class="form-label required">所在城市</view>
          <input class="form-input" v-model="formData.city" placeholder="请输入所在城市" />
        </view>

        <view class="form-item">
          <view class="form-label required">职业</view>
          <input class="form-input" v-model="formData.occupation" placeholder="请输入职业" />
        </view>

        <!-- 申请说明 -->
        <view class="section-title" style="margin-top: 48rpx;">💬 申请说明</view>

        <view class="form-item">
          <view class="form-label required">为什么想成为传播大使</view>
          <textarea 
            class="form-textarea" 
            v-model="formData.reason" 
            placeholder="请分享您的想法和动机..."
            :maxlength="500"
          />
        </view>

        <view class="form-item">
          <view class="form-label required">如何理解天道文化</view>
          <textarea 
            class="form-textarea" 
            v-model="formData.understanding" 
            placeholder="请分享您对天道文化的理解..."
            :maxlength="500"
          />
        </view>

        <view class="form-item">
          <view class="form-label required">是否愿意花时间帮助他人</view>
          <picker mode="selector" :range="willingnessOptions" @change="onWillingnessChange">
            <view class="form-picker">
              <text :class="{ placeholder: !formData.willingness }">
                {{ formData.willingness || '请选择' }}
              </text>
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <view class="form-item">
          <view class="form-label required">预期推广计划</view>
          <textarea 
            class="form-textarea" 
            v-model="formData.plan" 
            placeholder="请描述您的推广计划和目标..."
            :maxlength="500"
          />
        </view>

        <!-- 申请须知 -->
        <view class="alert-box warning">
          <view class="alert-icon">⚠️</view>
          <view class="alert-content">
            <view class="alert-title">申请须知</view>
            <view class="alert-message">
              1. 提交申请后，我们将在3个工作日内进行初审<br/>
              2. 初审通过后，将安排面试时间<br/>
              3. 面试通过后，即可成为准青鸾大使<br/>
              4. 准青鸾推荐1个初探班后自动升级为青鸾大使
            </view>
          </view>
        </view>

        <!-- 底部留白 -->
        <view style="height: 200rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="fixed-bottom">
      <button class="submit-btn" @tap="handleSubmit">提交申请</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

const scrollHeight = computed(() => {
  return 'calc(100vh - var(--status-bar-height) - var(--td-page-header-height) - 120rpx)'
})

const formData = ref({
  name: '',
  phone: '',
  wechat: '',
  city: '',
  occupation: '',
  reason: '',
  understanding: '',
  willingness: '',
  plan: ''
})

const willingnessOptions = ['非常愿意', '愿意', '看情况', '不太愿意']

const onWillingnessChange = (e: any) => {
  formData.value.willingness = willingnessOptions[e.detail.value]
}

const handleSubmit = () => {
  // 验证表单
  if (!formData.value.name) {
    uni.showToast({ title: '请输入真实姓名', icon: 'none' })
    return
  }
  if (!formData.value.phone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }
  if (!formData.value.wechat) {
    uni.showToast({ title: '请输入微信号', icon: 'none' })
    return
  }
  if (!formData.value.city) {
    uni.showToast({ title: '请输入所在城市', icon: 'none' })
    return
  }
  if (!formData.value.occupation) {
    uni.showToast({ title: '请输入职业', icon: 'none' })
    return
  }
  if (!formData.value.reason) {
    uni.showToast({ title: '请填写申请原因', icon: 'none' })
    return
  }
  if (!formData.value.understanding) {
    uni.showToast({ title: '请填写对天道文化的理解', icon: 'none' })
    return
  }
  if (!formData.value.willingness) {
    uni.showToast({ title: '请选择是否愿意帮助他人', icon: 'none' })
    return
  }
  if (!formData.value.plan) {
    uni.showToast({ title: '请填写推广计划', icon: 'none' })
    return
  }

  // 提交成功
  uni.showToast({
    title: '申请已提交',
    icon: 'success',
    duration: 2000
  })
  
  setTimeout(() => {
    uni.navigateBack()
  }, 2000)
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

.alert-box {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 48rpx;
  display: flex;
  gap: 16rpx;
  
  &.info {
    background: #E6F4FF;
  }
  
  &.warning {
    background: #FFF4E5;
  }
}

.alert-icon {
  font-size: 32rpx;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 12rpx;
}

.alert-message {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.form-item {
  margin-bottom: 32rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  
  &.required::before {
    content: '*';
    color: #E34D59;
    margin-right: 8rpx;
  }
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  border: 2rpx solid #E5E5E5;
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  border: 2rpx solid #E5E5E5;
  box-sizing: border-box;
}

.form-picker {
  width: 100%;
  height: 88rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  border: 2rpx solid #E5E5E5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .placeholder {
    color: #999;
  }
  
  .picker-arrow {
    font-size: 20rpx;
    color: #999;
  }
}

.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: #E6F4FF;
  color: #0052D9;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  
  &::after {
    border: none;
  }
}
</style>

