/**
 * Web 后台云存储工具函数
 * 封装常用的云存储操作，简化业务代码
 */

// 确保 CloudStorage 已初始化
if (!window.CloudStorage) {
  console.error('❌ CloudStorage 未初始化！请先加载 cloudbase.js');
}

/**
 * 等待 CloudBase 认证完成
 * @returns {Promise<void>}
 */
async function waitForAuth() {
  // 检查是否已认证
  if (window.CloudStorage && window.CloudStorage.isAuthenticated) {
    return Promise.resolve();
  }
  
  console.log('⏳ 等待 CloudBase 认证完成...');
  
  // 最多等待 10 秒
  const maxWaitTime = 10000;
  const checkInterval = 200;
  let elapsed = 0;
  
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      elapsed += checkInterval;
      
      if (window.CloudStorage && window.CloudStorage.isAuthenticated) {
        clearInterval(timer);
        console.log('✅ CloudBase 认证已完成');
        resolve();
      } else if (elapsed >= maxWaitTime) {
        clearInterval(timer);
        reject(new Error('CloudBase 认证超时，请刷新页面重试'));
      }
    }, checkInterval);
  });
}

/**
 * 上传单个文件
 * @param {File} file - 浏览器 File 对象
 * @param {string} cloudPath - 云存储路径（如：'announcements/covers/1_1234567890.jpg'）
 * @returns {Promise<{fileID: string, tempFileURL: string}>}
 */
async function uploadSingleFile(file, cloudPath) {
  try {
    console.log('📤 开始上传文件:', cloudPath);
    
    // 🔥 等待认证完成
    await waitForAuth();
    
    // 上传文件到云存储
    const uploadResult = await window.CloudStorage.uploadFile({
      cloudPath: cloudPath,
      filePath: file
    });
    
    const fileID = uploadResult.fileID;
    console.log('✅ 文件上传成功，fileID:', fileID);
    
    // 获取临时 URL（用于显示）
    const tempURLResult = await window.CloudStorage.getTempFileURL({
      fileList: [fileID]
    });
    
    const tempFileURL = tempURLResult.fileList[0].tempFileURL;
    console.log('✅ 获取临时URL成功:', tempFileURL);
    
    return {
      fileID: fileID,
      tempFileURL: tempFileURL
    };
  } catch (error) {
    console.error('❌ 上传文件失败:', error);
    throw new Error('上传失败：' + (error.message || '未知错误'));
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
    console.log('📤 批量上传文件，数量:', files.length);
    
    const uploadPromises = files.map(async (file, index) => {
      const cloudPath = pathGenerator(file, index);
      return await uploadSingleFile(file, cloudPath);
    });
    
    const results = await Promise.all(uploadPromises);
    console.log('✅ 批量上传成功:', results.length);
    return results;
  } catch (error) {
    console.error('❌ 批量上传失败:', error);
    throw new Error('批量上传失败：' + (error.message || '未知错误'));
  }
}

/**
 * 获取单个文件的临时 URL
 * @param {string} fileID - 文件 ID
 * @returns {Promise<string>}
 */
async function getSingleTempURL(fileID) {
  if (!fileID) {
    console.warn('⚠️ fileID 为空，返回空字符串');
    return '';
  }
  
  // 如果已经是 http/https 开头，直接返回
  if (fileID.startsWith('http://') || fileID.startsWith('https://')) {
    return fileID;
  }
  
  try {
    const result = await window.CloudStorage.getTempFileURL({
      fileList: [fileID]
    });
    
    const tempFileURL = result.fileList[0].tempFileURL;
    console.log('✅ 获取临时URL成功:', tempFileURL);
    return tempFileURL;
  } catch (error) {
    console.error('❌ 获取临时URL失败:', error);
    return '';
  }
}

/**
 * 批量获取临时 URLs
 * @param {string[]} fileIDs - 文件 ID 数组
 * @returns {Promise<string[]>}
 */
async function getBatchTempURLs(fileIDs) {
  if (!fileIDs || fileIDs.length === 0) {
    console.warn('⚠️ fileIDs 为空，返回空数组');
    return [];
  }
  
  try {
    console.log('📥 批量获取临时URL，数量:', fileIDs.length);
    
    const result = await window.CloudStorage.getTempFileURL({
      fileList: fileIDs
    });
    
    const tempURLs = result.fileList.map(item => item.tempFileURL);
    console.log('✅ 批量获取临时URL成功:', tempURLs.length);
    return tempURLs;
  } catch (error) {
    console.error('❌ 批量获取临时URL失败:', error);
    return fileIDs;  // 失败时返回原 fileIDs
  }
}

/**
 * 删除文件
 * @param {string[]} fileIDs - 要删除的文件 ID 数组
 * @returns {Promise<void>}
 */
async function deleteFiles(fileIDs) {
  if (!fileIDs || fileIDs.length === 0) {
    console.warn('⚠️ fileIDs 为空，无需删除');
    return;
  }
  
  try {
    console.log('🗑️ 删除文件，数量:', fileIDs.length);
    
    await window.CloudStorage.deleteFile({
      fileList: fileIDs
    });
    
    console.log('✅ 删除文件成功:', fileIDs);
  } catch (error) {
    console.warn('⚠️ 删除文件失败（不阻塞流程）:', error);
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
    // 删除旧文件（如果存在）
    if (oldFileID) {
      console.log('🗑️ 删除旧文件:', oldFileID);
      await deleteFiles([oldFileID]);
    }
    
    // 上传新文件
    return await uploadSingleFile(newFile, cloudPath);
  } catch (error) {
    console.error('❌ 替换文件失败:', error);
    throw error;
  }
}

/**
 * 生成标准化云存储路径
 * @param {string} category - 分类（如 'announcements/covers', 'courses/covers'）
 * @param {string} id - 记录 ID
 * @param {string} filename - 文件名
 * @returns {string} - 云存储路径
 */
function generateCloudPath(category, id, filename) {
  const timestamp = Date.now();
  const ext = filename.substring(filename.lastIndexOf('.'));
  return `${category}/${id}_${timestamp}${ext}`;
}

/**
 * 验证文件
 * @param {File} file - 文件对象
 * @param {Object} options - 验证选项
 * @param {string[]} options.acceptTypes - 允许的 MIME 类型（如 ['image/jpeg', 'image/png']）
 * @param {number} options.maxSize - 最大文件大小（字节）
 * @returns {{valid: boolean, error?: string}}
 */
function validateFile(file, options = {}) {
  const { acceptTypes = ['image/*'], maxSize = 5 * 1024 * 1024 } = options;
  
  // 验证文件类型
  if (acceptTypes && acceptTypes.length > 0) {
    const isTypeValid = acceptTypes.some(type => {
      if (type.endsWith('/*')) {
        // 通配符匹配（如 image/*）
        const prefix = type.split('/')[0];
        return file.type.startsWith(prefix + '/');
      } else {
        // 精确匹配
        return file.type === type;
      }
    });
    
    if (!isTypeValid) {
      return {
        valid: false,
        error: '文件类型不支持，仅支持：' + acceptTypes.join(', ')
      };
    }
  }
  
  // 验证文件大小
  if (maxSize && file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `文件大小不能超过 ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 导出到全局
window.CloudStorageHelper = {
  waitForAuth,
  uploadSingleFile,
  uploadMultipleFiles,
  getSingleTempURL,
  getBatchTempURLs,
  deleteFiles,
  replaceFile,
  generateCloudPath,
  validateFile,
  formatFileSize
};

console.log('✅ CloudStorageHelper 工具函数挂载成功');
