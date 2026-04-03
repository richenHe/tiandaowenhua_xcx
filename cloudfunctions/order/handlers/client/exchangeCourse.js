/**
 * 客户端接口：功德分/积分兑换课程
 * Action: exchangeCourse
 *
 * 使用功德分（或积分）兑换商城课程，直接写入 user_courses，无需线下领取。
 * 兑换价格 = courses.current_price（1元=1功德分/积分）
 * 统一叠加逻辑（4种情况）：
 *   A. 无记录 → 新建，expire_at=NULL, pending_days=validity_days
 *   B. 已有记录 + 未签合同(contract_signed=0) → pending_days += validity_days
 *   C. 已有记录 + 已签合同(contract_signed=1) + 未过期(status=1) → expire_at/contract_end 双向延长
 *   D. 无 status=1 的记录（全过期 status=3）→ 新建（同 A）
 */

const { findOne, insert, update, db } = require('../../common/db');
const { response, utils } = require('../../common');

/**
 * 统一叠加逻辑：处理兑换/赠送时的 user_courses 更新
 * @param {object} db - 数据库实例
 * @param {number} userId - 用户 ID
 * @param {string} openid - 用户 openid
 * @param {object} targetCourse - 目标课程对象
 * @param {object} insertBaseData - 新建记录时的额外字段
 * @param {string} nowStr - 当前时间字符串
 */
