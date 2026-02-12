/**
 * CloudBase 云存储统一访问层
 * 
 * 提供文件上传、下载、删除等基础功能
 * 支持单文件和多文件操作
 * 
 * @see https://docs.cloudbase.net/storage/sdk
 */

const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});

/**
 * ==================== 文件上传 ====================
 */

/**
 * 上传单个文件到云存储
 * 
 * @param {string} cloudPath - 云存储路径（如：users/avatars/uid_123.jpg）
 * @param {Buffer|string} fileContent - 文件内容（Buffer 或本地文件路径）
 * @returns {Promise<string>} 返回文件的 fileID
 * 
 * @example
 * // 上传 Buffer
 * const fileID = await uploadFile('users/avatars/user_1.jpg', fileBuffer);
 * 
 * // 上传本地文件
 * const fileID = await uploadFile('docs/report.pdf', '/tmp/report.pdf');
 */
async function uploadFile(cloudPath, fileContent) {
  try {
    const result = await app.uploadFile({
      cloudPath,
      fileContent
    });

    if (!result || !result.fileID) {
      throw new Error('文件上传失败，未返回 fileID');
    }

    return result.fileID;
  } catch (error) {
    console.error('[Storage] uploadFile error:', { cloudPath, error: error.message });
    throw error;
  }
}

/**
 * 批量上传文件到云存储
 * 
 * @param {Array<Object>} files - 文件列表
 * @param {string} files[].cloudPath - 云存储路径
 * @param {Buffer|string} files[].fileContent - 文件内容
 * @returns {Promise<Array<string>>} 返回文件 fileID 数组
 * 
 * @example
 * const fileIDs = await uploadFiles([
 *   { cloudPath: 'path1.jpg', fileContent: buffer1 },
 *   { cloudPath: 'path2.jpg', fileContent: buffer2 }
 * ]);
 */
async function uploadFiles(files) {
  try {
    const uploadPromises = files.map(file => uploadFile(file.cloudPath, file.fileContent));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('[Storage] uploadFiles error:', error);
    throw error;
  }
}

/**
 * ==================== 获取临时下载链接 ====================
 */

/**
 * 获取文件的临时下载链接（单个）
 * 
 * @param {string} fileID - 文件 ID（如：cloud://env-id/path/file.jpg）
 * @param {number} maxAge - 链接有效期（秒），默认 7200（2小时）
 * @returns {Promise<string>} 返回临时下载链接
 * 
 * @example
 * const url = await getTempFileURL('cloud://env-id/users/avatar.jpg');
 * const url = await getTempFileURL('cloud://env-id/docs/file.pdf', 3600); // 1小时
 */
async function getTempFileURL(fileID, maxAge = 7200) {
  try {
    const result = await app.getTempFileURL({
      fileList: [{ fileID, maxAge }]
    });

    if (!result || !result.fileList || result.fileList.length === 0) {
      throw new Error('获取临时链接失败');
    }

    const file = result.fileList[0];
    if (file.code !== 'SUCCESS') {
      throw new Error(`获取临时链接失败: ${file.code}`);
    }

    return file.tempFileURL;
  } catch (error) {
    console.error('[Storage] getTempFileURL error:', { fileID, error: error.message });
    throw error;
  }
}

/**
 * 批量获取文件的临时下载链接
 * 
 * @param {Array<string|Object>} fileList - 文件 ID 列表或包含 fileID 和 maxAge 的对象数组
 * @param {number} defaultMaxAge - 默认有效期（秒），默认 7200
 * @returns {Promise<Array<Object>>} 返回包含 fileID 和 tempFileURL 的对象数组
 * 
 * @example
 * // 简单用法
 * const urls = await getTempFileURLs(['cloud://env-id/file1.jpg', 'cloud://env-id/file2.jpg']);
 * // 返回：[{ fileID: '...', tempFileURL: '...' }, ...]
 * 
 * // 自定义有效期
 * const urls = await getTempFileURLs([
 *   { fileID: 'cloud://env-id/file1.jpg', maxAge: 3600 },
 *   { fileID: 'cloud://env-id/file2.jpg', maxAge: 7200 }
 * ]);
 */
async function getTempFileURLs(fileList, defaultMaxAge = 7200) {
  try {
    // 标准化输入格式
    const normalizedList = fileList.map(item => {
      if (typeof item === 'string') {
        return { fileID: item, maxAge: defaultMaxAge };
      }
      return {
        fileID: item.fileID,
        maxAge: item.maxAge || defaultMaxAge
      };
    });

    const result = await app.getTempFileURL({
      fileList: normalizedList
    });

    if (!result || !result.fileList) {
      throw new Error('批量获取临时链接失败');
    }

    // 返回成功的结果，过滤失败项
    return result.fileList
      .filter(file => file.code === 'SUCCESS')
      .map(file => ({
        fileID: file.fileID,
        tempFileURL: file.tempFileURL
      }));
  } catch (error) {
    console.error('[Storage] getTempFileURLs error:', error);
    throw error;
  }
}

/**
 * ==================== 文件下载 ====================
 */

/**
 * 下载文件到本地（返回文件内容）
 * 
 * @param {string} fileID - 文件 ID
 * @returns {Promise<Buffer>} 返回文件内容（Buffer）
 * 
 * @example
 * const buffer = await downloadFile('cloud://env-id/path/file.jpg');
 * // 保存到本地
 * require('fs').writeFileSync('/tmp/file.jpg', buffer);
 */
