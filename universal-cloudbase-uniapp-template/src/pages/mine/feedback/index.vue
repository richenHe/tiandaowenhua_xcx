<template>
  <view class="page-container">
    <TdPageHeader title="意见反馈" :showBack="true" />

    <scroll-view class="scroll-content" scroll-y>
      <view class="page-content">
        <view class="t-form">
          <!-- 反馈课程 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text class="t-form-item__label-text">反馈课程</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-select" @click="handleSelectCourse">
                <view class="t-select__input">
                  <text class="t-select__value" :class="{ 'placeholder': !formData.course }">
                    {{ formData.course || '选择课程（选填）' }}
                  </text>
                  <text class="t-select__arrow">▼</text>
                </view>
              </view>
              <view class="t-form-item__tips">
                从"我的课程"中选择，或留空为通用反馈
              </view>
            </view>
          </view>

          <!-- 反馈类型 -->
          <view class="t-form-item">
            <view class="t-form-item__label t-form-item__label--required">
              <text class="t-form-item__label-text">反馈类型</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-select" @click="handleSelectType">
                <view class="t-select__input">
                  <text class="t-select__value">{{ formData.type }}</text>
                  <text class="t-select__arrow">▼</text>
                </view>
              </view>
              <view class="t-form-item__tips">
                选择课程后：课程内容/课程服务/讲师/场地<br>
                未选课程：功能建议/问题反馈/投诉
              </view>
            </view>
          </view>

          <!-- 反馈内容 -->
          <view class="t-form-item">
            <view class="t-form-item__label t-form-item__label--required">
              <text class="t-form-item__label-text">反馈内容</text>
            </view>
            <view class="t-form-item__control">
              <textarea 
                class="t-textarea"
                v-model="formData.content"
                placeholder="请详细描述您的问题或建议..."
                :maxlength="500"
              />
            </view>
          </view>

          <!-- 上传截图 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text class="t-form-item__label-text">上传截图</text>
            </view>
            <view class="t-form-item__control">
              <view class="image-upload">
                <view 
                  v-for="(image, index) in formData.images" 
                  :key="index"
                  class="image-item"
                >
                  <image :src="image" mode="aspectFill" class="image-preview" />
                  <view class="image-delete" @click="handleDeleteImage(index)">×</view>
                </view>
                <view 
                  v-if="formData.images.length < 3"
                  class="image-upload-btn"
                  @click="handleUploadImage"
                >
                  <text class="upload-icon">+</text>
                </view>
              </view>
              <view class="t-form-item__tips">
                最多上传3张图片
              </view>
            </view>
          </view>

          <!-- 联系方式 -->
          <view class="t-form-item">
            <view class="t-form-item__label">
              <text class="t-form-item__label-text">联系方式</text>
            </view>
            <view class="t-form-item__control">
              <view class="t-input-wrapper">
                <input 
                  class="t-input"
                  v-model="formData.contact"
                  type="text"
                  placeholder="方便我们与您联系（选填）"
                />
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部留白 -->
      <view class="bottom-spacing"></view>
    </scroll-view>

    <!-- 固定底部按钮 -->
    <view class="fixed-bottom">
      <button class="t-button t-button--primary t-button--block t-button--large" @click="handleSubmit">
        <text class="t-button__text">提交反馈</text>
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'

// 表单数据
const formData = ref({
  course: '',
  type: '功能建议',
  content: '',
  images: [] as string[],
  contact: ''
})

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 选择课程
const handleSelectCourse = () => {
  uni.showActionSheet({
    itemList: ['初探班', '密训班', '深研班'],
    success: (res) => {
      const courses = ['初探班', '密训班', '深研班']
      formData.value.course = courses[res.tapIndex]
    }
  })
}

// 选择反馈类型
const handleSelectType = () => {
  const itemList = formData.value.course 
    ? ['课程内容', '课程服务', '讲师', '场地']
    : ['功能建议', '问题反馈', '投诉']
  
  uni.showActionSheet({
    itemList,
    success: (res) => {
      formData.value.type = itemList[res.tapIndex]
    }
  })
}

