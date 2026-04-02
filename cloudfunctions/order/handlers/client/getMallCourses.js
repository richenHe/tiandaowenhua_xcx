/**
 * 获取商城课程列表（客户端接口）
 * @description 展示积分商城的课程商品（初探班和密训班）；游客可读，不要求 users 表已注册
 * @param {number} type - 课程类型：1初探班/2密训班（可选）
 * @param {number} page - 页码（默认1）
 * @param {number} page_size - 每页数量（默认10）
 */

const { db, response, cloudFileIDToURL, executePaginatedQuery } = require('common');

module.exports = async (event, context) => {
  const { type, page = 1, page_size = 10, pageSize } = event;

  try {
    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 10;

    // 构建查询
    let queryBuilder = db
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('status', 1)  // 只查询上架课程
      .in('type', [1, 2])  // 只查询初探班和密训班
      .order('id', { ascending: true });

    // 如果指定了课程类型
    if (type) {
      queryBuilder = queryBuilder.eq('type', parseInt(type));
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 🔥 格式化返回数据，cloud:// fileID 直接转换为 CDN HTTPS URL
    const list = (result.list || []).map(item => {
      return {
        id: item.id,
        name: item.name,
        nickname: item.nickname || '',
        type: item.type,
        coverImage: cloudFileIDToURL(item.cover_image || ''),
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
    });

    return response.success({
      ...result,
      list
    }, '获取成功');

  } catch (error) {
    console.error('获取商城课程失败:', error);
    return response.error('获取商城课程失败', error);
  }
};










