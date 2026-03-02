/**
 * 管理端接口：创建活动记录
 * Action: createActivity
 *
 * 接受前端字段：name/dateRange/location/description/images
 * 映射到 DB 字段：activity_name/start_time+end_time/location/activity_desc/images
 */
const { insert } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

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

    if (!start_time) {
      return response.paramError('缺少必要参数: start_time（活动开始时间）');
    }

    const safeJson = (v) => typeof v === 'string' ? v : (v ? JSON.stringify(v) : null);

    const [activity] = await insert('ambassador_activity_records', {
      user_id: event.user_id || admin.id || 0,
      _openid: '',
      activity_name: name,
      activity_desc: description || '',
      activity_type: activity_type || 1,
      location: location || '',
      start_time: formatDateTime(new Date(start_time)),
      end_time: end_time ? formatDateTime(new Date(end_time)) : null,
      images: safeJson(images),
      target_level: target_level || null,
      reward_config: safeJson(reward_config),
      participant_count: 0,
      status: 1,
      created_at: formatDateTime(new Date())
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
