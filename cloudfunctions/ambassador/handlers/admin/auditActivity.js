/**
 * 管理端接口：审核活动
 * Action: auditActivity
 */
const { findOne, update, insert } = require('../../common/db');
const { response } = require('../../common');
const { formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { activity_id, status, merit_points, reject_reason } = event;

  try {
    console.log(`[auditActivity] 审核活动:`, { activity_id, status, merit_points });

    // 参数验证
    if (!activity_id || status === undefined) {
      return response.paramError('缺少必要参数: activity_id, status');
    }

    const statusNum = parseInt(status);
    if (![1, 2].includes(statusNum)) {
      return response.paramError('status 必须是 1(通过) 或 2(拒绝)');
    }

    if (statusNum === 2 && !reject_reason) {
      return response.paramError('拒绝活动时必须提供拒绝原因');
    }

    if (statusNum === 1 && !merit_points) {
      return response.paramError('通过活动时必须提供功德点奖励');
    }

    // 查询活动记录
    const activity = await findOne('ambassador_activity_records', { id: activity_id });
    if (!activity) {
      return response.error('活动记录不存在');
    }

    // 状态：0-待审核 1-审核通过 2-审核拒绝
    if (activity.status !== 0) {
      return response.error('该活动已被审核');
    }

    // 查询用户
    const user = await findOne('users', { id: activity.user_id });
    if (!user) {
      return response.error('用户不存在');
    }

    // 更新活动状态
    await update('ambassador_activity_records', {
      status: statusNum,
      merit_points: statusNum === 1 ? merit_points : null,
      audit_remark: statusNum === 2 ? reject_reason : null,
      audit_time: formatDateTime(new Date()),
      audit_admin_id: admin.id
    }, { id: activity_id });

    // 如果通过，增加用户功德点
    if (statusNum === 1) {
      const meritPointsNum = parseFloat(merit_points);
      const newBalance = (user.merit_points || 0) + meritPointsNum;

      await update('users', {
        merit_points: newBalance
      }, { id: user.id });

      // 记录功德点日志
      await insert('merit_points_records', {
        user_id: user.id,
        user_uid: user.uid,
        _openid: user._openid || '',
        change_type: 1,
        amount: meritPointsNum,
        before_balance: user.merit_points || 0,
        after_balance: newBalance,
        description: `活动审核通过：${activity.activity_name || ''}`,
        admin_id: admin.id,
        created_at: formatDateTime(new Date())
      });
    }

    console.log('[auditActivity] 审核成功');
    return response.success({
      success: true,
      message: statusNum === 1 ? '活动已通过审核' : '活动已拒绝'
    });

  } catch (error) {
    console.error(`[auditActivity] 失败:`, error);
    return response.error('审核活动失败', error);
  }
};
