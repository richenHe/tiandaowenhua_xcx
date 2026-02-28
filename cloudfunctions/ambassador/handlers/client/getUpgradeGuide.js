/**
 * 获取升级指南
 * 返回当前等级信息、目标等级信息、升级选项、申请状态、当前统计数据
 * 返回结构与前端 UpgradeGuide 类型完全匹配
 */
const { db, findOne } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { target_level } = event;
  const { user } = context;

  try {
    // 参数验证：支持 1-4（覆盖普通用户→准青鸾 到 青鸾→鸿鹄 全路径）
    if (!target_level || target_level < 1 || target_level > 4) {
      return response.paramError('目标等级应在 1-4 之间');
    }

    const currentLevelNum = user.ambassador_level || 0;

    // 当前等级已达到或超过目标等级
    if (currentLevelNum >= target_level) {
      return response.paramError('当前等级已达到或超过目标等级');
    }

    // 并行查询：当前等级配置、目标等级配置
    const [currentConfig, targetConfig] = await Promise.all([
      findOne('ambassador_level_configs', { level: currentLevelNum }),
      findOne('ambassador_level_configs', { level: target_level })
    ]);

    if (!targetConfig) {
      return response.error('目标等级配置不存在');
    }

    // 统计推荐成功的初探班订单数（推荐人是当前用户、已支付）
    const { count: orderCount } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('referee_id', user.id)
      .eq('order_type', 1)
      .eq('pay_status', 1);

    // 检查是否已签署目标等级协议
    const existingContract = await db
      .from('contract_signatures')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('ambassador_level', target_level)
      .eq('status', 1);
    const hasSignedContract = (existingContract.count || 0) > 0;

    // 查询最新的大使申请状态（针对目标等级）
    const { data: applications } = await db
      .from('ambassador_applications')
      .select('id, status, reject_reason, created_at')
      .eq('user_id', user.id)
      .eq('target_level', target_level)
      .order('created_at', { ascending: false })
      .limit(1);

    const latestApplication = applications && applications[0] ? applications[0] : null;
    const applicationStatus = latestApplication ? latestApplication.status : null;
    const applicationRejectReason = latestApplication ? latestApplication.reject_reason : null;
    const applicationId = latestApplication ? latestApplication.id : null;

    // 构建当前等级信息
    const currentLevelInfo = {
      level: currentLevelNum,
      name: currentConfig ? currentConfig.level_name : getLevelName(currentLevelNum),
      benefits: buildBenefits(currentConfig)
    };

    /**
     * 安全解析 JSON 字段
     */
    function safeParseJson(value) {
      if (value == null) return null;
      if (typeof value === 'string') {
        try { return JSON.parse(value); } catch (e) { return null; }
      }
      return value;
    }

    // 解析 upgrade_benefits 配置（{title, desc} 数组格式）
    const upgradeBenefits = safeParseJson(targetConfig.upgrade_benefits);

    // 解析 apply_questions 配置（{question} 数组格式）
    const applyQuestions = safeParseJson(targetConfig.apply_questions) || [];

    // 构建目标等级信息
    const targetLevelInfo = {
      level: target_level,
      name: targetConfig.level_name,
      benefits: buildBenefits(targetConfig),
      upgrade_benefits: upgradeBenefits,
      apply_questions: applyQuestions,
    };

    // 构建升级选项
    // DB 状态：0=待审核, 1=已通过, 2=已驳回
    const upgradeOptions = buildUpgradeOptions({
      currentLevel: currentLevelNum,
      targetLevel: target_level,
      targetConfig,
      hasSignedContract,
      applicationApproved: applicationStatus === 1
    });

    // 当前统计数据
    const { count: refereeCount } = await db
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referee_id', user.id);

    const currentStats = {
      referee_count: refereeCount || 0,
      order_count: orderCount || 0,
      merit_points: parseFloat(user.merit_points) || 0,
      cash_points: parseFloat(user.cash_points_available) || 0
    };

    // 升级要求（原始配置数据）
    const requirements = {
      referee_count: targetConfig.required_referee_count || 0,
      upgrade_payment_amount: parseFloat(targetConfig.upgrade_payment_amount) || 0,
      frozen_points: parseFloat(targetConfig.frozen_points) || 0,
      gift_quota_basic: targetConfig.gift_quota_basic || 0,
      gift_quota_advanced: targetConfig.gift_quota_advanced || 0
    };

    return response.success({
      current_level: currentLevelInfo,
      target_level: targetLevelInfo,
      upgrade_options: upgradeOptions,
      current_stats: currentStats,
      requirements,
      // 申请状态：null=未申请, 0=待审核, 1=已通过, 2=已驳回
      application_status: applicationStatus,
      application_reject_reason: applicationRejectReason,
      application_id: applicationId
    }, '获取升级指南成功');

  } catch (error) {
    console.error('[getUpgradeGuide] 执行失败:', error);
    return response.error('获取升级指南失败', error);
  }
};

