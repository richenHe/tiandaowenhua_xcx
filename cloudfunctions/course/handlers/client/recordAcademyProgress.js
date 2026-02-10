/**
 * 记录商学院学习进度（客户端接口）
 */
const { findOne, insert, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { content_id, content_type, progress, duration } = event;
  const { user } = context;

  try {
    // 参数验证
    const validation = validateRequired(
      { content_id, content_type, progress },
      ['content_id', 'content_type', 'progress']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 验证 content_type: 1-介绍 2-案例 3-资料
    if (![1, 2, 3].includes(parseInt(content_type))) {
      return response.paramError('无效的内容类型');
    }

    // 查询是否已有学习记录
    const existingProgress = await findOne(
      'academy_progress',
      'user_id = ? AND content_id = ? AND content_type = ?',
      [user.id, content_id, content_type]
    );

    if (existingProgress) {
      // 更新学习进度
      await update(
        'academy_progress',
        {
          progress: Math.max(existingProgress.progress, progress), // 取最大进度
          duration: (existingProgress.duration || 0) + (duration || 0),
          last_learn_at: new Date()
        },
        'id = ?',
        [existingProgress.id]
      );

      return response.success({
        message: '学习进度已更新',
        progress: Math.max(existingProgress.progress, progress)
      });
    } else {
      // 创建学习记录
      const progressId = await insert('academy_progress', {
        user_id: user.id,
        content_id,
        content_type,
        progress,
        duration: duration || 0,
        last_learn_at: new Date()
      });

      return response.success({
        message: '学习记录已创建',
        progress_id: progressId,
        progress
      });
    }

  } catch (error) {
    console.error('[Course/recordAcademyProgress] 记录失败:', error);
    return response.error('记录学习进度失败', error);
  }
};
