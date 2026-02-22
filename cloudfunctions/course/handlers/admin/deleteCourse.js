/**
 * 删除课程（管理端接口）
 */
const { findOne, softDelete } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { id } = event;

  try {
    // 参数验证
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询课程是否存在
    const course = await findOne('courses', { id });
    if (!course) {
      return response.notFound('课程不存在');
    }

    // 软删除课程（courses 表没有 deleted_at 字段，使用状态标记）
    const { update } = require('../../common/db');
    await update('courses', { status: 0 }, { id });

    return response.success({
      success: true,
      message: '课程删除成功'
    });

  } catch (error) {
    console.error('[Course/deleteCourse] 删除失败:', error);
    return response.error('删除课程失败', error);
  }
};
