/**
 * 删除案例（管理端接口）
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

    // 查询案例是否存在
    const caseItem = await findOne('academy_cases', { id });
    if (!caseItem) {
      return response.notFound('案例不存在');
    }

    // 删除案例（academy_cases 表没有 deleted_at 字段，使用状态标记）
    const { update } = require('../../common/db');
    await update('academy_cases', { status: 0 }, { id });

    return response.success({
      success: true,
      message: '案例删除成功'
    });

  } catch (error) {
    console.error('[Course/deleteCase] 删除失败:', error);
    return response.error('删除案例失败', error);
  }
};
