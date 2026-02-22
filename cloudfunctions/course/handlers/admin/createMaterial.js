/**
 * 创建资料（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：academy_materials
 * 关键字段：category（非 type）、image_url（非 cover_image）、video_url、content（非 description）
 *
 * @param {Object} event
 * @param {string} event.title      - 资料名称（必填）
 * @param {string} event.category   - 资料分类（必填），对应 DB 字段 category
 * @param {string} event.imageUrl   - 图片URL，对应 DB 字段 image_url
 * @param {string} event.videoUrl   - 视频URL，对应 DB 字段 video_url
 * @param {string} event.content    - 文字内容，对应 DB 字段 content
 * @param {number} event.sortOrder  - 排序，对应 DB 字段 sort_order（默认 0）
 * @param {number} event.status     - 状态：0隐藏/1显示（默认 1）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  // 接收 camelCase 参数
  const {
    title,
    category,
    imageUrl,
    videoUrl,
    content,
    sortOrder,
    status
  } = event;

  try {
    // 参数验证（camelCase key）
    const validation = validateRequired(
      { title, category },
      ['title', 'category']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // camelCase → snake_case，写入 DB
    const [result] = await insert('academy_materials', {
      title,
      category,
      image_url: imageUrl || null,
      video_url: videoUrl || null,
      content: content || null,
      tags: null,
      view_count: 0,
      download_count: 0,
      share_count: 0,
      sort_order: sortOrder || 0,
      status: status !== undefined ? status : 1
    });

    return response.success({
      materialId: result.id,
      message: '资料创建成功'
    });

  } catch (error) {
    console.error('[Course/createMaterial] 创建失败:', error);
    return response.error('创建资料失败', error);
  }
};
