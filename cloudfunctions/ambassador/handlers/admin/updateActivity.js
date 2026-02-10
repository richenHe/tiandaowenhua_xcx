/**
 * 管理端接口：更新活动
 * Action: updateActivity
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { activity_id, title, description, start_time, end_time, target_level, reward_config, status } = event;

  try {
    console.log(`[updateActivity] 更新活动:`, activity_id);

    // 参数验证
    if (!activity_id) {
      return response.paramError('缺少必要参数: activity_id');
    }

    // 查询活动
    const activity = await findOne('ambassador_activity_records', { id: activity_id });
    if (!activity) {
      return response.error('活动不存在');
    }

    // 构建更新数据
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (target_level !== undefined) updateData.target_level = target_level;
    if (reward_config !== undefined) updateData.reward_config = JSON.stringify(reward_config);
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    // 更新活动
    await update('ambassador_activity_records', updateData, { id: activity_id });

    return response.success({
      activity_id,
      message: '活动更新成功'
    }, '更新成功');

  } catch (error) {
    console.error(`[updateActivity] 失败:`, error);
    return response.error('更新活动失败', error);
  }
};
