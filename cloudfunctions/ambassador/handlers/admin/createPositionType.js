/**
 * 管理端接口：创建活动岗位类型
 * Action: createPositionType
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { name, requiredLevel, meritPointsDefault, description, sortOrder } = event;

  try {
    console.log('[createPositionType] 创建岗位类型:', { name, requiredLevel });

    if (!name || !name.trim()) {
      return response.paramError('岗位名称不能为空');
    }

    // 检查同名岗位是否已存在
    const { data: existing } = await db
      .from('ambassador_position_types')
      .select('id')
      .eq('name', name.trim());

    if (existing && existing.length > 0) {
      return response.error('该岗位名称已存在');
    }

    // 若指定了门槛等级，验证等级是否存在
    if (requiredLevel != null && requiredLevel !== '') {
      const { data: levelRows } = await db
        .from('ambassador_level_configs')
        .select('level')
        .eq('level', requiredLevel);
      if (!levelRows || levelRows.length === 0) {
        return response.error('指定的门槛等级不存在');
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    await db.from('ambassador_position_types').insert({
      _openid: '',
      name: name.trim(),
      required_level: (requiredLevel != null && requiredLevel !== '') ? Number(requiredLevel) : null,
      merit_points_default: Number(meritPointsDefault) || 0,
      description: description || null,
      status: 1,
      sort_order: Number(sortOrder) || 0,
      created_at: now,
      updated_at: now
    });

    return response.success(null, '岗位类型创建成功');

  } catch (error) {
    console.error('[createPositionType] 失败:', error);
    return response.error('创建岗位类型失败', error);
  }
};
