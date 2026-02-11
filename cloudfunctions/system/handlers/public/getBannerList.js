/**
 * 获取轮播图列表（公共接口，无需鉴权）
 * @description 用于首页展示轮播图，从公告表中查询category='banner'的记录
 */

const { db, response } = require('common');

module.exports = async (event, context) => {
  try {
    // 查询轮播图数据（使用公告表，category='banner'）
    const { data: banners, error } = await db
      .from('announcements')
      .select('id, title, summary, cover_image, link, sort_order')
      .eq('category', 'banner')
      .eq('status', 1)  // 已发布
      .lte('start_time', new Date().toISOString())  // 已开始
      .or('end_time.is.null,end_time.gte.' + new Date().toISOString())  // 未结束或无结束时间
      .order('sort_order', { ascending: false })  // 按权重倒序
      .order('created_at', { ascending: false })  // 相同权重按创建时间倒序
      .limit(10);  // 最多返回10个

    if (error) throw error;

    // 格式化返回数据
    const list = banners.map(item => ({
      id: item.id,
      title: item.title || '',
      subtitle: item.summary || '',
      coverImage: item.cover_image || '',
      link: item.link || '',
      sortOrder: item.sort_order || 0
    }));

    return response.success({
      list,
      total: list.length
    }, '获取成功');

  } catch (error) {
    console.error('获取轮播图失败:', error);
    return response.error('获取轮播图失败', error);
  }
};