async function downloadFile(fileID) {
  try {
    const result = await app.downloadFile({
      fileID
    });

    if (!result || !result.fileContent) {
      throw new Error('文件下载失败');
    }

    return result.fileContent;
  } catch (error) {
    console.error('[Storage] downloadFile error:', { fileID, error: error.message });
    throw error;
  }
}

/**
 * 批量下载文件
 * 
 * @param {Array<string>} fileIDs - 文件 ID 数组
 * @returns {Promise<Array<Object>>} 返回包含 fileID 和 fileContent 的对象数组
 * 
 * @example
 * const files = await downloadFiles([
 *   'cloud://env-id/file1.jpg',
 *   'cloud://env-id/file2.jpg'
 * ]);
 * // 返回：[{ fileID: '...', fileContent: Buffer }, ...]
 */
async function downloadFiles(fileIDs) {
  try {
    const downloadPromises = fileIDs.map(async fileID => {
      const fileContent = await downloadFile(fileID);
      return { fileID, fileContent };
    });

    return await Promise.all(downloadPromises);
  } catch (error) {
    console.error('[Storage] downloadFiles error:', error);
    throw error;
  }
}

/**
 * ==================== 文件删除 ====================
 */

/**
 * 删除单个文件
 * 
 * @param {string} fileID - 文件 ID
 * @returns {Promise<void>}
 * 
 * @example
 * await deleteFile('cloud://env-id/users/old-avatar.jpg');
 */
async function deleteFile(fileID) {
  try {
    const result = await app.deleteFile({
      fileList: [fileID]
    });

    if (!result || !result.fileList || result.fileList.length === 0) {
      throw new Error('文件删除失败');
    }

    const file = result.fileList[0];
    if (file.code !== 'SUCCESS') {
      throw new Error(`文件删除失败: ${file.code}`);
    }
  } catch (error) {
    console.error('[Storage] deleteFile error:', { fileID, error: error.message });
    throw error;
  }
}

/**
 * 批量删除文件
 * 
 * @param {Array<string>} fileIDs - 文件 ID 数组
 * @returns {Promise<Object>} 返回删除结果 { success: number, failed: number, errors: Array }
 * 
 * @example
 * const result = await deleteFiles([
 *   'cloud://env-id/file1.jpg',
 *   'cloud://env-id/file2.jpg'
 * ]);
 * // 返回：{ success: 2, failed: 0, errors: [] }
 */
async function deleteFiles(fileIDs) {
  try {
    const result = await app.deleteFile({
      fileList: fileIDs
    });

    if (!result || !result.fileList) {
      throw new Error('批量删除文件失败');
    }

    const successCount = result.fileList.filter(f => f.code === 'SUCCESS').length;
    const failedCount = result.fileList.filter(f => f.code !== 'SUCCESS').length;
    const errors = result.fileList
      .filter(f => f.code !== 'SUCCESS')
      .map(f => ({ fileID: f.fileID, code: f.code }));

    return {
      success: successCount,
      failed: failedCount,
      errors
    };
  } catch (error) {
    console.error('[Storage] deleteFiles error:', error);
    throw error;
  }
}

/**
 * ==================== 工具函数 ====================
 */

/**
 * 生成云存储路径（带时间戳）
 * 
 * @param {string} dir - 目录路径（如：users/avatars）
 * @param {string} identifier - 标识符（如：uid、id）
 * @param {string} ext - 文件扩展名（如：jpg、png）
 * @returns {string} 完整的云存储路径
 * 
 * @example
 * const path = generateCloudPath('users/avatars', 'user_123', 'jpg');
 * // 返回：users/avatars/user_123_1707123456789.jpg
 */
function generateCloudPath(dir, identifier, ext) {
  const timestamp = Date.now();
  return `${dir}/${identifier}_${timestamp}.${ext}`;
}

/**
 * 从 URL 提取 fileID
 * 
 * @param {string} url - 完整的云存储 URL
 * @returns {string} fileID
 * 
 * @example
 * const fileID = extractFileID('https://xxx.tcb.qcloud.la/cloud://env-id/path/file.jpg');
 * // 返回：cloud://env-id/path/file.jpg
 */
function extractFileID(url) {
  if (!url) return '';
  
  // 如果已经是 fileID 格式，直接返回
  if (url.startsWith('cloud://')) {
    return url;
  }
  
  // 从 URL 中提取 fileID
  const match = url.match(/cloud:\/\/[^?]+/);
  return match ? match[0] : '';
}

/**
 * 验证文件类型
 * 
 * @param {string} filename - 文件名
 * @param {Array<string>} allowedTypes - 允许的文件类型
 * @returns {boolean} 是否合法
 * 
 * @example
 * const isValid = validateFileType('avatar.jpg', ['jpg', 'png', 'gif']);
 */
function validateFileType(filename, allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']) {
  const ext = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(ext);
}

/**
 * 验证文件大小
 * 
 * @param {Buffer} fileContent - 文件内容
 * @param {number} maxSizeMB - 最大文件大小（MB）
 * @returns {boolean} 是否合法
 * 
 * @example
 * const isValid = validateFileSize(buffer, 5); // 限制 5MB
 */
function validateFileSize(fileContent, maxSizeMB = 10) {
  const maxSize = maxSizeMB * 1024 * 1024;
  return fileContent.length <= maxSize;
}

module.exports = {
  // 核心上传下载删除
  uploadFile,
  uploadFiles,
  getTempFileURL,
  getTempFileURLs,
  downloadFile,
  downloadFiles,
  deleteFile,
  deleteFiles,
  
  // 工具函数
  generateCloudPath,
  extractFileID,
  validateFileType,
  validateFileSize,
  
  // CloudBase app 实例（供高级用户使用）
  app
};

