/**
 * 管理端接口：删除活动
 * Action: deleteActivity
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { activity_id } = event;

  try {
    console.log(`[deleteActivity] 删除活动:`, activity_id);

    // 参数验证
    if (!activity_id) {
      return response.paramError('缺少必要参数: activity_id');
    }

    // 查询活动
    const activity = await findOne('ambassador_activity_records', { id: activity_id });
    if (!activity) {
      return response.error('活动不存在');
    }

    // 软删除（更新状态为0）
    await update('ambassador_activity_records',
      { status: 0 },
      { id: activity_id }
    );

    return response.success({
      activity_id,
      message: '活动已删除'
    }, '删除成功');

  } catch (error) {
    console.error(`[deleteActivity] 失败:`, error);
    return response.error('删除活动失败', error);
  }
};
