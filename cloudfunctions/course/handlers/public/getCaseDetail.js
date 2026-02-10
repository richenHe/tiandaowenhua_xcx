/**
 * 获取案例详情（公开接口）
 */
const { findOne, update } = require('../../common/db');
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

    // 查询案例详情
    const caseDetail = await findOne(
      'academy_cases',
      'id = ? AND status = 1 AND deleted_at IS NULL',
      [id]
    );

    if (!caseDetail) {
      return response.notFound('案例不存在或已下架');
    }

    // 增加浏览次数
    await update(
      'academy_cases',
      { view_count: caseDetail.view_count + 1 },
      'id = ?',
      [id]
    );

    caseDetail.view_count += 1;

    return response.success(caseDetail);

  } catch (error) {
    console.error('[Course/getCaseDetail] 查询失败:', error);
    return response.error('查询案例详情失败', error);
  }
};
