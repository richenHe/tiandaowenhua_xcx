# 云存储字段分类指南

> 文档版本：v1.0  
> 更新日期：2026-02-13  
> 依据：`docs/database/数据库详细信息.md` - 云存储字段汇总

---

## 📋 字段分类总览

根据使用场景，将所有云存储字段分为三大类：

| 分类 | 数量 | 说明 |
|------|------|------|
| **前端主导** | 4 个 | 用户在小程序端上传，后台查看/审核 |
| **后台主导** | 11 个 | 管理员在后台上传，前端显示 |
| **系统生成** | 1 个 | 后台生成，前端下载使用 |

**总计：16 个云存储字段**

---

## 1️⃣ 前端主导字段（用户上传）

这些字段由用户在小程序端上传，后台主要用于查看和审核。

| 表名 | 字段名 | 云存储路径 | 文件类型 | 前端功能 | 后台功能 |
|------|--------|-----------|---------|---------|---------|
| users | avatar | `users/avatars/{uid}_{timestamp}.{ext}` | 图片 | ✅ 上传、显示 | 👁️ 查看 |
| users | background_image | `users/backgrounds/{uid}_{timestamp}.{ext}` | 图片 | ✅ 上传、显示 | 👁️ 查看 |
| feedbacks | images | `feedbacks/images/{feedback_id}/` | 图片（JSON数组） | ✅ 上传、显示 | 👁️ 查看、审核 |
| ambassador_activity_records | images | `ambassador/activities/{record_id}/` | 图片（JSON数组） | ✅ 上传、显示 | 👁️ 查看、审核 |

### 实现状态

| 字段 | 前端实现 | 后台实现 | 云函数转换 |
|------|---------|---------|-----------|
| users.avatar | ✅ 已完成 | ⚠️ 需添加 | ✅ 已完成 |
| users.background_image | ✅ 已完成 | ⚠️ 需添加 | ✅ 已完成 |
| feedbacks.images | ✅ 已完成 | ⚠️ 需添加 | ⚠️ 待确认 |
| ambassador_activity_records.images | ❌ 未实现 | ❌ 未实现 | ❌ 未实现 |

---

## 2️⃣ 后台主导字段（管理员上传）

这些字段由管理员在后台上传，前端用于显示。

| 表名 | 字段名 | 云存储路径 | 文件类型 | 前端功能 | 后台功能 |
|------|--------|-----------|---------|---------|---------|
| courses | cover_image | `courses/covers/{course_id}_{timestamp}.{ext}` | 图片 | 👁️ 显示 | ✅ 上传、编辑 |
| courses | content | `courses/content/{course_id}/` | 图片（富文本） | 👁️ 显示 | ✅ 富文本编辑器上传 |
| academy_intro | cover_image | `academy/intro/covers/{intro_id}_{timestamp}.{ext}` | 图片 | 👁️ 显示 | ✅ 上传、编辑 |
| academy_cases | student_avatar | `academy/cases/avatars/{case_id}_{timestamp}.{ext}` | 图片 | 👁️ 显示 | ✅ 上传、编辑 |
| academy_cases | video_url | `academy/cases/videos/{case_id}_{timestamp}.mp4` | 视频 | 👁️ 播放 | ✅ 上传、编辑 |
| academy_cases | images | `academy/cases/images/{case_id}/` | 图片（JSON数组） | 👁️ 显示 | ✅ 上传、编辑 |
| academy_materials | image_url | `academy/materials/{category}/{material_id}_{timestamp}.{ext}` | 图片 | 👁️ 显示、下载 | ✅ 上传、编辑 |
| academy_materials | video_url | `academy/materials/videos/{material_id}_{timestamp}.mp4` | 视频 | 👁️ 播放、下载 | ✅ 上传、编辑 |
| announcements | cover_image | `announcements/covers/{announcement_id}_{timestamp}.{ext}` | 图片 | 👁️ 显示 | ✅ 上传、编辑 |
| mall_goods | goods_image | `mall/goods/{goods_id}_{timestamp}.{ext}` | 图片 | 👁️ 显示 | ✅ 上传、编辑 |
| admin_users | avatar | `admin/avatars/{admin_id}_{timestamp}.{ext}` | 图片 | - | ✅ 上传、显示 |

### 实现状态

