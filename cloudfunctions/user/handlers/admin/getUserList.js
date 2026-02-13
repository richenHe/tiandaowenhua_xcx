/**
 * 管理端接口：学员管理 - 列表（支持搜索/筛选）
 * Action: admin:getUserList
 * 
 * ⚠️ 注意：此接口涉及复杂的 LIKE 搜索和日期范围筛选
 * CloudBase SDK 查询构建器可能不支持，需要使用 MCP 工具或其他方案
 * 当前版本：仅修改字段名，暂保留原有查询逻辑
 */
const { db } = require('../../common/db');
const { response, utils } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, pageSize = 20, keyword, ambassadorLevel, startDate, endDate } = event;

  try {
    console.log('[admin:getUserList] 获取学员列表');

    const { offset, limit } = utils.getPagination(page, pageSize);

    // ⚠️ 使用 db 实例进行查询（CloudBase SDK 方式）
    // TODO: 复杂查询需要后续优化
    // 注意：users 表没有 deleted_at 字段，所有用户都是有效的
    // 注意：CloudBase SDK 不支持在 select 中使用 as 别名，需手动处理
    let queryBuilder = db.from('users')
      .select('id, _openid, real_name, phone, city, avatar, referee_code, referee_id, ambassador_level, merit_points, cash_points_available, cash_points_frozen, profile_completed, created_at');

    // 关键词搜索（注意：CloudBase SDK 可能不支持 LIKE）
    if (keyword) {
      // 这里暂时简化处理，实际可能需要使用 MCP 工具
      console.warn('[getUserList] 关键词搜索功能需要使用 MCP 工具或其他方案');
    }

    // 大使等级筛选
    if (ambassadorLevel != null && ambassadorLevel !== '') {
      queryBuilder = queryBuilder.eq('ambassador_level', ambassadorLevel);
    }

    // 注册时间范围（注意：CloudBase SDK 可能需要特殊处理日期）
    if (startDate) {
      queryBuilder = queryBuilder.gte('created_at', startDate);
    }
    if (endDate) {
      queryBuilder = queryBuilder.lte('created_at', endDate);
    }

    const { data: users, error: queryError } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      throw new Error(queryError.message);
    }

    // 查询总数
    const { count: total, error: countError } = await db.from('users')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(countError.message);
    }

    console.log('[admin:getUserList] 查询成功，共', total, '条');
    
    // 格式化数据，添加字段别名
    const list = (users || []).map(user => ({
      ...user,
      cash_points: user.cash_points_available,
      frozen_cash_points: user.cash_points_frozen
    }));
    
    return response.success({
      total: total || 0,
      page,
      pageSize,
      list
    });

  } catch (error) {
    console.error('[admin:getUserList] 查询失败:', error);
    return response.error('获取学员列表失败', error);
  }
};
