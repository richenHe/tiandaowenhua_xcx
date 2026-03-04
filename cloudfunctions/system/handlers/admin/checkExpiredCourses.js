/**
 * 管理端接口：标记过期的课程和合同
 * Action: checkExpiredCourses
 *
 * 每日凌晨由定时任务触发，也可手动调用。
 * 执行两步：
 * 1. 将 expire_at < NOW() 且 contract_signed=1 的 user_courses 状态标记为 3（已过期）
 * 2. 将 contract_end < CURDATE() 的 contract_signatures 状态标记为 2（已过期）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  try {
    console.log('[checkExpiredCourses] 开始执行过期标记任务');

    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const todayStr = now.toISOString().substring(0, 10);

    // 1. 标记过期课程：status=1 且 contract_signed=1 且 expire_at < NOW() → status=3
    const { data: expiredCourses, error: courseErr } = await db
      .from('user_courses')
      .update({ status: 3, updated_at: nowStr })
      .eq('status', 1)
      .eq('contract_signed', 1)
      .lt('expire_at', nowStr)
      .not('expire_at', 'is', null)
      .select('id');

    if (courseErr) {
      console.error('[checkExpiredCourses] 标记过期课程失败:', courseErr);
    } else {
      console.log('[checkExpiredCourses] 标记过期课程完成，共:', expiredCourses?.length || 0, '条');
    }

    // 2. 标记过期合同：status=1 且 contract_end < CURDATE() → status=2
    const { data: expiredContracts, error: contractErr } = await db
      .from('contract_signatures')
      .update({ status: 2, updated_at: nowStr })
      .eq('status', 1)
      .lt('contract_end', todayStr)
      .not('contract_end', 'is', null)
      .select('id');

    if (contractErr) {
      console.error('[checkExpiredCourses] 标记过期合同失败:', contractErr);
    } else {
      console.log('[checkExpiredCourses] 标记过期合同完成，共:', expiredContracts?.length || 0, '条');
    }

    return response.success({
      expired_courses: expiredCourses?.length || 0,
      expired_contracts: expiredContracts?.length || 0
    }, '过期标记任务执行完成');

  } catch (error) {
    console.error('[checkExpiredCourses] 失败:', error);
    return response.error('过期标记任务执行失败', error);
  }
};
