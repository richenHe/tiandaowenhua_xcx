/**
 * 管理端接口：获取用户已购买且未签合同的课程列表（仅 need_contract=1 的课程）
 * Action: adminGetUserPaidCourses
 *
 * 参数：
 * - userId: 用户ID（必填）
 *
 * 返回用户已支付但尚未签署合同的课程列表，供后台"录入合约"时选择
 * 过滤掉 need_contract=0 的课程（不需要合同的课程不应出现在此列表）
 */

const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { userId } = event;

  try {
    if (!userId) {
      return response.paramError('缺少必要参数: userId');
    }

    // 查询用户已购买、状态有效、未签合同的课程
    const { data: userCourses, error } = await db
      .from('user_courses')
      .select(`
        id,
        course_id,
        course_name,
        course_type,
        buy_time,
        buy_price,
        pending_days,
        is_gift,
        created_at
      `)
      .eq('user_id', userId)
      .eq('status', 1)
      .eq('contract_signed', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!userCourses || userCourses.length === 0) {
      return response.success([]);
    }

    // 过滤掉 need_contract=0 的课程
    const courseIds = [...new Set(userCourses.map(uc => uc.course_id))];
    const { data: courseList } = await db
      .from('courses')
      .select('id, need_contract')
      .in('id', courseIds);

    const needContractMap = {};
    (courseList || []).forEach(c => { needContractMap[c.id] = c.need_contract; });

    const courses = userCourses
      .filter(uc => needContractMap[uc.course_id] === 1)
      .map(uc => ({
        user_course_id: uc.id,
        course_id:      uc.course_id,
        course_name:    uc.course_name || '未知课程',
        course_type:    uc.course_type,
        buy_time:       uc.buy_time,
        buy_price:      uc.buy_price,
        pending_days:   uc.pending_days,
        is_gift:        uc.is_gift,
        purchased_at:   uc.buy_time || uc.created_at
      }));

    return response.success(courses);

  } catch (error) {
    console.error('[admin:adminGetUserPaidCourses] 失败:', error);
    return response.error('查询用户课程列表失败', error);
  }
};
