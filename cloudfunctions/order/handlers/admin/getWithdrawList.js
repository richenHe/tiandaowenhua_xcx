/**
 * 管理端接口：获取提现申请列表
 * Action: getWithdrawList
 *
 * 参数：
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 * - status: 状态筛选（可选，0=待审核 1=审核通过 2=已打款 3=已拒绝）
 * - keyword: 搜索关键词（提现单号/用户姓名）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, pageSize = 20, status, keyword } = event;

  try {
    console.log(`[admin:getWithdrawList] 管理员 ${admin.id} 获取提现列表`);

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    // 构建查询（使用外键名进行 JOIN）
    let query = db
      .from('withdrawals')
      .select(`
        id,
        withdraw_no,
        user_id,
        user_name,
        amount,
        account_type,
        account_info,
        status,
        apply_time,
        audit_admin_id,
        audit_time,
        audit_remark,
        reject_reason,
        transfer_time,
        transfer_no,
        created_at,
        user:users!fk_withdrawals_user(real_name, phone, ambassador_level)
      `)
      .order('apply_time', { ascending: false });

    // 状态筛选
    if (status != null && status !== '') {
      query = query.eq('status', parseInt(status));
    }

    // 关键词搜索
    if (keyword) {
      query = query.or(`withdraw_no.ilike.%${keyword}%,user_name.ilike.%${keyword}%`);
    }

    // 分页
    const { data: withdrawals, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // 统计总数
    let countQuery = db
      .from('withdrawals')
      .select('*', { count: 'exact', head: true });

    if (status != null && status !== '') {
      countQuery = countQuery.eq('status', parseInt(status));
    }

    if (keyword) {
      countQuery = countQuery.or(`withdraw_no.ilike.%${keyword}%,user_name.ilike.%${keyword}%`);
    }

    const { count: total } = await countQuery;

    // 获取所有审核管理员ID
    const adminIds = [...new Set(withdrawals.map(w => w.audit_admin_id).filter(id => id))];
    
    // 查询审核管理员信息
    let adminMap = {};
    if (adminIds.length > 0) {
      const { data: admins } = await db
        .from('admins')
        .select('id, username, real_name')
        .in('id', adminIds);
      
      if (admins) {
        admins.forEach(admin => {
          adminMap[admin.id] = admin;
        });
      }
    }
    
    // 处理数据
    const processedWithdrawals = withdrawals.map(withdrawal => {
      let accountInfo = null;
      
      // 安全解析 account_info 字段
      if (withdrawal.account_info) {
        try {
          if (typeof withdrawal.account_info === 'string') {
            accountInfo = JSON.parse(withdrawal.account_info);
          } else {
            accountInfo = withdrawal.account_info;
          }
        } catch (e) {
          console.error('[getWithdrawList] 解析 account_info 失败:', e);
        }
      }
      
      return {
        ...withdrawal,
        account_info: accountInfo,
        status_text: getStatusText(withdrawal.status),
        account_type_text: getAccountTypeText(withdrawal.account_type),
        audit_admin: withdrawal.audit_admin_id ? adminMap[withdrawal.audit_admin_id] : null
      };
    });

    return response.success({
      list: processedWithdrawals,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }, '获取成功');

  } catch (error) {
    console.error('[admin:getWithdrawList] 失败:', error);
    return response.error('获取提现列表失败', error);
  }
};

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    0: '待审核',
    1: '审核通过',
    2: '已打款',
    3: '已拒绝'
  };
  return statusMap[status] || '未知';
}

// 获取账户类型文本
function getAccountTypeText(type) {
  const typeMap = {
    1: '微信',
    2: '支付宝',
    3: '银行卡'
  };
  return typeMap[type] || '未知';
}

