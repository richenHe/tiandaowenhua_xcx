/**
 * 管理端接口：获取申请详情
 * Action: getApplicationDetail
 */
const { findOne } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { application_id } = event;

  try {
    console.log(`[getApplicationDetail] 查询申请详情:`, { application_id });

    // 参数验证
    if (!application_id) {
      return response.paramError('缺少必要参数: application_id');
    }

    // 查询申请记录
    const application = await findOne('ambassador_applications', { id: application_id });
    if (!application) {
      return response.error('申请记录不存在');
    }

    // 查询申请人信息
    const user = await findOne('users', { id: application.user_id });
    if (!user) {
      return response.error('用户不存在');
    }

    // 组装返回数据
    const result = {
      id: application.id,
      user_id: application.user_id,
      real_name: application.real_name || user.real_name,
      phone: application.phone || user.phone,
      wechat_id: application.wechat_id || '',
      city: application.city || '',
      occupation: application.occupation || '',
      apply_reason: application.apply_reason || '',
      understanding: application.understanding || '',
      willing_help: application.willing_help,
      promotion_plan: application.promotion_plan || '',
      status: application.status,
      materials: application.apply_reason || '',  // 兼容旧字段
      reject_reason: application.reject_reason || '',
      created_at: application.created_at,
      audit_time: application.audit_time,
      audit_admin_id: application.audit_admin_id
    };

    console.log('[getApplicationDetail] 查询成功');
    return response.success(result);

  } catch (error) {
    console.error(`[getApplicationDetail] 失败:`, error);
    return response.error('获取申请详情失败', error);
  }
};
