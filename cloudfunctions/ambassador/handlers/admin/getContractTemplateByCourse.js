/**
 * 管理端接口：按课程ID获取协议模板
 * Action: adminGetCourseContractTemplate
 * 用于后台课程列表的学习服务协议弹窗加载该课程对应的协议模板（含电子合同文件URL）
 */
const { db } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');

module.exports = async (event, context) => {
  const { courseId } = event;
  const { admin } = context;

  try {
    console.log(`[adminGetCourseContractTemplate] 管理员 ${admin?.id} 查询课程 ${courseId} 协议模板`);

    if (courseId == null || courseId === '') {
      return response.paramError('缺少必要参数: courseId');
    }

    const { data: templates, error } = await db
      .from('contract_templates')
      .select('id, contract_name, contract_type, ambassador_level, course_id, version, contract_file_id, validity_years, status, created_at')
      .eq('course_id', Number(courseId))
      .eq('contract_type', 4)
      .is('deleted_at', null)
      .order('id', { ascending: true })
      .limit(1);

    if (error) throw error;

    let template = templates && templates[0] ? templates[0] : null;

    if (template && template.contract_file_id) {
      template.contract_file_url = cloudFileIDToURL(template.contract_file_id);
    }

    return response.success({ template }, '获取成功');

  } catch (error) {
    console.error('[adminGetCourseContractTemplate] 失败:', error);
    return response.error('获取课程协议模板失败', error);
  }
};
