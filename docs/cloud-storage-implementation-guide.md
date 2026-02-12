# 云存储字段实现规范指南

> **创建日期**：2026-02-12  
> **目的**：确保所有云存储字段正确使用 fileID，避免保存临时路径导致的加载失败

---

## ⚠️ 核心原则

### ❌ 错误做法
```javascript
// 错误：保存本地临时路径
formData.avatar = res.tempFilePaths[0]  // http://127.0.0.1:11103/__tmp__/xxx.jpeg
await api.update({ avatar: formData.avatar })  // ← 数据库中保存了临时路径！
```

### ✅ 正确做法
```javascript
// 正确：上传到云存储，保存 fileID
const result = await StorageApi.uploadFile({ cloudPath, filePath: res.tempFilePaths[0] })
formData.avatarFileID = result.fileID  // cloud://xxx.jpeg
formData.avatar = await StorageApi.getSingleTempFileURL(result.fileID)  // 仅用于显示

await api.update({ avatar: formData.avatarFileID })  // ← 数据库保存 fileID ✅
```

---

## 📋 云存储字段清单

| 序号 | 表名 | 字段名 | 文件类型 | 前端实现状态 | 备注 |
|-----|------|--------|---------|-------------|------|
| 1 | users | avatar | 图片 | ✅ 已修复 | 用户头像 |
| 2 | users | background_image | 图片 | ✅ 已修复 | 用户背景图 |
| 3 | users | qrcode_url | PNG图片 | ⚠️ 待检查 | 推广二维码 |
| 4 | courses | cover_image | 图片 | ⚠️ 待检查 | 课程封面 |
| 5 | courses | content | 富文本图片 | ⚠️ 待检查 | 课程详情中的图片 |
| 6 | ambassador_activity_records | images | 图片数组 | ⚠️ 待检查 | 活动图片（JSON） |
| 7 | academy_intro | cover_image | 图片 | ⚠️ 待检查 | 商学院介绍封面 |
| 8 | academy_cases | student_avatar | 图片 | ⚠️ 待检查 | 学员头像 |
| 9 | academy_cases | video_url | 视频 | ⚠️ 待检查 | 案例视频 |
| 10 | academy_cases | images | 图片数组 | ⚠️ 待检查 | 案例图片（JSON） |
| 11 | academy_materials | image_url | 图片 | ⚠️ 待检查 | 素材图片 |
| 12 | academy_materials | video_url | 视频 | ⚠️ 待检查 | 素材视频 |
| 13 | announcements | cover_image | 图片 | ⚠️ 待检查 | 公告封面 |
| 14 | feedbacks | images | 图片数组 | ⚠️ 待检查 | 反馈图片（JSON） |
| 15 | mall_goods | goods_image | 图片 | ⚠️ 待检查 | 商品图片 |
| 16 | admin_users | avatar | 图片 | ⚠️ 待检查 | 管理员头像 |

---

## 🔧 标准实现模板

### 1. 单图片上传

```vue
<script setup>
import { ref } from 'vue'
import StorageApi, { StoragePathHelper } from '@/api/modules/storage'

const formData = ref({
  coverImage: '',      // 用于显示的临时URL
  coverImageFileID: '' // 用于保存的fileID
})

/**
 * 上传封面图片
 */
const uploadCoverImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' })

        const filePath = res.tempFilePaths[0]
        
        // 生成云存储路径
        const timestamp = Date.now()
        const ext = filePath.substring(filePath.lastIndexOf('.'))
        const cloudPath = `courses/covers/${courseId}_${timestamp}${ext}`

        // 删除旧文件（如果存在）
        if (formData.value.coverImageFileID) {
          await StorageApi.deleteFile([formData.value.coverImageFileID])
        }

        // 上传到云存储
        const result = await StorageApi.uploadFile({ cloudPath, filePath })

        // 🔥 关键：保存 fileID
        formData.value.coverImageFileID = result.fileID

        // 获取临时URL用于显示
        formData.value.coverImage = await StorageApi.getSingleTempFileURL(result.fileID)

        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'error' })
        console.error('上传失败:', error)
      }
    }
  })
}

/**
 * 保存数据
 */
const handleSave = async () => {
  await api.update({
    coverImage: formData.value.coverImageFileID  // ✅ 保存 fileID
  })
}

/**
 * 加载数据
 */
const loadData = async () => {
  const data = await api.get()
  
  // fileID 保存在数据库中
  formData.value.coverImageFileID = data.cover_image
  
  // 转换为临时URL用于显示
  if (data.cover_image) {
    formData.value.coverImage = await StorageApi.getSingleTempFileURL(data.cover_image)
  }
}
</script>
```

