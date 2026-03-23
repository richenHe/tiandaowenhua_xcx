/**
 * 删除课程（管理端接口）
 * 软删除：设置 is_deleted=1，列表查询时过滤掉已删除课程
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { id } = event;

  try {
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const course = await findOne('courses', { id });
    if (!course) {
      return response.notFound('课程不存在');
    }

    // 软删除：标记 is_deleted=1，不影响历史订单/预约等关联数据
    await update('courses', { is_deleted: 1 }, { id });

    return response.success({ message: '课程删除成功' });

  } catch (error) {
    console.error('[Course/deleteCourse] 删除失败:', error);
    return response.error('删除课程失败', error);
  }
};
