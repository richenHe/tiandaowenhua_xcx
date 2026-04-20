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
              <!-- 加载中 -->
              <view v-if="coursesLoading" class="t-select">
                <view class="t-select__input">
                  <text class="t-select__value placeholder">加载中…</text>
                </view>
              </view>
              <!-- 有课程时用 picker，无课程时点击提示 -->
              <picker
                v-else-if="courses.length > 0"
                :range="courseNames"
                :value="selectedCourseIndex"
                @change="handleCoursePickerChange"
              >
                <view class="t-select">
                  <view class="t-select__input">
                    <text class="t-select__value" :class="{ 'placeholder': !formData.courseName }">
                      {{ formData.courseName || '选择课程（选填）' }}
                    </text>
                    <text class="t-select__arrow">▼</text>
                  </view>
                </view>
              </picker>
              <view v-else class="t-select" @click="handleSelectCourse">
                <view class="t-select__input">
                  <text class="t-select__value placeholder">选择课程（选填）</text>
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
              <picker
                :range="feedbackTypeNames"
                :value="selectedTypeIndex"
                @change="handleTypePickerChange"
              >
                <view class="t-select">
                  <view class="t-select__input">
                    <text class="t-select__value">{{ formData.typeLabel }}</text>
                    <text class="t-select__arrow">▼</text>
                  </view>
                </view>
              </picker>
              <view class="t-form-item__tips">
                请选择反馈类型
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
                  v-for="(imageUrl, index) in formData.imageUrls" 
                  :key="index"
                  class="image-item"
                >
                  <image :src="imageUrl" mode="aspectFill" class="image-preview" />
                  <view class="image-delete" @click="handleDeleteImage(index)">×</view>
                </view>
                <view 
                  v-if="formData.imageUrls.length < 3"
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
import { ref, computed, onMounted } from 'vue'
import TdPageHeader from '@/components/tdesign/TdPageHeader.vue'
import { SystemApi } from '@/api'
import StorageApi, { StoragePathHelper } from '@/api/modules/storage'
import type { FeedbackType, FeedbackCourse } from '@/api/types/system'

// 表单数据
const formData = ref({
  courseId: undefined as number | undefined,
  courseName: '',
  typeValue: 2, // 默认功能建议
  typeLabel: '功能建议',
  content: '',
  images: [] as string[], // 存储 fileID
  imageUrls: [] as string[], // 存储临时 URL（用于显示）
  contact: ''
})

// 可选课程列表
const courses = ref<FeedbackCourse[]>([])
const coursesLoading = ref(true)

// picker 用的课程名称数组（不受 showActionSheet 6 条上限限制）
const courseNames = computed(() => courses.value.map(c => c.name))

// 当前选中课程在列表中的索引（用于 picker 回显）
const selectedCourseIndex = computed(() => {
  if (!formData.value.courseId) return 0
  const idx = courses.value.findIndex(c => c.id === formData.value.courseId)
  return idx >= 0 ? idx : 0
})

// 默认反馈类型（本地兜底，防止接口未实现或返回非数组时报错）
const DEFAULT_FEEDBACK_TYPES: FeedbackType[] = [
  { value: 1, label: 'Bug反馈', icon: 'bug' },
  { value: 2, label: '功能建议', icon: 'light' },
  { value: 3, label: '内容问题', icon: 'content' },
  { value: 4, label: '服务投诉', icon: 'service' },
  { value: 5, label: '其他', icon: 'other' }
]

// 反馈类型列表（初始化为默认值，接口成功后覆盖）
const feedbackTypes = ref<FeedbackType[]>([...DEFAULT_FEEDBACK_TYPES])

onMounted(() => {
  loadFeedbackTypes()
  loadFeedbackCourses()
})

// 加载反馈类型
const loadFeedbackTypes = async () => {
  try {
    const result = await SystemApi.getFeedbackTypes()
    // 防御性赋值：只有返回数组且非空时才覆盖默认值
    if (Array.isArray(result) && result.length > 0) {
      feedbackTypes.value = result
    }
  } catch (error) {
    console.error('获取反馈类型失败，使用默认类型:', error)
  }
}