### 2. 多图片上传（JSON数组）

```vue
<script setup>
import { ref } from 'vue'
import StorageApi from '@/api/modules/storage'

const formData = ref({
  images: [],       // 用于显示的临时URL数组
  imagesFileIDs: [] // 用于保存的fileID数组
})

/**
 * 上传多张图片
 */
const uploadImages = () => {
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' })

        const filePaths = res.tempFilePaths
        const uploadPromises = filePaths.map(async (filePath, index) => {
          const timestamp = Date.now()
          const ext = filePath.substring(filePath.lastIndexOf('.'))
          const cloudPath = `feedbacks/images/${recordId}/${timestamp}_${index}${ext}`
          
          return await StorageApi.uploadFile({ cloudPath, filePath })
        })

        const results = await Promise.all(uploadPromises)

        // 保存 fileID 数组
        formData.value.imagesFileIDs = results.map(r => r.fileID)

        // 获取临时URL用于显示
        formData.value.images = await StorageApi.getBatchTempFileURLs(formData.value.imagesFileIDs)

        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'error' })
        console.error('上传失败:', error)
      }
    }
  })
}

/**
 * 保存数据
 */
const handleSave = async () => {
  await api.submit({
    images: JSON.stringify(formData.value.imagesFileIDs)  // ✅ 保存 fileID 数组
  })
}

/**
 * 加载数据
 */
const loadData = async () => {
  const data = await api.get()
  
  // fileID 数组保存在数据库中（JSON格式）
  formData.value.imagesFileIDs = JSON.parse(data.images || '[]')
  
  // 转换为临时URL用于显示
  if (formData.value.imagesFileIDs.length > 0) {
    formData.value.images = await StorageApi.getBatchTempFileURLs(formData.value.imagesFileIDs)
  }
}
</script>
```

### 3. 视频上传

```vue
<script setup>
import { ref } from 'vue'
import StorageApi from '@/api/modules/storage'

const formData = ref({
  videoUrl: '',      // 用于显示的临时URL
  videoFileID: ''    // 用于保存的fileID
})

/**
 * 上传视频
 */
const uploadVideo = () => {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    maxDuration: 60,
    success: async (res) => {
      try {
        uni.showLoading({ title: '上传中...' })

        const filePath = res.tempFilePath
        const timestamp = Date.now()
        const cloudPath = `academy/cases/videos/${caseId}_${timestamp}.mp4`

        // 删除旧文件
        if (formData.value.videoFileID) {
          await StorageApi.deleteFile([formData.value.videoFileID])
        }

        // 上传到云存储
        const result = await StorageApi.uploadFile({ cloudPath, filePath })

        // 保存 fileID
        formData.value.videoFileID = result.fileID

        // 获取临时URL用于显示
        formData.value.videoUrl = await StorageApi.getSingleTempFileURL(result.fileID)

        uni.hideLoading()
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: '上传失败', icon: 'error' })
        console.error('上传失败:', error)
      }
    }
  })
}

/**
 * 保存数据
 */
const handleSave = async () => {
  await api.update({
    videoUrl: formData.value.videoFileID  // ✅ 保存 fileID
  })
}
</script>
```

---

## 🔍 前端代码检查清单

### 检查要点

- [ ] **1. 上传后保存的是 `result.fileID`，不是 `res.tempFilePaths[0]`**
- [ ] **2. 表单数据中区分 `xxxFileID`（保存用）和 `xxx`（显示用）**
- [ ] **3. 保存时传递的是 `fileID`，不是临时URL**
- [ ] **4. 加载时使用 `getSingleTempFileURL` 转换 fileID 为临时URL**
- [ ] **5. 多图片/视频使用 JSON 数组存储 fileID**

### 常见错误模式

