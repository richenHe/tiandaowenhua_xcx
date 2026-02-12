# 云函数公共代码更新日志

> 记录 common/ 和 business-logic/ 公共代码的重要更新

## 2026-02-12

### ✨ 新增功能

#### 1. 云存储功能模块（common/storage.js）
**新增云存储完整功能支持：**

- **基础功能**：
  - `uploadFile()` - 上传单个文件到云存储
  - `uploadFiles()` - 批量上传文件
  - `getTempFileURL()` - 获取文件临时下载链接（2小时有效期）
  - `downloadFile()` - 下载文件到云函数本地（内部使用）
  - `deleteFile()` - 删除单个或批量删除文件

- **高级功能**：
  - `replaceFile()` - 替换旧文件（如更新头像）
  - `generateCloudPath()` - 生成标准云存储路径
  - `getStoragePath()` - 获取标准路径（基于数据库字段类型）

- **标准路径常量（STORAGE_PATHS）**：
  ```javascript
  // 用户模块
  USER_AVATAR: (uid) => `users/avatars/${uid}_${Date.now()}`
  USER_QRCODE: (uid) => `users/qrcodes/${uid}_${Date.now()}.png`
  
  // 课程模块
  COURSE_COVER: (courseId) => `courses/covers/${courseId}_${Date.now()}`
  COURSE_CONTENT: (courseId) => `courses/content/${courseId}/`
  
  // 大使活动模块
  AMBASSADOR_ACTIVITY: (recordId) => `ambassador/activities/${recordId}/`
  
  // 商学院模块
  ACADEMY_INTRO_COVER: (introId) => `academy/intro/covers/${introId}_${Date.now()}`
  ACADEMY_CASE_AVATAR: (caseId) => `academy/cases/avatars/${caseId}_${Date.now()}`
  ACADEMY_CASE_VIDEO: (caseId) => `academy/cases/videos/${caseId}_${Date.now()}.mp4`
  ACADEMY_CASE_IMAGES: (caseId) => `academy/cases/images/${caseId}/`
  
  // 商城、反馈、管理员等其他模块路径...
  ```

**使用示例：**
```javascript
const { storage } = require('common');

// 上传头像
const result = await storage.uploadFile({
  cloudPath: storage.getStoragePath('USER_AVATAR', user.uid),
  fileContent: avatarBuffer
});

// 获取下载链接
const { tempFileURL } = await storage.getTempFileURL(fileID);

// 替换头像（自动删除旧头像）
const result = await storage.replaceFile(
  oldAvatarFileID,
  storage.getStoragePath('USER_AVATAR', user.uid),
  newAvatarBuffer
);
```

**参考文档：**
- 数据库云存储字段汇总: `docs/database/数据库详细信息.md` → 云存储字段汇总章节
- CloudBase 云存储 Web SDK 文档（已通过 MCP 查询）

---

#### 2. 公共代码同步部署规范

**新增强制同步规则（.cursorrules）：**

- 修改 `common/` 或 `business-logic/` 后，必须同步更新所有云函数
- 同步范围：`user`, `order`, `course`, `ambassador`, `system`（5个云函数）
- 排除：`callbacks`（独立维护）

**同步工具：**
- 使用 `mcp_cloudbase_updateFunctionCode` 批量更新
- 禁止使用 `updateFunctionConfig`（避免修改运行时配置）

**快速同步：**
```
请帮我使用 mcp_cloudbase_updateFunctionCode 批量更新以下云函数的代码：
- user
- order
- course
- ambassador
- system

functionRootPath: D:\project\cursor\work\xcx\cloudfunctions
```

**详细指南：** 见 `cloudfunctions/sync-functions.md`

---

### 📋 同步检查清单

**每次修改公共代码后必须执行：**
- [ ] 已复制最新 `common/` 到所有云函数（如需要）
- [ ] 已复制最新 `business-logic/` 到所有云函数（如需要）
- [ ] 已使用 `updateFunctionCode` 更新所有云函数
- [ ] 已排除 `callbacks` 云函数
- [ ] 已验证更新成功
- [ ] 已测试关键接口

---

### 🔄 影响范围

**本次更新影响以下云函数：**
1. ✅ **user** - 用户模块（需要云存储功能上传头像、二维码）
2. ✅ **order** - 订单模块
3. ✅ **course** - 课程模块（需要云存储功能上传封面、内容图片）
4. ✅ **ambassador** - 大使模块（需要云存储功能上传活动图片）
5. ✅ **system** - 系统模块（需要云存储功能上传公告封面、素材）
6. ❌ **callbacks** - 排除（独立维护）

---

### 📚 相关文档

- 项目开发规范: `.cursorrules`
- 云函数同步指南: `cloudfunctions/sync-functions.md`
- 数据库详细信息: `docs/database/数据库详细信息.md`
- CloudBase 云存储文档: 通过 MCP 工具查询

---

**更新时间：** 2026-02-12  
**更新内容：** 新增云存储功能模块 + 公共代码同步部署规范  
**下次更新需同步的云函数：** user, order, course, ambassador, system


