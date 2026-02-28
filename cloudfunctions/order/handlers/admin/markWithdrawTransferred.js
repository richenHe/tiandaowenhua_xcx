/**
 * 管理端接口：标记提现已转账（含上传电子发票）
 * Action: markWithdrawTransferred
 *
 * 将 status 从 1（审核通过待转账）更新为 2（已转账）
 * 强制要求上传电子发票，无 invoice_file_id 时拒绝操作
 *
 * 入参：
 *   withdrawal_id   - 提现记录ID（必填）
 *   invoice_file_id - 电子发票云存储 fileID（必填，cloud://...）
 *   transfer_no     - 转账流水号（可选）
 *   transfer_remark - 转账备注（可选）
 */
const { findOne, update, insert } = require('../../common/db');
const { response, utils, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { withdrawal_id, invoice_file_id, transfer_no, transfer_remark } = event;

  try {
    console.log(`[markWithdrawTransferred] 标记已转账:`, { admin_id: admin.id, withdrawal_id });

    if (!withdrawal_id) {
      return response.paramError('缺少提现记录ID');
    }

    // 强制要求电子发票
    if (!invoice_file_id || !invoice_file_id.trim()) {
      return response.paramError('请先上传电子发票，上传后方可标记已转账');
    }

    const withdrawal = await findOne('withdrawals', { id: withdrawal_id });
    if (!withdrawal) {
      return response.notFound('提现记录不存在');
    }

    // status=0（待转账）或 status=1（旧版已审核）均可直接标记已转账
    if (withdrawal.status !== 0 && withdrawal.status !== 1) {
      return response.error('该提现申请状态不允许标记转账（需为待转账状态）');
    }

    const now = utils.formatDateTime(new Date());

    // 更新提现记录：状态+发票信息
    await update('withdrawals',
      {
        status: 2,
        transfer_time: now,
        transfer_no: transfer_no || '',
        invoice_file_id: invoice_file_id.trim(),
        invoice_uploaded_at: now,
        invoice_uploader_admin_id: admin.id,
        audit_remark: transfer_remark || '已完成线下银行汇款'
      },
      { id: withdrawal_id }
    );

    // 查询用户信息（用于更新 pending 和写积分流水）
    const user = await findOne('users', { id: withdrawal.user_id });

    if (user) {
      // 扣减 cash_points_pending（打款完成，资金已实际转出）
      const newPending = parseFloat(user.cash_points_pending || 0) - parseFloat(withdrawal.amount);
      await update('users',
        { cash_points_pending: Math.max(0, newPending) },
        { id: user.id }
      );

      // 写 cash_points_records type=4（提现成功，amount=0 为打款完成通知记录）
      await insert('cash_points_records', {
        user_id: user.id,
        _openid: user._openid || '',
        type: 4, // 4=提现成功
        amount: 0,
        available_after: user.cash_points_available,
        withdraw_no: withdrawal.withdraw_no,
        remark: `提现已打款，已上传电子发票。转账金额：¥${withdrawal.amount}`
      });
    }

    // 构建发票展示 URL（供返回给前端预览）
    const invoice_url = cloudFileIDToURL ? cloudFileIDToURL(invoice_file_id.trim()) : invoice_file_id;

    console.log(`[markWithdrawTransferred] 标记已转账成功，发票已记录`);

    return response.success({
      withdrawal_id,
      status: 2,
      status_name: '已转账',
      invoice_url
    }, '已标记为转账完成');

  } catch (error) {
    console.error(`[markWithdrawTransferred] 失败:`, error);
    return response.error('标记转账失败', error);
  }
};
