/**
 * 管理端接口：创建公告
 * Action: createAnnouncement
 *
 * 参数：
 * - title: 公告标题
 * - content: 公告内容
 * - summary: 摘要（可选）
 * - category: 公告分类（general-普通，system-系统，course-课程，ambassador-大使，banner-轮播图）
 * - cover_image: 封面图片 fileID（可选，云存储）
 * - link: 跳转链接（可选，用于轮播图）
 * - target_type: 目标用户类型（0-全部，1-学员，2-大使）
 * - target_level: 目标大使等级（可选）
 * - is_top: 是否置顶（0-否，1-是）
 * - is_popup: 是否弹窗（0-否，1-是）
 * - start_time: 开始时间（可选）
 * - end_time: 结束时间（可选）
 * - sort_order: 排序（可选）
 */
const { insert } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { 
    title, 
    content, 
    summary = '',
    category = 'general', 
    cover_image = '',
    link = '',
    target_type = 0, 
    target_level = null,
    is_top = 0,
    is_popup = 0,
    start_time, 
    end_time, 
    sort_order = 0 
  } = event;

  try {
    // 参数验证
    if (!title || !content) {
      return response.paramError('缺少必要参数: title, content');
    }

    console.log(`[admin:createAnnouncement] 管理员 ${admin.id} 创建公告`);

    // 创建公告
    const announcementData = {
      title,
      content,
      summary,
      category,
      cover_image,
      link,
      target_type,
      target_level,
      is_top,
      is_popup,
      sort_order,
      status: 1,
      created_by: admin.id
    };

    // 时间字段使用 MySQL 格式
    if (start_time) announcementData.start_time = formatDateTime(start_time);
    if (end_time) announcementData.end_time = formatDateTime(end_time);

    const [announcement] = await insert('announcements', announcementData);

    return response.success({ id: announcement.id }, '创建成功');

  } catch (error) {
    console.error('[admin:createAnnouncement] 失败:', error);
    return response.error('创建公告失败', error);
  }
};
