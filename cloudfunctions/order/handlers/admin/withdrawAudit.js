/**
 * 管理端接口：提现审核
 * Action: withdrawAudit
 */
const { findOne, update, insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { withdrawal_id, status, reject_reason } = event;

  try {
    console.log(`[withdrawAudit] 提现审核:`, { admin_id: admin.id, withdrawal_id, status });

    // 1. 参数验证
    if (!withdrawal_id) {
      return response.paramError('缺少提现记录ID');
    }
    if (status !== 1 && status !== 2) {
      return response.paramError('状态参数错误（1通过/2拒绝）');
    }
    if (status === 2 && !reject_reason) {
      return response.paramError('拒绝时需要提供原因');
    }

    // 2. 查询提现记录
    const withdrawal = await findOne('withdrawals', { id: withdrawal_id });
    if (!withdrawal) {
      return response.notFound('提现记录不存在');
    }

    // 3. 验证提现状态
    if (withdrawal.status !== 0) {
      return response.error('该提现申请已处理');
    }

    // 4. 查询用户信息
    const user = await findOne('users', { id: withdrawal.user_id });
    if (!user) {
      return response.error('用户不存在');
    }

    // 5. 处理审核结果
    if (status === 1) {
      // 审核通过
      await update('withdrawals',
        {
          status: 1,
          audit_admin_id: admin.id,
          audit_time: new Date(),
          audit_remark: '审核通过'
        },
        { id: withdrawal_id }
      );

      // 扣除冻结积分
      await update('users',
        {
          cash_points_frozen: user.cash_points_frozen - withdrawal.amount
        },
        { id: user.id }
      );

      // 记录积分变动
      await insert('cash_points_records', {
        user_id: user.id,
        type: 3, // 提现
        amount: -withdrawal.amount,
        balance_after: user.cash_points_frozen - withdrawal.amount,
        source_type: 4, // 提现
        source_id: withdrawal_id,
        description: `提现审核通过：${withdrawal.amount}元`
      });

      console.log(`[withdrawAudit] 审核通过`);

      return response.success({
        withdrawal_id,
        status: 1,
        status_name: '审核通过'
      }, '审核通过');

    } else {
      // 审核拒绝
      await update('withdrawals',
        {
          status: 2,
          audit_admin_id: admin.id,
          audit_time: new Date(),
          audit_remark: reject_reason
        },
        { id: withdrawal_id }
      );

      // 解冻积分（退回到可用积分）
      await update('users',
        {
          cash_points_frozen: user.cash_points_frozen - withdrawal.amount,
          cash_points_available: user.cash_points_available + withdrawal.amount
        },
        { id: user.id }
      );

      // 记录积分变动
      await insert('cash_points_records', {
        user_id: user.id,
        type: 4, // 退回
        amount: withdrawal.amount,
        balance_after: user.cash_points_available + withdrawal.amount,
        source_type: 4, // 提现
        source_id: withdrawal_id,
        description: `提现审核拒绝，积分退回：${reject_reason}`
      });

      console.log(`[withdrawAudit] 审核拒绝`);

      return response.success({
        withdrawal_id,
        status: 2,
        status_name: '审核拒绝',
        reject_reason
      }, '审核拒绝');
    }

  } catch (error) {
    console.error(`[withdrawAudit] 失败:`, error);
    return response.error('提现审核失败', error);
  }
};
