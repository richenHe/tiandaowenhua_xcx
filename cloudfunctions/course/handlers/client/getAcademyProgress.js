/**
 * 获取商学院学习进度（客户端接口）
 */
const { from, rawQuery } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { content_id, content_type } = event;
  const { user } = context;

  try {
    if (content_id && content_type) {
      // 查询单个内容的学习进度
      const validation = validateRequired({ content_id, content_type }, ['content_id', 'content_type']);
      if (!validation.valid) {
        return response.paramError(validation.message);
      }

      const sql = `
        SELECT
          id,
          content_id,
          content_type,
          progress,
          duration,
          last_learn_at,
          created_at
        FROM academy_progress
        WHERE user_id = ? AND content_id = ? AND content_type = ?
      `;
      const result = await rawQuery(sql, [user.id, content_id, content_type]);

      return response.success(result[0] || {
        progress: 0,
        duration: 0,
        last_learn_at: null
      });

    } else {
      // 查询所有学习进度
      const sql = `
        SELECT
          id,
          content_id,
          content_type,
          CASE content_type
            WHEN 1 THEN '商学院介绍'
            WHEN 2 THEN '案例'
            WHEN 3 THEN '资料'
            ELSE '未知'
          END as content_type_name,
          progress,
          duration,
          last_learn_at,
          created_at
        FROM academy_progress
        WHERE user_id = ?
        ORDER BY last_learn_at DESC
      `;
      const list = await rawQuery(sql, [user.id]);

      // 统计学习情况
      const stats = {
        total_contents: list.length,
        completed_contents: list.filter(item => item.progress >= 100).length,
        total_duration: list.reduce((sum, item) => sum + (item.duration || 0), 0)
      };

      return response.success({
        stats,
        list
      });
    }

  } catch (error) {
    console.error('[Course/getAcademyProgress] 查询失败:', error);
    return response.error('查询学习进度失败', error);
  }
};
