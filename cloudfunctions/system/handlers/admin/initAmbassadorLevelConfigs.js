/**
 * 管理端接口：初始化大使等级配置
 * Action: initAmbassadorLevelConfigs
 *
 * 功能：创建默认的5个等级配置
 */
const { insert, query } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;

  try {
    console.log(`[admin:initAmbassadorLevelConfigs] 管理员 ${admin.id} 初始化大使等级配置`);

    // 检查是否已初始化
    const existingConfigs = await query('ambassador_level_configs');
    if (existingConfigs && existingConfigs.length > 0) {
      return response.error('配置已存在，无需重复初始化');
    }

    // 默认配置
    const defaultConfigs = [
      {
        level: 1,
        level_name: '初级大使',
        upgrade_type: 'payment',
        upgrade_conditions: JSON.stringify({
          payment_amount: 1980,
          course_id: null
        }),
        benefits: JSON.stringify({
          commission_rate: 0.10,
          merit_points_rate: 1.0,
          quotas: 5,
          description: '10%课程佣金 + 5个推广名额'
        }),
        description: '入门级大使，适合初次接触推广的学员',
        created_at: new Date()
      },
      {
        level: 2,
        level_name: '中级大使',
        upgrade_type: 'payment',
        upgrade_conditions: JSON.stringify({
          payment_amount: 3980,
          course_id: null,
          required_level: 1
        }),
        benefits: JSON.stringify({
          commission_rate: 0.15,
          merit_points_rate: 1.2,
          quotas: 10,
          description: '15%课程佣金 + 10个推广名额'
        }),
        description: '中级大使，具备一定推广经验',
        created_at: new Date()
      },
      {
        level: 3,
        level_name: '高级大使',
        upgrade_type: 'contract',
        upgrade_conditions: JSON.stringify({
          contract_template_id: null,
          required_level: 2,
          min_referrals: 10
        }),
        benefits: JSON.stringify({
          commission_rate: 0.20,
          merit_points_rate: 1.5,
          quotas: 20,
          description: '20%课程佣金 + 20个推广名额 + 团队管理权限'
        }),
        description: '高级大使，需签署协议并达到推广要求',
        created_at: new Date()
      },
      {
        level: 4,
        level_name: '金牌大使',
        upgrade_type: 'contract',
        upgrade_conditions: JSON.stringify({
          contract_template_id: null,
          required_level: 3,
          min_referrals: 30,
          min_team_size: 5
        }),
        benefits: JSON.stringify({
          commission_rate: 0.25,
          merit_points_rate: 2.0,
          quotas: 50,
          description: '25%课程佣金 + 50个推广名额 + 团队奖励'
        }),
        description: '金牌大使，具备团队管理能力',
        created_at: new Date()
      },
      {
        level: 5,
        level_name: '钻石大使',
        upgrade_type: 'contract',
        upgrade_conditions: JSON.stringify({
          contract_template_id: null,
          required_level: 4,
          min_referrals: 100,
          min_team_size: 20
        }),
        benefits: JSON.stringify({
          commission_rate: 0.30,
          merit_points_rate: 3.0,
          quotas: 100,
          description: '30%课程佣金 + 100个推广名额 + 最高团队奖励'
        }),
        description: '钻石大使，顶级推广专家',
        created_at: new Date()
      }
    ];

    // 批量插入
    await insert('ambassador_level_configs', defaultConfigs);

    return response.success({ count: defaultConfigs.length }, '初始化成功');

  } catch (error) {
    console.error('[admin:initAmbassadorLevelConfigs] 失败:', error);
    return response.error('初始化大使等级配置失败', error);
  }
};
