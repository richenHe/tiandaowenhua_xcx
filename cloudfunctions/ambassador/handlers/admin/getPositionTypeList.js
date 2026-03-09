/**
 * 管理端接口：获取活动岗位类型列表
 * Action: getPositionTypeList
 *
 * 返回 is_fixed：辅导员/会务义工/沙龙组织为固定岗位，前端用于隐藏删除按钮、禁用名称编辑
 */
const { db, response } = require('../../common');
const { isFixedPosition } = require('../../constants/activityType');

module.exports = async (event, context) => {
  const { includeDisabled = false } = event;

  try {
    console.log('[getPositionTypeList] 查询岗位类型列表');

    let query = db
      .from('ambassador_position_types')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (!includeDisabled) {
      query = query.eq('status', 1);
    }

    const { data: rows } = await query;

    // 查询所有等级配置，用于返回等级名称
    const { data: levelRows } = await db
      .from('ambassador_level_configs')
      .select('level, level_name')
      .eq('status', 1);

    const levelMap = {};
    (levelRows || []).forEach(l => { levelMap[l.level] = l.level_name; });

    const list = (rows || []).map(item => ({
      id: item.id,
      name: item.name,
      required_level: item.required_level,
      required_level_name: item.required_level != null ? (levelMap[item.required_level] || `等级${item.required_level}`) : null,
      merit_points_default: item.merit_points_default,
      description: item.description,
      status: item.status,
      sort_order: item.sort_order,
      is_fixed: isFixedPosition(item.name),
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    return response.success({ list, total: list.length });

  } catch (error) {
    console.error('[getPositionTypeList] 失败:', error);
    return response.error('获取岗位类型列表失败', error);
  }
};
