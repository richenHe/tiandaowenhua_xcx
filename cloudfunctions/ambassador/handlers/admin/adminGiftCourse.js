/**
 * 管理端接口：大使赠送课程给用户
 * Action: adminGiftCourse
 *
 * 流程：
 *   1. 校验大使对该课程类型有剩余名额
 *   2. 扣减大使名额（ambassador_quotas）
 *   3. 为接收人开通课程（user_courses 新建或延期）
 *   4. 写入 quota_usage_records 日志
 */
const { db, insert, update } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { ambassadorUserId, recipientUserId, courseId } = event;

  try {
    console.log('[adminGiftCourse] 参数:', { ambassadorUserId, recipientUserId, courseId });

    if (!ambassadorUserId || !recipientUserId || !courseId) {
      return response.paramError('缺少必要参数: ambassadorUserId, recipientUserId, courseId');
    }

    // 查询课程信息
    const { data: course, error: courseErr } = await db
      .from('courses')
      .select('id, name, type, validity_days, status')
      .eq('id', Number(courseId))
      .single();

    if (courseErr || !course) {
      return response.error('课程不存在');
    }
    if (course.status !== 1) {
      return response.error('该课程已下架');
    }

    // 映射 course.type → quota_type（仅 1初探班 / 2密训班 可赠送）
    const quotaType = course.type;
    if (![1, 2].includes(quotaType)) {
      return response.error('该课程类型不支持赠送（仅初探班/密训班）');
    }

    // 查询大使信息
    const { data: ambassador, error: ambErr } = await db
      .from('users')
      .select('id, real_name, ambassador_level')
      .eq('id', Number(ambassadorUserId))
      .single();

    if (ambErr || !ambassador) {
      return response.error('大使用户不存在');
    }
    if (!ambassador.ambassador_level || ambassador.ambassador_level === 0) {
      return response.error('该用户不是大使');
    }

    // 查询接收人信息
    const { data: recipient, error: recipErr } = await db
      .from('users')
      .select('id, real_name, phone')
      .eq('id', Number(recipientUserId))
      .single();

    if (recipErr || !recipient) {
      return response.error('接收用户不存在');
    }

    // 查询大使该课程类型的有效名额（按 id 升序，先扣最早的）
    const { data: quotas, error: quotaErr } = await db
      .from('ambassador_quotas')
      .select('*')
      .eq('user_id', ambassador.id)
      .eq('quota_type', quotaType)
      .eq('status', 1)
      .gt('remaining_quantity', 0)
      .order('id', { ascending: true });

    if (quotaErr) throw quotaErr;

    const totalRemaining = (quotas || []).reduce((sum, q) => sum + q.remaining_quantity, 0);
    if (totalRemaining < 1) {
      const typeName = quotaType === 1 ? '初探班' : '密训班';
      return response.error(`大使的${typeName}赠课名额不足`);
    }

    // 扣减 1 个名额（取第一条有余量的记录）
    const targetQuota = quotas[0];
    await update('ambassador_quotas', {
      used_quantity: targetQuota.used_quantity + 1,
      remaining_quantity: targetQuota.remaining_quantity - 1
    }, { id: targetQuota.id });

    console.log('[adminGiftCourse] 名额已扣减:', {
      quota_id: targetQuota.id,
      remaining: targetQuota.remaining_quantity - 1
    });

    // 计算有效期
    const now = new Date();
    const nowStr = formatDateTime(now);
    let expireAt = null;
    if (course.validity_days != null) {
      const expireDate = new Date(now.getTime() + course.validity_days * 86400000);
      expireAt = formatDateTime(expireDate);
    }

    // 查询接收人是否已有该课程
    const { data: existingCourses } = await db
      .from('user_courses')
      .select('id, expire_at, status')
      .eq('user_id', recipient.id)
      .eq('course_id', course.id)
      .limit(1);

    const existing = existingCourses?.[0] || null;
    let userCourseId;
    let actionDesc;

    if (!existing) {
      // 新建 user_courses 记录
      const [newRecord] = await insert('user_courses', {
        user_id: recipient.id,
        _openid: '',
        course_id: course.id,
        course_type: course.type,
        course_name: course.name,
        order_no: null,
        buy_price: 0,
        buy_time: nowStr,
        expire_at: expireAt,
        is_gift: 1,
        gift_source: `大使赠送:${ambassador.real_name || ambassador.id}`,
        attend_count: 0,
        status: 1,
        created_at: nowStr,
        updated_at: nowStr
      });
      userCourseId = newRecord.id;
      actionDesc = '新开通';
      console.log('[adminGiftCourse] 新建课程记录:', userCourseId);
    } else {
      // 已有课程 → 延长有效期
      userCourseId = existing.id;
      let newExpireAt = null;

      if (course.validity_days != null) {
        // 判断现有有效期是否已过期
        const currentExpire = existing.expire_at ? new Date(existing.expire_at) : null;
        const baseTime = (currentExpire && currentExpire > now) ? currentExpire : now;
        const extended = new Date(baseTime.getTime() + course.validity_days * 86400000);
        newExpireAt = formatDateTime(extended);
      }

      const updateData = {
        expire_at: newExpireAt,
        updated_at: nowStr
      };
      // 如果课程已过期/失效，恢复为有效
      if (existing.status !== 1) {
        updateData.status = 1;
      }

      await update('user_courses', updateData, { id: existing.id });
      actionDesc = existing.status !== 1 ? '重新激活并延期' : '延长有效期';
      console.log('[adminGiftCourse] 课程已延期:', { id: existing.id, new_expire_at: newExpireAt });
    }

    // 写入 quota_usage_records 日志
    const [usageRecord] = await insert('quota_usage_records', {
      quota_id: targetQuota.id,
      ambassador_id: ambassador.id,
      _openid: '',
      recipient_id: recipient.id,
      recipient_name: recipient.real_name || '',
      recipient_phone: recipient.phone || '',
      usage_type: 1,
      course_id: course.id,
      course_name: course.name,
      remark: `管理员操作：大使${ambassador.real_name || ambassador.id}赠送课程[${course.name}]给${recipient.real_name || recipient.id}（${actionDesc}）`
    });

    console.log('[adminGiftCourse] 使用记录已写入:', usageRecord.id);

    return response.success({
      record_id: usageRecord.id,
      user_course_id: userCourseId,
      action: actionDesc,
      ambassador_name: ambassador.real_name,
      recipient_name: recipient.real_name,
      course_name: course.name,
      remaining_quota: totalRemaining - 1
    }, '课程赠送成功');

  } catch (error) {
    console.error('[adminGiftCourse] 失败:', error);
    return response.error('赠送课程失败: ' + (error.message || '未知错误'));
  }
};
