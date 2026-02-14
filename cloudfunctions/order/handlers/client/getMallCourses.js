/**
 * 获取商城课程列表（客户端接口，需要用户鉴权）
 * @description 展示积分商城的课程商品（初探班和密训班）
 * @param {number} type - 课程类型：1初探班/2密训班（可选）
 * @param {number} page - 页码（默认1）
 * @param {number} page_size - 每页数量（默认10）
 */

const { db, response, getTempFileURL, executePaginatedQuery } = require('common');

module.exports = async (event, context) => {
  const { type, page = 1, page_size = 10, pageSize } = event;

  try {
    // 兼容 pageSize 参数
    const finalPageSize = page_size || pageSize || 10;

    // 构建查询
    let queryBuilder = db
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('status', 1)  // 只查询上架课程
      .in('type', [1, 2])  // 只查询初探班和密训班
      .order('sort_order', { ascending: false })  // 按排序权重倒序
      .order('id', { ascending: true });  // 相同权重按ID正序

    // 如果指定了课程类型
    if (type) {
      queryBuilder = queryBuilder.eq('type', parseInt(type));
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 格式化返回数据并转换云存储 fileID 为临时 URL
    const list = await Promise.all((result.list || []).map(async item => {
      let coverImageUrl = item.cover_image || '';
      if (item.cover_image) {
        try {
          const tempResult = await getTempFileURL(item.cover_image);
          coverImageUrl = tempResult.tempFileURL || item.cover_image;
        } catch (error) {
          console.warn('[getMallCourses] 转换临时URL失败:', item.cover_image, error.message);
        }
      }

      return {
        id: item.id,
        name: item.name,
        nickname: item.nickname || '',
        type: item.type,
        coverImage: coverImageUrl,
        description: item.description || '',
        teacher: item.teacher || '',
        duration: item.duration || '',
        originalPrice: parseFloat(item.original_price) || 0,
        currentPrice: parseFloat(item.current_price) || 0,
        stock: item.stock,
        soldCount: item.sold_count || 0,
        isUnlimitedStock: item.stock === -1,
        canBuy: item.stock === -1 || item.stock > 0
      };
    }));

    return response.success({
      ...result,
      list
    }, '获取成功');

  } catch (error) {
    console.error('获取商城课程失败:', error);
    return response.error('获取商城课程失败', error);
  }
};










