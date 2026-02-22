/**
 * 管理端接口：发送通知
 * Action: sendNotification
 *
 * 支持两种方式：
 * 方式1（简单通知）：
 * - user_ids: 用户ID列表
 * - title: 通知标题
 * - content: 通知内容
 * - type: 通知类型（system/course/order）
 *
 * 方式2（模板消息）：
 * - user_ids: 用户ID列表
 * - template_id: 模板ID
 * - scene: 场景
 * - data: 模板数据
 */
const { response } = require('../../common');
const business = require('../../business-logic');
const { insert } = require('../../common/db');

module.exports = async (event, context) => {
  const { admin } = context;
  const { user_ids, title, content, type, template_id, scene, data } = event;

  try {
    // 参数验证
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return response.paramError('缺少必要参数: user_ids（数组）');
    }

    console.log(`[admin:sendNotification] 管理员 ${admin.id} 发送通知给 ${user_ids.length} 个用户`);

    let results = [];

    // 方式1：简单通知（记录到数据库）
    if (title && content) {
      // 批量创建通知记录
      for (const user_id of user_ids) {
        try {
          const [log] = await insert('notification_logs', {
            user_id,
            type: type || 'system',
            title,
            content,
            status: 1, // 1-已发送
            send_time: new Date().toISOString().slice(0, 19).replace('T', ' ')
          });
          results.push({ user_id, success: true, id: log.id });
        } catch (error) {
          console.error(`[admin:sendNotification] 用户 ${user_id} 通知失败:`, error);
          results.push({ user_id, success: false, error: error.message });
        }
      }
    }
    // 方式2：模板消息
    else if (template_id && scene && data) {
      results = await business.batchSendSubscribeMessage({
        user_ids,
        template_id,
        scene,
        data
      });
    } else {
      return response.paramError('缺少必要参数: (title, content) 或 (template_id, scene, data)');
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return response.success({
      success: true,
      total: results.length,
      success_count: successCount,
      fail_count: failCount,
      details: results
    }, `发送完成：成功 ${successCount}，失败 ${failCount}`);

  } catch (error) {
    console.error('[admin:sendNotification] 失败:', error);
    return response.error('发送通知失败', error);
  }
};
