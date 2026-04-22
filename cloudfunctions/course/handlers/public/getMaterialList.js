/**
 * 获取资料列表（公开接口）
 */
const { db, response, executePaginatedQuery, cloudFileIDToURL } = require('../../common');
const { getMaterialImageFileIds } = require('../../common/materialImages');

module.exports = async (event, context) => {
  const { category, keyword, page = 1, page_size = 10, pageSize } = event;

  try {
    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 10;

    // 构建查询
    let queryBuilder = db.from('academy_materials')
      .select('id, title, category, image_url, images, video_url, content, tags, view_count, download_count, share_count, sort_order, created_at', { count: 'exact' })
      .eq('status', 1)
      .order('sort_order', { ascending: false })
      .order('id', { ascending: false });

    // 添加分类筛选
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`title.like.%${keyword}%,content.like.%${keyword}%`);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 海报图转 CDN（<image> 适用）；video_url 若为 cloud:// 则保持不转，供小程序 <video> 直连云存储鉴权播放（转 tcb.qcloud.la 常因桶未公网读导致 ERR_FAILED）
    const list = result.list || [];
    list.forEach((item) => {
      const fileIds = getMaterialImageFileIds(item);
      item.images = fileIds.map((fid) => cloudFileIDToURL(fid));
      item.image_url = item.images[0] || '';
      if (item.video_url && !String(item.video_url).startsWith('cloud://')) {
        item.video_url = cloudFileIDToURL(item.video_url);
      }
    });

    return response.success({
      ...result,
      list
    });

  } catch (error) {
    console.error('[Course/getMaterialList] 查询失败:', error);
    return response.error('查询资料列表失败', error);
  }
};
