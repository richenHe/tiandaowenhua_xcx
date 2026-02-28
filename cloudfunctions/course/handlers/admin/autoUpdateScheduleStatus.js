/**
 * 自动更新过期排期状态（定时触发，每日 0 点执行）
 *
 * 状态变更规则（status=1 的记录）：
 *   1. 有结课日期且 class_end_date < 今日 → status=2（已结束）
 *   2. 无结课日期且 class_date < 今日    → status=2（已结束）
 *
 * 触发方式：cloudfunction.json 的 timer trigger，event 无 action 字段
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  try {
    // 以 YYYY-MM-DD 格式获取今日日期（北京时间 UTC+8）
    const now = new Date();
    const today = new Date(now.getTime() + 8 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    // 更新一：有结课日期且已过结课日期
    const { data: data1, error: error1 } = await db
      .from('class_records')
      .update({ status: 2 })
      .eq('status', 1)
      .not('class_end_date', 'is', null)
      .lt('class_end_date', today);

    if (error1) throw error1;

    // 更新二：无结课日期（单天课程）且已过上课日期
    const { data: data2, error: error2 } = await db
      .from('class_records')
      .update({ status: 2 })
      .eq('status', 1)
      .is('class_end_date', null)
      .lt('class_date', today);

    if (error2) throw error2;

    const affected1 = Array.isArray(data1) ? data1.length : 0;
    const affected2 = Array.isArray(data2) ? data2.length : 0;
    const total = affected1 + affected2;

    console.log(`[autoUpdateScheduleStatus] 日期: ${today}, 更新 ${total} 条（有结课日期: ${affected1}, 无结课日期: ${affected2}）`);

    return response.success({
      date: today,
      affectedRows: total,
      withEndDate: affected1,
      withoutEndDate: affected2,
      message: `成功更新 ${total} 条过期排期状态为已结束`
    });
  } catch (error) {
    console.error('[autoUpdateScheduleStatus] 更新失败:', error);
    return response.error('自动更新排期状态失败', error);
  }
};
