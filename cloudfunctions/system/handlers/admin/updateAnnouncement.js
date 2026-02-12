/**
 * 管理端接口：更新公告
 * Action: updateAnnouncement
 *
 * 参数：
 * - id: 公告ID
 * - title: 公告标题（可选）
 * - content: 公告内容（可选）
 * - summary: 摘要（可选）
 * - category: 公告分类（可选）
 * - target_type: 目标用户类型（可选）
 * - target_level: 目标大使等级（可选）
 * - is_top: 是否置顶（可选）
 * - is_popup: 是否弹窗（可选）
 * - start_time: 开始时间（可选）
 * - end_time: 结束时间（可选）
 * - sort_order: 排序（可选）
 * - status: 状态（可选）
 */
const { findOne, update } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { 
    id, 
    title, 
    content, 
    summary,
    category, 
    target_type, 
    target_level,
    is_top,
    is_popup,
    start_time, 
    end_time, 
    sort_order, 
    status 
  } = event;

  try {
    // 参数验证
    if (!id) {
      return response.paramError('缺少必要参数: id');
    }

    console.log(`[admin:updateAnnouncement] 管理员 ${admin.id} 更新公告 ${id}`);

    // 验证公告存在
    const announcement = await findOne('announcements', { id });
    if (!announcement) {
      return response.notFound('公告不存在');
    }

    // 构建更新数据（updated_at 使用数据库默认值）
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (category) updateData.category = category;
    if (target_type !== undefined) updateData.target_type = target_type;
    if (target_level !== undefined) updateData.target_level = target_level;
    if (is_top !== undefined) updateData.is_top = is_top;
    if (is_popup !== undefined) updateData.is_popup = is_popup;
    if (start_time) updateData.start_time = formatDateTime(start_time);
    if (end_time) updateData.end_time = formatDateTime(end_time);
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (status !== undefined) updateData.status = status;

    // 更新公告
    await update('announcements', updateData, { id });

    return response.success({ id }, '更新成功');

  } catch (error) {
    console.error('[admin:updateAnnouncement] 失败:', error);
    return response.error('更新公告失败', error);
  }
};
