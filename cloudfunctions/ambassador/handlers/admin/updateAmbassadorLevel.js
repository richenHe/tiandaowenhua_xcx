/**
 * 管理端接口：更新大使等级
 * Action: updateAmbassadorLevel
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { user_id, level } = event;

  try {
    console.log(`[updateAmbassadorLevel] 更新大使等级:`, { user_id, level });

    // 参数验证
    if (!user_id || level === undefined) {
      return response.paramError('缺少必要参数: user_id, level');
    }

    // 验证等级值（1-5）
    const levelNum = parseInt(level);
    if (levelNum < 0 || levelNum > 5) {
      return response.paramError('无效的等级值，必须在 0-5 之间');
    }

    // 查询用户
    const user = await findOne('users', { id: user_id });
    if (!user) {
      return response.error('用户不存在');
    }

    // 更新大使等级
    await update('users', { ambassador_level: levelNum }, { id: user_id });

    console.log('[updateAmbassadorLevel] 更新成功');
    return response.success({
      success: true,
      message: '大使等级更新成功'
    });

  } catch (error) {
    console.error(`[updateAmbassadorLevel] 失败:`, error);
    return response.error('更新大使等级失败', error);
  }
};
