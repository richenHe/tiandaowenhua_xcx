/**
 * 公共模块：触发"签订合同"后续业务逻辑
 *
 * 适用于 need_contract=0 的课程，在 attend_count 从 0 变为 1 时自动触发
 * 执行与管理员录入合约（adminCreateCourseContract）相同的后续操作：
 *   1. user_courses.contract_signed = 1
 *   2. user_courses.expire_at = NOW() + pending_days（兜底 validity_days 或 365）
 *   3. user_courses.pending_days = 0
 *   4. 发放推荐人奖励（grantRefereeRewardAfterSign）
 *
 * 注意：不创建 contract_signatures 记录（因为不需要合同）
 *
 * @param {number} userId - 用户ID
 * @param {number} courseId - 课程ID
 * @param {number} userCourseId - user_courses.id
 */

const { db } = require('./db');
const { formatDateTime } = require('./utils');
const { grantRefereeRewardAfterSign } = require('./grantRefereeReward');

async function triggerPostContractLogic(userId, courseId, userCourseId) {
  try {
    // 查询 user_courses 当前状态
    const { data: uc } = await db
      .from('user_courses')
      .select('id, pending_days, contract_signed')
      .eq('id', userCourseId)
      .single();

    if (!uc || uc.contract_signed === 1) {
      return;
    }

    // 查询课程有效期天数（兜底）
    const { data: courseInfo } = await db
      .from('courses')
      .select('validity_days')
      .eq('id', courseId)
      .single();

    // 计算有效期（与 adminCreateCourseContract 逻辑一致）
    const now = new Date();
    const nowStr = formatDateTime(now);
    const bjNow = new Date(now.getTime() + 8 * 3600000);

    const totalDays = (uc.pending_days > 0)
      ? uc.pending_days
      : (courseInfo?.validity_days || 365);

    const expireDate = new Date(bjNow.getTime() + totalDays * 86400000);
    const expireAt = [
      expireDate.getUTCFullYear(),
      String(expireDate.getUTCMonth() + 1).padStart(2, '0'),
      String(expireDate.getUTCDate()).padStart(2, '0')
    ].join('-') + ' 23:59:59';

    // 更新 user_courses
    await db.from('user_courses').update({
      contract_signed: 1,
      expire_at:       expireAt,
      pending_days:    0,
      updated_at:      nowStr
    }).eq('id', userCourseId);

    console.log(`[triggerPostContractLogic] 用户${userId} 课程${courseId} 首次上课触发：contract_signed=1, expire_at=${expireAt}`);

    // 发放推荐人奖励
    await grantRefereeRewardAfterSign(userId, courseId);

  } catch (err) {
    console.error('[triggerPostContractLogic] 触发后续逻辑失败（不影响签到主流程）:', err);
  }
}

module.exports = { triggerPostContractLogic };
