/**
 * 管理端接口：创建活动记录
 * Action: createActivity
 *
 * 接受前端字段：name/dateRange/location/description/images
 * 映射到 DB 字段：activity_name/start_time+end_time/location/activity_desc/images
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  // 兼容前端字段：name（活动名称）、dateRange（时间范围数组）
  const { name, dateRange, location, description, images, activity_type = 1, target_level, reward_config } = event;

  try {
    console.log(`[createActivity] 创建活动:`, { name, activity_type });

    // 解析时间：支持 dateRange 数组或直接传 start_time/end_time
    const start_time = event.start_time || (dateRange && dateRange[0]) || null;
    const end_time = event.end_time || (dateRange && dateRange[1]) || null;

    // 参数验证
    if (!name) {
      return response.paramError('缺少必要参数: name（活动名称）');
    }

    // 创建活动记录，使用正确的 DB 字段名
    const [activity] = await insert('ambassador_activity_records', {
      activity_name: name,
      activity_desc: description || '',
      activity_type: activity_type || 1,
      location: location || '',
      start_time: start_time || null,
      end_time: end_time || null,
      images: images ? JSON.stringify(images) : null,
      target_level: target_level || null,
      reward_config: reward_config ? JSON.stringify(reward_config) : null,
      participant_count: 0,
      status: 1,
      created_at: new Date().toISOString()
    });

    return response.success({
      activity_id: activity.id,
      name: activity.activity_name,
      activity_type: activity.activity_type,
      start_time: activity.start_time,
      end_time: activity.end_time
    }, '活动创建成功');

  } catch (error) {
    console.error(`[createActivity] 失败:`, error);
    return response.error('创建活动失败', error);
  }
};
