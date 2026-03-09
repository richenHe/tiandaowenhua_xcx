/**
 * 管理端接口：审核申请
 * Action: auditApplication
 *
 * 通过时必须设置 frozen_points（冻结积分，可为 0）
 * 校验：frozen_points 须为目标等级 unfreeze_per_referral 的整数倍
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { application_id, approved, reject_reason, frozen_points } = event;

  try {
    console.log(`[auditApplication] 审核申请:`, { application_id, approved, frozen_points });

    if (!application_id || approved === undefined) {
      return response.paramError('缺少必要参数: application_id, approved');
    }

    if (!approved && !reject_reason) {
      return response.paramError('拒绝申请时必须提供拒绝原因');
    }

    // 通过时必须传 frozen_points（允许为 0）
    if (approved && (frozen_points === undefined || frozen_points === null || frozen_points === '')) {
      return response.paramError('通过审核时必须设置冻结积分');
    }

    const application = await findOne('ambassador_applications', { id: application_id });
    if (!application) {
      return response.error('申请记录不存在');
    }

    if (application.status !== 0) {
      return response.error('该申请已被审核');
    }

    const user = await findOne('users', { id: application.user_id });
    if (!user) {
      return response.error('用户不存在');
    }

    // 通过时校验冻结积分与单次解冻积分的倍数关系
    if (approved) {
      const frozenVal = Number(frozen_points) || 0;

      if (frozenVal > 0) {
        const targetLevel = application.target_level;
        const levelConfig = await findOne('ambassador_level_configs', { level: targetLevel });

        if (!levelConfig) {
          return response.error(`目标等级 ${targetLevel} 的配置不存在，请先在等级配置中创建`);
        }

        const unfreezePerReferral = Number(levelConfig.unfreeze_per_referral) || 0;

        if (unfreezePerReferral <= 0) {
          return response.error('该等级尚未配置单次解冻积分，请先在等级配置中设置后再审核');
        }

        // 使用整数比较避免浮点精度问题
        const frozenCents = Math.round(frozenVal * 100);
        const unfreezeCents = Math.round(unfreezePerReferral * 100);
        if (frozenCents % unfreezeCents !== 0) {
          return response.error(`冻结积分(${frozenVal})必须是单次解冻积分(${unfreezePerReferral})的整数倍`);
        }
      }
    }

    const { formatDateTime } = require('../../common/utils');
    const updateData = {
      status: approved ? 1 : 2,
      reject_reason: approved ? null : reject_reason,
      audit_time: formatDateTime(new Date()),
      audit_admin_id: admin.id
    };

    if (approved) {
      updateData.frozen_points = Number(frozen_points) || 0;
    }

    await update('ambassador_applications', updateData, { id: application_id });

    return response.success({
      success: true,
      message: approved ? '申请已通过，请引导用户签署协议后完成升级' : '申请已拒绝'
    });

  } catch (error) {
    console.error(`[auditApplication] 失败:`, error);
    return response.error('审核失败', error);
  }
};
