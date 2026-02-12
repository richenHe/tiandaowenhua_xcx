/**
 * 创建资料（管理端接口）
 * 注意：academy_materials 表字段与之前不同
 * - category: 分类（非 type）
 * - image_url: 图片URL（非 cover_image）
 * - video_url: 视频URL
 * - content: 内容
 * - tags: 标签（JSON）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const {
    title,
    category,
    image_url,
    video_url,
    content,
    tags,
    sort_order,
    status
  } = event;

  try {
    // 参数验证
    const validation = validateRequired({ title, category }, ['title', 'category']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 创建资料
    const [result] = await insert('academy_materials', {
      title,
      category,
      image_url,
      video_url,
      content,
      tags: tags || null,
      view_count: 0,
      download_count: 0,
      share_count: 0,
      sort_order: sort_order || 0,
      status: status !== undefined ? status : 1
    });

    return response.success({
      id: result.id
    }, '资料创建成功');

  } catch (error) {
    console.error('[Course/createMaterial] 创建失败:', error);
    return response.error('创建资料失败', error);
  }
};
