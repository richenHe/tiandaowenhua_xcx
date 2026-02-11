/**
 * 获取商学院学习进度（客户端接口）
 */
const { db } = require('../../common/db');
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

      const { data, error } = await db
        .from('academy_progress')
        .select('id, content_id, content_type, progress, duration, last_learn_at, created_at')
        .eq('user_id', user.id)
        .eq('content_id', parseInt(content_id))
        .eq('content_type', parseInt(content_type))
        .single();

      if (error && error.code !== 'PGRST116') {  // PGRST116 = 没有找到记录
        throw error;
      }

      return response.success(data || {
        progress: 0,
        duration: 0,
        last_learn_at: null
      });

    } else {
      // 查询所有学习进度
      const { data: list, error } = await db
        .from('academy_progress')
        .select('id, content_id, content_type, progress, duration, last_learn_at, created_at')
        .eq('user_id', user.id)
        .order('last_learn_at', { ascending: false });

      if (error) {
        throw error;
      }

      // 格式化数据（添加 content_type_name）
      const getContentTypeName = (type) => {
        const map = {
          1: '商学院介绍',
          2: '案例',
          3: '资料'
        };
        return map[type] || '未知';
      };

      const formattedList = (list || []).map(item => ({
        ...item,
        content_type_name: getContentTypeName(item.content_type)
      }));

      // 统计学习情况
      const stats = {
        total_contents: formattedList.length,
        completed_contents: formattedList.filter(item => item.progress >= 100).length,
        total_duration: formattedList.reduce((sum, item) => sum + (item.duration || 0), 0)
      };

      return response.success({
        stats,
        list: formattedList
      });
    }

  } catch (error) {
    console.error('[Course/getAcademyProgress] 查询失败:', error);
    return response.error('查询学习进度失败', error);
  }
};
