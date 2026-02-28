/**
 * 管理端接口：提现审核
 * Action: withdrawAudit
 */
const { findOne, update, insert } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { withdrawal_id, status, reject_reason } = event;

  try {
    console.log(`[withdrawAudit] 提现审核:`, { admin_id: admin.id, withdrawal_id, status });

    // 1. 参数验证
    if (!withdrawal_id) {
      return response.paramError('缺少提现记录ID');
    }
    if (status !== 2) {
      return response.paramError('状态参数错误（仅支持 2=驳回）');
    }
    if (!reject_reason) {
      return response.paramError('拒绝时需要提供原因');
    }

    // 2. 查询提现记录
    const withdrawal = await findOne('withdrawals', { id: withdrawal_id });
    if (!withdrawal) {
      return response.notFound('提现记录不存在');
    }

    // 3. 验证提现状态（status=0 或 status=1 均可驳回）
    if (withdrawal.status !== 0 && withdrawal.status !== 1) {
      return response.error('该提现申请已处理');
    }

    // 4. 查询用户信息
    const user = await findOne('users', { id: withdrawal.user_id });
    if (!user) {
      return response.error('用户不存在');
    }

    // parseFloat 防止 DB 返回字符串时字符串拼接
    const pendingNow = parseFloat(user.cash_points_pending || 0);
    const availableNow = parseFloat(user.cash_points_available || 0);
    const withdrawAmount = parseFloat(withdrawal.amount);

    // 5. 审核驳回（DB status=3）：pending 退回到 available
    {
      const newPending = pendingNow - withdrawAmount;
      const newAvailable = availableNow + withdrawAmount;

      await update('withdrawals',
        {
          status: 3,
          audit_admin_id: admin.id,
          audit_time: utils.formatDateTime(new Date()),
          audit_remark: reject_reason
        },
        { id: withdrawal_id }
      );

      await update('users',
        {
          cash_points_pending: newPending,
          cash_points_available: newAvailable
        },
        { id: user.id }
      );

      // 记录积分流水（type=5：提现失败退回，amount 为正）
      await insert('cash_points_records', {
        user_id: user.id,
        _openid: user._openid || '',
        type: 5,
        amount: withdrawAmount,
        available_after: newAvailable,
        withdraw_no: withdrawal.withdraw_no,
        remark: `提现审核驳回，积分退回：${reject_reason}`
      });

      console.log(`[withdrawAudit] 审核拒绝`);

      return response.success({
        withdrawal_id,
        status: 3,
        status_name: '审核拒绝',
        reject_reason
      }, '审核拒绝');
    }

  } catch (error) {
    console.error(`[withdrawAudit] 失败:`, error);
    return response.error('提现审核失败', error);
  }
};
