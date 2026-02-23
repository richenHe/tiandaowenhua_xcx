/**
 * 获取商学院介绍详情（公开接口）
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

    // 查询商学院介绍详情（academy_intro 无 deleted_at 列）
    const { data: detail, error } = await db
      .from('academy_intro')
      .select('*')
      .eq('id', id)
      .eq('status', 1)
      .single();

    if (error && !error.message?.includes('0 rows')) {
      throw error;
    }

    if (!detail) {
      return response.notFound('商学院介绍不存在或已下架');
    }

    return response.success(detail);

  } catch (error) {
    console.error('[Course/getAcademyDetail] 查询失败:', error);
    return response.error('查询商学院详情失败', error);
  }
};