/**
 * 根据等级配置构建权益说明列表
 * @param {Object|null} config - 等级配置
 * @returns {string[]}
 */
function buildBenefits(config) {
  if (!config) return [];
  const benefits = [];

  if (config.merit_rate_basic > 0) {
    benefits.push(`推荐初探班获 ${(config.merit_rate_basic * 100).toFixed(0)}% 功德分`);
  }
  if (config.merit_rate_advanced > 0) {
    benefits.push(`推荐密训班获 ${(config.merit_rate_advanced * 100).toFixed(0)}% 功德分`);
  }
  if (config.cash_rate_basic > 0) {
    benefits.push(`推荐初探班获 ${(config.cash_rate_basic * 100).toFixed(0)}% 可提现积分`);
  }
  if (config.cash_rate_advanced > 0) {
    benefits.push(`推荐密训班获 ${(config.cash_rate_advanced * 100).toFixed(0)}% 可提现积分`);
  }
  if (config.unfreeze_per_referral > 0) {
    benefits.push(`每次推荐初探班解冻 ${config.unfreeze_per_referral} 元积分`);
  }
  if (config.frozen_points > 0) {
    benefits.push(`升级获得 ${config.frozen_points} 元冻结积分`);
  }
  if (config.gift_quota_basic > 0) {
    benefits.push(`赠送 ${config.gift_quota_basic} 个初探班名额`);
  }
  if (config.gift_quota_advanced > 0) {
    benefits.push(`赠送 ${config.gift_quota_advanced} 个密训班名额`);
  }

  return benefits;
}

/**
 * 根据等级和当前状态构建升级选项
 * @param {Object} params
 * @returns {Array}
 */
function buildUpgradeOptions({ currentLevel, targetLevel, targetConfig, hasSignedContract, applicationApproved }) {
  const options = [];
  const upgradeFee = parseFloat(targetConfig.upgrade_payment_amount) || 0;

  if (currentLevel === 0 && targetLevel === 1) {
    // 普通用户 → 准青鸾：申请审核 + 签署协议
    options.push({
      type: 'contract',
      name: '申请通过后签署准青鸾大使协议',
      eligible: applicationApproved && !hasSignedContract,
      requirements: ['提交大使申请并通过审核', '签署《准青鸾大使协议》'],
      reason: !applicationApproved ? '需先提交申请并等待审核通过' : null
    });
  } else if (currentLevel === 1 && targetLevel === 2) {
    // 准青鸾 → 青鸾：申请审核通过即可签署协议
    const eligible = applicationApproved && !hasSignedContract;
    options.push({
      type: 'contract',
      name: '签署青鸾大使协议',
      eligible,
      requirements: ['提交大使申请并通过审核', '签署《青鸾大使协议》'],
      reason: !applicationApproved ? '需先提交申请并等待审核通过' : null
    });
  } else if (currentLevel === 2 && targetLevel === 3) {
    // 青鸾 → 鸿鹄：申请 + 签署补充协议 + 支付升级费用
    options.push({
      type: 'contract',
      name: '签署鸿鹄大使补充协议',
      eligible: applicationApproved && !hasSignedContract,
      requirements: ['提交大使申请并通过审核', '签署《鸿鹄大使补充协议》'],
      reason: !applicationApproved ? '需先提交申请并等待审核通过' : null
    });
    if (upgradeFee > 0) {
      options.push({
        type: 'payment',
        name: `支付 ${upgradeFee} 元升级费用`,
        eligible: applicationApproved && hasSignedContract,
        fee: upgradeFee,
        requirements: [`支付 ${upgradeFee} 元升级费用`],
        reason: !applicationApproved
          ? '需先提交申请并等待审核通过'
          : !hasSignedContract
          ? '请先签署鸿鹄大使补充协议'
          : null
      });
    }
  } else {
    // 通用逻辑：申请 + 签署协议
    const eligible = applicationApproved && !hasSignedContract;
    options.push({
      type: 'contract',
      name: `签署${targetConfig.level_name}协议`,
      eligible,
      requirements: ['提交大使申请并通过审核', `签署《${targetConfig.level_name}协议》`],
      reason: !applicationApproved ? '需先提交申请并等待审核通过' : null
    });
    if (upgradeFee > 0) {
      options.push({
        type: 'payment',
        name: `支付 ${upgradeFee} 元升级费用`,
        eligible: applicationApproved && hasSignedContract,
        fee: upgradeFee,
        requirements: [`支付 ${upgradeFee} 元升级费用`],
        reason: !applicationApproved
          ? '需先提交申请并等待审核通过'
          : !hasSignedContract
          ? '请先签署协议'
          : null
      });
    }
  }

  return options;
}

/**
 * 等级名称兜底映射（配置不存在时使用）
 * @param {number} level
 * @returns {string}
 */
function getLevelName(level) {
  const names = {
    0: '普通用户',
    1: '准青鸾大使',
    2: '青鸾大使',
    3: '鸿鹄大使',
    4: '金凤大使'
  };
  return names[level] || '普通用户';
}
