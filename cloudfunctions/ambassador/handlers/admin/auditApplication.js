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
    await update('ambassador_applications',
      {
        status: approved ? 1 : 2,
        reject_reason: approved ? null : reject_reason,
        reviewed_at: new Date().toISOString(),
        reviewer_id: admin.id
      },
      { id: application_id }
    );

    // 如果通过，升级用户为大使
    if (approved) {
      await update('users',
        {
          ambassador_level: 1,  // 初级大使
          ambassador_approved_at: new Date().toISOString()
        },
        { id: user.id }
      );

      // 发送通知
      try {
        await business.sendSubscribeMessage({
          touser: user._openid,
          template_id: 'ambassador_approved',
          data: {
            name: user.real_name,
            level: '初级大使',
            time: new Date().toLocaleString('zh-CN')
          }
        });
      } catch (notifyError) {
        console.error('发送通知失败:', notifyError);
      }
    }

    return response.success({
      application_id,
      approved,
      message: approved ? '申请已通过，用户已成为初级大使' : '申请已拒绝'
    }, '审核成功');

  } catch (error) {
    console.error(`[auditApplication] 失败:`, error);
    return response.error('审核失败', error);
  }
};
