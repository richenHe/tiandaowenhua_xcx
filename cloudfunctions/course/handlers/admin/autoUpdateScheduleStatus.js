/**
 * 自动更新排期状态 + 标记缺席 + 沙龙自动签到/清理（定时触发，每日 0 点执行）
 *
 * 排期状态码：0已取消 / 1未开始 / 2进行中 / 3已结束
 * 预约状态码：0待上课 / 1已签到 / 2缺席 / 3已取消
 *
 * 转换规则：
 *   1. class_records: status=1 且 class_date <= today    → status=2（未开始 → 进行中）
 *   2. 沙龙自动签到：type=4 排期变为进行中时，appointments.status=0 → 1（自动签到）
 *   3. class_records: status=2 且 class_end_date < today → status=3（进行中 → 已结束）
 *   4. appointments: 已结束排期(status=3)中 status=0(待上课) → status=2（缺席）
 *   5. 沙龙结束清理：type=4 排期已结束时，硬删除 class_records + courses + user_courses
 *
 * 触发方式：cloudfunction.json 的 timer trigger，event 无 action 字段
 */
const { db } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  try {
    const { formatBeijingDate } = require('../../common/utils');
    const today = formatBeijingDate(new Date());
    const now = formatDateTime(new Date());

    // 第一步：未开始(1) → 进行中(2)，class_date <= today
    const { data: data1, error: error1 } = await db
      .from('class_records')
      .update({ status: 2 })
      .eq('status', 1)
      .lte('class_date', today);

    if (error1) throw error1;

    const toOngoing = Array.isArray(data1) ? data1.length : 0;

    // 第二步：沙龙自动签到 — 查询所有 type=4 的课程 ID，再找进行中的沙龙排期
    let salonAutoCheckin = 0;
    const { data: salonCourses } = await db
      .from('courses')
      .select('id')
      .eq('type', 4);

    const salonCourseIds = salonCourses ? salonCourses.map(c => c.id) : [];

    if (salonCourseIds.length > 0) {
      const { data: salonOngoing } = await db
        .from('class_records')
        .select('id')
        .eq('status', 2)
        .in('course_id', salonCourseIds);

      if (salonOngoing && salonOngoing.length > 0) {
        const salonRecordIds = salonOngoing.map(r => r.id);
        const { data: checkinData, error: checkinError } = await db
          .from('appointments')
          .update({ status: 1, checkin_time: now })
          .in('class_record_id', salonRecordIds)
          .eq('status', 0);

        if (checkinError) throw checkinError;
        salonAutoCheckin = Array.isArray(checkinData) ? checkinData.length : 0;
      }
    }

    // 第三步：进行中(2) → 已结束(3)，class_end_date < today
    const { data: data2, error: error2 } = await db
      .from('class_records')
      .update({ status: 3 })
      .eq('status', 2)
      .lt('class_end_date', today);

    if (error2) throw error2;

    const toEnded = Array.isArray(data2) ? data2.length : 0;

    // 第四步：标记缺席 — 已结束排期中仍为待上课(0)的预约 → 缺席(2)
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

    // 第五步：沙龙结束清理 — 硬删除已结束的沙龙排期 + 课程 + user_courses（保留 appointments）
    let salonCleanedCourses = 0;
    let salonCleanedRecords = 0;
    if (salonCourseIds.length > 0) {
      const { data: salonEnded } = await db
        .from('class_records')
        .select('id, course_id')
        .eq('status', 3)
        .in('course_id', salonCourseIds);

      if (salonEnded && salonEnded.length > 0) {
        const courseIdsToDelete = [...new Set(salonEnded.map(r => r.course_id))];
        const recordIdsToDelete = salonEnded.map(r => r.id);

        // 顺序删除：排期 → user_courses → 课程
        await db.from('class_records').delete().in('id', recordIdsToDelete);
        await db.from('user_courses').delete().in('course_id', courseIdsToDelete);
        await db.from('courses').delete().in('id', courseIdsToDelete);

        salonCleanedRecords = recordIdsToDelete.length;
        salonCleanedCourses = courseIdsToDelete.length;
      }
    }

    const total = toOngoing + toEnded + toAbsent + salonAutoCheckin;

    console.log(`[autoUpdateScheduleStatus] 日期: ${today}, 未开始→进行中: ${toOngoing}, 进行中→已结束: ${toEnded}, 待上课→缺席: ${toAbsent}, 沙龙自动签到: ${salonAutoCheckin}, 沙龙清理课程: ${salonCleanedCourses}, 沙龙清理排期: ${salonCleanedRecords}`);

    return response.success({
      date: today,
      affectedRows: total,
      toOngoing,
      toEnded,
      toAbsent,
      salonAutoCheckin,
      salonCleanedCourses,
      salonCleanedRecords,
      message: `更新 ${total} 条记录（排期状态 ${toOngoing + toEnded} + 缺席 ${toAbsent} + 沙龙签到 ${salonAutoCheckin}），沙龙清理 ${salonCleanedCourses} 门课程`
    });
  } catch (error) {
    console.error('[autoUpdateScheduleStatus] 更新失败:', error);
    return response.error('自动更新排期状态失败', error);
  }
};
