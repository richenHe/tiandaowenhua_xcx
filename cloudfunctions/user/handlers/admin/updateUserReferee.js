/**
 * 管理端接口：修改学员推荐人
 * Action: admin:updateUserReferee
 *
 * 管理员可以修改任意用户的推荐人（包括已锁定的），也可以清空推荐人
 * change_type=4 表示管理员修改
 */
const { findOne, update, insert } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, newRefereeId, remark } = event;

  try {
    // 参数验证
    if (!userId) {
      return response.paramError('缺少参数：userId');
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return response.paramError('userId 格式不正确');
    }

    const user = await findOne('users', { id: parsedUserId });
    if (!user) {
      return response.error('用户不存在', null, 404);
    }

    const oldRefereeId = user.referee_id;

    // 获取旧推荐人信息（清空和更换都需要记录）
    let oldRefereeName = null;
    let oldRefereeUid = null;
    if (oldRefereeId) {
      const oldReferee = await findOne('users', { id: oldRefereeId });
      if (oldReferee) {
        oldRefereeName = oldReferee.real_name;
        oldRefereeUid = oldReferee.uid;
      }
    }

    // 清空推荐人
    if (!newRefereeId) {
      await update('users', {
        referee_id: null,
        referee_uid: null,
        referee_updated_at: utils.formatDateTime(new Date())
      }, { id: parsedUserId });

      await insert('referee_change_logs', {
        user_id: parsedUserId,
        user_uid: user.uid,
        old_referee_id: oldRefereeId,
        old_referee_uid: oldRefereeUid,
        old_referee_name: oldRefereeName,
        new_referee_id: null,
        new_referee_uid: null,
        new_referee_name: null,
        change_type: 4,
        change_source: 3,
        admin_id: admin.id,
        remark: remark || '管理员清除推荐人'
      });

      console.log('[admin:updateUserReferee] 推荐人已清除, userId:', parsedUserId);
      return response.success(null, '推荐人已清除');
    }

    // 设置新推荐人
    const parsedNewRefereeId = parseInt(newRefereeId);
    if (isNaN(parsedNewRefereeId)) {
      return response.paramError('新推荐人ID格式不正确');
    }

    const newReferee = await findOne('users', { id: parsedNewRefereeId });
    if (!newReferee) {
      return response.error('新推荐人不存在', null, 404);
    }

    if (parsedUserId === parsedNewRefereeId) {
      return response.error('不能将自己设为推荐人', null, 400);
    }

    // 检查循环推荐
    const isCircular = await checkCircularReferral(parsedNewRefereeId, parsedUserId);
    if (isCircular) {
      return response.error('不能设置该推荐人，会形成循环推荐关系', null, 400);
    }

    await update('users', {
      referee_id: parsedNewRefereeId,
      referee_uid: newReferee.uid,
      referee_updated_at: utils.formatDateTime(new Date())
    }, { id: parsedUserId });

    await insert('referee_change_logs', {
      user_id: parsedUserId,
      user_uid: user.uid,
      old_referee_id: oldRefereeId,
      old_referee_uid: oldRefereeUid,
      old_referee_name: oldRefereeName,
      new_referee_id: parsedNewRefereeId,
      new_referee_uid: newReferee.uid,
      new_referee_name: newReferee.real_name,
      change_type: 4,
      change_source: 3,
      admin_id: admin.id,
      remark: remark || '管理员修改推荐人'
    });

    console.log('[admin:updateUserReferee] 推荐人修改成功:', parsedUserId, '->', parsedNewRefereeId);
    return response.success({
      oldRefereeId,
      newRefereeId: parsedNewRefereeId,
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
 */
async function checkCircularReferral(refereeId, userId) {
  let currentId = refereeId;
  const visited = new Set();

  while (currentId) {
    if (currentId === userId) {
      return true;
    }
    if (visited.has(currentId)) {
      break;
    }
    visited.add(currentId);

    const user = await findOne('users', { id: currentId });
    if (!user || !user.referee_id) {
      break;
    }
    currentId = user.referee_id;
  }

  return false;
}
