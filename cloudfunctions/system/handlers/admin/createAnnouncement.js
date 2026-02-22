/**
 * 管理端接口：创建公告
 * Action: createAnnouncement
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * @param {string}  event.title        - 公告标题（必填）
 * @param {string}  event.content      - 公告内容（必填）
 * @param {string}  event.summary      - 摘要（可选）
 * @param {string}  event.category     - 公告分类（general/system/course/ambassador/banner）
 * @param {string}  event.coverImage   - 封面图片 fileID（可选），对应 DB 字段 cover_image
 * @param {string}  event.link         - 跳转链接（可选，用于轮播图）
 * @param {number}  event.targetType   - 目标用户类型（0-全部，1-学员，2-大使），对应 DB target_type
 * @param {number}  event.targetLevel  - 目标大使等级，对应 DB target_level
 * @param {number}  event.isTop        - 是否置顶（0/1），对应 DB is_top
 * @param {number}  event.isPopup      - 是否弹窗（0/1），对应 DB is_popup
 * @param {string}  event.startTime    - 开始时间，对应 DB start_time
 * @param {string}  event.endTime      - 结束时间，对应 DB end_time
 * @param {number}  event.sortOrder    - 排序，对应 DB sort_order
 * @param {number}  event.status       - 状态（默认 1）
 */
const { insert } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  // 接收 camelCase 参数
  const {
    title,
    content,
    summary = '',
    category = 'general',
    coverImage = '',
    link = '',
    targetType = 0,
    targetLevel = null,
    isTop = 0,
    isPopup = 0,
    startTime,
    endTime,
    sortOrder = 0,
    status = 1
  } = event;

  try {
    // 参数验证
    if (!title || !content) {
      return response.paramError('缺少必要参数: title, content');
    }

    console.log(`[admin:createAnnouncement] 管理员 ${admin.id} 创建公告`);

    // camelCase → snake_case，写入 DB
    const announcementData = {
      title,
      content,
      summary,
      category,
      cover_image: coverImage,      // camelCase → snake_case
      link,
      target_type: targetType,       // camelCase → snake_case
      target_level: targetLevel,
      is_top: isTop,
      is_popup: isPopup,
      sort_order: sortOrder,
      status,
      created_by: admin.id
    };

    // 时间字段使用 MySQL 格式
    if (startTime) announcementData.start_time = formatDateTime(startTime);
    if (endTime) announcementData.end_time = formatDateTime(endTime);

    const [announcement] = await insert('announcements', announcementData);

    return response.success({ announcementId: announcement.id }, '创建成功');

  } catch (error) {
    console.error('[admin:createAnnouncement] 失败:', error);
    return response.error('创建公告失败', error);
  }
};
