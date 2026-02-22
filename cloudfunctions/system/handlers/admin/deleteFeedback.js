/**
 * 管理端接口：删除反馈
 * Action: deleteFeedback
 *
 * 参数：
 * - feedback_id: 反馈ID
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { feedback_id } = event;

  try {
    // 参数验证
    if (!feedback_id) {
      return response.paramError('缺少必要参数: feedback_id');
    }

    console.log(`[admin:deleteFeedback] 管理员 ${admin.id} 删除反馈 ${feedback_id}`);

    // 验证反馈存在
    const feedback = await findOne('feedbacks', { id: feedback_id });
    if (!feedback) {
      return response.notFound('反馈不存在');
    }

    // 软删除（更新状态为9）
    await update('feedbacks', {
      status: 9 // 9-已删除
    }, { id: feedback_id });

    return response.success({
      success: true,
      feedback_id
    }, '删除成功');

  } catch (error) {
    console.error('[admin:deleteFeedback] 失败:', error);
    return response.error('删除反馈失败', error);
  }
};