```javascript
// ❌ 错误模式1：直接保存本地路径
uni.chooseImage({
  success: (res) => {
    formData.avatar = res.tempFilePaths[0]  // ← 临时路径！
    api.update({ avatar: formData.avatar }) // ← 错误！
  }
})

// ❌ 错误模式2：保存临时URL
const result = await uploadFile()
formData.avatar = await getTempURL(result.fileID)  // ← 临时URL
api.update({ avatar: formData.avatar })            // ← 错误！

// ❌ 错误模式3：使用 wx.cloud.uploadFile 返回值
wx.cloud.uploadFile({
  success: (res) => {
    formData.avatar = res.fileID  // ← 可能是临时URL
    api.update({ avatar: formData.avatar })
  }
})

// ✅ 正确模式：明确区分 fileID 和临时URL
const result = await StorageApi.uploadFile({ cloudPath, filePath })
formData.avatarFileID = result.fileID  // ← fileID（保存用）
formData.avatar = await StorageApi.getSingleTempFileURL(result.fileID)  // ← 临时URL（显示用）
api.update({ avatar: formData.avatarFileID })  // ← 正确！
```

---

## 📝 待办事项

### 🔴 高优先级（会导致功能异常）

- [x] **users.avatar** - 已修复 ✅
- [x] **users.background_image** - 已修复 ✅
- [ ] **users.qrcode_url** - 待检查
- [ ] **feedbacks.images** - 待检查（用户反馈功能）

### 🟡 中优先级（后台管理功能）

- [ ] **courses.cover_image** - 待检查
- [ ] **courses.content** - 待检查
- [ ] **announcements.cover_image** - 待检查
- [ ] **mall_goods.goods_image** - 待检查
- [ ] **admin_users.avatar** - 待检查

### 🟢 低优先级（商学院模块）

- [ ] **ambassador_activity_records.images** - 待检查
- [ ] **academy_intro.cover_image** - 待检查
- [ ] **academy_cases.student_avatar** - 待检查
- [ ] **academy_cases.video_url** - 待检查
- [ ] **academy_cases.images** - 待检查
- [ ] **academy_materials.image_url** - 待检查
- [ ] **academy_materials.video_url** - 待检查

---

## 🛠️ 快速修复脚本

### 搜索可能存在问题的代码

```bash
# 搜索所有可能直接使用临时路径的代码
grep -r "tempFilePaths\[0\]" universal-cloudbase-uniapp-template/src/pages/
grep -r "tempFilePath" universal-cloudbase-uniapp-template/src/pages/
grep -r "avatarUrl" universal-cloudbase-uniapp-template/src/pages/

# 搜索所有 uni.chooseImage 调用
grep -r "uni.chooseImage" universal-cloudbase-uniapp-template/src/pages/

# 搜索所有 uni.chooseVideo 调用
grep -r "uni.chooseVideo" universal-cloudbase-uniapp-template/src/pages/
```

---

## ✅ 验证方法

### 1. 数据库验证

```sql
-- 检查保存的是否是 fileID
SELECT id, avatar, background_image FROM tiandao_culture.users WHERE id = 1;

-- ✅ 正确格式：cloud://cloud1-xxx.7463-cloud1-xxx/users/avatars/xxx.jpeg
-- ❌ 错误格式：http://127.0.0.1:11103/__tmp__/xxx.jpeg
-- ❌ 错误格式：https://xxx.tcb.qcloud.la/xxx?sign=xxx
```

### 2. 控制台验证

```javascript
// 在浏览器控制台查看
console.log('保存的 avatar:', formData.avatarFileID)
// 应该输出：cloud://xxx 或以 cloud:// 开头的字符串

console.log('显示的 avatar:', formData.avatar)
// 应该输出：https://xxx.tcb.qcloud.la/xxx?sign=xxx
```

### 3. 网络请求验证

查看 API 请求 payload：
```json
{
  "avatar": "cloud://cloud1-xxx.7463-cloud1-xxx/users/avatars/xxx.jpeg",  // ✅ 正确
  "backgroundImage": "cloud://cloud1-xxx.7463-cloud1-xxx/users/backgrounds/xxx.jpeg"  // ✅ 正确
}
```

---

## 📚 相关文档

- [数据库详细信息](./database/数据库详细信息.md)
- [云存储 API 文档](../universal-cloudbase-uniapp-template/src/api/modules/storage.ts)
- [项目开发规范](../.cursorrules)

---

**最后更新**：2026-02-12  
**维护者**：开发团队


