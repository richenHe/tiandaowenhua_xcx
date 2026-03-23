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
  // 🔥 等待认证完成
  await waitForAuth();

  // 上传文件（单独 try-catch，失败直接抛出）
  let fileID;
  try {
    console.log('📤 开始上传文件:', cloudPath);
    const uploadResult = await window.CloudStorage.uploadFile({
      cloudPath: cloudPath,
      filePath: file
    });
    fileID = uploadResult.fileID;
    console.log('✅ 文件上传成功，fileID:', fileID);
  } catch (error) {
    console.error('❌ 上传文件失败:', error);
    throw new Error('上传失败：' + (error.message || '未知错误'));
  }

  // 获取临时 URL（单独 try-catch，失败不影响上传结果，返回空字符串）
  let tempFileURL = '';
  try {
    const tempURLResult = await window.CloudStorage.getTempFileURL({
      fileList: [fileID]
    });
    tempFileURL = tempURLResult.fileList[0].tempFileURL || '';
    console.log('✅ 获取临时URL成功:', tempFileURL);
  } catch (error) {
    // getTempFileURL 在部分场景下可能因鉴权失败，不阻塞上传流程
    console.warn('⚠️ 获取临时URL失败（不影响上传），fileID:', fileID, error.message || error);
  }

  return { fileID, tempFileURL };
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

  // 已经是 HTTP/HTTPS URL 的直接返回，只对 cloud:// 调 SDK
  const needConvert = fileIDs.filter(id => id && !id.startsWith('http://') && !id.startsWith('https://'));
  if (needConvert.length === 0) {
    // 全部已是可直接使用的 URL，按原顺序返回
    return fileIDs;
  }

  try {
    console.log('📥 批量获取临时URL，数量:', needConvert.length);
    
    const result = await window.CloudStorage.getTempFileURL({
      fileList: needConvert
    });

    // 建立 fileID → tempFileURL 映射
    const urlMap = {};
    result.fileList.forEach(item => {
      if (item.tempFileURL) urlMap[item.fileID] = item.tempFileURL;
    });

    // 按原 fileIDs 顺序返回（已是 HTTP URL 的原样保留）
    const tempURLs = fileIDs.map(id => {
      if (id && (id.startsWith('http://') || id.startsWith('https://'))) return id;
      return urlMap[id] || id;
    });
    console.log('✅ 批量获取临时URL成功:', tempURLs.length);
    return tempURLs;
  } catch (error) {
    console.error('❌ 批量获取临时URL失败:', error);
    return fileIDs;
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

/**
 * 将 cloud:// fileID 直接转换为 CDN HTTPS URL，无需 API 调用、无需认证
 * 格式：cloud://{envId}.{bucket}/{path} → https://{bucket}.tcb.qcloud.la/{path}
 * @param {string} fileID - cloud:// 格式的文件 ID
 * @returns {string}
 */
function cloudFileIDToURL(fileID) {
  if (!fileID) return '';
  if (fileID.startsWith('http://') || fileID.startsWith('https://')) return fileID;
  if (!fileID.startsWith('cloud://')) return fileID;
  const withoutScheme = fileID.slice(8);
  const dotIdx = withoutScheme.indexOf('.');
  const slashIdx = withoutScheme.indexOf('/');
  if (dotIdx === -1 || slashIdx === -1 || dotIdx >= slashIdx) return fileID;
  const bucket = withoutScheme.slice(dotIdx + 1, slashIdx);
  const filePath = withoutScheme.slice(slashIdx + 1);
  return `https://${bucket}.tcb.qcloud.la/${filePath}`;
}

/**
 * 批量将 cloud:// fileID 转换为 CDN HTTPS URL，无需 API 调用
 * @param {string[]} fileIDs
 * @returns {string[]}
 */
function batchCloudFileIDToURL(fileIDs) {
  if (!Array.isArray(fileIDs)) return [];
  return fileIDs.map(cloudFileIDToURL).filter(Boolean);
}

// 导出到全局
window.CloudStorageHelper = {
  waitForAuth,
  uploadSingleFile,
  uploadMultipleFiles,
  getSingleTempURL,
  getBatchTempURLs,
  cloudFileIDToURL,
  batchCloudFileIDToURL,
  deleteFiles,
  replaceFile,
  generateCloudPath,
  validateFile,
  formatFileSize
};

console.log('✅ CloudStorageHelper 工具函数挂载成功');

/* =====================================================================
 * CloudImageUpload — 统一云存储图片上传 Vue 组件
 *
 * 用法（在 createApp 注册后使用）：
 *   app.component('cloud-image-upload', CloudUploadComponents.CloudImageUpload)
 *
 * 模板示例：
 *   <cloud-image-upload
 *     v-model="formData.coverImageURL"
 *     v-model:file-id="formData.coverImage"
 *     path-prefix="banners"
 *     :item-id="formData.id || 'new'"
 *     tips="建议尺寸：750×360，支持 JPG/PNG，不超过 5MB"
 *   />
 * ===================================================================== */
(function () {
  // 注入全局 CSS（只注入一次）
  if (!document.getElementById('cloud-upload-style')) {
    const style = document.createElement('style');
    style.id = 'cloud-upload-style';
    style.textContent = `
      .cu-wrap { display: inline-block; }
      .cu-area {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 2px dashed #dcdcdc;
        border-radius: 8px;
        background: #fafafa;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s;
        box-sizing: border-box;
        overflow: hidden;
      }
      .cu-area:hover { border-color: #0052d9; background: #f0f4ff; }
      .cu-area input[type=file] { display: none; }
      .cu-area .cu-icon { font-size: 36px; color: #bbb; margin-bottom: 6px; }
      .cu-area .cu-text { color: #999; font-size: 13px; }
      .cu-preview { border-radius: 8px; border: 1px solid #dcdcdc; box-sizing: border-box; overflow: hidden; }
      .cu-preview img { display: block; width: 100%; object-fit: cover; }
      .cu-actions { display: flex; gap: 8px; margin-top: 8px; align-items: center; }
      .cu-btn-replace {
        display: inline-flex; align-items: center; justify-content: center;
        height: 28px; padding: 0 12px; border-radius: 4px; font-size: 13px;
        border: 1px solid #dcdcdc; background: #fff; color: #333;
        cursor: pointer; transition: border-color 0.2s, color 0.2s;
        white-space: nowrap; outline: none;
      }
      .cu-btn-replace:hover:not(:disabled) { border-color: #0052d9; color: #0052d9; }
      .cu-btn-replace:disabled { opacity: 0.6; cursor: not-allowed; }
      .cu-tips { margin-top: 6px; font-size: 12px; color: #999; }
      .cu-uploading { opacity: 0.6; pointer-events: none; }
    `;
    document.head.appendChild(style);
  }

  const CloudImageUpload = {
    name: 'CloudImageUpload',
    props: {
      modelValue: { type: String, default: '' },
      fileId:     { type: String, default: '' },
      pathPrefix: { type: String, default: 'uploads' },
      itemId:     { type: [String, Number], default: 'new' },
      maxSize:    { type: Number, default: 5 * 1024 * 1024 },
      accept:     { type: String, default: 'image/jpeg,image/png,image/jpg,image/gif,image/webp' },
      tips:       { type: String, default: '' },
      width:      { type: [Number, String], default: 320 },
      height:     { type: [Number, String], default: 160 },
    },
    emits: ['update:modelValue', 'update:fileId', 'uploaded', 'removed'],
    setup(props, { emit }) {
      const { ref } = Vue;
      const uploading = ref(false);

      const w = () => (typeof props.width  === 'number' ? props.width  + 'px' : props.width);
      const h = () => (typeof props.height === 'number' ? props.height + 'px' : props.height);

      async function doUpload(file) {
        const helper = window.CloudStorageHelper;
        const validation = helper.validateFile(file, {
          acceptTypes: props.accept.split(',').map(s => s.trim()),
          maxSize: props.maxSize
        });
        if (!validation.valid) {
          TDesign.MessagePlugin.warning(validation.error);
          return;
        }
        try {
          uploading.value = true;
          TDesign.MessagePlugin.loading('上传中...', 0);
          if (props.fileId) {
            try { await helper.deleteFiles([props.fileId]); } catch (_) {}
          }
          const cloudPath = helper.generateCloudPath(props.pathPrefix, props.itemId || 'new', file.name);
          const result = await helper.uploadSingleFile(file, cloudPath);
          TDesign.MessagePlugin.closeAll();
          TDesign.MessagePlugin.success('上传成功');
          emit('update:fileId', result.fileID);
          emit('update:modelValue', result.tempFileURL);
          emit('uploaded', { fileId: result.fileID, url: result.tempFileURL });
        } catch (err) {
          TDesign.MessagePlugin.closeAll();
          TDesign.MessagePlugin.error('上传失败：' + err.message);
        } finally {
          uploading.value = false;
        }
      }

      // 通过动态创建 input 触发文件选择，绕过 Dialog 内的事件拦截问题
      function openFilePicker() {
        if (uploading.value) return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = props.accept;
        input.style.cssText = 'position:fixed;top:-999px;left:-999px;opacity:0;';
        document.body.appendChild(input);
        input.addEventListener('change', function (e) {
          const file = e.target.files[0];
          if (file) doUpload(file);
          document.body.removeChild(input);
        });
        input.addEventListener('cancel', function () {
          document.body.removeChild(input);
        });
        input.click();
      }

      async function handleRemove() {
        if (props.fileId) {
          try { await window.CloudStorageHelper.deleteFiles([props.fileId]); } catch (_) {}
        }
        emit('update:fileId', '');
        emit('update:modelValue', '');
        emit('removed');
        TDesign.MessagePlugin.success('已删除');
      }

      return { uploading, openFilePicker, handleRemove, w, h };
    },
    template: `
      <div class="cu-wrap">
        <!-- 无图片时：点击整块上传 -->
        <div
          v-if="!modelValue"
          class="cu-area"
          :class="{ 'cu-uploading': uploading }"
          :style="{ width: w(), height: h() }"
          @click="openFilePicker"
        >
          <span class="cu-icon">🖼</span>
          <span class="cu-text">{{ uploading ? '上传中...' : '点击上传图片' }}</span>
        </div>

        <!-- 有图片时：显示预览 + 操作按钮 -->
        <div v-else>
          <div class="cu-preview" :style="{ width: w() }">
            <img :src="modelValue" :style="{ height: h() }" />
          </div>
          <div class="cu-actions">
            <button
              class="cu-btn-replace"
              :disabled="uploading"
              @click="openFilePicker"
            >{{ uploading ? '上传中...' : '更换图片' }}</button>
            <t-button size="small" theme="danger" variant="outline" @click="handleRemove">删除图片</t-button>
          </div>
        </div>

        <div v-if="tips" class="cu-tips">{{ tips }}</div>
      </div>
    `
  };

  window.CloudUploadComponents = { CloudImageUpload };
})();
