/**
 * 管理端接口：获取反馈详情
 * Action: getFeedbackDetail
 *
 * 参数：
 * - feedback_id: 反馈ID
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { feedback_id } = event;

  try {
    // 参数验证
    if (!feedback_id) {
      return response.paramError('缺少必要参数: feedback_id');
    }

    console.log(`[admin:getFeedbackDetail] 管理员 ${admin.id} 获取反馈详情 ${feedback_id}`);

    // 查询反馈
    const { data: feedbacks, error: feedbackError } = await db
      .from('feedbacks')
      .select('*')
      .eq('id', feedback_id)
      .single();

    if (feedbackError) throw feedbackError;

    if (!feedbacks) {
      return response.notFound('反馈不存在');
    }

    // 查询用户信息
    let user = null;
    if (feedbacks.user_id) {
      const { data: userData, error: userError } = await db
        .from('users')
        .select('id, user_name, avatar, phone')
        .eq('id', feedbacks.user_id)
        .single();

      if (!userError && userData) {
        user = userData;
      }
    }

    return response.success({
      id: feedbacks.id,
      user_id: feedbacks.user_id,
      user,
      type: feedbacks.type,
      category: feedbacks.category,
      related_id: feedbacks.related_id,
      content: feedbacks.content,
      images: feedbacks.images ? (Array.isArray(feedbacks.images) ? feedbacks.images : JSON.parse(feedbacks.images)) : [],
      contact: feedbacks.contact,
      reply: feedbacks.reply,
      reply_time: feedbacks.reply_time,
      reply_admin_id: feedbacks.reply_admin_id,
      status: feedbacks.status,
      created_at: feedbacks.created_at,
      updated_at: feedbacks.updated_at
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getFeedbackDetail] 失败:', error);
    return response.error('获取反馈详情失败', error);
  }
};
