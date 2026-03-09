/**
 * 客户端接口：申请成为大使 / 申请升级大使等级
 * Action: apply
 *
 * 升级路径：
 *   - 普通用户(0) → 提交申请 → 即时升为准青鸾(1)，申请 target_level=2（待审核，用于后续升青鸾）
 *   - 青鸾(2) → 提交申请 → target_level=3（待审核，用于后续升鸿鹄）
 *
 * 驳回后准青鸾不回退，可重新申请
 */
const { db, findOne, insert, update } = require('../../common/db');
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
    targetLevel
  } = event;

  try {
    console.log(`[apply] 用户 ${user.id} 申请大使，当前等级: ${user.ambassador_level}`);

    if (!real_name || !phone) {
      return response.paramError('缺少必要参数: real_name, phone');
    }

    const currentLevel = user.ambassador_level || 0;

    // 普通用户(0)和准青鸾(1)的 target_level 均为 2（青鸾），青鸾(2)的 target_level 为 3（鸿鹄）
    let resolvedTargetLevel;
    if (currentLevel <= 1) {
      resolvedTargetLevel = 2;
    } else if (currentLevel === 2) {
      resolvedTargetLevel = 3;
    } else {
      return response.error('当前等级不支持申请升级');
    }

    // 前端传了 targetLevel 且合法时使用前端值
    if (targetLevel && Number(targetLevel) > currentLevel) {
      resolvedTargetLevel = Number(targetLevel);
    }

    if (resolvedTargetLevel < 2 || resolvedTargetLevel > 4) {
      return response.paramError('目标等级超出范围');
    }

    // 检查是否已有针对该目标等级的待审核/已通过申请
    const { data: existingApps } = await db
      .from('ambassador_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('target_level', resolvedTargetLevel)
      .in('status', [0, 1])
      .limit(1);

    if (existingApps && existingApps.length > 0) {
      const existStatus = existingApps[0].status;
      if (existStatus === 0) {
        return response.error('您已有待审核的申请，请耐心等待');
      }
      if (existStatus === 1) {
        return response.error('申请已通过，请签署协议完成升级');
      }
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

    // 普通用户提交申请后即时升为准青鸾
    let instantUpgraded = false;
    if (currentLevel === 0) {
      await update('users',
        { ambassador_level: 1, ambassador_start_date: now.split(' ')[0] },
        { id: user.id }
      );
      instantUpgraded = true;
      console.log(`[apply] 普通用户 ${user.id} 即时升级为准青鸾大使`);
    }

    return response.success({
      application_id: application ? application.id : null,
      target_level: resolvedTargetLevel,
      status: 0,
      instant_upgraded: instantUpgraded,
      new_level: instantUpgraded ? 1 : currentLevel,
      message: instantUpgraded
        ? '恭喜！您已成为准青鸾大使，申请已提交等待审核'
        : '申请已提交，请等待审核'
    }, instantUpgraded ? '申请成功，已升级为准青鸾大使' : '申请提交成功');

  } catch (error) {
    console.error(`[apply] 失败:`, error);
    return response.error('申请失败', error);
  }
};
