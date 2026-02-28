/**
 * 客户端接口：功德分/积分兑换课程
 * Action: exchangeCourse
 *
 * 使用功德分（或积分）兑换商城课程，直接写入 user_courses，无需线下领取。
 * 兑换价格 = courses.current_price（1元=1功德分/积分）
 * 首次兑换：新建 user_courses，expire_at = 兑换时间 +1年
 * 重复兑换：在原 expire_at 基础上顺延 +1年
 */

/**
 * 将日期字符串或 Date 对象加一年，返回 UTC+8 格式字符串
 * @param {string|Date} base - 起始时间，为空则用当前时间
 * @returns {string} YYYY-MM-DD HH:mm:ss
 */
function addOneYear(base) {
  const d = base ? new Date(base) : new Date();
  d.setFullYear(d.getFullYear() + 1);
  // 转换为 UTC+8 时间字符串
  const d8 = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${d8.getUTCFullYear()}-${pad(d8.getUTCMonth() + 1)}-${pad(d8.getUTCDate())} ${pad(d8.getUTCHours())}:${pad(d8.getUTCMinutes())}:${pad(d8.getUTCSeconds())}`;
}
const { findOne, insert, update, db } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { course_id, use_cash_points_if_not_enough = false } = event;

  try {
    console.log(`[exchangeCourse] 兑换课程（有效期+1年）:`, { user_id: user.id, course_id });

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

    // 3. 查询课程信息（只允许初探班 type=1 和密训班 type=2）
    const course = await findOne('courses', { id: course_id });
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

      // 7.2 处理 user_courses：已有记录则在原有效期基础上续期 +1年，否则新建
      const { data: existingList } = await db
        .from('user_courses')
        .select('id, expire_at')
        .eq('user_id', user.id)
        .eq('course_id', course.id)
        .eq('status', 1)
        .order('id', { ascending: false })
        .limit(1);

      let userCourseId = null;
      if (existingList && existingList.length > 0) {
        // 已有记录：在当前有效期基础上顺延 1 年
        const existing = existingList[0];
        const newExpireAt = addOneYear(existing.expire_at);
        await update('user_courses',
          { expire_at: newExpireAt },
          { id: existing.id }
        );
        userCourseId = existing.id;
        console.log(`[exchangeCourse] 续期成功，新有效期：${newExpireAt}`);
      } else {
        // 首次兑换：新建记录，有效期 1 年
        const expireAt = addOneYear(nowStr);
        const insertResult = await insert('user_courses', {
          user_id: user.id,
          _openid: OPENID || '',
          course_id: course.id,
          course_type: course.type,
          course_name: course.name,
          order_no: null,
          buy_price: price,
          buy_time: nowStr,
          expire_at: expireAt,
          is_gift: 0,
          attend_count: 1,
          status: 1
        });
        userCourseId = insertResult?.id || null;
        console.log(`[exchangeCourse] 首次兑换，有效期至：${expireAt}`);
      }

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

      // 7.4 写入功德分消耗明细
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

      // 7.5 写入积分消耗明细
      if (cash_points_used > 0) {
        await insert('cash_points_records', {
          user_id: user.id,
          _openid: OPENID || '',
          type: 2,                // 消费
          amount: -cash_points_used,
          available_after: Math.round(parseFloat(user.cash_points_available) - cash_points_used),
          remark: `兑换课程：${course.name}`
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
