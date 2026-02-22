/**
 * 更新资料（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：academy_materials
 * 关键字段：category（非 type）、image_url（非 cover_image）、video_url、content（非 description）
 *
 * @param {Object} event
 * @param {number} event.id         - 资料 ID（必填）
 * @param {string} event.title      - 资料名称
 * @param {string} event.category   - 资料分类，对应 DB 字段 category
 * @param {string} event.imageUrl   - 图片URL，对应 DB 字段 image_url
 * @param {string} event.videoUrl   - 视频URL，对应 DB 字段 video_url
 * @param {string} event.content    - 文字内容，对应 DB 字段 content
 * @param {number} event.sortOrder  - 排序，对应 DB 字段 sort_order
 * @param {number} event.status     - 状态：0隐藏/1显示
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  // 接收 camelCase 参数
  const {
    id,
    title,
    category,
    imageUrl,
    videoUrl,
    content,
    sortOrder,
    status
  } = event;

  try {
    // 参数验证
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询资料是否存在
    const material = await findOne('academy_materials', { id });
    if (!material) {
      return response.notFound('资料不存在');
    }

    // 转换 camelCase → snake_case，构建 DB 更新字段
    // 只添加实际传入的字段（undefined 表示未传，跳过）
    const fieldsToUpdate = {};
    if (title !== undefined) fieldsToUpdate.title = title;
    if (category !== undefined) fieldsToUpdate.category = category;
    if (imageUrl !== undefined) fieldsToUpdate.image_url = imageUrl;
    if (videoUrl !== undefined) fieldsToUpdate.video_url = videoUrl;
    if (content !== undefined) fieldsToUpdate.content = content;
    if (sortOrder !== undefined) fieldsToUpdate.sort_order = sortOrder;
    if (status !== undefined) fieldsToUpdate.status = status;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    // 更新资料（fieldsToUpdate 仅含 DB 真实存在的列）
    await update('academy_materials', fieldsToUpdate, { id });

    return response.success({
      success: true,
      message: '资料更新成功'
    });

  } catch (error) {
    console.error('[Course/updateMaterial] 更新失败:', error);
    return response.error('更新资料失败', error);
  }
};
