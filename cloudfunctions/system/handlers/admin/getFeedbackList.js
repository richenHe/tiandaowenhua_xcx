/**
 * 管理端接口：获取反馈列表
 * Action: getFeedbackList
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 * - status: 状态筛选（可选）
 * - type: 类型筛选（可选）
 */
const { db } = require('../../common/db');
const { response, getPagination } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, status, type } = event;

  try {
    console.log(`[admin:getFeedbackList] 管理员 ${admin.id} 获取反馈列表`);

    const { limit, offset } = getPagination(page, page_size);

    // 构建查询
    let query = db
      .from('feedbacks')
      .select(`
        id,
        user_id,
        type,
        course_id,
        content,
        images,
        contact,
        status,
        reply_content,
        reply_at,
        created_at,
        user:users!user_id(real_name, phone),
        course:courses(name)
      `)
      .order('created_at', { ascending: false });

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      query = query.eq('status', status);
    }

    // 类型筛选
    if (type) {
      query = query.eq('type', type);
    }

    // 分页
    const { data: feedbacks, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 统计总数
    let countQuery = db
      .from('feedbacks')
      .select('*', { count: 'exact', head: true });

    if (status !== undefined && status !== null && status !== '') {
      countQuery = countQuery.eq('status', status);
    }
    if (type) {
      countQuery = countQuery.eq('type', type);
    }

    const { count: total } = await countQuery;

    // 处理数据
    const processedFeedbacks = feedbacks.map(f => ({
      ...f,
      images: f.images ? JSON.parse(f.images) : [],
      type_text: getTypeText(f.type),
      status_text: getStatusText(f.status)
    }));

    return response.success({
      list: processedFeedbacks,
      total,
      page: parseInt(page),
      page_size: parseInt(page_size)
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getFeedbackList] 失败:', error);
    return response.error('获取反馈列表失败', error);
  }
};

// 获取类型文本
function getTypeText(type) {
  const typeMap = {
    1: '课程内容',
    2: '功能建议',
    3: '系统问题',
    4: '服务态度',
    5: '其他反馈'
  };
  return typeMap[type] || '未知';
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    0: '待处理',
    1: '已回复',
    2: '已关闭'
  };
  return statusMap[status] || '未知';
}
