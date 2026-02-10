/**
 * 客户端接口：获取我的反馈列表
 * Action: getMyFeedback
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认10）
 */
const { query, db } = require('../../common/db');
const { response, getPagination } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { page = 1, page_size = 10 } = event;

  try {
    console.log(`[getMyFeedback] 用户 ${user.id} 获取反馈列表`);

    const { limit, offset } = getPagination(page, page_size);

    // 查询反馈列表（包含课程信息）
    const { data: feedbacks, error } = await db
      .from('feedbacks')
      .select(`
        id,
        type,
        course_id,
        content,
        images,
        contact,
        status,
        reply_content,
        reply_at,
        created_at,
        course:courses(name, cover_image)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 统计总数
    const { count: total } = await db
      .from('feedbacks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 处理图片字段
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
