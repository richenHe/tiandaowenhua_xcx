/**
 * 管理端接口：回复反馈
 * Action: replyFeedback
 *
 * 参数：
 * - id: 反馈ID
 * - reply_content: 回复内容
 * - status: 状态（1-已回复，2-已关闭）
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { id, reply_content, status = 1 } = event;

  try {
    // 参数验证
    if (!id || !reply_content) {
      return response.paramError('缺少必要参数: id, reply_content');
    }

    console.log(`[admin:replyFeedback] 管理员 ${admin.id} 回复反馈 ${id}`);

    // 验证反馈存在
    const feedback = await findOne('feedbacks', { id });
    if (!feedback) {
      return response.notFound('反馈不存在');
    }

    // 更新反馈
    await update('feedbacks', {
      reply_content,
      reply_at: new Date(),
      status,
      updated_at: new Date()
    }, { id });

    // TODO: 发送订阅消息通知用户

    return response.success({ id }, '回复成功');

  } catch (error) {
    console.error('[admin:replyFeedback] 失败:', error);
    return response.error('回复反馈失败', error);
  }
};
