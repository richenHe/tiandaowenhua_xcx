/**
 * 创建预约（客户端接口�? */
const { db, findOne, insert } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { classRecordId, class_record_id } = event;
  const finalClassRecordId = classRecordId || class_record_id; // 支持两种命名
  const { user } = context;

  try {
    // 参数验证
    if (!finalClassRecordId) {
      return response.paramError('缺少必填参数: classRecordId');
    }

    // 预览模式限制：资料未完善的用户不允许预约
    if (!user.profile_completed) {
      return response.forbidden('请先完善个人资料后再预约');
    }

    // 黑名单校验：课程拉黑（blacklist_type=1）
    const { data: courseBlacklist } = await db
      .from('user_blacklist')
      .select('blacklist_months, blacklist_end_time')
      .eq('user_id', user.id)
      .eq('blacklist_type', 1)
      .eq('status', 1)
      .limit(1);
    if (courseBlacklist && courseBlacklist.length > 0) {
      const bl = courseBlacklist[0];
      if (new Date(bl.blacklist_end_time) > new Date()) {
        return response.error(`因为你多次缺席，${bl.blacklist_months}月内无法报名复训，请和客服联系`);
      }
    }

    console.log('[Course/createAppointment] 创建预约:', {
      user_id: user.id,
      class_record_id: finalClassRecordId
    });

    // 查询上课记录
    const { data: classRecords, error: classError } = await db
      .from('class_records')
      .select('*')
      .eq('id', finalClassRecordId)
      .eq('status', 1)
      .single();

    if (classError || !classRecords) {
      console.error('[Course/createAppointment] 查询上课记录失败:', classError);
      return response.notFound('上课记录不存在或已取消');
    }

    const classRecord = classRecords;

    // 查询课程类型，用于沙龙课程特殊处理
    const course = await findOne('courses', { id: classRecord.course_id });
    const isSalon = course && course.type === 4;

    let userCourseId;
    let isRetrainAppointment = false;
    let usedRetrainCredit = false;
    let retrainCreditOrderNo = null;

    if (isSalon) {
      // 沙龙课程(type=4)：免费，若无 user_courses 记录则自动创建
      const { data: existingUc } = await db
        .from('user_courses')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', classRecord.course_id)
        .single();
      if (existingUc) {
        userCourseId = existingUc.id;
      } else {
        const now = formatDateTime(new Date());
        const [newUc] = await insert('user_courses', {
          user_id: user.id,
          course_id: classRecord.course_id,
          course_type: 4,
          buy_price: 0,
          order_no: null,
          status: 1,
          attend_count: 0,
          created_at: now,
          updated_at: now
        });
        userCourseId = newUc.id;
      }
    } else {
      // 非沙龙课程：验证用户是否已购买该课程（status=1）
      const { data: userCourses, error: courseError } = await db
        .from('user_courses')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', classRecord.course_id)
        .eq('status', 1)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (courseError || !userCourses) {
        return response.forbidden('您还未购买该课程或课程已过期');
      }
      userCourseId = userCourses.id;

      // 复训校验：attend_count >= 1 时，若本排期 retrain_price>0 须已付复训费或可抵用资格；若为 0 则免费复训直接通过
      if ((userCourses.attend_count || 0) >= 1) {
        const scheduleRetrainPrice = parseFloat(classRecord.retrain_price) || 0;
        if (scheduleRetrainPrice <= 0) {
          isRetrainAppointment = true;
        } else {
          // 优先检查当前排期是否有已支付的复训订单
          const { data: retrainOrder } = await db
            .from('orders')
            .select('id')
            .eq('user_id', user.id)
            .eq('order_type', 2)
            .eq('class_record_id', finalClassRecordId)
            .eq('pay_status', 1)
            .single();

          if (!retrainOrder) {
            // 检查是否有可抵用的复训资格（同课程，retrain_credit_status=1）
            const { data: creditOrder } = await db
              .from('orders')
              .select('id, order_no')
              .eq('user_id', user.id)
              .eq('order_type', 2)
              .eq('pay_status', 1)
              .eq('retrain_credit_status', 1)
              .eq('related_id', userCourseId)
              .limit(1)
              .single();

            if (creditOrder) {
              // 使用复训资格：标记为已抵用
              await db
                .from('orders')
                .update({ retrain_credit_status: 2 })
                .eq('id', creditOrder.id);
              usedRetrainCredit = true;
              retrainCreditOrderNo = creditOrder.order_no;
              console.log(`[Course/createAppointment] 使用复训资格, order_no: ${creditOrder.order_no}`);
            } else {
              return response.error('复训课程需先支付复训费');
            }
          }
          isRetrainAppointment = true;
        }
      }
    }

    // 同一课程只能有一个进行中的预约（跨排期去重）
    const { data: activeCourseAppointment } = await db
      .from('appointments')
      .select('id, class_record_id')
      .eq('user_id', user.id)
      .eq('course_id', classRecord.course_id)
      .eq('status', 0)
      .limit(1);

    if (activeCourseAppointment && activeCourseAppointment.length > 0) {
      return response.error('您已预约了该课程的其他排期，如需预约当前排期，请先取消已有的预约');
    }

    // 检查同排期是否已预约（含已结课，防重复预约同一排期）
    const { data: existingAppointments } = await db
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .eq('class_record_id', finalClassRecordId)
      .in('status', [0, 1])
      .single();

    if (existingAppointments) {
      return response.error('您已预约该课程，请勿重复预约');
    }

    // 检查名额
    if (classRecord.booked_quota >= classRecord.total_quota) {
      return response.error('该课程名额已满');
    }

    // 创建预约记录（status: 0=待上课，user_course_id 为 NOT NULL 必须包含）
    const appointmentData = {
      user_id: user.id,
      _openid: user._openid || user.openid || '',
      course_id: classRecord.course_id,
      class_record_id: finalClassRecordId,
      user_course_id: userCourseId,
      is_retrain: isRetrainAppointment ? 1 : 0,
      status: 0
    };
    // 复训资格抵扣时，关联原始复训订单号
    if (retrainCreditOrderNo) {
      appointmentData.order_no = retrainCreditOrderNo;
    }

    const { data: newAppointment, error: insertError } = await db
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (insertError) {
      console.error('[Course/createAppointment] 创建预约失败:', insertError);
      throw insertError;
    }

    // 更新班级人数（注意：这里可能存在并发问题，生产环境建议使用数据库事务或乐观锁）
    const { error: updateError } = await db
      .from('class_records')
      .update({ booked_quota: classRecord.booked_quota + 1 })
      .eq('id', finalClassRecordId);

    if (updateError) {
      console.error('[Course/createAppointment] 更新班级人数失败:', updateError);
      // 回滚：删除刚创建的预约
      await db.from('appointments').delete().eq('id', newAppointment.id);
      throw updateError;
    }

    console.log('[Course/createAppointment] 预约成功:', newAppointment.id);

    return response.success({
      appointment_id: newAppointment.id,
      class_record_id: finalClassRecordId,
      class_date: classRecord.class_date,
      start_time: classRecord.class_time,
      used_retrain_credit: usedRetrainCredit
    }, usedRetrainCredit ? '预约成功（已使用保留的复训资格）' : '预约成功');

  } catch (error) {
    console.error('[Course/createAppointment] 创建失败:', error);
    return response.error('创建预约失败', error);
  }
};
