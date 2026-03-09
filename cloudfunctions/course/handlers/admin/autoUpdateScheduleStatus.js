/**
 * 自动更新排期状态 + 沙龙自动流转 + 非沙龙结课/缺席（定时触发，每日 0 点执行）
 *
 * 排期状态码：0已取消 / 1未开始 / 2进行中 / 3已结束
 * 预约状态码（沙龙）：0待上课 / 1已签到 / 2已结课 / 3已取消（全自动流转，无缺席）
 * 预约状态码（非沙龙）：0进行中 / 1已结课 / 3已取消 / 4缺席
 *
 * 转换规则：
 *   1. class_records: status=1 且 class_date <= today    → status=2（未开始 → 进行中）
 *   2. 沙龙自动签到：type=4 排期变为进行中时，appointments.status=0 → 1（自动签到）
 *   3. class_records: status=2 且 class_end_date < today → status=3（进行中 → 已结束）
 *   4a. 沙龙已结课：已结束排期中 status IN (0,1) → status=2（已结课）
 *   4b. 非沙龙：已结束排期中 status=0，有签到记录 → status=1（已结课）+ attend_count+1，无签到记录 → status=4（缺席）
 *   5. 沙龙结束清理：type=4 排期已结束时，硬删除 class_records + courses + user_courses
 *
 * 触发方式：cloudfunction.json 的 timer trigger，event 无 action 字段
 */
const { db } = require('../../common/db');
const { response, formatDateTime } = require('../../common');
const { triggerPostContractLogic } = require('../../common/triggerPostContractLogic');

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

    // 第四步：已结束排期的预约处理，按课程类型区分
    let salonCompleted = 0; // 沙龙已结课(status=2)
    let toFinished = 0;     // 非沙龙已结课(status=1)
    let toAbsent4 = 0;      // 非沙龙缺席(status=4)
    const { data: endedRecords, error: error4a } = await db
      .from('class_records')
      .select('id, course_id')
      .eq('status', 3);

    if (error4a) throw error4a;

    if (endedRecords && endedRecords.length > 0) {
      const salonEndedIds = endedRecords
        .filter(r => salonCourseIds.includes(r.course_id))
        .map(r => r.id);
      const nonSalonEndedIds = endedRecords
        .filter(r => !salonCourseIds.includes(r.course_id))
        .map(r => r.id);

      // 沙龙已结课：status=0(待上课) 或 status=1(已签到) → status=2(已结课)
      if (salonEndedIds.length > 0) {
        const { data: data4s, error: error4s } = await db
          .from('appointments')
          .update({ status: 2 })
          .in('class_record_id', salonEndedIds)
          .in('status', [0, 1]);
        if (error4s) throw error4s;
        salonCompleted = Array.isArray(data4s) ? data4s.length : 0;
      }

      // 非沙龙：按签到记录分流，有签到→已结课(1)+attend_count+1，无签到→缺席(4)
      if (nonSalonEndedIds.length > 0) {
        const { data: pendingApts } = await db
          .from('appointments')
          .select('id, user_id, course_id, user_course_id')
          .in('class_record_id', nonSalonEndedIds)
          .eq('status', 0);

        if (pendingApts && pendingApts.length > 0) {
          const aptIds = pendingApts.map(a => a.id);
          const { data: allCheckins } = await db
            .from('appointment_checkins')
            .select('appointment_id')
            .in('appointment_id', aptIds);

          const checkedSet = new Set((allCheckins || []).map(c => c.appointment_id));

          for (const apt of pendingApts) {
            if (checkedSet.has(apt.id)) {
              await db.from('appointments').update({ status: 1 }).eq('id', apt.id);
              if (apt.user_course_id) {
                const { data: uc } = await db.from('user_courses')
                  .select('id, attend_count, contract_signed').eq('id', apt.user_course_id).single();
                if (uc) {
                  const oldCount = uc.attend_count || 0;
                  const newCount = oldCount + 1;
                  await db.from('user_courses')
                    .update({ attend_count: newCount }).eq('id', uc.id);

                  // attend_count 0→1 且未签合同：检查是否"不需要合同"的课程
                  if (newCount === 1 && oldCount === 0 && uc.contract_signed === 0) {
                    const { data: courseInfo } = await db.from('courses')
                      .select('need_contract').eq('id', apt.course_id).single();
                    if (courseInfo && courseInfo.need_contract === 0) {
                      await triggerPostContractLogic(apt.user_id, apt.course_id, uc.id);
                    }
                  }
                }
              }
              toFinished++;
            } else {
              await db.from('appointments').update({ status: 4 }).eq('id', apt.id);
              toAbsent4++;
            }
          }
        }
      }
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

    const total = toOngoing + toEnded + salonCompleted + toAbsent4 + toFinished + salonAutoCheckin;

    console.log(`[autoUpdateScheduleStatus] 日期: ${today}, 未开始→进行中: ${toOngoing}, 进行中→已结束: ${toEnded}, 沙龙已结课: ${salonCompleted}, 非沙龙已结课: ${toFinished}, 非沙龙缺席: ${toAbsent4}, 沙龙自动签到: ${salonAutoCheckin}, 沙龙清理课程: ${salonCleanedCourses}, 沙龙清理排期: ${salonCleanedRecords}`);

    return response.success({
      date: today,
      affectedRows: total,
      toOngoing,
      toEnded,
      salonCompleted,
      toAbsent4,
      toFinished,
      salonAutoCheckin,
      salonCleanedCourses,
      salonCleanedRecords,
      message: `更新 ${total} 条记录（排期状态 ${toOngoing + toEnded} + 沙龙结课 ${salonCompleted} + 非沙龙结课 ${toFinished} + 非沙龙缺席 ${toAbsent4} + 沙龙签到 ${salonAutoCheckin}），沙龙清理 ${salonCleanedCourses} 门课程`
    });
  } catch (error) {
    console.error('[autoUpdateScheduleStatus] 更新失败:', error);
    return response.error('自动更新排期状态失败', error);
  }
};
