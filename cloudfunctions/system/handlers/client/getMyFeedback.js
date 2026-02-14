/**
 * 客户端接口：获取我的反馈列表
 * Action: getMyFeedback
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认10）
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 10, pageSize } = event;

  try {
    console.log(`[getMyFeedback] 用户 ${user.id} 获取反馈列表`);

    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 构建查询（包含课程信息）
    let queryBuilder = db
      .from('feedbacks')
      .select(`
        id,
        type,
        course_id,
        content,
        images,
        contact,
        status,
        reply,
        reply_time,
        created_at,
        course:courses(name, cover_image)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 处理图片字段
    const list = (result.list || []).map(f => ({
      ...f,
      images: f.images ? JSON.parse(f.images) : [],
      type_text: getTypeText(f.type),
      status_text: getStatusText(f.status)
    }));

    return response.success({
      ...result,
      list
    }, '获取成功');

  } catch (error) {
    console.error('[getMyFeedback] 失败:', error);
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
