/**
 * 获取案例详情（公开接口）
 */
const { db } = require('../../common/db');
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

    // 查询案例详情（使用 Query Builder，academy_cases 无 deleted_at 列）
    const { data: caseDetail, error } = await db
      .from('academy_cases')
      .select('*')
      .eq('id', id)
      .eq('status', 1)
      .single();

    if (error && !error.message?.includes('0 rows')) {
      throw error;
    }

    if (!caseDetail) {
      return response.notFound('案例不存在或已下架');
    }

    // 增加浏览次数
    await db
      .from('academy_cases')
      .update({ view_count: (caseDetail.view_count || 0) + 1 })
      .eq('id', id);

    caseDetail.view_count = (caseDetail.view_count || 0) + 1;

    return response.success(caseDetail);

  } catch (error) {
    console.error('[Course/getCaseDetail] 查询失败:', error);
    return response.error('查询案例详情失败', error);
  }
};
