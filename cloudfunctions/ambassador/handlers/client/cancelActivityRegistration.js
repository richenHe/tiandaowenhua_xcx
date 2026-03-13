/**
 * 客户端接口：取消活动报名
 * Action: cancelActivityRegistration
 *
 * 入参（camelCase）：activityId
 * 校验：报名记录存在且 status=1，活动未结束，才允许取消
 * 操作：将报名记录 status 改为 0，并回写岗位 registered_count - 1
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { activityId } = event;

  try {
    console.log('[cancelActivityRegistration] 取消报名:', { userId: user.id, activityId });

    if (!activityId) return response.paramError('缺少必要参数: activityId');

    // 查询用户在该活动的有效报名记录
    const { data: regRows, error: regError } = await db
      .from('ambassador_activity_registrations')
      .select('id, position_name, status')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .eq('status', 1);
    if (regError) throw regError;
    if (!regRows || regRows.length === 0) {
      return response.error('未找到有效报名记录');
    }

    const reg = regRows[0];

    // 查询活动，确认活动未结束（status != 0）
    const { data: actRows, error: actError } = await db
      .from('ambassador_activities')
      .select('id, status, positions, schedule_name')
      .eq('id', activityId);
    if (actError) throw actError;
    if (!actRows || actRows.length === 0) return response.error('活动不存在');

    const activity = actRows[0];
    if (activity.status === 0) {
      return response.error('活动已结束，无法取消报名');
    }
    if (activity.status === 2) {
      return response.error('活动报名已截止，无法取消报名');
    }

    const now = formatDateTime(new Date());

    // 将报名记录状态改为 0（已取消）
    await db
      .from('ambassador_activity_registrations')
      .update({ status: 0, updated_at: now })
      .eq('id', reg.id);

    // 回写岗位 registered_count（减 1，最小为 0）
    let positions = [];
    try {
      positions = typeof activity.positions === 'string'
        ? JSON.parse(activity.positions)
        : (activity.positions || []);
    } catch (e) {}

    const targetPos = positions.find(p => p.name === reg.position_name);
    if (targetPos) {
      targetPos.registered_count = Math.max(0, (targetPos.registered_count || 0) - 1);
      await db
        .from('ambassador_activities')
        .update({ positions: JSON.stringify(positions), updated_at: now })
        .eq('id', activityId);
    }

    return response.success({
      activity_id: activityId,
      position_name: reg.position_name
    }, '取消报名成功');

  } catch (error) {
    console.error('[cancelActivityRegistration] 失败:', error);
    return response.error('取消报名失败', error);
  }
};
