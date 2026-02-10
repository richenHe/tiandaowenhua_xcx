/**
 * 客户端接口：申请积分提现
 * Action: client:applyWithdraw
 * 
 * ⚠️ 注意：此接口涉及事务处理，CloudBase SDK 可能不支持
 * 如果部署后报错，需要改为其他方案或逐步操作
 */
const { findOne, insert, update, db } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user } = context;
  const { amount, withdrawType, accountInfo } = event;

  try {
    console.log('[applyWithdraw] 申请提现:', user.id, amount);

    // 参数验证
    const err = utils.validateRequired(event, ['amount', 'withdrawType', 'accountInfo']);
    if (err) {
      return response.paramError(err);
    }

    // 验证提现金额
    if (amount <= 0) {
      return response.paramError('提现金额必须大于0');
    }

    // 查询系统配置的最低提现金额
    const config = await findOne('system_configs', { config_key: 'min_withdraw_amount' });
    const minAmount = config ? parseFloat(config.config_value) : 100;

    if (amount < minAmount) {
      return response.paramError(`最低提现金额为${minAmount}元`);
    }

    // ⚠️ 验证可用积分余额（使用正确的字段名）
    if (user.cash_points_available < amount) {
      return response.error('可用积分不足', null, 400);
    }

    // ⚠️ 注意：CloudBase SDK 可能不支持事务，这里逐步操作
    // 如果需要严格的事务保证，需要使用其他方案
    
    try {
      // 1. 冻结积分（⚠️ 使用正确的字段名）
      await update('users',
        {
          cash_points_available: user.cash_points_available - amount,
          cash_points_frozen: user.cash_points_frozen + amount
        },
        { id: user.id }
      );

      // 2. 创建提现记录
      const withdrawNo = utils.generateOrderNo('WD');
      await insert('withdrawals', {
        user_id: user.id,
        withdraw_no: withdrawNo,
        amount: amount,
        withdraw_type: withdrawType,
        account_info: JSON.stringify(accountInfo),
        status: 0
      });

      // 3. 记录积分变动
      await insert('cash_points_records', {
        user_id: user.id,
        change_amount: -amount,
        balance_after: user.cash_points_available - amount,
        change_type: 'withdraw',
        remark: '申请提现'
      });

      console.log('[applyWithdraw] 提现申请成功');
      return response.success(null, '提现申请已提交，等待审核');

    } catch (dbError) {
      // 如果失败，尝试回滚（恢复积分）
      console.error('[applyWithdraw] 提现失败，尝试回滚:', dbError);
      try {
        await update('users',
          {
            cash_points_available: user.cash_points_available,
            cash_points_frozen: user.cash_points_frozen
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
