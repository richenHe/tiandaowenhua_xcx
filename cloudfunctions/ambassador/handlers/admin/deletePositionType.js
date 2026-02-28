/**
 * 管理端接口：删除活动岗位类型（硬删除）
 * Action: deletePositionType
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { id } = event;

  try {
    console.log('[deletePositionType] 删除岗位类型:', { id });

    if (!id) {
      return response.paramError('缺少必要参数: id');
    }

    // 检查记录是否存在
    const { data: existing } = await db
      .from('ambassador_position_types')
      .select('id, name')
      .eq('id', id);

    if (!existing || existing.length === 0) {
      return response.error('岗位类型不存在');
    }

    await db.from('ambassador_position_types').delete().eq('id', id);

    return response.success(null, `岗位类型「${existing[0].name}」已删除`);

  } catch (error) {
    console.error('[deletePositionType] 失败:', error);
    return response.error('删除岗位类型失败', error);
  }
};
