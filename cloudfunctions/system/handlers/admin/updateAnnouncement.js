/**
 * 管理端接口：更新公告
 * Action: updateAnnouncement
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * @param {number}  event.id           - 公告 ID（必填）
 * @param {string}  event.title        - 公告标题
 * @param {string}  event.content      - 公告内容
 * @param {string}  event.summary      - 摘要
 * @param {string}  event.category     - 公告分类
 * @param {string}  event.coverImage   - 封面图片 fileID，对应 DB 字段 cover_image
 * @param {string}  event.link         - 跳转链接
 * @param {number}  event.targetType   - 目标用户类型，对应 DB target_type
 * @param {number}  event.targetLevel  - 目标大使等级，对应 DB target_level
 * @param {number}  event.isTop        - 是否置顶，对应 DB is_top
 * @param {number}  event.isPopup      - 是否弹窗，对应 DB is_popup
 * @param {string}  event.startTime    - 开始时间，对应 DB start_time
 * @param {string}  event.endTime      - 结束时间，对应 DB end_time
 * @param {number}  event.sortOrder    - 排序，对应 DB sort_order
 * @param {number}  event.status       - 状态
 */
const { findOne, update } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  // 接收 camelCase 参数
  const {
    id,
    title,
    content,
    summary,
    category,
    coverImage,
    link,
    targetType,
    targetLevel,
    isTop,
    isPopup,
    startTime,
    endTime,
    sortOrder,
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

    // 转换 camelCase → snake_case，构建 DB 更新字段
    // 只添加实际传入的字段（undefined 表示未传，跳过）
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (category !== undefined) updateData.category = category;
    if (coverImage !== undefined) updateData.cover_image = coverImage;  // camelCase → snake_case
    if (link !== undefined) updateData.link = link;
    if (targetType !== undefined) updateData.target_type = targetType;
    if (targetLevel !== undefined) updateData.target_level = targetLevel;
    if (isTop !== undefined) updateData.is_top = isTop;
    if (isPopup !== undefined) updateData.is_popup = isPopup;
    if (startTime) updateData.start_time = formatDateTime(startTime);
    if (endTime) updateData.end_time = formatDateTime(endTime);
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    if (status !== undefined) updateData.status = status;

    // 更新公告（updateData 仅含 DB 真实存在的列）
    await update('announcements', updateData, { id });

    return response.success({ success: true, id }, '更新成功');

  } catch (error) {
    console.error('[admin:updateAnnouncement] 失败:', error);
    return response.error('更新公告失败', error);
  }
};
