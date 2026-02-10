/**
 * 管理端接口：修改学员推荐人
 * Action: admin:updateUserReferee
 */
const { findOne, update, insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, newRefereeId, remark } = event;

  try {
    console.log('[admin:updateUserReferee] 修改推荐人:', userId, '->', newRefereeId);

    // 参数验证
    if (!userId) {
      return response.paramError('缺少参数：userId');
    }

    // 查询用户信息
    const user = await findOne('users', { id: userId });

    if (!user) {
      return response.error('用户不存在', null, 404);
    }

    // 如果新推荐人ID为空，表示清除推荐人
    if (!newRefereeId) {
      const oldRefereeId = user.referee_id;

      // 更新用户推荐人
      await update('users', 
        { 
          referee_id: null,
          referee_uid: null
        }, 
        { id: userId }
      );

      // 记录变更日志
      await insert('referee_change_logs', {
        user_id: userId,
        old_referee_id: oldRefereeId,
        new_referee_id: null,
        change_type: 'admin_clear',
        operator_type: 'admin',
        operator_id: admin.id,
        remark: remark || '管理员清除推荐人'
      });

      console.log('[admin:updateUserReferee] 推荐人已清除');
      return response.success(null, '推荐人已清除');
    }

    // 验证新推荐人是否存在
    const newReferee = await findOne('users', { id: newRefereeId });

    if (!newReferee) {
      return response.error('新推荐人不存在', null, 404);
    }

    // 不能推荐自己
    if (userId === newRefereeId) {
      return response.error('不能将自己设为推荐人', null, 400);
    }

    // 检查是否会形成循环推荐
    const isCircular = await checkCircularReferral(newRefereeId, userId);
    if (isCircular) {
      return response.error('不能设置该推荐人，会形成循环推荐关系', null, 400);
    }

    const oldRefereeId = user.referee_id;

    // 更新用户推荐人
    await update('users', 
      { 
        referee_id: newRefereeId,
        referee_uid: newReferee.uid
      }, 
      { id: userId }
    );

    // 记录变更日志
    await insert('referee_change_logs', {
      user_id: userId,
      old_referee_id: oldRefereeId,
      new_referee_id: newRefereeId,
      change_type: 'admin_update',
      operator_type: 'admin',
      operator_id: admin.id,
      remark: remark || '管理员修改推荐人'
    });

    // 查询旧推荐人名称
    let oldRefereeName = null;
    if (oldRefereeId) {
      const oldReferee = await findOne('users', { id: oldRefereeId });
      oldRefereeName = oldReferee?.real_name;
    }

    console.log('[admin:updateUserReferee] 推荐人修改成功');
    return response.success({
      oldRefereeId,
      newRefereeId,
      oldRefereeName,
      newRefereeName: newReferee.real_name
    }, '推荐人修改成功');

  } catch (error) {
    console.error('[admin:updateUserReferee] 修改失败:', error);
    return response.error('修改推荐人失败', error);
  }
};

/**
 * 检查是否会形成循环推荐关系
 * @param {number} refereeId - 推荐人ID
 * @param {number} userId - 用户ID
 * @returns {Promise<boolean>}
 */
async function checkCircularReferral(refereeId, userId) {
  let currentId = refereeId;
  const visited = new Set();

  while (currentId) {
    // 如果遇到了用户自己，说明形成了循环
    if (currentId === userId) {
      return true;
    }

    // 防止无限循环
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);

    // 查询当前用户的推荐人
    const user = await findOne('users', { id: currentId });

    if (!user || !user.referee_id) {
      break;
    }

    currentId = user.referee_id;
  }

  return false;
}