| 字段 | 前端显示 | 后台实现 | 云函数转换 |
|------|---------|---------|-----------|
| courses.cover_image | ✅ 已完成 | ❌ **待实现** | ⚠️ 待确认 |
| courses.content | ✅ 已完成 | ❌ **待实现** | ⚠️ 待确认 |
| academy_intro.cover_image | ✅ 已完成 | ❌ **待实现** | ❌ 未实现 |
| academy_cases.student_avatar | ✅ 已完成 | ❌ **待实现** | ⚠️ 待确认 |
| academy_cases.video_url | ✅ 已完成 | ❌ **待实现** | ⚠️ 待确认 |
| academy_cases.images | ✅ 已完成 | ❌ **待实现** | ⚠️ 待确认 |
| academy_materials.image_url | ✅ 已完成 | ❌ **待实现** | ⚠️ 需修复 |
| academy_materials.video_url | ✅ 已完成 | ❌ **待实现** | ⚠️ 需修复 |
| announcements.cover_image | ✅ 已完成 | ❌ **待实现** | ❌ 未实现 |
| mall_goods.goods_image | ❓ 待确认 | ❌ **待实现** | ❌ 未实现 |
| admin_users.avatar | - | ❌ **待实现** | - |

---

## 3️⃣ 系统生成字段（后台生成，前端使用）

这些字段由系统或后台生成，前端下载使用。

| 表名 | 字段名 | 云存储路径 | 文件类型 | 前端功能 | 后台功能 |
|------|--------|-----------|---------|---------|---------|
| users | qrcode_url | `users/qrcodes/{uid}_{timestamp}.png` | 图片（PNG） | 👁️ 显示、下载、分享 | ✅ 生成、查看 |

### 实现状态

| 字段 | 前端实现 | 后台实现 | 云函数生成 |
|------|---------|---------|-----------|
| users.qrcode_url | ❓ 待确认 | ❌ **待实现** | ❌ 未实现 |

---

## 📊 实现优先级

### 🔴 高优先级（后台必须实现）

**紧急修复项**：
1. ✅ **academy_materials.image_url** - 素材图片（云函数已返回fileID，需转临时URL）
2. ✅ **academy_materials.video_url** - 素材视频（云函数已返回fileID，需转临时URL）
3. ❌ **feedbacks.images** - 反馈图片（前端已实现，后台需添加查看功能）

**后台核心功能**（按模块分组）：

#### A. 课程管理模块
- courses.cover_image - 课程封面
- courses.content - 课程详情（富文本图片）

#### B. 商学院模块
- academy_intro.cover_image - 商学院介绍封面
- academy_cases.student_avatar - 学员头像
- academy_cases.video_url - 案例视频
- academy_cases.images - 案例图片

#### C. 素材管理模块
- academy_materials.image_url - 素材图片（已有页面，需加云存储）
- academy_materials.video_url - 素材视频（已有页面，需加云存储）

#### D. 系统管理模块
- announcements.cover_image - 公告封面
- mall_goods.goods_image - 商品图片
- admin_users.avatar - 管理员头像

### 🟡 中优先级（后台查看审核）

1. users.avatar - 用户头像（后台用户列表查看）
2. users.background_image - 用户背景图（后台用户详情查看）
3. feedbacks.images - 反馈图片（后台反馈列表查看）
4. ambassador_activity_records.images - 活动图片（后台审核查看）

### 🟢 低优先级（系统生成）

1. users.qrcode_url - 推广二维码（自动生成功能）

---

## 🎯 快速接入指南

### 对于后台开发者

#### 步骤 1：阅读核心文档
1. **必读**：`docs/cloud-storage-integration-guide.md` - 第 3 章 "Web 后台接入"
2. **参考**：本文档的字段分类表

#### 步骤 2：初始化云存储
```javascript
// admin/assets/js/cloudbase.js
const app = window.cloudbase.init({
  env: 'cloud1-0gnn3mn17b581124'
})

window.CloudStorage = {
  app,
  uploadFile: app.uploadFile.bind(app),
  getTempFileURL: app.getTempFileURL.bind(app),
  deleteFile: app.deleteFile.bind(app)
}
```

#### 步骤 3：封装工具函数
```javascript
// admin/assets/js/cloud-storage-helper.js
// 参考 docs/cloud-storage-integration-guide.md 第 3.3 节
```

#### 步骤 4：为具体页面添加上传功能

**示例：课程封面上传（admin/pages/course/list.html）**