async function applyCourseDays(db, userId, openid, targetCourse, insertBaseData, nowStr) {
  const validityDays = targetCourse.validity_days || 365;

  // 查 status=1 的最新记录
  const { data: existingList } = await db
    .from('user_courses')
    .select('id, contract_signed, pending_days, expire_at')
    .eq('user_id', userId)
    .eq('course_id', targetCourse.id)
    .eq('status', 1)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!existingList || existingList.length === 0) {
    // A/D. 无 status=1 记录 → 新建
    await insert('user_courses', {
      user_id: userId,
      _openid: openid || '',
      course_id: targetCourse.id,
      course_type: targetCourse.type,
      course_name: targetCourse.name,
      expire_at: null,
      pending_days: validityDays,
      attend_count: 0,
      status: 1,
      created_at: nowStr,
      updated_at: nowStr,
      ...insertBaseData
    });
    console.log(`[applyCourseDays] 新建课程记录: course_id=${targetCourse.id}, pending_days=${validityDays}`);
    return;
  }

  const existing = existingList[0];

  if (existing.contract_signed === 0) {
    // B. 未签合同 → pending_days 累加
    const newPendingDays = (existing.pending_days || 0) + validityDays;
    await update('user_courses', { pending_days: newPendingDays, updated_at: nowStr }, { id: existing.id });
    console.log(`[applyCourseDays] 叠加 pending_days: course_id=${targetCourse.id}, 新值=${newPendingDays}`);
  } else {
    // C. 已签合同且未过期 → 双向延长
    const currentExpire = utils.parseBeijingDateStr(existing.expire_at);
    const newExpireDate = new Date(currentExpire.getTime() + validityDays * 86400000);
    const newExpireAt = utils.formatDateTime(newExpireDate);
    const newContractEnd = newExpireAt.split(' ')[0];

    await update('user_courses', { expire_at: newExpireAt, updated_at: nowStr }, { id: existing.id });
    // 同步延长合同有效期
    await db.from('contract_signatures').update({
      contract_end: newContractEnd,
      updated_at: nowStr
    }).eq('user_id', userId).eq('course_id', targetCourse.id).eq('status', 1);
    console.log(`[applyCourseDays] 双向延长有效期: course_id=${targetCourse.id}, 新截止=${newExpireAt}`);
  }
}

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { course_id, use_cash_points_if_not_enough = false } = event;

  try {
    console.log(`[exchangeCourse] 兑换课程:`, { user_id: user.id, course_id });

    // 1. 权限验证 - 检查资料是否完善
    if (!user.profile_completed) {
      return response.forbidden('请先完善资料', {
        action: 'complete_profile',
        redirect_url: '/pages/auth/complete-profile/index'
      });
    }

    // 2. 参数验证
    if (!course_id) {
      return response.paramError('课程ID不能为空');
    }

    // 3. 查询课程信息（只允许初探班 type=1 和密训班 type=2；排除后台软删除）
    const course = await findOne('courses', { id: course_id, is_deleted: 0 });
    if (!course) {
      return response.notFound('课程不存在或已下架');
    }
    if (course.status !== 1) {
      return response.error('课程不存在或已下架');
    }
    if (course.type !== 1 && course.type !== 2) {
      return response.error('该课程不支持功德分兑换');
    }

    // 4. 库存验证（stock=-1 表示无限库存）
    if (course.stock !== -1 && course.stock <= 0) {
      return response.error('课程名额已满');
    }

    // 5. 计算兑换价格（current_price 即功德分/积分消耗数，1元=1分，保留小数）
    const price = parseFloat(course.current_price) || 0;
    if (price <= 0) {
      return response.error('课程价格配置异常，请联系管理员');
    }

    // 6. 计算支付方式（与前端三种情况对应，同 exchangeGoods 逻辑）
    let merit_points_used = 0;
    let cash_points_used = 0;

    if (parseFloat(user.merit_points) >= price) {
      // 情况1：功德分充足，只用功德分
      merit_points_used = price;
      cash_points_used = 0;
    } else if (use_cash_points_if_not_enough) {
      // 情况2：功德分不足但选择用积分，全额使用积分（不动功德分）
      merit_points_used = 0;
      cash_points_used = price;
      if (parseFloat(user.cash_points_available) < cash_points_used) {
        return response.error(`功德分和积分均不足，无法兑换`);
      }
    } else {
      // 情况3：功德分不足且未选积分
      return response.error(`功德分不足，是否使用积分兑换？`);
    }

    // 7. 执行兑换操作
    try {
      const nowStr = utils.formatDateTime(new Date());

      // 7.1 扣除功德分/积分余额（Math.round 确保存储整数）
      await update('users',
        {
          merit_points: Math.round(parseFloat(user.merit_points) - merit_points_used),
          cash_points_available: Math.round(parseFloat(user.cash_points_available) - cash_points_used)
        },
        { id: user.id }
      );

      // 7.2 处理 user_courses：统一叠加逻辑（4种情况）
      await applyCourseDays(db, user.id, OPENID, course, {
        order_no: null,
        buy_price: price,
        buy_time: nowStr,
        is_gift: 0
      }, nowStr);

      // 获取用户课程ID（用于返回值）
      const { data: ucResult } = await db
        .from('user_courses')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .eq('status', 1)
        .order('created_at', { ascending: false })
        .limit(1);
      let userCourseId = ucResult?.[0]?.id || null;

      // 7.3 更新课程销量（有限库存同步扣减库存）
      if (course.stock !== -1) {
        await update('courses',
          {
            sold_count: (course.sold_count || 0) + 1,
            stock: course.stock - 1
          },
          { id: course.id }
        );
      } else {
        await update('courses',
          { sold_count: (course.sold_count || 0) + 1 },
          { id: course.id }
        );
      }

      // 7.4 密训班赠送课程处理（统一叠加逻辑）
      if (course.type === 2) {
        let giftIds = course.included_course_ids;
        if (typeof giftIds === 'string') {
          try { giftIds = JSON.parse(giftIds); } catch (e) { giftIds = []; }
        }
        if (giftIds && giftIds.length > 0) {
          for (const giftCourseId of giftIds) {
            const giftCourse = await findOne('courses', { id: giftCourseId, is_deleted: 0 });
            if (!giftCourse) {
              console.warn('[exchangeCourse] 赠送课程不存在或已删除:', giftCourseId);
              continue;
            }
            await applyCourseDays(db, user.id, OPENID, giftCourse, {
              order_no: null,
              source_course_id: course.id,
              buy_price: 0,
              buy_time: nowStr,
              is_gift: 1,
              gift_source: `兑换${course.name}赠送`
            }, nowStr);
          }
        }
      }

      // 7.5 写入功德分消耗明细
      if (merit_points_used > 0) {
        await insert('merit_points_records', {
          user_id: user.id,
          _openid: OPENID || '',
          type: 2,                // 支出
          source: 6,              // 商城兑换
          amount: -merit_points_used,
          balance_after: Math.round(parseFloat(user.merit_points) - merit_points_used),
          remark: `兑换课程：${course.name}`
        });
      }

      // 7.6 写入积分消耗明细（type=6 系统调整，表示商城兑换扣减）
      if (cash_points_used > 0) {
        await insert('cash_points_records', {
          user_id: user.id,
          _openid: OPENID || '',
          type: 6,
          amount: -cash_points_used,
          available_after: Math.round(parseFloat(user.cash_points_available) - cash_points_used),
          remark: `商城兑换课程：${course.name}`
        });
      }

      console.log(`[exchangeCourse] 兑换成功:`, { user_id: user.id, course_id, userCourseId });

      return response.success({
        user_course_id: userCourseId,
        course_id: course.id,
        course_name: course.name,
        course_type: course.type,
        merit_points_used,
        cash_points_used,
        price
      }, '兑换成功');

    } catch (txError) {
      console.error(`[exchangeCourse] 写入失败:`, txError);
      throw txError;
    }

  } catch (error) {
    console.error(`[exchangeCourse] 失败:`, error);
    return response.error(error.message || '兑换课程失败', error);
  }
};
