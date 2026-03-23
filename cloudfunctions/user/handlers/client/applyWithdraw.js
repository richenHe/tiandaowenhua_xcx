/**
 * 客户端接口：申请积分提现（银行汇款）
 * Action: client:applyWithdraw
 *
 * 提现方式：银行汇款（公司对私转账）
 * 银行收款信息统一从用户个人资料（users 表）读取，用户需在"个人资料"页填写后才能提现
 * 入参：
 *   amount - 提现金额（元）
 */
const { findOne, insert, update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { amount } = event;

  try {
    console.log('[applyWithdraw] 申请提现:', user.id, amount);

    // 参数验证
    if (!amount) {
      return response.paramError('缺少必填参数：amount');
    }

    if (amount <= 0) {
      return response.paramError('提现金额必须大于0');
    }

    // 从 users 表读取银行收款信息
    const bankAccountName = user.bank_account_name || '';
    const bankName = user.bank_name || '';
    const bankAccountNumber = user.bank_account_number || '';

    // 校验银行信息是否已在个人资料中填写完整
    if (!bankAccountName || !bankName || !bankAccountNumber) {
      return response.error('请先在个人资料中填写收款银行账户信息（收款人姓名、开户支行、银行卡号）', null, 400);
    }

    // 基本卡号格式校验
    if (bankAccountNumber.replace(/\s/g, '').length < 10) {
      return response.error('个人资料中的银行卡号格式不正确，请重新填写', null, 400);
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

      // 2. 创建提现申请记录（银行信息快照来自个人资料）
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

      // 3. 记录积分流水（type=3：提现申请）
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
