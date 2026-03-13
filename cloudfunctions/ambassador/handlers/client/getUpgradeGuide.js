/**
 * 获取升级指南
 *
 * 升级路径：
 *   普通用户(0) → target=2: 提交申请即时升准青鸾(1)，审核通过后签约升青鸾(2)
 *   青鸾(2)     → target=3: 提交申请，审核通过后签约升鸿鹄(3)
 *
 * 返回结构与前端 UpgradeGuide 类型匹配
 */
const { db, findOne } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { target_level } = event;
  const { user } = context;

  try {
    if (!target_level || target_level < 1 || target_level > 4) {
      return response.paramError('目标等级应在 1-4 之间');
    }

    const currentLevelNum = user.ambassador_level || 0;

    if (currentLevelNum >= target_level) {
      return response.paramError('当前等级已达到或超过目标等级');
    }

    const [currentConfig, targetConfig] = await Promise.all([
      findOne('ambassador_level_configs', { level: currentLevelNum }),
      findOne('ambassador_level_configs', { level: target_level })
    ]);

    if (!targetConfig) {
      return response.error('目标等级配置不存在');
    }

    // 查询推荐成功的初探班订单数
    const { count: orderCount } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('referee_id', user.id)
      .eq('order_type', 1)
      .eq('pay_status', 1);

    // 检查是否已签署目标等级协议（status=1 有效）
    const existingContract = await db
      .from('contract_signatures')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('ambassador_level', target_level)
      .eq('status', 1);
    const hasSignedContract = (existingContract.count || 0) > 0;

    // 检查是否有待审核的协议（status=5）
    const pendingContract = await db
      .from('contract_signatures')
      .select('id, sign_time', { count: 'exact', head: false })
      .eq('user_id', user.id)
      .eq('ambassador_level', target_level)
      .eq('status', 5)
      .order('id', { ascending: false })
      .limit(1);
    const hasAuditPendingContract = pendingContract.data && pendingContract.data.length > 0;

    // 检查是否有已驳回的协议（status=6）
    const { data: rejectedContracts } = await db
      .from('contract_signatures')
      .select('id, reject_reason, audit_time')
      .eq('user_id', user.id)
      .eq('ambassador_level', target_level)
      .eq('status', 6)
      .order('id', { ascending: false })
      .limit(1);
    const rejectedContractInfo = rejectedContracts && rejectedContracts.length > 0
      ? rejectedContracts[0] : null;

    // 查询最新的大使申请状态（target_level 匹配）
    const { data: applications } = await db
      .from('ambassador_applications')
      .select('id, status, reject_reason, created_at, frozen_points')
      .eq('user_id', user.id)
      .eq('target_level', target_level)
      .order('id', { ascending: false })
      .limit(1);

    const latestApplication = applications && applications[0] ? applications[0] : null;
    const applicationStatus = latestApplication ? latestApplication.status : null;
    const applicationRejectReason = latestApplication ? latestApplication.reject_reason : null;
    const applicationId = latestApplication ? latestApplication.id : null;

    // 当前等级信息
    const currentLevelInfo = {
      level: currentLevelNum,
      name: currentConfig ? currentConfig.level_name : getLevelName(currentLevelNum),
      benefits: buildBenefits(currentConfig)
    };

    function safeParseJson(value) {
      if (value == null) return null;
      if (typeof value === 'string') {
        try { return JSON.parse(value); } catch (e) { return null; }
      }
      return value;
    }

    const upgradeBenefits = safeParseJson(targetConfig.upgrade_benefits);
    const applyQuestions = safeParseJson(targetConfig.apply_questions) || [];

    // 目标等级信息
    const targetLevelInfo = {
      level: target_level,
      name: targetConfig.level_name,
      benefits: buildBenefits(targetConfig),
      upgrade_benefits: upgradeBenefits,
      apply_questions: applyQuestions,
    };

    // 构建升级选项（不再有支付步骤）
    const upgradeOptions = buildUpgradeOptions({
      currentLevel: currentLevelNum,
      targetLevel: target_level,
      targetConfig,
      hasSignedContract,
      hasAuditPendingContract,
      rejectedContractInfo,
      applicationApproved: applicationStatus === 1
    });

    // 当前统计数据 — 只计 contract_signed=1 的正式推荐关系
    const { data: allRefU } = await db
      .from('users')
      .select('id')
      .eq('referee_id', user.id);
    let refereeCount = 0;
    if (allRefU && allRefU.length > 0) {
      const rIds = allRefU.map(u => u.id);
      const { data: cRecs } = await db
        .from('user_courses')
        .select('user_id')
        .in('user_id', rIds)
        .eq('contract_signed', 1);
      refereeCount = new Set((cRecs || []).map(r => r.user_id)).size;
    }

    const currentStats = {
      referee_count: refereeCount || 0,
      order_count: orderCount || 0,
      merit_points: parseFloat(user.merit_points) || 0,
      cash_points: parseFloat(user.cash_points_available) || 0
    };

    const requirements = {
      referee_count: targetConfig.required_referee_count || 0,
      frozen_points: parseFloat(targetConfig.frozen_points) || 0,
    };

    return response.success({
      current_level: currentLevelInfo,
      target_level: targetLevelInfo,
      upgrade_options: upgradeOptions,
      current_stats: currentStats,
      requirements,
      application_status: applicationStatus,
      application_reject_reason: applicationRejectReason,
      application_id: applicationId,
      // 普通用户查看 target=1 时标记即时升级
      instant_upgrade: target_level === 1 && currentLevelNum === 0
    }, '获取升级指南成功');

  } catch (error) {
    console.error('[getUpgradeGuide] 执行失败:', error);
    return response.error('获取升级指南失败', error);
  }
};

/**
 * 根据等级配置构建权益说明列表
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
  return benefits;
}

/**
 * 构建升级选项（无支付步骤）
 *
 * 普通用户 target=1: 提交申请即时升准青鸾（前端特殊处理）
 * 准青鸾 target=2:   审核通过 + 签署协议
 * 青鸾 target=3:     审核通过 + 签署协议
 */
function buildUpgradeOptions({ currentLevel, targetLevel, targetConfig, hasSignedContract, hasAuditPendingContract, rejectedContractInfo, applicationApproved }) {
  const options = [];
  const contractSubmitted = hasSignedContract || hasAuditPendingContract;
  const rejectReason = rejectedContractInfo ? (rejectedContractInfo.reject_reason || '无') : null;

  if (currentLevel === 0 && targetLevel === 1) {
    // 普通用户 → 准青鸾：提交申请即可（前端处理即时升级）
    options.push({
      type: 'instant_apply',
      name: '提交申请即可成为准青鸾大使',
      eligible: true,
      completed: false,
      requirements: ['购买密训班课程', '提交大使申请即可升级'],
      reason: null
    });
  } else {
    // 准青鸾→青鸾 / 青鸾→鸿鹄：审核通过 + 签署协议
    const contractName = targetLevel === 3 ? '鸿鹄大使补充协议'
      : targetLevel === 2 ? '青鸾大使补充协议'
      : `${targetConfig.level_name}协议`;

    options.push({
      type: 'contract',
      name: `审核通过后签署《${contractName}》`,
      eligible: applicationApproved && !contractSubmitted,
      completed: hasSignedContract,
      audit_pending: hasAuditPendingContract,
      rejected: !!rejectedContractInfo,
      reject_reason: rejectReason,
      requirements: ['提交申请并等待审核通过', `签署《${contractName}》`],
      reason: !applicationApproved ? '需等待审核通过'
        : hasAuditPendingContract ? '协议已提交，等待管理员审核' : null
    });
  }

  return options;
}

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
