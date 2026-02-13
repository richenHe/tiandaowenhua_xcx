/**
 * 云存储公共函数
 * 提供文件上传、下载、删除等功能
 */

const cloud = require('wx-server-sdk');
const fs = require('fs');
const path = require('path');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 上传文件到云存储
 * @param {Object} options - 上传选项
 * @param {string} options.cloudPath - 云存储路径（如：users/avatars/uid_timestamp.jpg）
 * @param {Buffer|ReadStream|string} options.fileContent - 文件内容（Buffer、Stream 或本地文件路径）
 * @param {Function} options.onProgress - 上传进度回调（可选）
 * @returns {Promise<Object>} - 上传结果 { fileID, statusCode }
 */
async function uploadFile({ cloudPath, fileContent, onProgress }) {
  try {
    // 如果 fileContent 是字符串路径，创建读取流
    let content = fileContent;
    if (typeof fileContent === 'string') {
      content = fs.createReadStream(fileContent);
    }

    const result = await cloud.uploadFile({
      cloudPath,
      fileContent: content,
    });

    return {
      success: true,
      fileID: result.fileID,
      statusCode: result.statusCode,
    };
  } catch (error) {
    console.error('[云存储] 上传文件失败:', error);
    throw new Error(`上传文件失败: ${error.message}`);
  }
}

/**
 * 批量上传文件
 * @param {Array} files - 文件列表
 * @param {string} files[].cloudPath - 云存储路径
 * @param {Buffer|ReadStream|string} files[].fileContent - 文件内容
 * @returns {Promise<Array>} - 上传结果数组
 */
async function uploadFiles(files) {
  try {
    const uploadTasks = files.map(file => uploadFile(file));
    const results = await Promise.all(uploadTasks);
    
    return {
      success: true,
      files: results,
    };
  } catch (error) {
    console.error('[云存储] 批量上传文件失败:', error);
    throw new Error(`批量上传文件失败: ${error.message}`);
  }
}

/**
 * 获取文件临时下载链接
 * @param {string|Array<string>} fileList - 文件ID或文件ID数组
 * @param {number} maxAge - 链接有效期（秒），默认2小时
 * @returns {Promise<Object>} - 下载链接结果
 */
async function getTempFileURL(fileList, maxAge = 7200) {
  try {
    // 统一转换为数组格式
    const fileIDList = Array.isArray(fileList) ? fileList : [fileList];
    
    const result = await cloud.getTempFileURL({
      fileList: fileIDList.map(fileID => ({
        fileID,
        maxAge,
      })),
    });

    // 如果输入是单个文件，返回单个结果
    if (!Array.isArray(fileList)) {
      const file = result.fileList[0];
      return {
        success: file.status === 0,
        fileID: file.fileID,
        tempFileURL: file.tempFileURL,
        message: file.errmsg || '获取成功',
      };
    }

    // 批量文件返回完整列表
    return {
      success: true,
      fileList: result.fileList.map(file => ({
        fileID: file.fileID,
        tempFileURL: file.tempFileURL,
        status: file.status,
        message: file.errmsg || '获取成功',
      })),
    };
  } catch (error) {
    console.error('[云存储] 获取临时下载链接失败:', error);
    throw new Error(`获取临时下载链接失败: ${error.message}`);
  }
}

/**
 * 下载文件到本地（云函数内部使用）
 * @param {string} fileID - 文件ID
 * @param {string} localPath - 本地保存路径
 * @returns {Promise<Object>} - 下载结果
 */
async function downloadFile(fileID, localPath) {
  try {
    const result = await cloud.downloadFile({
      fileID,
    });

    // 保存文件到本地
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(localPath, result.fileContent);

    return {
      success: true,
      fileID,
      localPath,
      size: result.fileContent.length,
    };
  } catch (error) {
    console.error('[云存储] 下载文件失败:', error);
    throw new Error(`下载文件失败: ${error.message}`);
  }
}

/**
 * 删除文件
 * @param {string|Array<string>} fileList - 文件ID或文件ID数组
 * @returns {Promise<Object>} - 删除结果
 */
async function deleteFile(fileList) {
  try {
    // 统一转换为数组格式
    const fileIDList = Array.isArray(fileList) ? fileList : [fileList];
    
    const result = await cloud.deleteFile({
      fileList: fileIDList,
    });

    // 如果输入是单个文件，返回单个结果
    if (!Array.isArray(fileList)) {
      const file = result.fileList[0];
      return {
        success: file.status === 0,
        fileID: file.fileID,
        message: file.errmsg || '删除成功',
      };
    }

    // 批量文件返回完整列表
    return {
      success: true,
      fileList: result.fileList.map(file => ({
        fileID: file.fileID,
        status: file.status,
        message: file.errmsg || '删除成功',
      })),
    };
  } catch (error) {
    console.error('[云存储] 删除文件失败:', error);
    throw new Error(`删除文件失败: ${error.message}`);
  }
}

