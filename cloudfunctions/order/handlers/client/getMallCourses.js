/**
 * 获取商城课程列表（客户端接口，需要用户鉴权）
 * @description 展示积分商城的课程商品（初探班和密训班）
 * @param {number} type - 课程类型：1初探班/2密训班（可选）
 * @param {number} page - 页码（默认1）
 * @param {number} pageSize - 每页数量（默认10）
 */

const { db, response } = require('common');

module.exports = async (event, context) => {
  const { type, page = 1, pageSize = 10 } = event;

  try {
    // 计算分页参数
    const limit = parseInt(pageSize) || 10;
    const offset = (parseInt(page) - 1) * limit;

    // 构建查询
    let queryBuilder = db
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('status', 1)  // 只查询上架课程
      .in('type', [1, 2])  // 只查询初探班和密训班
      .order('sort_order', { ascending: false })  // 按排序权重倒序
      .order('id', { ascending: true })  // 相同权重按ID正序
      .range(offset, offset + limit - 1);

    // 如果指定了课程类型
    if (type) {
      queryBuilder = queryBuilder.eq('type', parseInt(type));
    }

    // 执行查询
    const { data: courses, error, count: total } = await queryBuilder;

    if (error) throw error;

    // 格式化返回数据
    const list = (courses || []).map(item => ({
      id: item.id,
      name: item.name,
      nickname: item.nickname || '',
      type: item.type,
      coverImage: item.cover_image || '',
      description: item.description || '',
      teacher: item.teacher || '',
      duration: item.duration || '',
      originalPrice: parseFloat(item.original_price) || 0,
      currentPrice: parseFloat(item.current_price) || 0,
      stock: item.stock,
      soldCount: item.sold_count || 0,
      isUnlimitedStock: item.stock === -1,
      canBuy: item.stock === -1 || item.stock > 0
    }));

    return response.success({
      total: total || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      list
    }, '获取成功');

  } catch (error) {
    console.error('获取商城课程失败:', error);
    return response.error('获取商城课程失败', error);
  }
};





