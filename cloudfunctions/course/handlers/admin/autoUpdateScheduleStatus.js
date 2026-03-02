/**
 * 自动更新排期状态 + 标记缺席（定时触发，每日 0 点执行）
 *
 * 排期状态码：0已取消 / 1未开始 / 2进行中 / 3已结束
 * 预约状态码：0待上课 / 1已签到 / 2缺席 / 3已取消
 *
 * 转换规则：
 *   1. class_records: status=1 且 class_date <= today    → status=2（未开始 → 进行中）
 *   2. class_records: status=2 且 class_end_date < today → status=3（进行中 → 已结束）
 *      注：单天课 class_end_date 与 class_date 相同，无需单独处理
 *   3. appointments: 已结束排期(status=3)中 status=0(待上课) → status=2（缺席）
 *
 * 触发方式：cloudfunction.json 的 timer trigger，event 无 action 字段
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  try {
    const { formatBeijingDate } = require('../../common/utils');
    const today = formatBeijingDate(new Date());

    // 第一步：未开始(1) → 进行中(2)，class_date <= today
    const { data: data1, error: error1 } = await db
      .from('class_records')
      .update({ status: 2 })
      .eq('status', 1)
      .lte('class_date', today);

    if (error1) throw error1;

    // 第二步：进行中(2) → 已结束(3)，class_end_date < today（单天课 class_end_date = class_date）
    const { data: data2, error: error2 } = await db
      .from('class_records')
      .update({ status: 3 })
      .eq('status', 2)
      .lt('class_end_date', today);

    if (error2) throw error2;

    const toOngoing = Array.isArray(data1) ? data1.length : 0;
    const toEnded = Array.isArray(data2) ? data2.length : 0;

    // 第三步：标记缺席 - 已结束排期中仍为待上课(0)的预约 → 缺席(2)
    let toAbsent = 0;
    const { data: endedRecords, error: error4a } = await db
      .from('class_records')
      .select('id')
      .eq('status', 3);

    if (error4a) throw error4a;

    if (endedRecords && endedRecords.length > 0) {
      const endedIds = endedRecords.map(r => r.id);
      const { data: data4, error: error4b } = await db
        .from('appointments')
        .update({ status: 2 })
        .in('class_record_id', endedIds)
        .eq('status', 0);

      if (error4b) throw error4b;
      toAbsent = Array.isArray(data4) ? data4.length : 0;
    }

    const total = toOngoing + toEnded + toAbsent;

    console.log(`[autoUpdateScheduleStatus] 日期: ${today}, 未开始→进行中: ${toOngoing}, 进行中→已结束: ${toEnded}, 待上课→缺席: ${toAbsent}`);

    return response.success({
      date: today,
      affectedRows: total,
      toOngoing,
      toEnded,
      toAbsent,
      message: `更新 ${total} 条记录（排期状态 ${toOngoing + toEnded} + 缺席 ${toAbsent}）`
    });
  } catch (error) {
    console.error('[autoUpdateScheduleStatus] 更新失败:', error);
    return response.error('自动更新排期状态失败', error);
  }
};
