/**
 * 管理端接口：更新黑名单阈值配置
 * Action: updateBlacklistConfig
 *
 * 参数：
 * - configs: 配置数组（必填），[{key: 'student_deduction_threshold', value: '-30'}, ...]
 */
const { db, response, formatDateTime } = require('../../common');

const VALID_KEYS = [
  'student_deduction_threshold',
  'student_blacklist_months',
  'activity_deduction_threshold',
  'activity_blacklist_months'
];

module.exports = async (event, context) => {
  const { admin } = context;
  const { configs } = event;

  try {
    if (!configs || !Array.isArray(configs) || configs.length === 0) {
      return response.paramError('缺少必要参数: configs 数组');
    }

    // 校验所有 key 是否合法
    for (const item of configs) {
      if (!item.key || !VALID_KEYS.includes(item.key)) {
        return response.paramError(`无效的配置键: ${item.key}`);
      }
      if (item.value === undefined || item.value === null || item.value === '') {
        return response.paramError(`配置值不能为空: ${item.key}`);
      }
    }

    console.log(`[admin:updateBlacklistConfig] 管理员 ${admin.id} 更新阈值配置:`, configs);

    const now = formatDateTime(new Date());

    for (const item of configs) {
      const { data: existing } = await db.from('blacklist_config')
        .select('id')
        .eq('config_key', item.key)
        .limit(1);

      if (existing && existing.length > 0) {
        await db.from('blacklist_config')
          .update({ config_value: String(item.value), updated_at: now })
          .eq('config_key', item.key);
      } else {
        await db.from('blacklist_config').insert({
          config_key: item.key,
          config_value: String(item.value),
          updated_at: now
        });
      }
    }

    return response.success(null, '阈值配置更新成功');

  } catch (error) {
    console.error('[admin:updateBlacklistConfig] 失败:', error);
    return response.error('更新阈值配置失败', error);
  }
};
