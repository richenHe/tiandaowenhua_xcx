/**
 * 管理端接口：删除大使活动（新版，操作 ambassador_activities 表）
 * Action: deleteAmbassadorActivity
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { activityId } = event;

  try {
    console.log('[deleteAmbassadorActivity] 删除活动:', { activityId });

    if (!activityId) {
      return response.paramError('缺少必要参数: activityId');
    }

    // 查询活动是否存在
    const { data: rows } = await db
      .from('ambassador_activities')
      .select('id, merit_distributed')
      .eq('id', activityId);

    if (!rows || rows.length === 0) {
      return response.error('活动不存在');
    }
    if (rows[0].merit_distributed === 1) {
      return response.error('该活动功德分已发放，不可删除');
    }

    // 删除报名记录
    await db
      .from('ambassador_activity_registrations')
      .delete()
      .eq('activity_id', activityId);

    // 删除活动
    await db
      .from('ambassador_activities')
      .delete()
      .eq('id', activityId);

    return response.success(null, '删除成功');

  } catch (error) {
    console.error('[deleteAmbassadorActivity] 失败:', error);
    return response.error('删除失败', error);
  }
};
