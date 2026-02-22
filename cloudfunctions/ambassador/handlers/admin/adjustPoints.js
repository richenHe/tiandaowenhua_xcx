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
      const newBalance = (user.merit_points || 0) + amountNum;
      await update('users', {
        merit_points: newBalance
      }, { id: user_id });

      // 记录功德点日志
      await insert('merit_points_records', {
        user_id,
        user_uid: user.uid,
        _openid: user._openid || '',
        change_type: amountNum > 0 ? 1 : 2,
        amount: Math.abs(amountNum),
        before_balance: user.merit_points || 0,
        after_balance: newBalance,
        description: reason,
        admin_id: admin.id,
        created_at: formatDateTime(new Date())
      });
    } else {
      const newAvailable = (user.cash_points_available || 0) + amountNum;
      await update('users', {
        cash_points_available: newAvailable
      }, { id: user_id });

      // 记录现金积分日志
      await insert('cash_points_records', {
        user_id,
        user_uid: user.uid,
        _openid: user._openid || '',
        change_type: amountNum > 0 ? 1 : 2,
        amount: Math.abs(amountNum),
        before_balance: user.cash_points_available || 0,
        after_balance: newAvailable,
        description: reason,
        admin_id: admin.id,
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
