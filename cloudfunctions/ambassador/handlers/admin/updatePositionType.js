/**
 * 管理端接口：更新活动岗位类型
 * Action: updatePositionType
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { id, name, requiredLevel, meritPointsDefault, description, status, sortOrder } = event;

  try {
    console.log('[updatePositionType] 更新岗位类型:', { id, name });

    if (!id) {
      return response.paramError('缺少必要参数: id');
    }

    // 检查记录是否存在
    const { data: existing } = await db
      .from('ambassador_position_types')
      .select('id')
      .eq('id', id);

    if (!existing || existing.length === 0) {
      return response.error('岗位类型不存在');
    }

    // 若修改了名称，检查新名称是否与其他记录重复
    if (name != null) {
      if (!name.trim()) return response.paramError('岗位名称不能为空');
      const { data: dupRows } = await db
        .from('ambassador_position_types')
        .select('id')
        .eq('name', name.trim())
        .neq('id', id);
      if (dupRows && dupRows.length > 0) {
        return response.error('该岗位名称已存在');
      }
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

    const updateData = {};
    if (name != null) updateData.name = name.trim();
    // requiredLevel 传 null 或空字符串 表示无限制
    if (requiredLevel !== undefined) {
      updateData.required_level = (requiredLevel != null && requiredLevel !== '') ? Number(requiredLevel) : null;
    }
    if (meritPointsDefault != null) updateData.merit_points_default = Number(meritPointsDefault);
    if (description !== undefined) updateData.description = description || null;
    if (status != null) updateData.status = Number(status);
    if (sortOrder != null) updateData.sort_order = Number(sortOrder);
    updateData.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

    await db.from('ambassador_position_types').update(updateData).eq('id', id);

    return response.success(null, '岗位类型更新成功');

  } catch (error) {
    console.error('[updatePositionType] 失败:', error);
    return response.error('更新岗位类型失败', error);
  }
};
