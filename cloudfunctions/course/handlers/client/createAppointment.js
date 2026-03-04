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
      // 非沙龙课程：验证用户是否已购买且已签合同且未过期（status=1 + contract_signed=1）
      const { data: userCourses, error: courseError } = await db
        .from('user_courses')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', classRecord.course_id)
        .eq('status', 1)
        .eq('contract_signed', 1)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (courseError || !userCourses) {
        // 检查是否有未签合同的记录（待签合同状态）
        const { data: unsignedUc } = await db
          .from('user_courses')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', classRecord.course_id)
          .eq('status', 1)
          .eq('contract_signed', 0)
          .limit(1)
          .single();
        if (unsignedUc) {
          return response.forbidden('请先签署学习合同后再预约');
        }
        return response.forbidden('您还未购买该课程或课程已过期');
      }
      userCourseId = userCourses.id;

      // 复训校验：attend_count >= 1 时必须已支付复训费
      if ((userCourses.attend_count || 0) >= 1) {
        const { data: retrainOrder } = await db
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .eq('order_type', 2)
          .eq('class_record_id', finalClassRecordId)
          .eq('pay_status', 1)
          .single();

        if (!retrainOrder) {
          return response.error('复训课程需先支付复训费');
        }
      }
    }

    // 检查是否已预约（0待上课/1已签到 均算已预约）
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
    const { data: newAppointment, error: insertError } = await db
      .from('appointments')
      .insert({
        user_id: user.id,
        _openid: user._openid || user.openid || '',
        course_id: classRecord.course_id,
        class_record_id: finalClassRecordId,
        user_course_id: userCourseId,
        status: 0
      })
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
      start_time: classRecord.start_time
    }, '预约成功');

  } catch (error) {
    console.error('[Course/createAppointment] 创建失败:', error);
    return response.error('创建预约失败', error);
  }
};
