/**
 * 管理端接口：获取活动详情
 * Action: getActivityDetail
 */
const { findOne } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { activity_id } = event;

  try {
    console.log(`[getActivityDetail] 查询活动详情:`, { activity_id });

    // 参数验证
    if (!activity_id) {
      return response.paramError('缺少必要参数: activity_id');
    }

    // 查询活动记录
    const activity = await findOne('ambassador_activity_records', { id: activity_id });
    if (!activity) {
      return response.error('活动记录不存在');
    }

    // 查询用户信息
    const user = await findOne('users', { id: activity.user_id });
    if (!user) {
      return response.error('用户不存在');
    }

    // 组装返回数据
    const result = {
      id: activity.id,
      user_id: activity.user_id,
      real_name: user.real_name,
      phone: user.phone,
      activity_name: activity.activity_name || '',
      description: activity.activity_desc || '',
      activity_type: activity.activity_type,
      start_time: activity.start_time,
      end_time: activity.end_time,
      duration: activity.duration || '',
      location: activity.location || '',
      participant_count: activity.participant_count || 0,
      images: activity.images || [],
      note: activity.note || '',
      status: activity.status,
      merit_points: activity.merit_points || 0,
      audit_remark: activity.audit_remark || '',
      created_at: activity.created_at,
      audit_time: activity.audit_time,
      audit_admin_id: activity.audit_admin_id
    };

    console.log('[getActivityDetail] 查询成功');
    return response.success(result);

  } catch (error) {
    console.error(`[getActivityDetail] 失败:`, error);
    return response.error('获取活动详情失败', error);
  }
};
