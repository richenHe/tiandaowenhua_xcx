/**
 * 客户端接口：申请成为大使 / 申请升级大使等级
 * Action: apply
 *
 * targetLevel: 目标等级（camelCase），1=准青鸾, 2=青鸾, 3=鸿鹄, 4=金凤
 *   - 普通用户（level=0）不传或传 1 表示申请准青鸾
 *   - 现有大使传对应下一级，表示升级申请
 */
const { findOne, insert } = require('../../common/db');
const { response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const {
    real_name,
    phone,
    wechat_id,
    city,
    occupation,
    apply_reason,
    understanding,
    willing_help,
    promotion_plan,
    // camelCase 接收前端参数
    targetLevel
  } = event;

  try {
    console.log(`[apply] 用户 ${user.id} 申请大使，目标等级: ${targetLevel}`);

    // 参数验证
    if (!real_name || !phone) {
      return response.paramError('缺少必要参数: real_name, phone');
    }

    // 确定目标等级
    const currentLevel = user.ambassador_level || 0;
    // targetLevel 未传时，默认为当前等级+1（首次申请则为 1）
    const resolvedTargetLevel = targetLevel ? Number(targetLevel) : currentLevel + 1;

    if (resolvedTargetLevel < 1 || resolvedTargetLevel > 4) {
      return response.paramError('目标等级超出范围');
    }

    // 目标等级必须高于当前等级
    if (resolvedTargetLevel <= currentLevel) {
      return response.error(`当前已是 ${resolvedTargetLevel} 级大使，无法申请该等级`);
    }

    // 检查是否已有针对该目标等级的待审核/待面试申请
    const { data: existingApps } = await require('../../common/db').db
      .from('ambassador_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('target_level', resolvedTargetLevel)
      .in('status', [0, 1])
      .limit(1);

    if (existingApps && existingApps.length > 0) {
      return response.error('您已有待审核的申请，请耐心等待');
    }

    const now = formatDateTime(new Date());
    const [application] = await insert('ambassador_applications', {
      user_id: user.id,
      user_uid: user.user_uid || null,
      _openid: OPENID || '',
      target_level: resolvedTargetLevel,
      real_name,
      phone,
      wechat_id: wechat_id || null,
      city: city || null,
      occupation: occupation || null,
      apply_reason: apply_reason || null,
      understanding: understanding || null,
      willing_help: willing_help != null ? Number(willing_help) : 1,
      promotion_plan: promotion_plan || null,
      status: 0,
      created_at: now,
      updated_at: now
    });

    return response.success({
      application_id: application ? application.id : null,
      target_level: resolvedTargetLevel,
      status: 0,
      message: '申请已提交，请等待审核'
    }, '申请提交成功');

  } catch (error) {
    console.error(`[apply] 失败:`, error);
    return response.error('申请失败', error);
  }
};
