/**
 * 获取我的预约列表（客户端接口）
 *
 * 非沙龙课程返回 today_checked_in / has_ever_checked_in 用于前端状态展示
 */
const { db, response, executePaginatedQuery } = require('../../common');
const { formatDateTime } = require('../../common/utils');

module.exports = async (event, context) => {
  const { status, page = 1, page_size = 10, pageSize } = event;
  const { user } = context;

  try {
    console.log(`[getMyAppointments] 收到请求:`, { user_id: user.id, status, page });

    const finalPageSize = pageSize || page_size || 10;

    let queryBuilder = db
      .from('appointments')
      .select(`
        id,
        course_id,
        class_record_id,
        is_retrain,
        order_no,
        status,
        checkin_code,
        checkin_time,
        created_at,
        cancel_reason,
        cancel_time,
        course:courses!fk_appointments_course(
          name,
          type
        ),
        class_record:class_records!fk_appointments_class_record(
          class_date,
          class_end_date,
          class_time,
          class_location,
          teacher,
          cancel_deadline_days
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('id', { ascending: false });

    if (status !== undefined && status !== null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    const today = new Date().toISOString().slice(0, 10);

    // 收集非沙龙预约 ID，批量查询签到记录
    const rawList = result.list || [];
    const nonSalonIds = rawList
      .filter(a => a.course?.type !== 4)
      .map(a => a.id);

    // 批量查询所有非沙龙预约的签到记录
    let checkinMap = {};
    if (nonSalonIds.length > 0) {
      const { data: allCheckins } = await db
        .from('appointment_checkins')
        .select('appointment_id, checkin_date')
        .in('appointment_id', nonSalonIds);

      if (allCheckins) {
        for (const c of allCheckins) {
          if (!checkinMap[c.appointment_id]) {
            checkinMap[c.appointment_id] = { dates: [], todayChecked: false };
          }
          checkinMap[c.appointment_id].dates.push(c.checkin_date);
          if (c.checkin_date === today) {
            checkinMap[c.appointment_id].todayChecked = true;
          }
        }
      }
    }

    // 批量查询复训预约关联订单的退款状态与资格状态，用于前端显示复训费退款按钮
    const retrainOrderNos = [...new Set(
      rawList
        .filter(a => a.is_retrain === 1 && a.order_no)
        .map(a => a.order_no)
    )];

    let retrainOrderMap = {};
    if (retrainOrderNos.length > 0) {
      const { data: retrainOrders } = await db
        .from('orders')
        .select('order_no, retrain_credit_status, refund_status')
        .in('order_no', retrainOrderNos);

      if (retrainOrders) {
        retrainOrders.forEach(o => {
          retrainOrderMap[o.order_no] = {
            retrain_credit_status: o.retrain_credit_status,
            refund_status: o.refund_status
          };
        });
      }
    }

    const getStatusName = (s, isSalon) => {
      if (isSalon) return { 0: '待上课', 1: '已签到', 2: '已结课', 3: '已取消' }[s] || '未知';
      return { 0: '进行中', 1: '已结课', 3: '已取消', 4: '缺席' }[s] || '未知';
    };

    const list = rawList.map(a => {
      const courseType = a.course?.type;
      const isSalon = courseType === 4;
      const checkinInfo = checkinMap[a.id];

      return {
        id: a.id,
        course_id: a.course_id,
        course_name: a.course?.name,
        course_type: courseType,
        class_record_id: a.class_record_id,
        class_date: a.class_record?.class_date,
        class_end_date: a.class_record?.class_end_date || a.class_record?.class_date,
        start_time: a.class_record?.class_time,
        class_time: a.class_record?.class_time,
        location: a.class_record?.class_location,
        teacher: a.class_record?.teacher,
        status: a.status,
        status_name: getStatusName(a.status, isSalon),
        is_salon: isSalon,
        is_retrain: a.is_retrain || 0,
        order_no: a.order_no || '',
        cancel_deadline_days: a.class_record?.cancel_deadline_days || 0,
        checkin_code: a.checkin_code,
        checkin_at: a.checkin_time,
        appointed_at: a.created_at,
        cancelled_at: a.cancel_time,
        // 非沙龙专用：今日签到状态
        today_checked_in: isSalon ? undefined : !!(checkinInfo && checkinInfo.todayChecked),
        has_ever_checked_in: isSalon ? undefined : !!(checkinInfo && checkinInfo.dates.length > 0),
        // 复训专用：关联订单的退款状态与资格状态，用于前端判断是否显示复训费退款按钮
        retrain_credit_status: a.is_retrain === 1 && a.order_no
          ? (retrainOrderMap[a.order_no]?.retrain_credit_status ?? null)
          : null,
        retrain_refund_status: a.is_retrain === 1 && a.order_no
          ? (retrainOrderMap[a.order_no]?.refund_status ?? null)
          : null
      };
    });

    console.log(`[getMyAppointments] 查询成功，共 ${result.total} 条预约`);

    return response.success({ ...result, list });

  } catch (error) {
    console.error('[getMyAppointments] 查询失败:', error);
    return response.error('查询预约列表失败', error);
  }
};
