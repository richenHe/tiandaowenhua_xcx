/**
 * 管理端接口：订单列表
 * Action: getOrderList
 * 使用 CloudBase Query Builder 外键语法实现关联查询
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { getPagination } = require('../../common/utils');

module.exports = async (event, context) => {
  const { OPENID, admin } = context;
  const { pay_status, start_date, end_date, keyword, page = 1, page_size = 20 } = event;

  try {
    console.log(`[getOrderList] 管理员查询订单:`, { admin_id: admin.id, pay_status, keyword });

    const { offset, limit } = getPagination(page, page_size);

    // 构建查询（使用 CloudBase Query Builder 外键语法）
    let queryBuilder = db
      .from('orders')
      .select(`
        *,
        user:users!fk_orders_user(id, real_name, phone),
        referee:users!fk_orders_referee(id, real_name, phone, referee_code)
      `, { count: 'exact' });

    // 支付状态筛选
    if (pay_status != null && pay_status !== '') {
      queryBuilder = queryBuilder.eq('pay_status', parseInt(pay_status));
    }

    // 日期范围筛选
    if (start_date) {
      queryBuilder = queryBuilder.gte('created_at', start_date);
    }
    if (end_date) {
      queryBuilder = queryBuilder.lte('created_at', end_date);
    }

    // 关键词搜索（注意：CloudBase SDK 的 LIKE 搜索需要特殊处理）
    // 暂时简化处理，后续可以使用 MCP 工具或其他方案
    if (keyword) {
      console.warn('[getOrderList] 关键词搜索功能需要使用 MCP 工具或其他方案');
      // TODO: 实现关键词搜索（可能需要在后端过滤）
    }

    // 排序和分页
    const { data: orders, error, count: total } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formatOrderType = (type) => {
      switch (type) {
        case 1: return '课程订单';
        case 2: return '复训订单';
        case 3: return '升级订单';
        default: return '未知';
      }
    };

    const formatPayStatus = (status) => {
      switch (status) {
        case 0: return '未支付';
        case 1: return '已支付';
        case 2: return '已退款';
        default: return '未知';
      }
    };

    const list = (orders || []).map(order => ({
      order_no: order.order_no,
      order_type: order.order_type,
      order_type_text: formatOrderType(order.order_type),
      order_name: order.order_name,
      original_amount: order.original_amount,
      discount_amount: order.discount_amount || 0,
      final_amount: order.final_amount,
      paid_amount: order.final_amount,
      pay_status: order.pay_status,
      pay_status_text: formatPayStatus(order.pay_status),
      pay_time: order.pay_time,
      is_reward_granted: order.is_reward_granted,
      created_at: order.created_at,
      user_name: order.user?.real_name || '',
      user_nickname: order.user?.nickname || order.user?.real_name || '',
      user_phone: order.user?.phone || '',
      referee_name: order.referee?.real_name || '',
      referee_phone: order.referee?.phone || '',
      referee_code: order.referee?.referee_code || '',
      points_used: order.order_metadata?.points_used || 0
    }));

    return response.success({
      total: total || 0,
      page,
      page_size,
      list
    });

  } catch (error) {
    console.error('[getOrderList] 失败:', error);
    return response.error('查询订单列表失败', error);
  }
};
