/**
 * 获取课程列表（管理端接口）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { type, status, keyword, page = 1, page_size = 10 } = event;

  try {
    const { offset, limit } = getPagination(page, page_size);

    // 构建查询（注意：courses 表没有 deleted_at 字段）
    let queryBuilder = db
      .from('courses')
      .select(`
        id,
        name,
        type,
        cover_image,
        description,
        content,
        outline,
        teacher,
        duration,
        original_price,
        current_price,
        retrain_price,
        allow_retrain,
        included_course_ids,
        stock,
        sold_count,
        sort_order,
        status,
        created_at,
        updated_at,
        nickname
      `, { count: 'exact' });

    // 添加类型过滤
    if (type) {
      queryBuilder = queryBuilder.eq('type', parseInt(type));
    }

    // 添加状态过滤
    if (status !== undefined) {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 添加关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    // 排序和分页
    queryBuilder = queryBuilder
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 执行查询
    const { data: courses, error, count: total } = await queryBuilder;

    if (error) {
      throw error;
    }

    // 格式化数据（添加 type_name）
    const getTypeName = (type) => {
      switch (type) {
        case 1: return '初探班';
        case 2: return '密训班';
        case 3: return '咨询服务';
        default: return '未知';
      }
    };

    const list = (courses || []).map(course => ({
      ...course,
      type_name: getTypeName(course.type)
    }));

    return response.success({
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      list
    });

  } catch (error) {
    console.error('[Course/getCourseList] 查询失败:', error);
    return response.error('查询课程列表失败', error);
  }
};
