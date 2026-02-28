/**
 * 管理端接口：更新活动
 * Action: updateActivity
 *
 * 接受前端字段：id/name/dateRange/location/description/images
 * 映射到 DB 字段：activity_name/start_time+end_time/location/activity_desc/images
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  // 支持前端传 id 或 activity_id，以及 name（→activity_name）、dateRange（→start_time/end_time）
  const { id, activity_id, name, dateRange, location, description, images, target_level, reward_config, status } = event;

  try {
    const activityId = id || activity_id;
    console.log(`[updateActivity] 更新活动:`, activityId);

    // 参数验证
    if (!activityId) {
      return response.paramError('缺少必要参数: id（活动ID）');
    }

    // 查询活动是否存在
    const activity = await findOne('ambassador_activity_records', { id: activityId });
    if (!activity) {
      return response.error('活动不存在');
    }

    // 解析时间：支持 dateRange 数组或直接传 start_time/end_time
    const start_time = event.start_time || (dateRange && dateRange[0]) || undefined;
    const end_time = event.end_time || (dateRange && dateRange[1]) || undefined;

    // 构建更新数据，使用正确的 DB 字段名
    const updateData = {};
    if (name !== undefined) updateData.activity_name = name;
    if (description !== undefined) updateData.activity_desc = description;
    if (location !== undefined) updateData.location = location;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (images !== undefined) updateData.images = JSON.stringify(images);
    if (target_level !== undefined) updateData.target_level = target_level;
    if (reward_config !== undefined) updateData.reward_config = JSON.stringify(reward_config);
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    // 更新活动
    await update('ambassador_activity_records', updateData, { id: activityId });

    return response.success({
      activity_id: activityId,
      message: '活动更新成功'
    }, '更新成功');

  } catch (error) {
    console.error(`[updateActivity] 失败:`, error);
    return response.error('更新活动失败', error);
  }
};
