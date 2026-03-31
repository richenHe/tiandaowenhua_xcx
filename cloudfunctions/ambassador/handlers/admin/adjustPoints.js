/**
 * 管理端接口：调整用户积分（功德点或现金积分）
 * Action: adjustPoints
 */
const { findOne, update, insert } = require('../../common/db');
const { response } = require('../../common');
const { formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { user_id, point_type, amount, reason } = event;

  try {
    console.log(`[adjustPoints] 调整积分:`, { user_id, point_type, amount });

    // 参数验证
    if (!user_id || !point_type || !amount || !reason) {
      return response.paramError('缺少必要参数: user_id, point_type, amount, reason');
    }

    if (!['merit', 'cash'].includes(point_type)) {
      return response.paramError('point_type 必须是 merit 或 cash');
    }

    // 查询用户
    const user = await findOne('users', { id: user_id });
    if (!user) {
      return response.error('用户不存在');
    }

    const amountNum = parseFloat(amount);

    // 更新用户积分
    if (point_type === 'merit') {
      const prevBalance = parseFloat(user.merit_points || 0);
      const newBalance = prevBalance + amountNum;

      // 扣减时不允许余额变为负数
      if (newBalance < 0) {
        return response.paramError(`调整后余额不能为负，当前余额 ${prevBalance}，本次扣减 ${Math.abs(amountNum)}`);
      }

      await update('users', {
        merit_points: newBalance
      }, { id: user_id });

      // 记录功德点日志（字段名与 DB merit_points_records 表一致）
      await insert('merit_points_records', {
        user_id,
        user_uid: user.uid,
        _openid: user._openid || '',
        type: amountNum > 0 ? 1 : 2,        // 1=获得, 2=使用
        source: 7,                            // 7=其他（管理员手动调整）
        amount: Math.abs(amountNum),
        balance_after: newBalance,            // DB 字段名为 balance_after
        remark: reason,                       // DB 字段名为 remark
        created_at: formatDateTime(new Date())
      });
    } else {
      const prevAvailable = parseFloat(user.cash_points_available || 0);
      const prevFrozen = parseFloat(user.cash_points_frozen || 0);
      const newAvailable = prevAvailable + amountNum;

      // 扣减时不允许余额变为负数
      if (newAvailable < 0) {
        return response.paramError(`调整后余额不能为负，当前可用余额 ${prevAvailable}，本次扣减 ${Math.abs(amountNum)}`);
      }

      await update('users', {
        cash_points_available: newAvailable
      }, { id: user_id });

      // 记录现金积分日志（字段名与 DB cash_points_records 表一致）
      await insert('cash_points_records', {
        user_id,
        user_uid: user.uid,
        _openid: user._openid || '',
        type: 6,                              // 6=系统调整
        amount: Math.abs(amountNum),
        frozen_after: prevFrozen,             // 冻结余额不变
        available_after: newAvailable,        // 变动后可用余额
        remark: reason,
        created_at: formatDateTime(new Date())
      });
    }

    console.log('[adjustPoints] 调整成功');
    return response.success({
      success: true,
      message: '积分调整成功'
    });

  } catch (error) {
    console.error(`[adjustPoints] 失败:`, error);
    return response.error('调整积分失败', error);
  }
};
