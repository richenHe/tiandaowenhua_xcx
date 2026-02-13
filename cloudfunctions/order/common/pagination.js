/**
 * 分页工具模块
 * 提供统一的前后端分页处理
 */

/**
 * 解析分页参数
 * @param {number} page - 页码（从 1 开始）
 * @param {number} pageSize - 每页数量
 * @param {number} maxPageSize - 最大每页数量（默认 100）
 * @returns {Object} { page, pageSize, offset, limit }
 */
function parsePagination(page = 1, pageSize = 20, maxPageSize = 100) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(maxPageSize, Math.max(1, parseInt(pageSize) || 20));

  return {
    page: p,
    pageSize: ps,
    offset: (p - 1) * ps,
    limit: ps
  };
}

/**
 * 构建分页响应数据
 * @param {Array} list - 数据列表
 * @param {number} total - 总记录数
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页数量
 * @returns {Object} 分页响应对象
 */
function buildPaginationResponse(list, total, page, pageSize) {
  const totalPages = Math.ceil(total / pageSize);

  return {
    list: list || [],
    total: total || 0,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages,
    hasMore: page < totalPages,
    hasPrev: page > 1
  };
}

/**
 * Supabase 风格分页查询辅助函数
 * @param {Object} queryBuilder - Supabase 查询构建器
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Object} 添加了分页的查询构建器
 */
function applyPagination(queryBuilder, page = 1, pageSize = 20) {
  const { offset, limit } = parsePagination(page, pageSize);
  return queryBuilder.range(offset, offset + limit - 1);
}

/**
 * 执行分页查询（Supabase）
 * @param {Object} queryBuilder - 已配置好的查询构建器（需包含 count: 'exact'）
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} { list, total, page, pageSize, totalPages, hasMore, hasPrev }
 */
async function executePaginatedQuery(queryBuilder, page = 1, pageSize = 20) {
  const { offset, limit, page: p, pageSize: ps } = parsePagination(page, pageSize);

  // 应用分页
  const { data, error, count } = await queryBuilder.range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return buildPaginationResponse(data, count, p, ps);
}

/**
 * 数组分页（用于内存数据分页）
 * @param {Array} array - 原始数组
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Object} 分页结果
 */
function paginateArray(array, page = 1, pageSize = 20) {
  const { offset, limit, page: p, pageSize: ps } = parsePagination(page, pageSize);
  const total = array.length;
  const list = array.slice(offset, offset + limit);

  return buildPaginationResponse(list, total, p, ps);
}

module.exports = {
  parsePagination,
  buildPaginationResponse,
  applyPagination,
  executePaginatedQuery,
  paginateArray
};
