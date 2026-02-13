/**
 * 客户端接口：修改推荐人
 * Action: client:updateReferee
 * 规则：首次支付订单后锁定，支付前可随时修改
 */
const { db, findOne, insert, update } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { user, OPENID } = context;
  const { refereeCode } = event;

  try {
    console.log('[updateReferee] 修改推荐人:', user.id);

    // 参数验证
    if (!refereeCode) {
      return response.paramError('推荐码不能为空');
    }

    // 1. 检查是否已支付订单（支付后锁定）
    if (user.referee_confirmed_at) {
      return response.error('推荐人已锁定，无法修改', null, 403);
    }

    // 2. 查询新推荐人
    const newReferee = await findOne('users', { referee_code: refereeCode });

    if (!newReferee) {
      return response.paramError('推荐码不存在');
    }

    // 3. 不能选择自己
    if (newReferee.id === user.id) {
      return response.paramError('不能选择自己作为推荐人');
    }

    // 4. 检查是否会形成循环（新推荐人是否是当前用户的下级）
    const isDownline = await checkIfDownline(user.id, newReferee.id);
    if (isDownline) {
      return response.paramError('不能选择自己的下级作为推荐人');
    }

    // 5. 记录变更日志
    // 获取旧推荐人信息（如果存在）
    let oldRefereeName = null;
    let oldRefereeUid = null;
    if (user.referee_id) {
      const oldReferee = await findOne('users', { id: user.referee_id });
      if (oldReferee) {
        oldRefereeName = oldReferee.real_name;
        oldRefereeUid = oldReferee.uid;
      }
    }

    await insert('referee_change_logs', {
      user_id: user.id,
      user_uid: user.uid,
      old_referee_id: user.referee_id,
      old_referee_uid: oldRefereeUid,
      old_referee_name: oldRefereeName,
      new_referee_id: newReferee.id,
      new_referee_uid: newReferee.uid,
      new_referee_name: newReferee.real_name,
      change_type: 2, // 用户主动修改
      change_source: 1, // 小程序用户资料
      remark: '用户主动修改推荐人'
    });

    // 6. 更新推荐人
    await update('users', { 
      referee_id: newReferee.id,
      referee_uid: newReferee.uid,
      referee_updated_at: utils.formatDateTime(new Date())
    }, { _openid: OPENID });

    console.log('[updateReferee] 修改成功');
    return response.success(null, '修改推荐人成功');

  } catch (error) {
    console.error('[updateReferee] 修改失败:', error);
    return response.error('修改推荐人失败', error);
  }
};

/**
 * 检查目标用户是否是当前用户的下级（防止循环）
 */
async function checkIfDownline(userId, targetUserId) {
  // 查询目标用户的推荐人链
  let currentId = targetUserId;
  const visited = new Set();

  while (currentId) {
    if (visited.has(currentId)) {
      // 检测到循环
      return true;
    }

    if (currentId === userId) {
      // 目标用户是当前用户的下级
      return true;
    }

    visited.add(currentId);

    // 查询上级
    const parent = await findOne('users', { id: currentId });

    if (!parent || !parent.referee_id) {
      break;
    }

    currentId = parent.referee_id;
  }

  return false;
}
