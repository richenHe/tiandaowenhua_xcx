/**
 * 客户端接口：按课程ID获取学习服务协议模板
 * Action: getContractTemplateByCourse
 * 返回模板信息及当前用户签署状态
 */
const { db } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { courseId } = event;

  try {
    console.log(`[getContractTemplateByCourse] 获取课程协议模板:`, { user_id: user.id, courseId });

    if (!courseId) {
      return response.paramError('缺少必要参数: courseId');
    }

    const { data: templates, error } = await db
      .from('contract_templates')
      .select('id, contract_name, contract_type, course_id, version, contract_file_id, validity_years, effective_time')
      .eq('course_id', Number(courseId))
      .eq('contract_type', 4)
      .eq('status', 1)
      .is('deleted_at', null)
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;

    const template = templates && templates[0];

    if (!template) {
      return response.error('该课程暂无可用学习服务协议模板');
    }

    // 查签署状态
    const { data: signatures } = await db
      .from('contract_signatures')
      .select('id, sign_time, status')
      .eq('user_id', user.id)
      .eq('contract_template_id', template.id)
      .eq('status', 1)
      .limit(1);

    const signature = signatures && signatures[0];

    const contractFileUrl = template.contract_file_id ? cloudFileIDToURL(template.contract_file_id) : null;

    return response.success({
      template: {
        id: template.id,
        title: template.contract_name,
        version: template.version,
        course_id: template.course_id,
        validity_years: template.validity_years || 1,
        effective_date: template.effective_time ? String(template.effective_time).slice(0, 10) : null,
        contract_file_url: contractFileUrl
      },
      signed: !!signature,
      signature: signature ? {
        id: signature.id,
        signed_at: signature.sign_time,
        status: signature.status
      } : null
    });

  } catch (error) {
    console.error('[getContractTemplateByCourse] 失败:', error);
    return response.error('获取课程协议模板失败', error);
  }
};
