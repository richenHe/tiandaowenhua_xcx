/**
 * 管理端接口：获取公告列表
 * Action: getAnnouncementList
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 * - type: 类型筛选（可选）
 * - status: 状态筛选（可选）
 */
const { db } = require('../../common/db');
const { response, getPagination } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, type, status } = event;

  try {
    console.log(`[admin:getAnnouncementList] 管理员 ${admin.id} 获取公告列表`);

    const { limit, offset } = getPagination(page, page_size);

    // 构建查询
    let query = db
      .from('announcements')
      .select(`
        id,
        title,
        content,
        type,
        target,
        start_time,
        end_time,
        sort_order,
        status,
        created_by,
        created_at,
        updated_at,
        creator:admin_users!created_by(real_name)
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    // 筛选条件
    if (type) query = query.eq('type', type);
    if (status !== undefined && status !== null && status !== '') {
      query = query.eq('status', status);
    }

    // 分页
    const { data: announcements, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 统计总数
    let countQuery = db
      .from('announcements')
      .select('*', { count: 'exact', head: true });

    if (type) countQuery = countQuery.eq('type', type);
    if (status !== undefined && status !== null && status !== '') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: total } = await countQuery;

    // 处理数据
    const processedAnnouncements = announcements.map(a => ({
      ...a,
      type_text: getTypeText(a.type),
      target_text: getTargetText(a.target),
      status_text: a.status === 1 ? '启用' : '禁用'
    }));

    return response.success({
      list: processedAnnouncements,
      total,
      page: parseInt(page),
      page_size: parseInt(page_size)
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getAnnouncementList] 失败:', error);
    return response.error('获取公告列表失败', error);
  }
};

// 获取类型文本
function getTypeText(type) {
  const typeMap = {
    1: '系统通知',
    2: '活动公告',
    3: '维护公告'
  };
  return typeMap[type] || '未知';
}

// 获取目标文本
function getTargetText(target) {
  const targetMap = {
    'all': '全部用户',
    'ambassador': '大使',
    'student': '学员'
  };
  return targetMap[target] || '未知';
}
