# 云存储接入完整指南

> 适用于前端小程序（UniApp）和 Web 后台管理系统  
> 文档版本：v1.0  
> 更新日期：2026-02-13

---

## 📋 目录

1. [概述](#概述)
2. [小程序端接入](#小程序端接入)
3. [Web 后台接入](#web-后台接入)
4. [云函数处理](#云函数处理)
5. [常见问题](#常见问题)
6. [最佳实践](#最佳实践)

---

## 概述

### 云存储字段类型

根据 `docs/database/数据库详细信息.md`，项目中云存储字段分为三类：

| 类型 | 数据库存储 | 示例字段 |
|------|-----------|---------|
| **单个文件** | `varchar(255)` - 存储 fileID | `users.avatar`, `courses.cover_image` |
| **多个文件** | `json` - 存储 fileID 数组 | `feedbacks.images`, `academy_cases.images` |
| **富文本图片** | `text` - HTML 中包含图片 URL | `courses.content` |

### 核心原则

1. ✅ **数据库存储 fileID**（如 `cloud://xxx.xxx`）
2. ✅ **显示前转换为临时 URL**（有效期 1 小时）
3. ✅ **上传时使用标准化路径**（参考 `docs/database/数据库详细信息.md` 云存储字段汇总）
4. ✅ **删除/替换时清理旧文件**

---

## 小程序端接入

### 1. 初始化

已在 `src/utils/cloudbase.ts` 中完成：

```typescript
import cloudbase from '@cloudbase/js-sdk'
import adapterUni from '@cloudbase/adapter-uni-app'

const app = cloudbase.init({
  env: import.meta.env.VITE_ENV_ID,
  adapter: adapterUni
})

export { app }
```

### 2. 上传文件

**位置**：`src/api/modules/storage.ts`

#### 方法 1：直接上传（推荐用于简单场景）

```typescript
import { app } from '@/utils/cloudbase'
import { StoragePathHelper } from '@/utils/storage-path'

// 单图上传示例
const uploadAvatar = async () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      const userInfo = uni.getStorageSync('userInfo')
      
      // 生成云存储路径
      const cloudPath = StoragePathHelper.userAvatar(userInfo.uid, filePath)
      
      // 上传到云存储
      const result = await StorageApi.uploadFile({ cloudPath, filePath })
      
      // result.fileID 就是要保存到数据库的值
      console.log('上传成功，fileID:', result.fileID)
    }
  })
}
```

#### 方法 2：通过云函数上传（适用于小程序环境兼容性问题）

```typescript
// StorageApi.uploadFile 内部实现
static async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
  try {
    // 读取文件为 base64
    const fileSystem = uni.getFileSystemManager()
    const fileContent = await new Promise<string>((resolve, reject) => {
      fileSystem.readFile({
        filePath: options.filePath,
        encoding: 'base64',
        success: (res: any) => resolve(res.data),
        fail: reject
      })
    })

    // 通过云函数上传
    const result = await callCloudFunction<{ fileID: string; tempFileURL: string }>({
      name: 'system',
      action: 'uploadFile',
      data: {
        cloudPath: options.cloudPath,
        fileContent
      },
      showLoading: false
    })

    return {
      fileID: result.fileID,
      tempFileURL: result.tempFileURL || result.fileID
    }
  } catch (error) {
    console.error('上传文件失败:', error)
    throw error
  }
}
```

### 3. 获取临时 URL

```typescript
// 单个文件
const tempURL = await StorageApi.getSingleTempFileURL(fileID)

// 批量文件
const tempURLs = await StorageApi.getBatchTempFileURLs([fileID1, fileID2])
```

### 4. 删除文件

```typescript
await StorageApi.deleteFile([fileID])
```

### 5. 完整示例：用户头像上传

**文件**：`src/pages/mine/profile/index.vue`

```vue
<template>
  <button open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
    <image :src="formData.avatar" />
  </button>
</template>

<script setup lang="ts">
const formData = ref({
  avatar: '',           // 临时 URL（用于显示）
  avatarFileID: '',     // fileID（用于保存到数据库）
})

const onChooseAvatar = async (e: any) => {
  try {
    uni.showLoading({ title: '上传中...' })

    const tempPath = e.detail.avatarUrl
    const userInfoData = uni.getStorageSync('userInfo')
    
    // 生成云存储路径
    const timestamp = Date.now()
    const ext = tempPath.substring(tempPath.lastIndexOf('.')) || '.jpg'
    const cloudPath = `users/avatars/${userInfoData.uid}_${timestamp}${ext}`

    // 🔥 先删除旧文件
    if (formData.value.avatarFileID) {
      try {
        await StorageApi.deleteFile([formData.value.avatarFileID])
      } catch (err) {
        console.warn('删除旧头像失败:', err)
      }
    }

    // 🔥 上传新文件
    const result = await StorageApi.uploadFile({ cloudPath, filePath: tempPath })

    // 🔥 保存 fileID（重要！）
    formData.value.avatarFileID = result.fileID
    
    // 🔥 获取临时URL用于显示
    const tempURL = await StorageApi.getSingleTempFileURL(result.fileID)
    formData.value.avatar = tempURL

    uni.hideLoading()
    uni.showToast({ title: '上传成功', icon: 'success' })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({ title: '上传失败', icon: 'error' })
    console.error('上传头像失败:', error)
  }
}

// 🔥 保存时使用 fileID
const handleSave = async () => {
  await UserApi.updateProfile({
    avatar: formData.value.avatarFileID  // ⚠️ 使用 fileID，不是临时URL
  })
}

// 🔥 加载时转换为临时URL
const loadProfile = async () => {
  const profile = await UserApi.getProfile()
  
  if (profile.avatar) {
    formData.value.avatarFileID = profile.avatar  // 保存 fileID
    formData.value.avatar = await StorageApi.getSingleTempFileURL(profile.avatar)  // 显示临时URL
  }
}
</script>
```

### 6. 完整示例：多图上传（反馈图片）

**文件**：`src/pages/mine/feedback/index.vue`

```vue
<template>
  <view>
    <!-- 图片预览 -->
    <image
      v-for="(imageUrl, index) in formData.imageUrls"
      :key="index"
      :src="imageUrl"
      @click="handleDeleteImage(index)"
    />
    
    <!-- 上传按钮 -->
    <button @click="handleUploadImage" v-if="formData.imageUrls.length < 3">
      上传图片
    </button>
  </view>
</template>

<script setup lang="ts">
const formData = ref({
  images: [] as string[],        // fileID 数组（用于保存到数据库）
  imageUrls: [] as string[]      // 临时 URL 数组（用于显示）
})

const handleUploadImage = () => {
  uni.chooseImage({
    count: 3 - formData.value.imageUrls.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePaths = res.tempFilePaths
      
      // 🔥 立即显示本地预览
      formData.value.imageUrls.push(...tempFilePaths)

      uni.showLoading({ title: '上传中...' })
      try {
        const uploadPromises = tempFilePaths.map(async (filePath) => {
          const userInfoData = uni.getStorageSync('userInfo')
          const cloudPath = StoragePathHelper.feedbackImage(userInfoData.uid, filePath)
          const result = await StorageApi.uploadFile({ cloudPath, filePath })
          return result.fileID
        })
        
        const uploadedFileIDs = await Promise.all(uploadPromises)
        
        // 🔥 保存 fileIDs
        formData.value.images.push(...uploadedFileIDs)
        
        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'error' })
        
        // 上传失败时移除预览图
        formData.value.imageUrls.splice(
          formData.value.imageUrls.length - tempFilePaths.length,
          tempFilePaths.length
        )
      }
    }
  })
}

const handleDeleteImage = async (index: number) => {
  try {
    // 🔥 删除云存储文件
    const fileIDToDelete = formData.value.images[index]
    if (fileIDToDelete) {
      await StorageApi.deleteFile([fileIDToDelete])
    }
    
    // 🔥 删除本地引用
    formData.value.images.splice(index, 1)
    formData.value.imageUrls.splice(index, 1)
    
    uni.showToast({ title: '删除成功', icon: 'success' })
  } catch (error) {
    console.error('删除图片失败:', error)
  }
}

// 🔥 提交时使用 fileID 数组
const handleSubmit = async () => {
  await SystemApi.submitFeedback({
    images: formData.value.images.length > 0 ? formData.value.images : undefined
  })
}
</script>
```

---

## Web 后台接入

### 1. CloudBase 初始化

**位置**：`admin/assets/js/admin-api.js`（或新建 `admin/assets/js/cloudbase.js`）

```javascript
// 引入 CloudBase SDK
// 确保在 HTML 中已引入: <script src="../../assets/libs/tcb.js"></script>

// 初始化 CloudBase
const app = window.cloudbase.init({
  env: 'cloud1-0gnn3mn17b581124'  // 从 config.js 读取
})

// 认证
const auth = app.auth()

// 云存储
const storage = app.uploadFile.bind(app)
const getTempFileURL = app.getTempFileURL.bind(app)
const deleteFile = app.deleteFile.bind(app)

// 导出
window.CloudStorage = {
  app,
  auth,
  uploadFile: storage,
  getTempFileURL,
  deleteFile
}
```

### 2. 上传文件（Web）

#### HTML 模板

```html
<!-- 单图上传 -->
<div class="upload-container">
  <input 
    type="file" 
    id="imageUpload" 
    accept="image/*"
    @change="handleFileChange"
    style="display: none;"
  >
  <div v-if="!form.coverImage" class="upload-placeholder" @click="triggerUpload">
    <i class="t-icon t-icon-upload"></i>
    <p>点击上传封面</p>
  </div>
  <div v-else class="image-preview">
    <img :src="form.coverImageURL" alt="封面">
    <div class="image-actions">
      <button @click="triggerUpload" class="t-button t-button--ghost t-button--primary">
        更换
      </button>
      <button @click="removeImage" class="t-button t-button--ghost t-button--danger">
        删除
      </button>
    </div>
  </div>
</div>

<!-- 多图上传 -->
<div class="multi-upload-container">
  <div class="image-list">
    <div v-for="(img, index) in form.imagesURLs" :key="index" class="image-item">
      <img :src="img" alt="">
      <button @click="removeMultiImage(index)" class="remove-btn">
        <i class="t-icon t-icon-close"></i>
      </button>
    </div>
    <div v-if="form.imagesURLs.length < 5" class="upload-btn" @click="triggerMultiUpload">
      <i class="t-icon t-icon-add"></i>
    </div>
  </div>
  <input 
    type="file" 
    id="multiImageUpload" 
    accept="image/*"
    multiple
    @change="handleMultiFileChange"
    style="display: none;"
  >
</div>

<style>
.upload-container {
  margin-bottom: 16px;
}

.upload-placeholder {
  width: 200px;
  height: 200px;
  border: 2px dashed #dcdcdc;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-placeholder:hover {
  border-color: #0052d9;
  background: #f3f3f3;
}

.image-preview {
  position: relative;
  width: 200px;
}

.image-preview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}

.image-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.multi-upload-container .image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e34d59;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  width: 120px;
  height: 120px;
  border: 2px dashed #dcdcdc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 32px;
  color: #999;
}

.upload-btn:hover {
  border-color: #0052d9;
  color: #0052d9;
}
</style>
```

#### Vue 逻辑

```javascript
const { createApp } = Vue

createApp({
  data() {
    return {
      form: {
        // 单图字段
        coverImage: '',       // fileID（保存到数据库）
        coverImageURL: '',    // 临时 URL（用于显示）
        
        // 多图字段
        images: [],           // fileID 数组（保存到数据库）
        imagesURLs: []        // 临时 URL 数组（用于显示）
      },
      currentMaterialId: null  // 用于更新时删除旧文件
    }
  },
  
  methods: {
    // ========== 单图上传 ==========
    triggerUpload() {
      document.getElementById('imageUpload').click()
    },
    
    async handleFileChange(event) {
      const file = event.target.files[0]
      if (!file) return
      
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        this.$message.error('请选择图片文件')
        return
      }
      
      // 验证文件大小（限制 5MB）
      if (file.size > 5 * 1024 * 1024) {
        this.$message.error('图片大小不能超过 5MB')
        return
      }
      
      try {
        this.$message.loading('上传中...')
        
        // 🔥 生成云存储路径
        const timestamp = Date.now()
        const ext = file.name.substring(file.name.lastIndexOf('.'))
        const cloudPath = `academy/materials/poster/${this.currentMaterialId || 'new'}_${timestamp}${ext}`
        
        // 🔥 删除旧文件
        if (this.form.coverImage) {
          try {
            await window.CloudStorage.deleteFile({
              fileList: [this.form.coverImage]
            })
          } catch (err) {
            console.warn('删除旧文件失败:', err)
          }
        }
        
        // 🔥 上传新文件
        const uploadResult = await window.CloudStorage.uploadFile({
          cloudPath: cloudPath,
          filePath: file
        })
        
        const fileID = uploadResult.fileID
        
        // 🔥 保存 fileID
        this.form.coverImage = fileID
        
        // 🔥 获取临时 URL 用于显示
        const tempURLResult = await window.CloudStorage.getTempFileURL({
          fileList: [fileID]
        })
        
        this.form.coverImageURL = tempURLResult.fileList[0].tempFileURL
        
        this.$message.success('上传成功')
        
        // 清空 input
        event.target.value = ''
      } catch (error) {
        console.error('上传失败:', error)
        this.$message.error('上传失败：' + error.message)
      }
    },
    
    async removeImage() {
      try {
        // 🔥 删除云存储文件
        if (this.form.coverImage) {
          await window.CloudStorage.deleteFile({
            fileList: [this.form.coverImage]
          })
        }
        
        // 🔥 清空本地引用
        this.form.coverImage = ''
        this.form.coverImageURL = ''
        
        this.$message.success('删除成功')
      } catch (error) {
        console.error('删除失败:', error)
        this.$message.error('删除失败')
      }
    },
    
    // ========== 多图上传 ==========
    triggerMultiUpload() {
      document.getElementById('multiImageUpload').click()
    },
    
    async handleMultiFileChange(event) {
      const files = Array.from(event.target.files)
      if (!files.length) return
      
      // 检查数量限制
      if (this.form.images.length + files.length > 5) {
        this.$message.warning('最多只能上传 5 张图片')
        return
      }
      
      try {
        this.$message.loading('上传中...')
        
        // 批量上传
        const uploadPromises = files.map(async (file, index) => {
          const timestamp = Date.now()
          const ext = file.name.substring(file.name.lastIndexOf('.'))
          const cloudPath = `academy/cases/images/${this.currentCaseId || 'new'}/${timestamp}_${index}${ext}`
          
          const result = await window.CloudStorage.uploadFile({
            cloudPath: cloudPath,
            filePath: file
          })
          
          return result.fileID
        })
        
        const uploadedFileIDs = await Promise.all(uploadPromises)
        
        // 🔥 保存 fileIDs
        this.form.images.push(...uploadedFileIDs)
        
        // 🔥 获取临时 URLs
        const tempURLResult = await window.CloudStorage.getTempFileURL({
          fileList: uploadedFileIDs
        })
        
        const tempURLs = tempURLResult.fileList.map(item => item.tempFileURL)
        this.form.imagesURLs.push(...tempURLs)
        
        this.$message.success('上传成功')
        
        // 清空 input
        event.target.value = ''
      } catch (error) {
        console.error('上传失败:', error)
        this.$message.error('上传失败：' + error.message)
      }
    },
    
    async removeMultiImage(index) {
      try {
        // 🔥 删除云存储文件
        const fileIDToDelete = this.form.images[index]
        if (fileIDToDelete) {
          await window.CloudStorage.deleteFile({
            fileList: [fileIDToDelete]
          })
        }
        
        // 🔥 删除本地引用
        this.form.images.splice(index, 1)
        this.form.imagesURLs.splice(index, 1)
        
        this.$message.success('删除成功')
      } catch (error) {
        console.error('删除失败:', error)
        this.$message.error('删除失败')
      }
    },
    
    // ========== 加载数据时转换 fileID 为临时 URL ==========
    async loadMaterial(id) {
      try {
        const result = await callFunction({
          name: 'course',
          action: 'getMaterialDetail',
          data: { id }
        })
        
        const material = result.data
        this.currentMaterialId = material.id
        
        // 🔥 单图处理
        if (material.image_url) {
          this.form.coverImage = material.image_url  // 保存 fileID
          
          // 转换为临时 URL
          const tempURLResult = await window.CloudStorage.getTempFileURL({
            fileList: [material.image_url]
          })
          this.form.coverImageURL = tempURLResult.fileList[0].tempFileURL
        }
        
        // 🔥 多图处理
        if (material.images && material.images.length > 0) {
          this.form.images = material.images  // 保存 fileID 数组
          
          // 批量转换为临时 URLs
          const tempURLResult = await window.CloudStorage.getTempFileURL({
            fileList: material.images
          })
          this.form.imagesURLs = tempURLResult.fileList.map(item => item.tempFileURL)
        }
        
        // 其他字段...
        this.form.title = material.title
        this.form.content = material.content
      } catch (error) {
        console.error('加载失败:', error)
        this.$message.error('加载失败')
      }
    },
    
    // ========== 保存时使用 fileID ==========
    async handleSave() {
      try {
        const data = {
          title: this.form.title,
          content: this.form.content,
          image_url: this.form.coverImage,     // ⚠️ 使用 fileID
          images: this.form.images             // ⚠️ 使用 fileID 数组
        }
        
        if (this.currentMaterialId) {
          // 更新
          await callFunction({
            name: 'course',
            action: 'updateMaterial',
            data: { id: this.currentMaterialId, ...data }
          })
        } else {
          // 创建
          await callFunction({
            name: 'course',
            action: 'createMaterial',
            data: data
          })
        }
        
        this.$message.success('保存成功')
      } catch (error) {
        console.error('保存失败:', error)
        this.$message.error('保存失败')
      }
    }
  }
}).mount('#app')
```

### 3. 工具函数封装（推荐）

**新建文件**：`admin/assets/js/cloud-storage-helper.js`

```javascript
/**
 * Web 后台云存储工具函数
 */

// 确保 CloudBase 已初始化
if (!window.CloudStorage) {
  console.error('CloudStorage 未初始化！请先初始化 CloudBase。')
}

/**
 * 上传单个文件
 * @param {File} file - 浏览器 File 对象
 * @param {string} cloudPath - 云存储路径
 * @returns {Promise<{fileID: string, tempFileURL: string}>}
 */
async function uploadSingleFile(file, cloudPath) {
  try {
    // 上传文件
    const uploadResult = await window.CloudStorage.uploadFile({
      cloudPath: cloudPath,
      filePath: file
    })
    
    const fileID = uploadResult.fileID
    
    // 获取临时 URL
    const tempURLResult = await window.CloudStorage.getTempFileURL({
      fileList: [fileID]
    })
    
    return {
      fileID: fileID,
      tempFileURL: tempURLResult.fileList[0].tempFileURL
    }
  } catch (error) {
    console.error('上传文件失败:', error)
    throw error
  }
}

/**
 * 批量上传文件
 * @param {File[]} files - 文件数组
 * @param {Function} pathGenerator - 路径生成函数 (file, index) => cloudPath
 * @returns {Promise<Array<{fileID: string, tempFileURL: string}>>}
 */
async function uploadMultipleFiles(files, pathGenerator) {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const cloudPath = pathGenerator(file, index)
      return await uploadSingleFile(file, cloudPath)
    })
    
    return await Promise.all(uploadPromises)
  } catch (error) {
    console.error('批量上传失败:', error)
    throw error
  }
}

/**
 * 获取单个文件的临时 URL
 * @param {string} fileID - 文件 ID
 * @returns {Promise<string>}
 */
async function getSingleTempURL(fileID) {
  if (!fileID) return ''
  
  // 如果已经是 http/https 开头，直接返回
  if (fileID.startsWith('http://') || fileID.startsWith('https://')) {
    return fileID
  }
  
  try {
    const result = await window.CloudStorage.getTempFileURL({
      fileList: [fileID]
    })
    return result.fileList[0].tempFileURL
  } catch (error) {
    console.error('获取临时URL失败:', error)
    return ''
  }
}

/**
 * 批量获取临时 URLs
 * @param {string[]} fileIDs - 文件 ID 数组
 * @returns {Promise<string[]>}
 */
async function getBatchTempURLs(fileIDs) {
  if (!fileIDs || fileIDs.length === 0) return []
  
  try {
    const result = await window.CloudStorage.getTempFileURL({
      fileList: fileIDs
    })
    return result.fileList.map(item => item.tempFileURL)
  } catch (error) {
    console.error('批量获取临时URL失败:', error)
    return fileIDs  // 失败时返回原 fileIDs
  }
}

/**
 * 删除文件
 * @param {string[]} fileIDs - 要删除的文件 ID 数组
 * @returns {Promise<void>}
 */
async function deleteFiles(fileIDs) {
  if (!fileIDs || fileIDs.length === 0) return
  
  try {
    await window.CloudStorage.deleteFile({
      fileList: fileIDs
    })
    console.log('删除文件成功:', fileIDs)
  } catch (error) {
    console.warn('删除文件失败:', error)
    // 不抛出错误，因为删除失败不应该阻止其他操作
  }
}

/**
 * 替换文件（先删除旧文件，再上传新文件）
 * @param {string} oldFileID - 旧文件 ID
 * @param {File} newFile - 新文件
 * @param {string} cloudPath - 云存储路径
 * @returns {Promise<{fileID: string, tempFileURL: string}>}
 */
async function replaceFile(oldFileID, newFile, cloudPath) {
  try {
    // 删除旧文件
    if (oldFileID) {
      await deleteFiles([oldFileID])
    }
    
    // 上传新文件
    return await uploadSingleFile(newFile, cloudPath)
  } catch (error) {
    console.error('替换文件失败:', error)
    throw error
  }
}

/**
 * 生成标准化云存储路径
 * @param {string} category - 分类（如 'users/avatars', 'courses/covers'）
 * @param {string} id - 记录 ID
 * @param {string} filename - 文件名
 * @returns {string} - 云存储路径
 */
function generateCloudPath(category, id, filename) {
  const timestamp = Date.now()
  const ext = filename.substring(filename.lastIndexOf('.'))
  return `${category}/${id}_${timestamp}${ext}`
}

// 导出
window.CloudStorageHelper = {
  uploadSingleFile,
  uploadMultipleFiles,
  getSingleTempURL,
  getBatchTempURLs,
  deleteFiles,
  replaceFile,
  generateCloudPath
}
```

**在 HTML 中使用**：

```html
<script src="../../assets/js/cloud-storage-helper.js"></script>

<script>
// 使用工具函数
const handleUpload = async (file) => {
  const cloudPath = CloudStorageHelper.generateCloudPath(
    'academy/materials/poster',
    materialId,
    file.name
  )
  
  const result = await CloudStorageHelper.uploadSingleFile(file, cloudPath)
  
  form.coverImage = result.fileID
  form.coverImageURL = result.tempFileURL
}
</script>
```

---

## 云函数处理

### 1. 返回数据时转换 fileID 为临时 URL

**位置**：`cloudfunctions/course/handlers/public/getMaterialList.js`

```javascript
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getTempFileURL } = require('../../common/storage');

module.exports = async (event, context) => {
  try {
    // 查询数据
    const { data: list, error } = await db
      .from('academy_materials')
      .select('*')
      .eq('status', 1);

    if (error) throw error;

    // 🔥 转换云存储 fileID 为临时 URL
    if (list && list.length > 0) {
      // 收集所有需要转换的 fileID
      const fileIDs = [];
      list.forEach(item => {
        if (item.image_url) fileIDs.push(item.image_url);
        if (item.video_url) fileIDs.push(item.video_url);
      });

      // 批量获取临时 URL
      let urlMap = {};
      if (fileIDs.length > 0) {
        const tempURLs = await getTempFileURL(fileIDs);
        tempURLs.forEach((urlObj, index) => {
          if (urlObj && urlObj.tempFileURL) {
            urlMap[fileIDs[index]] = urlObj.tempFileURL;
          }
        });
      }

      // 替换 list 中的 fileID 为临时 URL
      list.forEach(item => {
        if (item.image_url && urlMap[item.image_url]) {
          item.image_url = urlMap[item.image_url];
        }
        if (item.video_url && urlMap[item.video_url]) {
          item.video_url = urlMap[item.video_url];
        }
      });
    }

    return response.success({ list });
  } catch (error) {
    console.error('查询失败:', error);
    return response.error('查询失败', error);
  }
};
```

### 2. 处理 JSON 数组字段

```javascript
// 🔥 转换包含 JSON 数组的云存储字段
if (list && list.length > 0) {
  const fileIDs = [];
  
  list.forEach(item => {
    // 单个文件
    if (item.student_avatar) fileIDs.push(item.student_avatar);
    
    // JSON 数组
    if (item.images) {
      try {
        const imagesArray = typeof item.images === 'string' 
          ? JSON.parse(item.images) 
          : item.images;
          
        if (Array.isArray(imagesArray)) {
          imagesArray.forEach(imgFileID => {
            if (imgFileID) fileIDs.push(imgFileID);
          });
        }
      } catch (e) {
        console.error('JSON 解析失败:', e);
      }
    }
  });

  // 批量获取临时 URL
  let urlMap = {};
  if (fileIDs.length > 0) {
    const tempURLs = await getTempFileURL(fileIDs);
    tempURLs.forEach((urlObj, index) => {
      if (urlObj && urlObj.tempFileURL) {
        urlMap[fileIDs[index]] = urlObj.tempFileURL;
      }
    });
  }

  // 替换
  list.forEach(item => {
    if (item.student_avatar && urlMap[item.student_avatar]) {
      item.student_avatar = urlMap[item.student_avatar];
    }
    
    if (item.images) {
      try {
        const imagesArray = typeof item.images === 'string' 
          ? JSON.parse(item.images) 
          : item.images;
          
        if (Array.isArray(imagesArray)) {
          item.images = imagesArray.map(imgFileID => 
            urlMap[imgFileID] || imgFileID
          );
        }
      } catch (e) {
        console.error('JSON 转换失败:', e);
        item.images = [];
      }
    }
  });
}
```

---

## 常见问题

### Q1: 为什么要存储 fileID 而不是临时 URL？

**A**: 临时 URL 有效期只有 1 小时，存储后会失效。fileID 是永久的，可以随时转换为新的临时 URL。

### Q2: 什么时候需要转换为临时 URL？

**A**: 
- ✅ 前端显示图片/视频时
- ✅ 下载文件时
- ❌ 保存到数据库时（保存 fileID）

### Q3: 如何处理多图上传？

**A**: 
1. 数据库字段类型为 `json`
2. 存储 fileID 数组：`["cloud://xxx1", "cloud://xxx2"]`
3. 显示前批量转换为临时 URL 数组

### Q4: Web 后台如何初始化 CloudBase？

**A**: 参考 [Web 后台接入](#web-后台接入) 章节的初始化代码。

### Q5: 上传失败怎么办？

**A**: 
1. 检查文件大小（建议限制 5MB 以内）
2. 检查文件类型是否正确
3. 检查云存储路径格式
4. 查看控制台错误信息

### Q6: 如何删除旧文件？

**A**: 
```javascript
// 小程序
await StorageApi.deleteFile([oldFileID])

// Web
await window.CloudStorage.deleteFile({ fileList: [oldFileID] })
```

---

## 最佳实践

### 1. 路径命名规范

参考 `docs/database/数据库详细信息.md` 云存储字段汇总：

```
users/avatars/{uid}_{timestamp}.{ext}
courses/covers/{course_id}_{timestamp}.{ext}
academy/materials/{category}/{material_id}_{timestamp}.{ext}
feedbacks/images/{feedback_id}/{timestamp}_{index}.{ext}
```

### 2. 错误处理

```javascript
try {
  const result = await uploadFile(...)
} catch (error) {
  console.error('上传失败:', error)
  
  // 给用户友好的提示
  if (error.message.includes('size')) {
    showError('文件太大，请压缩后重试')
  } else if (error.message.includes('format')) {
    showError('文件格式不支持')
  } else {
    showError('上传失败，请重试')
  }
}
```

### 3. 性能优化

```javascript
// ✅ 批量获取临时 URL（推荐）
const tempURLs = await getBatchTempURLs([fileID1, fileID2, fileID3])

// ❌ 逐个获取（低效）
const url1 = await getSingleTempURL(fileID1)
const url2 = await getSingleTempURL(fileID2)
const url3 = await getSingleTempURL(fileID3)
```

### 4. 数据一致性

```javascript
// 上传新文件前，先删除旧文件
if (oldFileID) {
  await deleteFile([oldFileID])
}

const newResult = await uploadFile(...)
formData.fileID = newResult.fileID
```

### 5. 显示加载状态

```javascript
// 小程序
uni.showLoading({ title: '上传中...' })
try {
  await uploadFile(...)
  uni.hideLoading()
  uni.showToast({ title: '上传成功', icon: 'success' })
} catch (error) {
  uni.hideLoading()
  uni.showToast({ title: '上传失败', icon: 'error' })
}

// Web
this.$message.loading('上传中...')
try {
  await uploadFile(...)
  this.$message.success('上传成功')
} catch (error) {
  this.$message.error('上传失败')
}
```

---

## 检查清单

### 小程序端

- [ ] 云存储 API 已封装在 `src/api/modules/storage.ts`
- [ ] 路径生成工具在 `src/utils/storage-path.ts`
- [ ] 上传前生成标准化路径
- [ ] 上传后保存 fileID 到表单
- [ ] 显示前转换为临时 URL
- [ ] 删除/替换时清理旧文件
- [ ] 提交时使用 fileID 而非临时 URL

### Web 后台

- [ ] CloudBase 已初始化
- [ ] HTML 已引入 `tcb.js`
- [ ] 上传组件已实现
- [ ] 上传前生成标准化路径
- [ ] 上传后保存 fileID
- [ ] 加载数据时转换为临时 URL
- [ ] 保存时使用 fileID
- [ ] 工具函数已封装（可选但推荐）

### 云函数端

- [ ] 返回数据前转换 fileID 为临时 URL
- [ ] 处理 JSON 数组字段
- [ ] 使用 `common/storage.js` 工具函数
- [ ] 批量转换优化性能

---

## 附录

### A. 完整代码示例

参考项目中的实际文件：
- 小程序：`src/pages/mine/profile/index.vue`（头像上传）
- 小程序：`src/pages/mine/feedback/index.vue`（多图上传）
- 云函数：`cloudfunctions/course/handlers/public/getMaterialList.js`
- 云函数：`cloudfunctions/course/handlers/public/getCaseList.js`

### B. 云存储字段完整列表

详见 `docs/database/数据库详细信息.md` - 云存储字段汇总

---

**文档结束** ✅



