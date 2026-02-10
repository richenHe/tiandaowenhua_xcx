/**
 * 创建资料（管理端接口）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const {
    title,
    type,
    cover_image,
    description,
    file_url,
    file_size,
    sort_order,
    status
  } = event;

  try {
    // 参数验证
    const validation = validateRequired({ title, type, file_url }, ['title', 'type', 'file_url']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 验证类型值：1-文档 2-视频 3-音频 4-图片
    if (![1, 2, 3, 4].includes(parseInt(type))) {
      return response.paramError('无效的资料类型');
    }

    // 创建资料
    const materialId = await insert('academy_materials', {
      title,
      type,
      cover_image,
      description,
      file_url,
      file_size: file_size || 0,
      download_count: 0,
      sort_order: sort_order || 0,
      status: status !== undefined ? status : 1
    });

    return response.success({
      message: '资料创建成功',
      material_id: materialId
    });

  } catch (error) {
    console.error('[Course/createMaterial] 创建失败:', error);
    return response.error('创建资料失败', error);
  }
};
