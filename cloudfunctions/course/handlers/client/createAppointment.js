/**
 * 创建预约（客户端接口�? */
const { db } = require('../../common/db');
const { response } = require('../../common');

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

    // 验证用户是否已购买该课程
    const { data: userCourses, error: courseError } = await db
      .from('user_courses')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', classRecord.course_id)
      .single();

    if (courseError || !userCourses) {
      return response.forbidden('您还未购买该课程');
    }

    // 检查是否已预约
    const { data: existingAppointments } = await db
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .eq('class_record_id', finalClassRecordId)
      .in('status', [1, 2])
      .single();

    if (existingAppointments) {
      return response.error('您已预约该课程，请勿重复预约');
    }

    // 检查名额
    if (classRecord.booked_quota >= classRecord.total_quota) {
      return response.error('该课程名额已满');
    }

    // 创建预约记录
    const { data: newAppointment, error: insertError } = await db
      .from('appointments')
      .insert({
        user_id: user.id,
        course_id: classRecord.course_id,
        class_record_id: finalClassRecordId,
        status: 1, // 待上�?        appointed_at: new Date().toISOString()
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
