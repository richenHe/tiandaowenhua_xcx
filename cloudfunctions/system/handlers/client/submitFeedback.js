/**
 * 客户端接口：提交反馈
 * Action: submitFeedback
 *
 * 参数：
 * - type: 反馈类型（1-5）
 * - courseId/course_id: 课程ID（可选）
 * - content: 反馈内容
 * - images: 图片数组（可选）
 * - contact: 联系方式（可选）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { type, courseId, course_id, content, images, contact } = event;
  const finalCourseId = courseId || course_id; // 支持两种命名

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
      status: 0 // 待处理
    };

    if (finalCourseId) {
      feedbackData.course_id = finalCourseId;
    }

    // images 字段应该是 TEXT 类型，存储 JSON 字符串
    if (images && Array.isArray(images) && images.length > 0) {
      feedbackData.images = JSON.stringify(images);
    }

    if (contact) {
      feedbackData.contact = contact;
    }

    const { data: newFeedback, error } = await db
      .from('feedbacks')
      .insert(feedbackData)
      .select()
      .single();

    if (error) {
      console.error('[submitFeedback] 插入失败:', error);
      throw error;
    }

    return response.success({
      id: newFeedback.id,
      created_at: newFeedback.created_at
    }, '提交成功，我们会尽快处理');

  } catch (error) {
    console.error('[submitFeedback] 失败:', error);
    return response.error('提交反馈失败', error);
  }
};
