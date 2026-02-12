/**
 * 获取升级指南
 * 显示用户当前状态和升级条件
 */
const { db, findOne } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { target_level } = event;
  const { OPENID, user } = context;

  try {
    // 参数验证
    if (!target_level || target_level < 2 || target_level > 5) {
      return response.paramError('目标等级应在 2-5 之间');
    }

    // 当前等级不能高于目标等级
    if (user.ambassador_level >= target_level) {
      return response.paramError('当前等级已达到或超过目标等级');
    }

    // 查询目标等级配置
    const levelConfig = await findOne('ambassador_level_configs', { level: target_level });
    if (!levelConfig) {
      return response.error('目标等级配置不存在');
    }

    // 统计推荐人数
    const { count: refereeCount } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referee_id', user.id);

    // 检查升级条件
    const conditions = {
      current_level: user.ambassador_level,
      target_level: target_level,
      level_name: levelConfig.level_name,
      requirements: {
        referee_count: levelConfig.required_referee_count || 0,
        course_requirement: levelConfig.course_requirement || '无',
        merit_points: levelConfig.merit_points_requirement || 0,
        cash_points_frozen: levelConfig.cash_points_frozen || '0.00'
      },
      current_status: {
        referee_count: refereeCount || 0,
        merit_points: parseFloat(user.merit_points) || 0,
        cash_points_available: parseFloat(user.cash_points_available) || 0
      },
      can_upgrade: false
    };

    // 判断是否满足升级条件
    conditions.can_upgrade = (
      conditions.current_status.referee_count >= conditions.requirements.referee_count &&
      conditions.current_status.merit_points >= conditions.requirements.merit_points &&
      conditions.current_status.cash_points_available >= parseFloat(conditions.requirements.cash_points_frozen)
    );

    return response.success(conditions, '获取升级指南成功');

  } catch (error) {
    console.error('[getUpgradeGuide] 执行失败:', error);
    return response.error('获取升级指南失败', error);
  }
};
