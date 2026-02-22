/**
 * 管理端接口：处理反馈
 * Action: handleFeedback
 *
 * 参数：
 * - feedback_id: 反馈ID
 * - reply: 回复内容
 * - status: 状态（可选，默认2-已处理）
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { feedback_id, reply, status = 2 } = event;

  try {
    // 参数验证
    if (!feedback_id || !reply) {
      return response.paramError('缺少必要参数: feedback_id, reply');
    }

    console.log(`[admin:handleFeedback] 管理员 ${admin.id} 处理反馈 ${feedback_id}`);

    // 验证反馈存在
    const feedback = await findOne('feedbacks', { id: feedback_id });
    if (!feedback) {
      return response.notFound('反馈不存在');
    }

    // 更新反馈
    await update('feedbacks', {
      reply,
      reply_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      reply_admin_id: admin.id,
      status
    }, { id: feedback_id });

    return response.success({
      success: true,
      feedback_id
    }, '处理成功');

  } catch (error) {
    console.error('[admin:handleFeedback] 失败:', error);
    return response.error('处理反馈失败', error);
  }
};
