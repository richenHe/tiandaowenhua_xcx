/**
 * 客户端接口：检查用户是否需要签署课程学习合同
 * Action: checkCourseContract
 *
 * 判断逻辑：
 * 1. attend_count > 0 → 不需要签（已上过课）
 * 2. contract_signed == 1 → 不需要签（已签约）
 * 3. 该课程未配置合同模板 → 不需要签
 * 4. 以上都不满足 → 需要签约
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

    // 查 user_courses 获取 attend_count 和 contract_signed
    const { data: userCourses, error: ucError } = await db
      .from('user_courses')
      .select('attend_count, contract_signed')
      .eq('user_id', user.id)
      .eq('course_id', Number(courseId))
      .eq('status', 1)
      .limit(1);

    if (ucError) throw ucError;

    const userCourse = userCourses && userCourses[0];

    if (!userCourse) {
      return response.success({ needSign: false, hasTemplate: false, reason: '未购买该课程' });
    }

    const attendCount = Number(userCourse.attend_count || 0);
    const contractSigned = Number(userCourse.contract_signed || 0);

    if (attendCount > 0) {
      return response.success({ needSign: false, hasTemplate: true, reason: '已上过课' });
    }

    if (contractSigned === 1) {
      return response.success({ needSign: false, hasTemplate: true, reason: '已签约' });
    }

    // 查该课程是否配了合同模板
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
      templateId: template.id
    });

  } catch (error) {
    console.error('[checkCourseContract] 失败:', error);
    return response.error('检查课程合同状态失败', error);
  }
};
