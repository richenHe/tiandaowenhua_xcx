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
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, status, type } = event;

  try {
    console.log(`[admin:getFeedbackList] 管理员 ${admin.id} 获取反馈列表`);

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 20;

    // 构建查询（使用外键名进行 JOIN）
    let queryBuilder = db
      .from('feedbacks')
      .select(`
        id,
        user_id,
        feedback_type,
        course_id,
        content,
        images,
        contact,
        status,
        reply,
        reply_time,
        reply_admin_id,
        created_at,
        user:users!fk_feedbacks_user(real_name, phone),
        course:courses!fk_feedbacks_course(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // 状态筛选
    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', status);
    }

    // 类型筛选
    if (type) {
      queryBuilder = queryBuilder.eq('feedback_type', type);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 处理数据
    const list = (result.list || []).map(f => {
      let images = [];

      // 安全解析 images 字段
      if (f.images) {
        try {
          // 如果是 JSON 数组字符串
          images = JSON.parse(f.images);
        } catch (e) {
          // 如果解析失败，可能是单个字符串，转为数组
          if (typeof f.images === 'string' && f.images.trim()) {
            images = [f.images];
          }
        }
      }

      return {
        ...f,
        images,
        type_text: getTypeText(f.feedback_type),
        status_text: getStatusText(f.status)
      };
    });

    return response.success({
      ...result,
      list
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
