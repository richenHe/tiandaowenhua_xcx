/**
 * 扫码签到（客户端接口）
 *
 * 学生扫描排期签到二维码后调用，自动查找该用户对应排期的预约并标记为已签到。
 * scene 参数格式：ci={class_record_id}
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, formatDateTime } = require('../../common/utils');

/**
 * 解冻推荐人积分（首次上课时触发，与 checkin.js 逻辑一致）
 */
async function unfreezeRefereePoints(userId, orderNo) {
  const { data: user } = await db
    .from('users')
    .select('referee_id')
    .eq('id', userId)
    .single();

  if (!user || !user.referee_id) return;

  const { data: referee } = await db
    .from('users')
    .select('id, uid, ambassador_level, cash_points_frozen')
    .eq('id', user.referee_id)
    .single();

  if (!referee) return;

  const { data: config } = await db
    .from('ambassador_level_configs')
    .select('unfreeze_per_referral')
    .eq('level', referee.ambassador_level)
    .single();

  if (!config) return;

  const unfreezeAmount = parseFloat(config.unfreeze_per_referral) || 0;
  if (unfreezeAmount <= 0 || referee.cash_points_frozen < unfreezeAmount) return;

  const { data: refereeUser } = await db
    .from('users')
    .select('real_name')
    .eq('id', userId)
    .single();

  const { data: currentReferee } = await db
    .from('users')
    .select('cash_points_frozen, cash_points_available')
    .eq('id', referee.id)
    .single();

  await db.from('users').update({
    cash_points_frozen: (currentReferee?.cash_points_frozen || 0) - unfreezeAmount,
    cash_points_available: (currentReferee?.cash_points_available || 0) + unfreezeAmount
  }).eq('id', referee.id);

  await db.from('cash_points_records').insert({
    user_id: referee.id,
    user_uid: referee.uid,
    type: 2,
    amount: unfreezeAmount,
    order_no: orderNo,
    referee_user_id: userId,
    referee_user_name: refereeUser?.real_name || '',
    remark: '推荐学员扫码签到，解冻积分',
    created_at: formatDateTime(new Date())
  });

  if (referee.ambassador_level === 2) {
    await db.from('users').update({ is_first_recommend: true }).eq('id', referee.id);
  }

  console.log('[Course/scanCheckin] 积分解冻成功:', unfreezeAmount);
}

module.exports = async (event, context) => {
  const { classRecordId } = event;
  const { user } = context;

  try {
    const validation = validateRequired({ classRecordId }, ['classRecordId']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const recordId = parseInt(classRecordId);

    // 查找当前用户在该排期下的预约记录
    const { data: appointments, error: findError } = await db
      .from('appointments')
      .select('id, status, course_id, order_no')
      .eq('user_id', user.id)
      .eq('class_record_id', recordId);

    if (findError) throw findError;

    if (!appointments || appointments.length === 0) {
      return response.error('您没有该课程的预约记录，无法签到');
    }

    const appointment = appointments[0];

    if (appointment.status === 1) {
      return response.error('您已签到，请勿重复签到');
    }
    if (appointment.status === 2) {
      return response.error('该预约已标记为缺席，无法签到');
    }
    if (appointment.status === 3) {
      return response.error('该预约已取消，无法签到');
    }

    // 更新签到状态：1=已签到
    const now = formatDateTime(new Date());
    await db
      .from('appointments')
      .update({ status: 1, checkin_time: now })
      .eq('id', appointment.id);

    // 更新用户课程上课次数
    const { data: userCourse } = await db
      .from('user_courses')
      .select('id, attend_count')
      .eq('user_id', user.id)
      .eq('course_id', appointment.course_id)
      .single();

    if (userCourse) {
      await db
        .from('user_courses')
        .update({ attend_count: (userCourse.attend_count || 0) + 1 })
        .eq('id', userCourse.id);
    }

    // 异步解冻推荐人积分
    setImmediate(async () => {
      try {
        await unfreezeRefereePoints(user.id, appointment.order_no);
      } catch (err) {
        console.error('[Course/scanCheckin] 解冻积分失败:', err);
      }
    });

    console.log(`[Course/scanCheckin] 签到成功: user_id=${user.id}, appointment_id=${appointment.id}`);

    return response.success({
      message: '签到成功',
      checkin_at: now
    });

  } catch (error) {
    console.error('[Course/scanCheckin] 签到失败:', error);
    return response.error('签到失败', error);
  }
};