// 加载可反馈的课程
const loadFeedbackCourses = async () => {
  coursesLoading.value = true
  try {
    const result = await SystemApi.getFeedbackCourses()
    courses.value = Array.isArray(result) ? result : []
  } catch (error) {
    console.error('获取课程列表失败:', error)
    courses.value = []
  } finally {
    coursesLoading.value = false
  }
}

// picker 选择课程（支持任意数量课程，不受 showActionSheet 6 条上限限制）
const handleCoursePickerChange = (e: any) => {
  const index = Number(e.detail.value)
  const selectedCourse = courses.value[index]
  if (selectedCourse) {
    formData.value.courseId = selectedCourse.id
    formData.value.courseName = selectedCourse.name
  }
}

// 无课程时点击提示（courses 为空时的兜底）
const handleSelectCourse = () => {
  uni.showToast({
    title: '暂无可选课程',
    icon: 'none'
  })
}

// picker 用的反馈类型名称数组
const feedbackTypeNames = computed(() => feedbackTypes.value.map(t => t.label))

// 当前选中类型在列表中的索引
const selectedTypeIndex = computed(() => {
  const idx = feedbackTypes.value.findIndex(t => t.value === formData.value.typeValue)
  return idx >= 0 ? idx : 0
})

// picker 选择反馈类型
const handleTypePickerChange = (e: any) => {
  const index = Number(e.detail.value)
  const selectedType = feedbackTypes.value[index]
  if (selectedType) {
    formData.value.typeValue = selectedType.value
    formData.value.typeLabel = selectedType.label
  }
}

// 上传图片
const handleUploadImage = () => {
  uni.chooseImage({
    count: 3 - formData.value.imageUrls.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        // 先显示本地预览图片
        res.tempFilePaths.forEach(tempPath => {
          formData.value.imageUrls.push(tempPath)
        })
        
        uni.showLoading({ title: '上传中...', mask: true })
        
        // 逐个上传图片到云存储
        for (let i = 0; i < res.tempFilePaths.length; i++) {
          const tempFilePath = res.tempFilePaths[i]
          
          // 生成云存储路径
          const timestamp = Date.now() + i
          const ext = tempFilePath.substring(tempFilePath.lastIndexOf('.'))
          const cloudPath = `feedbacks/images/temp_${timestamp}${ext}`
          
          console.log('开始上传图片:', cloudPath)
          
          // 上传到云存储
          const uploadResult = await StorageApi.uploadFile({ cloudPath, filePath: tempFilePath })
          
          console.log('上传成功，fileID:', uploadResult.fileID)
          
          // 保存 fileID
          formData.value.images.push(uploadResult.fileID)
        }
        
        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '上传失败，请重试', icon: 'none' })
        console.error('上传图片失败:', error)
        
        // 上传失败时，移除本次添加的预览图
        formData.value.imageUrls.splice(formData.value.imageUrls.length - res.tempFilePaths.length)
      }
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    }
  })
}

// 删除图片
const handleDeleteImage = async (index: number) => {
  try {
    // 删除云存储文件
    const fileID = formData.value.images[index]
    if (fileID) {
      await StorageApi.deleteFile([fileID])
    }
    
    // 删除本地引用
    formData.value.images.splice(index, 1)
    formData.value.imageUrls.splice(index, 1)
    
    uni.showToast({ title: '删除成功', icon: 'success' })
  } catch (error) {
    console.error('删除图片失败:', error)
    // 即使删除云存储失败，也删除本地引用
    formData.value.images.splice(index, 1)
    formData.value.imageUrls.splice(index, 1)
  }
}

// 提交反馈
const handleSubmit = async () => {
  if (!formData.value.content.trim()) {
    uni.showToast({
      title: '请填写反馈内容',
      icon: 'none'
    })
    return
  }

  if (formData.value.content.length < 5) {
    uni.showToast({
      title: '反馈内容至少5个字',
      icon: 'none'
    })
    return
  }

  try {
    await SystemApi.submitFeedback({
      feedbackType: formData.value.typeValue, // 驼峰命名
      courseId: formData.value.courseId, // 驼峰命名
      content: formData.value.content,
      images: formData.value.images.length > 0 ? formData.value.images : undefined,
      contact: formData.value.contact || undefined
    })

    uni.showToast({
      title: '提交成功',
      icon: 'success'
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('提交反馈失败:', error)
  }
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
  border-radius: $td-radius-round;
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

