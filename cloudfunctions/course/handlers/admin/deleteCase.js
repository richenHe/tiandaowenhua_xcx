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
    const caseItem = await findOne('academy_cases', 'id = ? AND deleted_at IS NULL', [id]);
    if (!caseItem) {
      return response.notFound('案例不存在');
    }

    // 软删除案例
    await softDelete('academy_cases', 'id = ?', [id]);

    return response.success({
      message: '案例删除成功'
    });

  } catch (error) {
    console.error('[Course/deleteCase] 删除失败:', error);
    return response.error('删除案例失败', error);
  }
};
