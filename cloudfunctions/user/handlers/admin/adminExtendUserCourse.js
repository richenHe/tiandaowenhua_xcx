/**
 * 管理端接口：延长用户课程有效期
 * Action: adminExtendUserCourse
 *
 * 参数：
 * - userCourseId: 用户课程ID（必填）
 * - extendDays:   延长天数（必填，正整数）
 *
 * 业务规则：
 * - 仅支持 contract_signed=1 且 status=1（有效）或 status=3（已过期）的记录
 * - status=1：新 expire_at = 当前 expire_at + extendDays
 * - status=3：新 expire_at = 今天 + extendDays，并将 status 恢复为 1
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { userCourseId, extendDays } = event;

  if (!userCourseId) return response.paramError('缺少必要参数: userCourseId');
  if (!extendDays || extendDays <= 0 || !Number.isInteger(Number(extendDays))) {
    return response.paramError('extendDays 必须为正整数');
  }

  const days = Number(extendDays);

  try {
    // 查询原记录
    const { data: uc, error: queryErr } = await db.from('user_courses')
      .select('id, user_id, course_id, expire_at, contract_signed, status')
      .eq('id', userCourseId)
      .single();

    if (queryErr || !uc) return response.error('用户课程记录不存在');

    if (uc.contract_signed !== 1) {
      return response.error('该课程尚未签合同，有效期未开始计算，不支持延期');
    }
    if (uc.status !== 1 && uc.status !== 3) {
      return response.error('仅有效或已过期的课程支持延期操作');
    }

    // 计算新到期时间
    const now = new Date();
    const nowStr = formatDateTime(now);
    const bjNow = new Date(now.getTime() + 8 * 3600000);

    let baseDate;
    if (uc.status === 3 || !uc.expire_at) {
      // 已过期：从今天起算
      baseDate = bjNow;
    } else {
      // 有效：在当前到期日基础上顺延
      baseDate = new Date(new Date(uc.expire_at).getTime() + 8 * 3600000);
    }

    const newExpireDate = new Date(baseDate.getTime() + days * 86400000);
    const newExpireAt = [
      newExpireDate.getUTCFullYear(),
      String(newExpireDate.getUTCMonth() + 1).padStart(2, '0'),
      String(newExpireDate.getUTCDate()).padStart(2, '0')
    ].join('-') + ' 23:59:59';

    // 构建更新内容
    const updateData = {
      expire_at:  newExpireAt,
      updated_at: nowStr
    };
    // 已过期则恢复为有效
    if (uc.status === 3) {
      updateData.status = 1;
    }

    const { error: updateErr } = await db.from('user_courses')
      .update(updateData)
      .eq('id', userCourseId);

    if (updateErr) throw updateErr;

    console.log(
      `[admin:adminExtendUserCourse] 管理员 ${admin.id} 延期 user_course_id=${userCourseId}，` +
      `延长 ${days} 天，新到期日=${newExpireAt}，原状态=${uc.status}`
    );

    return response.success({
      user_course_id: userCourseId,
      old_expire_at:  uc.expire_at,
      new_expire_at:  newExpireAt,
      status_changed: uc.status === 3
    }, '延期成功');

  } catch (error) {
    console.error('[admin:adminExtendUserCourse] 失败:', error);
    return response.error('延期操作失败', error);
  }
};
