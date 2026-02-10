/**
 * 客户端接口：提交反馈
 * Action: submitFeedback
 *
 * 参数：
 * - type: 反馈类型（1-5）
 * - course_id: 课程ID（可选）
 * - content: 反馈内容
 * - images: 图片列表（可选）
 * - contact: 联系方式（可选）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { type, course_id, content, images, contact } = event;

  try {
    // 参数验证
    if (!type || !content) {
      return response.paramError('缺少必要参数: type, content');
    }

    if (type < 1 || type > 5) {
      return response.paramError('反馈类型无效');
    }

    if (content.length < 5 || content.length > 500) {
      return response.paramError('反馈内容长度应在5-500字之间');
    }

    console.log(`[submitFeedback] 用户 ${user.id} 提交反馈`);

    // 创建反馈记录
    const feedbackData = {
      user_id: user.id,
      type,
      content,
      status: 0, // 待处理
      created_at: new Date()
    };

    if (course_id) {
      feedbackData.course_id = course_id;
    }

    if (images && Array.isArray(images) && images.length > 0) {
      feedbackData.images = JSON.stringify(images);
    }

    if (contact) {
      feedbackData.contact = contact;
    }

    const [feedback] = await insert('feedbacks', feedbackData);

    return response.success({
      id: feedback.id,
      created_at: feedback.created_at
    }, '提交成功，我们会尽快处理');

  } catch (error) {
    console.error('[submitFeedback] 失败:', error);
    return response.error('提交反馈失败', error);
  }
};
