/**
 * 管理端接口：移除活动报名人员（物理删除）
 * Action: adminRemoveRegistrant
 *
 * 管理员可在活动结束前移除未参加的报名人员，防止自动发放功德分给缺席者。
 * 删除报名记录后同步扣减活动 positions JSON 中对应岗位的 registered_count。
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { registrationId } = event;

  try {
    console.log('[adminRemoveRegistrant] 移除报名:', { registrationId, adminId: admin?.id });

    if (!registrationId) {
      return response.paramError('缺少必要参数: registrationId');
    }

    // 查询报名记录
    const { data: regRows, error: regErr } = await db
      .from('ambassador_activity_registrations')
      .select('*')
      .eq('id', registrationId);
    if (regErr) throw regErr;
    if (!regRows || regRows.length === 0) return response.error('报名记录不存在');

    const reg = regRows[0];

    if (reg.status !== 1) {
      return response.error('只能移除状态为"已报名"的记录');
    }

    // 查询所属活动
    const { data: actRows, error: actErr } = await db
      .from('ambassador_activities')
      .select('id, status, positions')
      .eq('id', reg.activity_id);
    if (actErr) throw actErr;
    if (!actRows || actRows.length === 0) return response.error('关联活动不存在');

    const activity = actRows[0];
    if (activity.status === 0) {
      return response.error('活动已结束，无法移除报名人员');
    }

    // 物理删除报名记录
    const { error: delErr } = await db
      .from('ambassador_activity_registrations')
      .delete()
      .eq('id', registrationId);
    if (delErr) throw delErr;

    // 扣减 positions 中对应岗位的 registered_count
    let positions = [];
    try {
      positions = typeof activity.positions === 'string'
        ? JSON.parse(activity.positions)
        : (activity.positions || []);
    } catch (e) {}

    const targetPos = positions.find(p => p.name === reg.position_name);
    if (targetPos) {
      targetPos.registered_count = Math.max(0, (targetPos.registered_count || 0) - 1);
    }

    const now = formatDateTime(new Date());
    await db
      .from('ambassador_activities')
      .update({ positions: JSON.stringify(positions), updated_at: now })
      .eq('id', activity.id);

    console.log(`[adminRemoveRegistrant] 已移除报名 ${registrationId}，用户 ${reg.user_name}(${reg.user_id})`);

    return response.success({
      removed_id: registrationId,
      user_name: reg.user_name,
      position_name: reg.position_name
    }, '移除成功');

  } catch (error) {
    console.error('[adminRemoveRegistrant] 失败:', error);
    return response.error('移除报名人员失败', error);
  }
};
