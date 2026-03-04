/**
 * 客户端接口：检查用户是否需要签署课程学习合同
 * Action: checkCourseContract
 *
 * 判断逻辑（按优先级）：
 * 1. 查 status=1（有效）的最新 user_courses 记录
 * 2. contract_signed=1 → 不需要签（已签约且有效）
 * 3. contract_signed=0 → 检查是否配置了合同模板，有则需要签约
 * 4. 未配置合同模板 → 不需要签
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { courseId } = event;

  try {
    console.log(`[checkCourseContract] 检查课程合同:`, { user_id: user.id, courseId });

    if (!courseId) {
      return response.paramError('缺少必要参数: courseId');
    }

    // 查 status=1（未过期）的最新 user_courses 记录
    const { data: userCourses, error: ucError } = await db
      .from('user_courses')
      .select('id, attend_count, contract_signed')
      .eq('user_id', user.id)
      .eq('course_id', Number(courseId))
      .eq('status', 1)
      .order('created_at', { ascending: false })
      .limit(1);

    if (ucError) throw ucError;

    const userCourse = userCourses && userCourses[0];

    if (!userCourse) {
      return response.success({ needSign: false, hasTemplate: false, reason: '未购买该课程或课程已过期' });
    }

    const contractSigned = Number(userCourse.contract_signed || 0);

    // 已签合同（且 status=1 未过期）→ 不需要签
    if (contractSigned === 1) {
      return response.success({ needSign: false, hasTemplate: true, reason: '已签约' });
    }

    // 未签合同 → 查该课程是否配了合同模板
    const { data: templates, error: tplError } = await db
      .from('contract_templates')
      .select('id')
      .eq('course_id', Number(courseId))
      .eq('contract_type', 4)
      .eq('status', 1)
      .is('deleted_at', null)
      .limit(1);

    if (tplError) throw tplError;

    const template = templates && templates[0];

    if (!template) {
      return response.success({ needSign: false, hasTemplate: false, reason: '该课程未配置合同模板' });
    }

    return response.success({
      needSign: true,
      hasTemplate: true,
      templateId: template.id,
      userCourseId: userCourse.id
    });

  } catch (error) {
    console.error('[checkCourseContract] 失败:', error);
    return response.error('检查课程合同状态失败', error);
  }
};
