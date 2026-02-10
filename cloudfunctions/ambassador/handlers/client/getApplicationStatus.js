/**
 * 客户端接口：获取申请状态
 * Action: getApplicationStatus
 */
const { findOne } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;

  try {
    console.log(`[getApplicationStatus] 查询申请状态:`, user.id);

    // 查询最新的申请记录
    const { db } = require('../../common/db');
    const { data, error } = await db
      .from('ambassador_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && !error.message.includes('0 rows')) {
      throw error;
    }

    const application = data;

    // 如果没有申请记录
    if (!application) {
      return response.success({
        has_application: false,
        ambassador_level: user.ambassador_level,
        message: user.ambassador_level > 0 ? '您已经是大使' : '您还未申请成为大使'
      });
    }

    // 返回申请状态
    const statusMap = {
      0: '待审核',
      1: '已通过',
      2: '已拒绝'
    };

    return response.success({
      has_application: true,
      application: {
        id: application.id,
        status: application.status,
        status_text: statusMap[application.status],
        reason: application.reason,
        reject_reason: application.reject_reason,
        created_at: application.created_at,
        reviewed_at: application.reviewed_at
      },
      ambassador_level: user.ambassador_level
    });

  } catch (error) {
    console.error(`[getApplicationStatus] 失败:`, error);
    return response.error('查询失败', error);
  }
};
