/**
 * 记录商学院学习进度（客户端接口）
 * 
 * academy_progress 表字段：
 *   user_id, course_id, lesson_id, progress_percent, watch_duration, last_position, completed
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  // 支持 camelCase 和 snake_case 两种参数格式
  const {
    courseId, course_id,
    lessonId, lesson_id,
    progressPercent, progress_percent, progress,
    watchDuration, watch_duration, duration,
    lastPosition, last_position,
    completed
  } = event;
  const { user } = context;

  const finalCourseId = courseId || course_id;
  const finalLessonId = lessonId || lesson_id;
  const finalProgress = progressPercent || progress_percent || progress || 0;
  const finalDuration = watchDuration || watch_duration || duration || 0;
  const finalLastPosition = lastPosition || last_position || 0;

  try {
    // 参数验证
    const validation = validateRequired(
      { courseId: finalCourseId, lessonId: finalLessonId },
      ['courseId', 'lessonId']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询是否已有学习记录（使用正确的列名：course_id, lesson_id）
    const { data: existingProgress, error: findError } = await db
      .from('academy_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', parseInt(finalCourseId))
      .eq('lesson_id', parseInt(finalLessonId))
      .single();

    if (findError && !findError.message?.includes('0 rows')) {
      throw findError;
    }

    if (existingProgress) {
      // 更新学习进度（使用正确列名：progress_percent, watch_duration）
      const newProgress = Math.max(existingProgress.progress_percent || 0, finalProgress);
      const newDuration = (existingProgress.watch_duration || 0) + finalDuration;
      const isCompleted = newProgress >= 100 ? 1 : (existingProgress.completed || 0);

      await db
        .from('academy_progress')
        .update({
          progress_percent: newProgress,
          watch_duration: newDuration,
          last_position: finalLastPosition || existingProgress.last_position || 0,
          completed: isCompleted
        })
        .eq('id', existingProgress.id);

      return response.success({
        message: '学习进度已更新',
        progress_percent: newProgress
      });
    } else {
      // 创建学习记录（使用正确列名）
      const isCompleted = finalProgress >= 100 ? 1 : 0;
      const { data: newRecord, error: insertError } = await db
        .from('academy_progress')
        .insert({
          user_id: user.id,
          _openid: user._openid || user.openid || '',
          course_id: parseInt(finalCourseId),
          lesson_id: parseInt(finalLessonId),
          progress_percent: finalProgress,
          watch_duration: finalDuration,
          last_position: finalLastPosition,
          completed: isCompleted
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return response.success({
        message: '学习记录已创建',
        progress_id: newRecord?.id,
        progress_percent: finalProgress
      });
    }

  } catch (error) {
    console.error('[Course/recordAcademyProgress] 记录失败:', error);
    return response.error('记录学习进度失败', error);
  }
};
