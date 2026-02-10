/**
 * 管理端接口：发送通知
 * Action: sendNotification
 *
 * 参数：
 * - user_ids: 用户ID列表
 * - template_id: 模板ID
 * - scene: 场景
 * - data: 模板数据
 */
const { response } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { admin } = context;
  const { user_ids, template_id, scene, data } = event;

  try {
    // 参数验证
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return response.paramError('缺少必要参数: user_ids（数组）');
    }

    if (!template_id || !scene || !data) {
      return response.paramError('缺少必要参数: template_id, scene, data');
    }

    console.log(`[admin:sendNotification] 管理员 ${admin.id} 发送通知给 ${user_ids.length} 个用户`);

    // 批量发送订阅消息
    const results = await business.batchSendSubscribeMessage({
      user_ids,
      template_id,
      scene,
      data
    });

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return response.success({
      total: results.length,
      success: successCount,
      fail: failCount,
      details: results
    }, `发送完成：成功 ${successCount}，失败 ${failCount}`);

  } catch (error) {
    console.error('[admin:sendNotification] 失败:', error);
    return response.error('发送通知失败', error);
  }
};
