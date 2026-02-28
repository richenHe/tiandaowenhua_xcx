/**
 * 管理端接口：审核申请
 * Action: auditApplication
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { application_id, approved, reject_reason } = event;

  try {
    console.log(`[auditApplication] 审核申请:`, { application_id, approved });

    // 参数验证
    if (!application_id || approved === undefined) {
      return response.paramError('缺少必要参数: application_id, approved');
    }

    if (!approved && !reject_reason) {
      return response.paramError('拒绝申请时必须提供拒绝原因');
    }

    // 查询申请记录
    const application = await findOne('ambassador_applications', { id: application_id });
    if (!application) {
      return response.error('申请记录不存在');
    }

    if (application.status !== 0) {
      return response.error('该申请已被审核');
    }

    // 查询用户
    const user = await findOne('users', { id: application.user_id });
    if (!user) {
      return response.error('用户不存在');
    }

    // 更新申请状态
    const { formatDateTime } = require('../../common/utils');
    await update('ambassador_applications',
      {
        status: approved ? 1 : 2,
        reject_reason: approved ? null : reject_reason,
        audit_time: formatDateTime(new Date()),
        audit_admin_id: admin.id
      },
      { id: application_id }
    );

    return response.success({
      success: true,
      // 审核通过后等待用户签署协议，签约完成后再升级等级
      message: approved ? '申请已通过，请引导用户签署协议后完成升级' : '申请已拒绝'
    });

  } catch (error) {
    console.error(`[auditApplication] 失败:`, error);
    return response.error('审核失败', error);
  }
};
