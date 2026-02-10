# 天道文化小程序 - 云存储架构设计

> **版本**: V1.0  
> **创建时间**: 2026-02-08  
> **CloudBase 环境**: cloud1-0gnn3mn17b581124

---

## 📋 目录

1. [云存储目录结构](#1-云存储目录结构)
2. [文件命名规范](#2-文件命名规范)
3. [数据库字段映射](#3-数据库字段映射)
4. [SDK使用示例](#4-sdk使用示例)
5. [安全规则配置](#5-安全规则配置)
6. [最佳实践](#6-最佳实践)

---

## 1. 云存储目录结构

```
cloud://cloud1-0gnn3mn17b581124/
│
├── users/                                    # 用户相关文件
│   ├── avatars/                              # 用户头像
│   │   └── {uid}_{timestamp}.{ext}           # 如: oWxAb5xxx_1707123456789.jpg
│   └── temp/                                 # 临时文件（定期清理）
│
├── courses/                                  # 课程相关文件
│   ├── covers/                               # 课程封面图
│   │   └── {course_id}_{timestamp}.{ext}     # 如: 1_1707123456789.jpg
│   ├── content/                              # 课程详情内容图片
│   │   └── {course_id}/
│   │       └── {filename}_{timestamp}.{ext}
│   └── materials/                            # 课程资料文件
│       └── {course_id}/
│           └── {filename}_{timestamp}.{ext}
│
├── academy/                                  # 商学院相关文件
│   ├── cases/                                # 学员案例
│   │   ├── avatars/                          # 学员头像
│   │   │   └── {case_id}_{timestamp}.{ext}
│   │   ├── images/                           # 案例图片
│   │   │   └── {case_id}/
│   │   │       └── {filename}_{timestamp}.{ext}
│   │   └── videos/                           # 案例视频
│   │       └── {case_id}_{timestamp}.{ext}
│   │
│   ├── materials/                            # 朋友圈素材
│   │   ├── posters/                          # 海报
│   │   │   └── {material_id}_{timestamp}.{ext}
│   │   ├── videos/                           # 视频
│   │   │   └── {material_id}_{timestamp}.{ext}
│   │   └── images/                           # 图片
│   │       └── {material_id}_{timestamp}.{ext}
│   │
│   └── intro/                                # 商学院介绍
│       └── covers/                           # 封面图片
│           └── {intro_id}_{timestamp}.{ext}
│
├── announcements/                            # 公告相关文件
│   └── covers/                               # 公告封面
│       └── {announcement_id}_{timestamp}.{ext}
│
├── feedbacks/                                # 反馈相关文件
│   └── images/                               # 反馈图片
│       └── {feedback_id}/
│           └── {filename}_{timestamp}.{ext}
│
├── mall/                                     # 商城相关文件
│   └── goods/                                # 商品图片
│       └── {goods_id}_{timestamp}.{ext}
│
└── admin/                                    # 后台管理相关
    └── avatars/                              # 管理员头像
        └── {admin_id}_{timestamp}.{ext}
```

### 目录说明

| 目录路径 | 用途 | 文件类型 | 访问权限 |
|---------|------|---------|---------|
| `/users/avatars/` | 用户头像 | 图片 (jpg/png/webp) | 公开读 |
| `/users/temp/` | 临时上传文件 | 任意 | 私有 |
| `/courses/covers/` | 课程封面图 | 图片 (jpg/png/webp) | 公开读 |
| `/courses/content/{id}/` | 课程详情图片 | 图片 (jpg/png/webp) | 公开读 |
| `/courses/materials/{id}/` | 课程资料文件 | 文档/视频 | 需登录 |
| `/academy/cases/avatars/` | 案例学员头像 | 图片 (jpg/png/webp) | 公开读 |
| `/academy/cases/images/{id}/` | 案例配图 | 图片 (jpg/png/webp) | 公开读 |
| `/academy/cases/videos/` | 案例视频 | 视频 (mp4) | 公开读 |
| `/academy/materials/posters/` | 推广海报 | 图片 (jpg/png/webp) | 需登录(大使) |
| `/academy/materials/videos/` | 推广视频 | 视频 (mp4) | 需登录(大使) |
| `/academy/intro/covers/` | 商学院介绍封面 | 图片 (jpg/png/webp) | 公开读 |
| `/announcements/covers/` | 公告封面 | 图片 (jpg/png/webp) | 公开读 |
| `/feedbacks/images/{id}/` | 反馈图片 | 图片 (jpg/png/webp) | 私有 |
| `/mall/goods/` | 商品图片 | 图片 (jpg/png/webp) | 公开读 |
| `/admin/avatars/` | 管理员头像 | 图片 (jpg/png/webp) | 私有 |

---

## 2. 文件命名规范

### 2.1 命名格式

**基础格式：`{业务标识}_{时间戳}.{扩展名}`**

**示例：**

```javascript
// 用户头像
users/avatars/oWxAb5xxx_1707123456789.jpg

// 课程封面
courses/covers/1_1707123456789.jpg

// 案例图片
academy/cases/images/5/photo1_1707123456789.jpg

// 反馈图片
feedbacks/images/123/issue_1707123456789.jpg
```

### 2.2 扩展名规范

| 文件类型 | 支持的扩展名 | 推荐格式 |
|---------|------------|---------|
| 图片 | .jpg, .jpeg, .png, .webp, .gif | .webp (体积小) |
| 视频 | .mp4, .mov | .mp4 |
| 文档 | .pdf, .doc, .docx, .xls, .xlsx | .pdf |
| 压缩包 | .zip, .rar | .zip |

### 2.3 命名工具函数

```javascript
/**
 * 生成云存储文件路径
 * @param {string} category - 文件类别（如 'users/avatars'）
 * @param {string|number} id - 业务ID（用户ID/课程ID等）
 * @param {string} ext - 文件扩展名（如 'jpg'）
 * @returns {string} 完整的云存储路径
 */
function generateCloudPath(category, id, ext) {
  const timestamp = Date.now();
  return `${category}/${id}_${timestamp}.${ext}`;
}

// 使用示例
const avatarPath = generateCloudPath('users/avatars', userId, 'jpg');
// 返回: users/avatars/123_1707123456789.jpg

const coverPath = generateCloudPath('courses/covers', courseId, 'webp');
// 返回: courses/covers/1_1707123456789.webp
```

---

## 3. 数据库字段映射

### 3.1 用户模块（users 表）

| 字段名 | 类型 | 云存储路径 | 说明 |
|-------|------|-----------|------|
| avatar | varchar(255) | `users/avatars/{uid}_{timestamp}.{ext}` | 用户头像URL |

**存储示例：**

```javascript
// 上传后的完整URL
avatar = "cloud://cloud1-0gnn3mn17b581124.636c-cloud1-0gnn3mn17b581124-1234567890/users/avatars/oWxAb5xxx_1707123456789.jpg"

// 存储到数据库时可以存储 fileID 或完整URL
```

### 3.2 课程模块（courses 表）

| 字段名 | 类型 | 云存储路径 | 说明 |
|-------|------|-----------|------|
| cover_image | varchar(255) | `courses/covers/{course_id}_{timestamp}.{ext}` | 课程封面图 |
| content | text | `courses/content/{course_id}/` | 富文本中的图片 |

**注意：**
- `content` 字段是 HTML 富文本，其中包含的图片应单独存储到 `courses/content/{course_id}/` 目录
- 富文本编辑器上传图片时，应使用云函数上传并返回完整的图片URL

### 3.3 商学院模块

#### academy_intro 表

| 字段名 | 类型 | 云存储路径 | 说明 |
|-------|------|-----------|------|
| cover_image | varchar(255) | `academy/intro/covers/{intro_id}_{timestamp}.{ext}` | 介绍封面 |

#### academy_cases 表

| 字段名 | 类型 | 云存储路径 | 说明 |
|-------|------|-----------|------|
| student_avatar | varchar(255) | `academy/cases/avatars/{case_id}_{timestamp}.{ext}` | 学员头像 |
| video_url | varchar(255) | `academy/cases/videos/{case_id}_{timestamp}.mp4` | 案例视频 |
| images | json | `academy/cases/images/{case_id}/` | 图片列表（JSON存储多个URL） |

**images 字段 JSON 格式：**

```json
[
  "cloud://env-id/academy/cases/images/5/img1_1707123456789.jpg",
  "cloud://env-id/academy/cases/images/5/img2_1707123456790.jpg"
]
```

#### academy_materials 表

| 字段名 | 类型 | 云存储路径 | 说明 |
|-------|------|-----------|------|
| image_url | varchar(255) | `academy/materials/{category}/{material_id}_{timestamp}.{ext}` | 素材图片/海报 |
| video_url | varchar(255) | `academy/materials/videos/{material_id}_{timestamp}.mp4` | 素材视频 |

**category 分类：**
- `posters` - 海报
- `images` - 一般图片
- `videos` - 视频

### 3.4 系统模块

#### announcements 表

| 字段名 | 类型 | 云存储路径 | 说明 |
|-------|------|-----------|------|
| cover_image | varchar(255) | `announcements/covers/{announcement_id}_{timestamp}.{ext}` | 公告封面 |

### 3.5 反馈模块（feedbacks 表）

| 字段名 | 类型 | 云存储路径 | 说明 |
|-------|------|-----------|------|
| images | json | `feedbacks/images/{feedback_id}/` | 反馈图片列表（JSON存储多个URL） |

### 3.6 商城模块

#### mall_goods 表

| 字段名 | 类型 | 云存储路径 | 说明 |
|-------|------|-----------|------|
| goods_image | varchar(255) | `mall/goods/{goods_id}_{timestamp}.{ext}` | 商品图片 |

#### mall_exchange_records 表

| 字段名 | 类型 | 云存储路径 | 说明 |
|-------|------|-----------|------|
| goods_image | varchar(255) | （冗余字段，来自 mall_goods.goods_image） | 商品图片（快照） |

### 3.7 后台管理模块（admin_users 表）

| 字段名 | 类型 | 云存储路径 | 说明 |
|-------|------|-----------|------|
| avatar | varchar(255) | `admin/avatars/{admin_id}_{timestamp}.{ext}` | 管理员头像 |

---

## 4. SDK使用示例

### 4.1 前端上传文件（小程序端）

```javascript
// uni-app 方式上传用户头像
async uploadAvatar() {
  try {
    // 1. 选择图片
    const [err, res] = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    });
    
    if (err) throw err;
    
    const tempFilePath = res.tempFilePaths[0];
    
    // 2. 调用云函数上传（推荐）
    const result = await uniCloud.callFunction({
      name: 'user',
      data: {
        action: 'client:uploadAvatar',
        tempFilePath
      }
    });
    
    const avatarUrl = result.result.data.fileID;
    
    // 3. 更新用户资料
    await uniCloud.callFunction({
      name: 'user',
      data: {
        action: 'client:updateProfile',
        avatar: avatarUrl
      }
    });
    
    uni.showToast({ title: '头像上传成功' });
    
  } catch (error) {
    console.error('上传失败:', error);
    uni.showToast({ title: '上传失败', icon: 'none' });
  }
}
```

### 4.2 云函数处理上传

```javascript
// cloudfunctions/user/index.js
const cloud = require('wx-server-sdk');
cloud.init();

const { query, update } = require('/opt/db-utils');
const { successResponse, errorResponse } = require('/opt/common-utils');

exports.main = async (event, context) => {
  const { action, ...params } = event;
  const { OPENID } = cloud.getWXContext();
  
  if (action === 'client:uploadAvatar') {
    try {
      const { tempFilePath } = params;
      
      // 1. 获取用户信息
      const [user] = await query(
        'SELECT id, uid FROM users WHERE _openid = ?',
        [OPENID]
      );
      
      if (!user) {
        return errorResponse('用户不存在', null, 404);
      }
      
      // 2. 生成云存储路径
      const ext = tempFilePath.split('.').pop();
      const cloudPath = `users/avatars/${user.uid}_${Date.now()}.${ext}`;
      
      // 3. 上传到云存储
      const uploadResult = await cloud.uploadFile({
        cloudPath,
        fileContent: tempFilePath
      });
      
      // 4. 更新数据库
      await update(
        'UPDATE users SET avatar = ? WHERE _openid = ?',
        [uploadResult.fileID, OPENID]
      );
      
      return successResponse({
        fileID: uploadResult.fileID,
        cloudPath
      });
      
    } catch (error) {
      console.error('上传头像失败:', error);
      return errorResponse(error.message, error);
    }
  }
}
```

### 4.3 获取临时下载链接

```javascript
// 云函数中获取文件临时URL
async function getTempFileURL(fileID) {
  const result = await cloud.getTempFileURL({
    fileList: [fileID]
  });
  
  return result.fileList[0].tempFileURL;
}

// 批量获取
async function getBatchTempFileURLs(fileIDs) {
  const result = await cloud.getTempFileURL({
    fileList: fileIDs.map(id => ({ fileID: id }))
  });
  
  return result.fileList.map(item => ({
    fileID: item.fileID,
    tempFileURL: item.tempFileURL
  }));
}
```

### 4.4 删除文件

```javascript
// 云函数中删除文件
async function deleteFile(fileID) {
  try {
    await cloud.deleteFile({
      fileList: [fileID]
    });
    console.log('文件删除成功:', fileID);
  } catch (error) {
    console.error('文件删除失败:', error);
  }
}

// 删除用户旧头像（更新头像时）
case 'client:updateAvatar': {
  const [user] = await query(
    'SELECT avatar FROM users WHERE _openid = ?',
    [OPENID]
  );
  
  // 删除旧头像
  if (user.avatar) {
    await deleteFile(user.avatar);
  }
  
  // 上传新头像...
}
```

---

## 5. 安全规则配置

### 5.1 推荐配置

```json
{
  "read": "auth != null || resource.path.matches('public/.*')",
  "write": "auth != null && (
    resource.path.matches('users/avatars/' + auth.uid + '_.*') ||
    resource.path.matches('feedbacks/images/.*') ||
    (auth.role == 'admin' && resource.path.matches('admin/.*'))
  )"
}
```

### 5.2 规则说明

| 路径模式 | 读权限 | 写权限 | 说明 |
|---------|-------|-------|------|
| `/users/avatars/{uid}_*` | 公开 | 仅本人 | 用户只能修改自己的头像 |
| `/courses/**` | 公开 | 仅管理员 | 课程文件公开读取，管理员管理 |
| `/academy/**` | 公开/需登录 | 仅管理员 | 部分需大使权限 |
| `/announcements/**` | 公开 | 仅管理员 | 公告文件公开读取 |
| `/feedbacks/images/**` | 私有 | 仅本人 | 反馈图片仅用户和管理员可见 |
| `/mall/**` | 公开 | 仅管理员 | 商城图片公开读取 |
| `/admin/**` | 私有 | 仅管理员 | 后台文件仅管理员访问 |

---

## 6. 最佳实践

### 6.1 文件大小限制

| 文件类型 | 推荐大小 | 最大限制 |
|---------|---------|---------|
| 用户头像 | < 500KB | 2MB |
| 课程封面 | < 1MB | 3MB |
| 反馈图片 | < 2MB | 5MB |
| 案例视频 | < 50MB | 100MB |
| 素材海报 | < 2MB | 5MB |

### 6.2 图片压缩建议

```javascript
// 前端上传前压缩（推荐使用 uni.compressImage）
async compressAndUpload(tempFilePath) {
  const compressed = await uni.compressImage({
    src: tempFilePath,
    quality: 80,
    compressedWidth: 1080  // 宽度不超过1080px
  });
  
  // 上传压缩后的图片
  return await uploadFile(compressed.tempFilePath);
}
```

### 6.3 文件命名最佳实践

```javascript
/**
 * ✅ 推荐：包含业务信息和时间戳
 */
const goodPath = `users/avatars/${userId}_${timestamp}.jpg`;

/**
 * ❌ 不推荐：使用随机字符串（难以追踪）
 */
const badPath = `users/avatars/${randomString()}.jpg`;

/**
 * ❌ 不推荐：不包含时间戳（可能重名）
 */
const badPath2 = `users/avatars/${userId}.jpg`;
```

### 6.4 临时文件清理

```javascript
// 定时任务：清理7天前的临时文件
// cloudfunctions/system/index.js
async function cleanTempFiles() {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  // 列出临时目录文件
  const result = await cloud.getTempFileURL({
    fileList: ['users/temp/']
  });
  
  // 过滤并删除过期文件
  const expiredFiles = result.fileList.filter(file => {
    const timestamp = parseInt(file.split('_').pop().split('.')[0]);
    return timestamp < sevenDaysAgo;
  });
  
  if (expiredFiles.length > 0) {
    await cloud.deleteFile({
      fileList: expiredFiles
    });
    console.log(`清理了 ${expiredFiles.length} 个临时文件`);
  }
}
```

### 6.5 错误处理

```javascript
async function safeUploadFile(cloudPath, fileContent) {
  try {
    const result = await cloud.uploadFile({
      cloudPath,
      fileContent
    });
    
    return { success: true, fileID: result.fileID };
    
  } catch (error) {
    console.error('文件上传失败:', {
      cloudPath,
      error: error.message,
      code: error.code
    });
    
    // 根据错误码返回友好提示
    let message = '上传失败，请稍后重试';
    
    if (error.code === 'INVALID_PARAM') {
      message = '文件格式不正确';
    } else if (error.code === 'FILE_TOO_LARGE') {
      message = '文件大小超过限制';
    } else if (error.code === 'PERMISSION_DENIED') {
      message = '无权限上传文件';
    }
    
    return { success: false, message };
  }
}
```

### 6.6 批量上传优化

```javascript
// 批量上传反馈图片
async function uploadFeedbackImages(tempFilePaths, feedbackId) {
  const uploadPromises = tempFilePaths.map((path, index) => {
    const ext = path.split('.').pop();
    const cloudPath = `feedbacks/images/${feedbackId}/img${index + 1}_${Date.now()}.${ext}`;
    
    return cloud.uploadFile({
      cloudPath,
      fileContent: path
    });
  });
  
  // 并发上传（最多5个）
  const results = [];
  for (let i = 0; i < uploadPromises.length; i += 5) {
    const batch = uploadPromises.slice(i, i + 5);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  
  return results.map(r => r.fileID);
}
```

---

## 📊 统计信息

- **目录数量**: 16 个主要目录
- **文件类型**: 图片、视频、文档
- **访问权限**: 公开读、需登录、仅管理员、私有
- **数据库映射**: 13 个表的文件字段

---

## 📝 维护记录

| 日期 | 版本 | 说明 |
|-----|------|-----|
| 2026-02-08 | v1.0 | 初始版本，完整的云存储架构设计 |

---

**📖 相关文档**

- [CloudBase 云存储 Web SDK 文档](https://docs.cloudbase.net/storage/web)
- [CloudBase 云存储 Node.js SDK 文档](https://docs.cloudbase.net/storage/server)
- [数据库详细信息](../../docs/database/数据库详细信息.md)
- [云函数开发规范](./README.md)