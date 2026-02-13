const { db, response } = require('common');

/**
 * 获取大使等级体系配置
 * @param {Object} event - 事件对象
 * @param {Object} context - 上下文对象
 * @param {string} context.OPENID - 用户OpenID（可选，用于获取当前等级）
 * @param {Object} context.user - 用户信息（可选）
 * @returns {Promise<Object>} 等级体系配置
 */
module.exports = async (event, context) => {
  try {
    const { user } = context || {};

    // 查询所有启用的大使等级配置
    const { data: levels, error } = await db
      .from('ambassador_level_configs')
      .select('*')
      .eq('status', 1) // 只查询启用的配置
      .order('level', { ascending: true });

    if (error) {
      console.error('[getLevelSystem] 查询失败:', error);
      return response.error('获取等级配置失败', error);
    }

    // 处理等级数据 - 添加升级条件和权益说明
    const processedLevels = (levels || []).map(level => {
      const upgradeConditions = [];
      const benefits = [];
      const levelIcon = getLevelIcon(level.level);
      const levelDesc = getLevelDesc(level.level);

      // 根据等级添加升级条件
      if (level.level === 1) { // 准青鸾
        upgradeConditions.push('完成用户资料填写');
        upgradeConditions.push('通过大使申请审核');
      } else if (level.level === 2) { // 青鸾
        upgradeConditions.push('准青鸾大使身份');
        upgradeConditions.push('完成首次推荐并成功');
        upgradeConditions.push('签署青鸾大使协议');
        if (level.frozen_points > 0) {
          upgradeConditions.push(`获得${level.frozen_points}元冻结积分`);
        }
      } else if (level.level === 3) { // 鸿鹄
        upgradeConditions.push('青鸾大使身份');
        if (level.upgrade_payment_amount > 0) {
          upgradeConditions.push(`支付${level.upgrade_payment_amount}元升级费用`);
        }
        upgradeConditions.push('签署鸿鹄大使补充协议');
        if (level.frozen_points > 0) {
          upgradeConditions.push(`获得${level.frozen_points}元冻结积分`);
        }
      }

      // 根据等级添加权益说明
      if (level.level >= 2) { // 青鸾及以上
        if (level.merit_rate_basic > 0) {
          benefits.push(`推荐初探班获${(level.merit_rate_basic * 100).toFixed(0)}%功德分`);
        }
        if (level.merit_rate_advanced > 0) {
          benefits.push(`推荐密训班获${(level.merit_rate_advanced * 100).toFixed(0)}%功德分`);
        }
        if (level.cash_rate_basic > 0) {
          benefits.push(`推荐初探班获${(level.cash_rate_basic * 100).toFixed(0)}%可提现积分`);
        }
        if (level.cash_rate_advanced > 0) {
          benefits.push(`推荐密训班获${(level.cash_rate_advanced * 100).toFixed(0)}%可提现积分`);
        }
        if (level.unfreeze_per_referral > 0) {
          benefits.push(`每次推荐解冻${level.unfreeze_per_referral}元积分`);
        }
      }

      if (level.level === 3) { // 鸿鹄
        if (level.gift_quota_basic > 0) {
          benefits.push(`赠送${level.gift_quota_basic}个初探班名额`);
        }
        if (level.gift_quota_advanced > 0) {
          benefits.push(`赠送${level.gift_quota_advanced}个密训班名额`);
        }
        benefits.push('专属大使证书');
        benefits.push('年度大使峰会邀请');
      }

      return {
        ...level,
        level_icon: levelIcon,
        level_desc: levelDesc,
        upgrade_conditions: upgradeConditions,
        benefits: benefits
      };
    });

    // 构建响应数据
    const result = {
      levels: processedLevels,
      current_level: user?.ambassador_level || 0,
      next_level: null
    };

    // 如果有用户信息，计算下一等级
    if (user) {
      const currentLevel = user.ambassador_level || 0;
      const nextLevelConfig = processedLevels.find(l => l.level === currentLevel + 1);
      result.next_level = nextLevelConfig || null;
    }

    return response.success(result, '获取等级配置成功');

  } catch (error) {
    console.error('[getLevelSystem] 执行失败:', error);
    return response.error('获取等级配置失败', error);
  }
};

/**
 * 获取等级图标
 */
function getLevelIcon(level) {
  const icons = {
    0: '👤',
    1: '🥚',
    2: '🐦',
    3: '🦅'
  };
  return icons[level] || '👤';
}

/**
 * 获取等级描述
 */
function getLevelDesc(level) {
  const descs = {
    0: '完善资料，申请成为大使',
    1: '新手大使，开启传播之旅',
    2: '进阶大使，获得推荐奖励',
    3: '高级大使，享受专属权益'
  };
  return descs[level] || '';
}





