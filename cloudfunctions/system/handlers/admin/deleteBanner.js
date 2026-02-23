/**
 * 管理端接口：删除轮播图
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { id } = event;

  if (!id) return response.paramError('ID 不能为空');

  try {
    const { error } = await db.from('banners').delete().eq('id', id);
    if (error) throw error;

    return response.success(null, '删除成功');
  } catch (error) {
    console.error('[admin:deleteBanner] 失败:', error);
    return response.error('删除轮播图失败', error);
  }
};
