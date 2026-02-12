/**
 * 获取商学院学习进度（客户端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { courseId, course_id, lessonId, lesson_id } = event;
  const { user } = context;

  // 统一参数格式
  const finalCourseId = courseId || course_id;
  const finalLessonId = lessonId || lesson_id;

  try {
    if (finalCourseId && finalLessonId) {
      // 查询单个课时的学习进度
      const { data, error } = await db
        .from('academy_progress')
        .select('id, course_id, lesson_id, progress_percent, watch_duration, last_position, completed, completed_at, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('course_id', parseInt(finalCourseId))
        .eq('lesson_id', parseInt(finalLessonId))
        .single();

      if (error && error.code !== 'PGRST116') {  // PGRST116 = 没有找到记录
        throw error;
      }

      return response.success(data || {
        progress_percent: 0,
        watch_duration: 0,
        last_position: 0,
        completed: 0
      }, '查询成功');

    } else if (finalCourseId) {
      // 查询某门课程的所有学习进度
      const { data: list, error } = await db
        .from('academy_progress')
        .select('id, course_id, lesson_id, progress_percent, watch_duration, last_position, completed, completed_at, updated_at')
        .eq('user_id', user.id)
        .eq('course_id', parseInt(finalCourseId))
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return response.success(list || [], '查询成功');

    } else {
      // 查询所有学习进度
      const { data: list, error } = await db
        .from('academy_progress')
        .select('id, course_id, lesson_id, progress_percent, watch_duration, completed, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      // 统计学习情况
      const stats = {
        total_lessons: list ? list.length : 0,
        completed_lessons: list ? list.filter(item => item.completed === 1).length : 0,
        total_watch_duration: list ? list.reduce((sum, item) => sum + (item.watch_duration || 0), 0) : 0
      };

      return response.success({
        stats,
        list: list || []
      }, '查询成功');
    }

  } catch (error) {
    console.error('[Course/getAcademyProgress] 查询失败:', error);
    return response.error('查询学习进度失败', error);
  }
};
