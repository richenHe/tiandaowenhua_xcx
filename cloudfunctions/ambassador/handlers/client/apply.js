/**
 * 客户端接口：申请成为大使
 * Action: apply
 */
const { findOne, insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { real_name, phone, reason } = event;

  try {
    console.log(`[apply] 用户申请成为大使:`, user.id);

    // 参数验证
    if (!real_name || !phone) {
      return response.paramError('缺少必要参数: real_name, phone');
    }

    // 检查是否已经是大使
    if (user.ambassador_level > 0) {
      return response.error('您已经是大使，无需重复申请');
    }

    // 检查是否有待审核的申请
    const existingApplication = await findOne('ambassador_applications', {
      user_id: user.id,
      status: 0  // 待审核
    });

    if (existingApplication) {
      return response.error('您已有待审核的申请，请耐心等待');
    }

    // 创建申请记录
    const [application] = await insert('ambassador_applications', {
      user_id: user.id,
      real_name,
      phone,
      reason: reason || '',
      status: 0,  // 待审核
      created_at: new Date().toISOString()
    });

    return response.success({
      application_id: application.id,
      status: 0,
      message: '申请已提交，请等待审核'
    }, '申请提交成功');

  } catch (error) {
    console.error(`[apply] 失败:`, error);
    return response.error('申请失败', error);
  }
};
