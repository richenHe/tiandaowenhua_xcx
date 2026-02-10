/**
 * 获取商学院介绍详情（公开接口）
 */
const { findOne } = require('../../common/db');
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

    // 查询商学院介绍详情
    const detail = await findOne(
      'academy_intro',
      'id = ? AND status = 1 AND deleted_at IS NULL',
      [id]
    );

    if (!detail) {
      return response.notFound('商学院介绍不存在或已下架');
    }

    return response.success(detail);

  } catch (error) {
    console.error('[Course/getAcademyDetail] 查询失败:', error);
    return response.error('查询商学院详情失败', error);
  }
};