```html
<!-- 上传组件 -->
<input type="file" id="coverImageUpload" accept="image/*" style="display:none">
<div v-if="!form.coverImage" @click="triggerUpload">点击上传封面</div>
<div v-else>
  <img :src="form.coverImageURL" />
  <button @click="triggerUpload">更换</button>
  <button @click="removeCoverImage">删除</button>
</div>

<script>
// 上传逻辑
const handleFileChange = async (event) => {
  const file = event.target.files[0]
  const cloudPath = `courses/covers/${courseId}_${Date.now()}${ext}`
  
  // 删除旧文件
  if (form.coverImage) {
    await CloudStorage.deleteFile({ fileList: [form.coverImage] })
  }
  
  // 上传新文件
  const result = await CloudStorage.uploadFile({ cloudPath, filePath: file })
  form.coverImage = result.fileID  // 保存到数据库
  
  // 获取临时URL显示
  const tempURL = await CloudStorage.getTempFileURL({ fileList: [result.fileID] })
  form.coverImageURL = tempURL.fileList[0].tempFileURL
}
</script>
```

---

## 📝 后台待实现清单

### 按页面分组

#### 1. admin/pages/course/list.html - 课程管理
- [ ] courses.cover_image - 课程封面上传
- [ ] courses.content - 富文本图片上传（需集成富文本编辑器）

#### 2. admin/pages/course/case.html - 案例管理
- [ ] academy_cases.student_avatar - 学员头像上传
- [ ] academy_cases.video_url - 案例视频上传
- [ ] academy_cases.images - 案例图片上传（多图）

#### 3. admin/pages/course/material.html - 素材管理 ⚠️ 优先
- [ ] academy_materials.image_url - 素材图片上传
- [ ] academy_materials.video_url - 素材视频上传
- [ ] 修复云函数返回值转换问题

#### 4. admin/pages/system/announcement.html - 公告管理
- [ ] announcements.cover_image - 公告封面上传

#### 5. admin/pages/system/mall.html - 商城管理（可能不存在）
- [ ] mall_goods.goods_image - 商品图片上传

#### 6. admin/pages/system/admin.html - 管理员管理
- [ ] admin_users.avatar - 管理员头像上传

#### 7. admin/pages/system/feedback.html - 反馈管理
- [ ] feedbacks.images - 查看反馈图片（只读，显示临时URL）

#### 8. admin/pages/user/list.html - 用户管理
- [ ] users.avatar - 查看用户头像（只读）
- [ ] users.background_image - 查看用户背景图（只读）
- [ ] users.qrcode_url - 生成推广二维码

#### 9. admin/pages/ambassador/activity.html - 活动记录
- [ ] ambassador_activity_records.images - 查看活动图片（审核场景）

---

## 🔧 云函数修复清单

### 需要修复的云函数

1. **cloudfunctions/course/handlers/public/getMaterialList.js**
   - 问题：返回 fileID 而非临时 URL
   - 影响字段：academy_materials.image_url, academy_materials.video_url
   - 状态：⚠️ 待修复

2. **cloudfunctions/course/handlers/admin/getMaterialList.js**
   - 问题：返回 fileID 而非临时 URL
   - 影响字段：academy_materials.image_url, academy_materials.video_url
   - 状态：⚠️ 待修复

3. **cloudfunctions/course/handlers/public/getCaseList.js**
   - 问题：可能返回 fileID
   - 影响字段：academy_cases.student_avatar, academy_cases.video_url, academy_cases.images
   - 状态：⚠️ 待确认

4. **cloudfunctions/system/handlers/client/getFeedbackList.js**
   - 问题：可能返回 fileID
   - 影响字段：feedbacks.images
   - 状态：⚠️ 待确认

---

## 📋 检查清单

### 前端开发者
- [x] users.avatar 已实现
- [x] users.background_image 已实现
- [x] feedbacks.images 已实现
- [ ] ambassador_activity_records.images 待实现

### 后台开发者
- [ ] 初始化 CloudBase SDK
- [ ] 封装云存储工具函数
- [ ] courses.cover_image 上传功能
- [ ] courses.content 富文本图片上传
- [ ] academy_intro.cover_image 上传功能
- [ ] academy_cases.student_avatar 上传功能
- [ ] academy_cases.video_url 上传功能
- [ ] academy_cases.images 上传功能
- [ ] academy_materials.image_url 上传功能（优先）
- [ ] academy_materials.video_url 上传功能（优先）
- [ ] announcements.cover_image 上传功能
- [ ] mall_goods.goods_image 上传功能
- [ ] admin_users.avatar 上传功能
- [ ] feedbacks.images 查看功能（只读）
- [ ] users 相关字段查看功能（只读）
- [ ] users.qrcode_url 生成功能

### 云函数开发者
- [ ] 修复 getMaterialList 返回值转换
- [ ] 修复 getCaseList 返回值转换
- [ ] 修复 getFeedbackList 返回值转换
- [ ] 实现 qrcode 生成接口

---

**文档结束** ✅



