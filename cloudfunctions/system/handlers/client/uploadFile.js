/**
 * 上传文件到云存储
 * 接收 base64 编码的文件内容，上传到云存储并返回 fileID
 */
const { response, db } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { cloudPath, fileContent } = event;

  // 参数校验
  if (!cloudPath || !fileContent) {
    return response.paramError('缺少必填参数：cloudPath 或 fileContent');
  }

  try {
    // 获取云存储实例
    const cloudbase = require('@cloudbase/node-sdk');
    const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
    
    // 将 base64 转换为 Buffer
    const buffer = Buffer.from(fileContent, 'base64');
    
    // 上传到云存储
    const result = await app.uploadFile({
      cloudPath: cloudPath,
      fileContent: buffer
    });

    console.log('[uploadFile] 上传成功:', {
      cloudPath,
      fileID: result.fileID,
      userID: user.id
    });

    return response.success({
      fileID: result.fileID,
      tempFileURL: result.fileID
    }, '上传成功');
  } catch (error) {
    console.error('[uploadFile] 上传失败:', error);
    return response.error('上传失败', error);
  }
};






