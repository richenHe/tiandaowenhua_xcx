/**
 * 签到（客户端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired, generateCode, formatDateTime } = require('../../common/utils');

/**
 * 解冻推荐人积分（首次上课时触发）
 * @param {number} userId - 签到用户ID
 * @param {string} orderNo - 订单号
 */
async function unfreezeRefereePoints(userId, orderNo) {
  // 1. 查询用户的推荐人
  const { data: user } = await db
    .from('users')
    .select('referee_id')
    .eq('id', userId)
    .single();

  if (!user || !user.referee_id) {
    console.log('[Course/checkin] 无推荐人，跳过积分解冻');
    return;
  }

  // 2. 查询推荐人信息和等级配置
  const { data: referee } = await db
    .from('users')
    .select('id, uid, ambassador_level, cash_points_frozen')
    .eq('id', user.referee_id)
    .single();

  if (!referee) {
    console.log('[Course/checkin] 推荐人不存在');
    return;
  }

  const { data: config } = await db
    .from('ambassador_level_configs')
    .select('unfreeze_per_referral')
    .eq('level', referee.ambassador_level)
    .single();

  if (!config) {
    console.log('[Course/checkin] 等级配置不存在');
    return;
  }

  const unfreezeAmount = parseFloat(config.unfreeze_per_referral) || 0;

  // 3. 检查是否有足够的冻结积分
  if (unfreezeAmount <= 0 || referee.cash_points_frozen < unfreezeAmount) {
    console.log('[Course/checkin] 冻结积分不足，跳过解冻');
    return;
  }

  // 4. 查询被推荐人姓名
  const { data: refereeUser } = await db
    .from('users')
    .select('real_name')
    .eq('id', userId)
    .single();

  // 5. 解冻积分
  const { data: currentReferee } = await db
    .from('users')
    .select('cash_points_frozen, cash_points_available')
    .eq('id', referee.id)
    .single();

  await db.from('users').update({
    cash_points_frozen: (currentReferee?.cash_points_frozen || 0) - unfreezeAmount,
    cash_points_available: (currentReferee?.cash_points_available || 0) + unfreezeAmount
  }).eq('id', referee.id);

  // 6. 插入积分明细
  await db.from('cash_points_records').insert({
    user_id: referee.id,
    user_uid: referee.uid,
    type: 2,
    amount: unfreezeAmount,
    order_no: orderNo,
    referee_user_id: userId,
    referee_user_name: refereeUser?.real_name || '',
    remark: '推荐学员首次上课，解冻积分',
    created_at: new Date().toISOString()
  });

  // 7. 青鸾大使首次推荐标记
  if (referee.ambassador_level === 2) {
    await db.from('users').update({
      is_first_recommend: true
    }).eq('id', referee.id);
  }

  console.log('[Course/checkin] 积分解冻成功:', unfreezeAmount);
}

module.exports = async (event, context) => {
  const { appointment_id, checkin_code } = event;
  const { user } = context;

  try {
    // 参数验证
    const validation = validateRequired({ appointment_id }, ['appointment_id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询预约记录（appointments 表无 deleted_at 列，使用 Query Builder）
    const { data: appointment, error: findError } = await db
      .from('appointments')
      .select('*')
      .eq('id', appointment_id)
      .eq('user_id', user.id)
      .single();

    if (findError && !findError.message?.includes('0 rows')) {
      throw findError;
    }

    if (!appointment) {
      return response.notFound('预约记录不存在');
    }

    if (appointment.status === 1) {
      return response.error('已签到，请勿重复签到');
    }

    if (appointment.status === 2) {
      return response.error('已缺席，无法签到');
    }

    if (appointment.status === 3) {
      return response.error('预约已取消，无法签到');
    }

    // 如果提供了签到码，验证签到码
    if (checkin_code) {
      if (appointment.checkin_code !== checkin_code) {
        return response.error('签到码错误');
      }
    } else {
      // 生成签到码（6位数字）
      const newCheckinCode = generateCode(6);

      await db
        .from('appointments')
        .update({ checkin_code: newCheckinCode })
        .eq('id', appointment_id);

      return response.success({
        message: '签到码已生成',
        checkin_code: newCheckinCode,
        need_verify: true
      });
    }

    // 更新签到状态：1=已签到（checkin_time 为实际列名）
    await db
      .from('appointments')
      .update({
        status: 1,
        checkin_time: formatDateTime(new Date())
      })
      .eq('id', appointment_id);

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

    // 异步处理推荐人积分解冻（不阻塞签到响应）
    setImmediate(async () => {
      try {
        await unfreezeRefereePoints(user.id, appointment.order_no);
      } catch (unfreezeError) {
        console.error('[Course/checkin] 解冻推荐人积分失败:', unfreezeError);
      }
    });

    return response.success({
      message: '签到成功',
      checkin_at: formatDateTime(new Date())
    });

  } catch (error) {
    console.error('[Course/checkin] 签到失败:', error);
    return response.error('签到失败', error);
  }
};
