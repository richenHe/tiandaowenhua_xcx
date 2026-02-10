/**
 * 客户端接口：修改推荐人
 * Action: client:updateReferee
 * 规则：7天内只能修改1次，首次支付后锁定
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

    // 2. 检查7天内是否已修改过
    const { data: recentChanges } = await db.from('referee_change_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentChanges && recentChanges.length > 0) {
      const daysDiff = (Date.now() - new Date(recentChanges[0].created_at)) / (1000 * 60 * 60 * 24);
      if (daysDiff < 7) {
        return response.error('7天内只能修改1次推荐人', null, 403);
      }
    }

    // 3. 查询新推荐人
    const newReferee = await findOne('users', { referee_code: refereeCode });

    if (!newReferee) {
      return response.paramError('推荐码不存在');
    }

    // 4. 不能选择自己
    if (newReferee.id === user.id) {
      return response.paramError('不能选择自己作为推荐人');
    }

    // 5. 检查是否会形成循环（新推荐人是否是当前用户的下级）
    const isDownline = await checkIfDownline(user.id, newReferee.id);
    if (isDownline) {
      return response.paramError('不能选择自己的下级作为推荐人');
    }

    // 6. 记录变更日志
    await insert('referee_change_logs', {
      user_id: user.id,
      old_referee_id: user.referee_id,
      new_referee_id: newReferee.id,
      change_reason: '用户主动修改'
    });

    // 7. 更新推荐人
    await update('users', { 
      referee_id: newReferee.id,
      referee_uid: newReferee.uid,
      referee_updated_at: new Date()
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