/**
 * 生成云存储路径
 * @param {string} category - 文件分类（如：users/avatars）
 * @param {string} identifier - 标识符（如：uid、course_id）
 * @param {string} filename - 文件名（含扩展名）
 * @returns {string} - 完整的云存储路径
 */
function generateCloudPath(category, identifier, filename) {
  const timestamp = Date.now();
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  
  // 格式：category/identifier_timestamp.ext
  return `${category}/${identifier}_${timestamp}${ext}`;
}

/**
 * 替换旧文件并删除（用于更新头像等场景）
 * @param {string} oldFileID - 旧文件ID（可选，不存在则只上传）
 * @param {string} cloudPath - 新文件云存储路径
 * @param {Buffer|ReadStream|string} fileContent - 新文件内容
 * @returns {Promise<Object>} - 操作结果
 */
async function replaceFile(oldFileID, cloudPath, fileContent) {
  try {
    // 上传新文件
    const uploadResult = await uploadFile({ cloudPath, fileContent });

    // 如果存在旧文件，删除它
    if (oldFileID) {
      try {
        await deleteFile(oldFileID);
      } catch (error) {
        console.warn('[云存储] 删除旧文件失败，但新文件已上传成功:', error);
      }
    }

    return {
      success: true,
      fileID: uploadResult.fileID,
      oldFileID,
    };
  } catch (error) {
    console.error('[云存储] 替换文件失败:', error);
    throw new Error(`替换文件失败: ${error.message}`);
  }
}

/**
 * 根据数据库字段类型生成云存储路径
 * 参考文档：docs/database/数据库详细信息.md - 云存储字段汇总
 */
const STORAGE_PATHS = {
  // 用户模块
  USER_AVATAR: (uid) => `users/avatars/${uid}_${Date.now()}`,
  USER_QRCODE: (uid) => `users/qrcodes/${uid}_${Date.now()}.png`,
  
  // 课程模块
  COURSE_COVER: (courseId) => `courses/covers/${courseId}_${Date.now()}`,
  COURSE_CONTENT: (courseId) => `courses/content/${courseId}/`,
  
  // 大使活动模块
  AMBASSADOR_ACTIVITY: (recordId) => `ambassador/activities/${recordId}/`,
  
  // 商学院模块
  ACADEMY_INTRO_COVER: (introId) => `academy/intro/covers/${introId}_${Date.now()}`,
  ACADEMY_CASE_AVATAR: (caseId) => `academy/cases/avatars/${caseId}_${Date.now()}`,
  ACADEMY_CASE_VIDEO: (caseId) => `academy/cases/videos/${caseId}_${Date.now()}.mp4`,
  ACADEMY_CASE_IMAGES: (caseId) => `academy/cases/images/${caseId}/`,
  ACADEMY_MATERIAL_IMAGE: (category, materialId) => `academy/materials/${category}/${materialId}_${Date.now()}`,
  ACADEMY_MATERIAL_VIDEO: (materialId) => `academy/materials/videos/${materialId}_${Date.now()}.mp4`,
  
  // 公告模块
  ANNOUNCEMENT_COVER: (announcementId) => `announcements/covers/${announcementId}_${Date.now()}`,
  
  // 反馈模块
  FEEDBACK_IMAGES: (feedbackId) => `feedbacks/images/${feedbackId}/`,
  
  // 商城模块
  MALL_GOODS_IMAGE: (goodsId) => `mall/goods/${goodsId}_${Date.now()}`,
  
  // 管理员模块
  ADMIN_AVATAR: (adminId) => `admin/avatars/${adminId}_${Date.now()}`,
};

/**
 * 获取标准云存储路径
 * @param {string} type - 路径类型（如：USER_AVATAR）
 * @param  {...any} args - 路径参数
 * @returns {string} - 云存储路径
 */
function getStoragePath(type, ...args) {
  const pathGenerator = STORAGE_PATHS[type];
  if (!pathGenerator) {
    throw new Error(`未知的云存储路径类型: ${type}`);
  }
  return pathGenerator(...args);
}

module.exports = {
  // 基础功能
  uploadFile,
  uploadFiles,
  getTempFileURL,
  downloadFile,
  deleteFile,
  
  // 高级功能
  replaceFile,
  generateCloudPath,
  getStoragePath,
  
  // 路径常量
  STORAGE_PATHS,
};







