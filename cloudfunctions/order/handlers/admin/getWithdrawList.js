/**
 * 管理端接口：获取提现申请列表
 * Action: getWithdrawList
 *
 * 参数：
 * - page: 页码（默认1）
 * - page_size: 每页数量（默认20）
 * - status: 状态筛选（可选，0=待审核 1=审核通过 2=已打款 3=已拒绝）
 * - keyword: 搜索关键词（提现单号/用户姓名）
 */
const { db, response, executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { page = 1, page_size = 20, pageSize, status, keyword, start_date, end_date } = event;

  try {
    console.log(`[admin:getWithdrawList] 管理员 ${admin.id} 获取提现列表`);

    // 兼容 pageSize 参数
    const finalPageSize = pageSize || page_size || 20;

    // 构建查询（使用外键名进行 JOIN）
    let queryBuilder = db
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
        user:users!fk_withdrawals_user(real_name, phone, ambassador_level, bank_name, bank_account_name, bank_account_number)
      `, { count: 'exact' })
      .order('apply_time', { ascending: false });

    // 状态筛选
    if (status != null && status !== '') {
      queryBuilder = queryBuilder.eq('status', parseInt(status));
    }

    // 日期范围筛选（按申请时间 apply_time 过滤）
    if (start_date) {
      queryBuilder = queryBuilder.gte('apply_time', start_date);
    }
    if (end_date) {
      queryBuilder = queryBuilder.lte('apply_time', end_date + ' 23:59:59');
    }

    // 关键词搜索
    if (keyword) {
      queryBuilder = queryBuilder.or(`withdraw_no.like.%${keyword}%,user_name.like.%${keyword}%`);
    }

    // 执行分页查询
    const result = await executePaginatedQuery(queryBuilder, page, finalPageSize);

    // 获取所有审核管理员ID
    const adminIds = [...new Set((result.list || []).map(w => w.audit_admin_id).filter(id => id))];

    // 查询审核管理员信息（正确表名为 admin_users）
    let adminMap = {};
    if (adminIds.length > 0) {
      const { data: admins } = await db
        .from('admin_users')
        .select('id, username, real_name')
        .in('id', adminIds);

      if (admins) {
        admins.forEach(a => {
          adminMap[a.id] = a;
        });
      }
    }

    // 处理数据：展平 account_info、映射字段名
    const list = (result.list || []).map(withdrawal => {
      let accountInfo = null;

      // 安全解析 account_info 字段
      if (withdrawal.account_info) {
        try {
          accountInfo = typeof withdrawal.account_info === 'string'
            ? JSON.parse(withdrawal.account_info)
            : withdrawal.account_info;
        } catch (e) {
          console.error('[getWithdrawList] 解析 account_info 失败:', e);
        }
      }

      return {
        ...withdrawal,
        // 用户手机号和大使等级（从 JOIN 的 user 对象取）
        user_phone: withdrawal.user?.phone || '',
        ambassador_level: withdrawal.user?.ambassador_level || 0,
        // 银行卡信息：优先 account_info，如果是纯数字则回退到 users 表字段
        bank_name: resolveBankName(accountInfo, withdrawal.user),
        bank_account_name: accountInfo?.account_name || accountInfo?.realName || accountInfo?.bank_account_name || withdrawal.user?.bank_account_name || '',
        bank_account_number: accountInfo?.account_number || accountInfo?.cardNumber || accountInfo?.bank_account_number || withdrawal.user?.bank_account_number || '',
        wechat_account: accountInfo?.wechat || accountInfo?.account || '',
        alipay_account: accountInfo?.alipay || accountInfo?.account || '',
        account_info: accountInfo,
        // 时间字段别名（前端用 approved_at 和 transferred_at）
        approved_at: withdrawal.audit_time || null,
        transferred_at: withdrawal.transfer_time || null,
        status_text: getStatusText(withdrawal.status),
        account_type_text: getAccountTypeText(withdrawal.account_type),
        audit_admin: withdrawal.audit_admin_id ? adminMap[withdrawal.audit_admin_id] : null
      };
    });

    // 查询各状态统计数据
    // status: 0=待审核 1=审核通过待转账 2=已打款 3=已拒绝
    const [
      { count: pendingCount },
      { count: transferredCount },
      { count: rejectedCount },
      { data: pendingAmountData }
    ] = await Promise.all([
      db.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 0),
      db.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 2),
      db.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 3),
      // 待打款金额 = 待审核(0) + 审核通过待转账(1) 的合计
      db.from('withdrawals').select('amount').in('status', [0, 1])
    ]);

    const pendingAmount = (pendingAmountData || []).reduce((sum, row) => sum + (row.amount || 0), 0);

    const statistics = {
      pending: pendingCount || 0,
      transferred: transferredCount || 0,
      rejected: rejectedCount || 0,
      pendingAmount
    };

    return response.success({
      ...result,
      list,
      statistics
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

/**
 * 解析银行名称：account_info 中的 bank_name 可能是纯数字 ID，
 * 此时回退到 users 表的 bank_name 字段
 */
function resolveBankName(accountInfo, user) {
  const name = accountInfo?.bank_name || accountInfo?.bankName || '';
  if (name && !/^\d+$/.test(String(name))) return name;
  return user?.bank_name || name || '';
}

