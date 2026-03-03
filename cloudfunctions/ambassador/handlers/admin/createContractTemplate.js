/**
 * 管理端接口：创建协议模板
 * Action: createContractTemplate
 * 支持通过电子合同文件（PDF/Word）或 HTML 内容创建协议模板
 */
const { db } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  // 兼容 level-config 弹窗（ambassadorLevel/contract_name）、合约管理页（title/level/version）和课程合同（courseId）
  const {
    contract_name, title,
    ambassadorLevel, level,
    contractType,
    courseId,
    version,
    content,
    contractFileId,
    validityYears,
    effective_date, expiry_date
  } = event;

  try {
    const resolvedName = contract_name || title;
    const isCourseContract = contractType === 'course' || Number(courseId) > 0;
    const resolvedLevel = isCourseContract ? 0 : (ambassadorLevel != null ? Number(ambassadorLevel) : (level != null ? Number(level) : null));
    const resolvedVersion = version || 'v1.0';

    console.log(`[createContractTemplate] 创建协议模板:`, { resolvedName, resolvedLevel, resolvedVersion, courseId, isCourseContract });

    if (!resolvedName) {
      return response.paramError('缺少必要参数: contract_name/title');
    }
    if (!isCourseContract && resolvedLevel == null) {
      return response.paramError('缺少必要参数: ambassadorLevel/level');
    }
    if (isCourseContract && !courseId) {
      return response.paramError('课程协议缺少必要参数: courseId');
    }

    // 协议类型：1=传播大使 / 2=青鸾大使 / 3=鸿鹄大使 / 4=课程学习服务协议
    let contractTypeValue = isCourseContract ? 4 : 1;
    if (!isCourseContract) {
      if (resolvedLevel === 2) contractTypeValue = 2;
      else if (resolvedLevel === 3) contractTypeValue = 3;
    }

    // 防重：查是否已有同等级/同课程的生效模板，有则转为更新
    let existQuery = db
      .from('contract_templates')
      .select('id')
      .eq('status', 1);

    if (isCourseContract) {
      existQuery = existQuery.eq('course_id', Number(courseId)).eq('contract_type', 4);
    } else {
      existQuery = existQuery.eq('ambassador_level', resolvedLevel).eq('contract_type', contractTypeValue);
    }

    const { data: existList } = await existQuery.limit(1);
    if (existList && existList.length > 0) {
      const updateFields = {
        contract_name: resolvedName,
        version: version || 'v1.0',
        content: content || '',
        validity_years: validityYears != null ? parseInt(validityYears) : 1,
        updated_at: formatDateTime(new Date())
      };
      if (contractFileId) updateFields.contract_file_id = contractFileId;

      await db.from('contract_templates').update(updateFields).eq('id', existList[0].id);
      console.log(`[createContractTemplate] 已存在模板 id=${existList[0].id}，转为更新`);

      return response.success({
        template_id: existList[0].id,
        contract_name: resolvedName,
        level: resolvedLevel,
        version: version || 'v1.0'
      }, '协议模板已更新（已有模板）');
    }

    const insertData = {
      contract_name: resolvedName,
      contract_type: contractTypeValue,
      ambassador_level: resolvedLevel,
      version: resolvedVersion,
      content: content || '',
      contract_file_id: contractFileId || null,
      validity_years: validityYears != null ? parseInt(validityYears) : 1,
      effective_time: effective_date || formatDateTime(new Date()),
      status: 1,
      created_by: admin?.id || null
    };

    if (isCourseContract) {
      insertData.course_id = Number(courseId);
    }

    const { data: inserted, error } = await db
      .from('contract_templates')
      .insert(insertData)
      .select('id, contract_name, ambassador_level, course_id, version')
      .single();

    if (error) throw error;

    return response.success({
      template_id: inserted.id,
      contract_name: inserted.contract_name,
      level: inserted.ambassador_level,
      version: inserted.version
    }, '协议模板创建成功');

  } catch (error) {
    console.error(`[createContractTemplate] 失败:`, error);
    return response.error('创建协议模板失败', error);
  }
};