// 上传图片
const handleUploadImage = () => {
  uni.chooseImage({
    count: 3 - formData.value.images.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      formData.value.images.push(...res.tempFilePaths)
    }
  })
}

// 删除图片
const handleDeleteImage = (index: number) => {
  formData.value.images.splice(index, 1)
}

// 提交反馈
const handleSubmit = () => {
  if (!formData.value.content.trim()) {
    uni.showToast({
      title: '请填写反馈内容',
      icon: 'none'
    })
    return
  }

  uni.showToast({
    title: '提交成功',
    icon: 'success'
  })

  setTimeout(() => {
    uni.navigateBack()
  }, 1500)
}
</script>

<style lang="scss" scoped>
@import '@/styles/tdesign-vars.scss';

.page-container {
  min-height: 100vh;
  background-color: $td-bg-color-page;
}

// 滚动内容
.scroll-content {
  height: calc(100vh - var(--td-page-header-height));
}

.page-content {
  padding: 32rpx;
}

// 表单样式
.t-form {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.t-form-item {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.t-form-item__label {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.t-form-item__label--required::before {
  content: '*';
  color: $td-error-color;
  font-size: 28rpx;
}

.t-form-item__label-text {
  font-size: 28rpx;
  color: $td-text-color-primary;
  font-weight: 500;
}

.t-form-item__control {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

// 选择器
.t-select {
  background-color: #FFFFFF;
  border-radius: $td-radius-default;
  border: 1px solid $td-border-level-1;
}

.t-select__input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
}

.t-select__value {
  font-size: 28rpx;
  color: $td-text-color-primary;
  flex: 1;
}

.t-select__value.placeholder {
  color: $td-text-color-placeholder;
}

.t-select__arrow {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
}

// 文本域
.t-textarea {
  width: 100%;
  min-height: 240rpx;
  padding: 24rpx;
  background-color: #FFFFFF;
  border: 1px solid $td-border-level-1;
  border-radius: $td-radius-default;
  font-size: 28rpx;
  color: $td-text-color-primary;
  line-height: 1.6;
}

// 输入框包装器
.t-input-wrapper {
  background-color: #FFFFFF;
  border: 1px solid $td-border-level-1;
  border-radius: $td-radius-default;
  padding: 24rpx;
}

// 输入框
.t-input {
  width: 100%;
  font-size: 28rpx;
  color: $td-text-color-primary;
  border: none;
  outline: none;
}

// 图片上传
.image-upload {
  display: flex;
  gap: 24rpx;
  flex-wrap: wrap;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border-radius: $td-radius-default;
  overflow: hidden;
}

.image-preview {
  width: 100%;
  height: 100%;
}

.image-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 48rpx;
  height: 48rpx;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 40rpx;
  line-height: 1;
}

.image-upload-btn {
  width: 200rpx;
  height: 200rpx;
  border: 2px dashed $td-border-level-2;
  border-radius: $td-radius-default;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FFFFFF;
}

.upload-icon {
  font-size: 64rpx;
  color: $td-text-color-placeholder;
}

// 提示文本
.t-form-item__tips {
  font-size: 24rpx;
  color: $td-text-color-placeholder;
  line-height: 1.6;
}

// 底部留白
.bottom-spacing {
  height: 300rpx;
}

// 固定底部
.fixed-bottom {
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background-color: #FFFFFF;
  border-top: 1px solid $td-border-level-0;
}

// 按钮样式
.t-button {
  border: none;
  border-radius: $td-radius-default;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &::after {
    border: none;
  }
}

.t-button--primary {
  background-color: #E6F4FF;
  color: $td-brand-color;
}

.t-button--block {
  width: 100%;
}

.t-button--large {
  height: 96rpx;
  line-height: 96rpx;
}

.t-button__text {
  font-size: 32rpx;
}
</style>

