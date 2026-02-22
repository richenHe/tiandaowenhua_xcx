/**
 * 管理端接口：获取配置列表
 * Action: getConfigList
 *
 * 参数：
 * - category: 配置分类（可选，如 'system', 'points', 'retrain'）
 * - page: 页码（可选）
 * - page_size: 每页数量（可选）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { category, page = 1, page_size = 100 } = event;

  try {
    console.log(`[admin:getConfigList] 管理员 ${admin.id} 获取配置列表`);

    // 构建查询
    let query = db
      .from('system_configs')
      .select('*')
      .eq('status', 1)
      .order('config_group', { ascending: true })
      .order('id', { ascending: true });

    // 可选的分类过滤
    if (category) {
      query = query.eq('config_group', category);
    }

    // 分页（默认不分页，返回所有）
    if (page_size && page_size < 1000) {
      const offset = (page - 1) * page_size;
      query = query.range(offset, offset + page_size - 1);
    }

    const { data: configs, count, error } = await query;

    if (error) throw error;

    // 格式化返回数据
    const list = configs.map(config => ({
      id: config.id,
      key: config.config_key,
      value: config.config_value,
      type: config.config_type,
      group: config.config_group,
      name: config.config_name,
      description: config.config_desc,
      is_system: config.is_system,
      updated_at: config.updated_at
    }));

    return response.success({
      total: count || list.length,
      list
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getConfigList] 失败:', error);
    return response.error('获取配置列表失败', error);
  }
};
