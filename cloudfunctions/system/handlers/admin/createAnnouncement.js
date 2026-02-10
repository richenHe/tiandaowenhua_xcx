/**
 * 管理端接口：创建公告
 * Action: createAnnouncement
 *
 * 参数：
 * - title: 公告标题
 * - content: 公告内容
 * - type: 公告类型（1-系统通知，2-活动公告，3-维护公告）
 * - target: 目标用户（all-全部，ambassador-大使，student-学员）
 * - start_time: 开始时间（可选）
 * - end_time: 结束时间（可选）
 * - sort_order: 排序（可选）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { title, content, type, target = 'all', start_time, end_time, sort_order = 0 } = event;

  try {
    // 参数验证
    if (!title || !content || !type) {
      return response.paramError('缺少必要参数: title, content, type');
    }

    console.log(`[admin:createAnnouncement] 管理员 ${admin.id} 创建公告`);

    // 创建公告
    const announcementData = {
      title,
      content,
      type,
      target,
      sort_order,
      status: 1,
      created_by: admin.id,
      created_at: new Date()
    };

    if (start_time) announcementData.start_time = new Date(start_time);
    if (end_time) announcementData.end_time = new Date(end_time);

    const [announcement] = await insert('announcements', announcementData);

    return response.success({ id: announcement.id }, '创建成功');

  } catch (error) {
    console.error('[admin:createAnnouncement] 失败:', error);
    return response.error('创建公告失败', error);
  }
};
