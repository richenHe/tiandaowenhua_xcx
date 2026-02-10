/**
 * 管理端接口：创建活动记录
 * Action: createActivity
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { title, description, activity_type, start_time, end_time, target_level, reward_config } = event;

  try {
    console.log(`[createActivity] 创建活动:`, { title, activity_type });

    // 参数验证
    if (!title || !activity_type || !start_time || !end_time) {
      return response.paramError('缺少必要参数: title, activity_type, start_time, end_time');
    }

    // 创建活动记录
    const [activity] = await insert('ambassador_activity_records', {
      title,
      description: description || '',
      activity_type,
      start_time,
      end_time,
      target_level: target_level || null,
      reward_config: reward_config ? JSON.stringify(reward_config) : null,
      status: 1,  // 启用
      created_by: admin.id,
      created_at: new Date().toISOString()
    });

    return response.success({
      activity_id: activity.id,
      title: activity.title,
      activity_type: activity.activity_type,
      start_time: activity.start_time,
      end_time: activity.end_time
    }, '活动创建成功');

  } catch (error) {
    console.error(`[createActivity] 失败:`, error);
    return response.error('创建活动失败', error);
  }
};
