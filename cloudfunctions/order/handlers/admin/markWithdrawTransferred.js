/**
 * 管理端接口：标记提现已转账
 * Action: markWithdrawTransferred
 * 将 status 从 1（审核通过待转账）更新为 2（已打款）
 */
const { findOne, update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { withdrawal_id, transfer_no, transfer_remark } = event;

  try {
    console.log(`[markWithdrawTransferred] 标记已转账:`, { admin_id: admin.id, withdrawal_id });

    if (!withdrawal_id) {
      return response.paramError('缺少提现记录ID');
    }

    const withdrawal = await findOne('withdrawals', { id: withdrawal_id });
    if (!withdrawal) {
      return response.notFound('提现记录不存在');
    }

    // 只有 status=1（审核通过待转账）才能标记已转账
    if (withdrawal.status !== 1) {
      return response.error('该提现申请状态不允许标记转账（需为审核通过待转账状态）');
    }

    await update('withdrawals',
      {
        status: 2,
        transfer_time: utils.formatDateTime(new Date()),
        transfer_no: transfer_no || '',
        audit_remark: transfer_remark || '已完成线下转账'
      },
      { id: withdrawal_id }
    );

    console.log(`[markWithdrawTransferred] 标记已转账成功`);

    return response.success({
      withdrawal_id,
      status: 2,
      status_name: '已打款'
    }, '已标记为转账完成');

  } catch (error) {
    console.error(`[markWithdrawTransferred] 失败:`, error);
    return response.error('标记转账失败', error);
  }
};
