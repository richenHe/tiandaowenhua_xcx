/**
 * 客户端接口：申请积分提现（银行汇款）
 * Action: client:applyWithdraw
 *
 * 提现方式：银行汇款（公司对私转账）
 * 入参：
 *   amount           - 提现金额（元）
 *   bankAccountName  - 收款人姓名
 *   bankName         - 开户行名称
 *   bankAccountNumber - 银行卡号
 *   saveAccountInfo  - 是否保存收款信息到个人资料（boolean，默认 false）
 */
const { findOne, insert, update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { amount, bankAccountName, bankName, bankAccountNumber, saveAccountInfo } = event;

  try {
    console.log('[applyWithdraw] 申请提现:', user.id, amount);

    // 参数验证
    const err = utils.validateRequired(event, ['amount', 'bankAccountName', 'bankName', 'bankAccountNumber']);
    if (err) {
      return response.paramError(err);
    }

    if (amount <= 0) {
      return response.paramError('提现金额必须大于0');
    }

    if (!bankAccountNumber || bankAccountNumber.replace(/\s/g, '').length < 10) {
      return response.paramError('银行卡号格式不正确');
    }

    // 查询系统配置的最低提现金额
    const config = await findOne('system_configs', { config_key: 'min_withdraw_amount' });
    const minAmount = config ? parseFloat(config.config_value) : 100;

    if (amount < minAmount) {
      return response.paramError(`最低提现金额为${minAmount}元`);
    }

    if (user.cash_points_available < amount) {
      return response.error('可用积分不足', null, 400);
    }

    try {
      // 1. 扣减可用积分，增加提现中积分
      // parseFloat 防止 DB 返回字符串时字符串拼接（如 "0.00" + 500 = "0.00500"）
      await update('users',
        {
          cash_points_available: parseFloat(user.cash_points_available) - amount,
          cash_points_pending: parseFloat(user.cash_points_pending || 0) + amount
        },
        { id: user.id }
      );

      // 2. 若勾选"保存收款信息"，同步更新 users 表的银行卡字段
      if (saveAccountInfo) {
        await update('users',
          {
            bank_account_name: bankAccountName,
            bank_name: bankName,
            bank_account_number: bankAccountNumber
          },
          { id: user.id }
        );
      }

      // 3. 创建提现申请记录
      const withdrawNo = utils.generateOrderNo('WD');
      await insert('withdrawals', {
        user_id: user.id,
        user_name: user.real_name || '',
        _openid: user._openid || '',
        withdraw_no: withdrawNo,
        amount: amount,
        account_type: 3, // 3=银行汇款
        account_info: JSON.stringify({
          bank_account_name: bankAccountName,
          bank_name: bankName,
          bank_account_number: bankAccountNumber
        }),
        status: 0,
        apply_time: utils.formatDateTime(new Date())
      });

      // 4. 记录积分流水（type=3：提现申请）
      await insert('cash_points_records', {
        user_id: user.id,
        _openid: user._openid || '',
        type: 3,
        amount: -amount,
        available_after: user.cash_points_available - amount,
        withdraw_no: withdrawNo,
        remark: `申请提现（银行汇款）：¥${amount}`
      });

      console.log('[applyWithdraw] 提现申请成功，withdraw_no:', withdrawNo);
      return response.success({ withdraw_no: withdrawNo }, '提现申请已提交，等待财务审核');

    } catch (dbError) {
      // 尝试回滚积分扣减
      console.error('[applyWithdraw] 提现失败，尝试回滚:', dbError);
      try {
        await update('users',
          {
            cash_points_available: parseFloat(user.cash_points_available),
            cash_points_pending: parseFloat(user.cash_points_pending || 0)
          },
          { id: user.id }
        );
      } catch (rollbackError) {
        console.error('[applyWithdraw] 回滚失败:', rollbackError);
      }
      throw dbError;
    }

  } catch (error) {
    console.error('[applyWithdraw] 申请失败:', error);
    return response.error('申请提现失败', error);
  }
};
