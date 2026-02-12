/**
 * 管理端接口：创建通知配置
 * Action: createNotificationConfig
 *
 * 参数：
 * - name: 唯一标识名称（用于系统调用）
 * - config_name: 配置显示名称
 * - config_code: 配置代码
 * - course_id: 关联课程ID（可选）
 * - trigger_type: 触发类型（1-立即，2-延时）
 * - trigger_time_offset: 触发时间偏移（秒）
 * - template_id: 小程序模板ID（可选）
 * - template_name: 模板名称（可选）
 * - title: 通知标题（可选）
 * - content_template: 内容模板（可选）
 * - page_path: 跳转页面路径（可选）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { 
    name, 
    config_name, 
    config_code, 
    course_id = null,
    trigger_type, 
    trigger_time_offset = 0,
    template_id = null,
    template_name = null,
    title = null,
    content_template = null,
    page_path = null
  } = event;

  try {
    // 参数验证
    if (!name || !config_name || !config_code || !trigger_type) {
      return response.paramError('缺少必要参数: name, config_name, config_code, trigger_type');
    }

    console.log(`[admin:createNotificationConfig] 管理员 ${admin.id} 创建通知配置`);

    // 创建配置
    const [config] = await insert('notification_configs', {
      name,
      config_name,
      config_code,
      course_id,
      trigger_type,
      trigger_time_offset,
      template_id,
      template_name,
      title,
      content_template,
      page_path,
      status: 1
      // created_at 使用数据库默认值
    });

    return response.success({ id: config.id }, '创建成功');

  } catch (error) {
    console.error('[admin:createNotificationConfig] 失败:', error);
    return response.error('创建通知配置失败', error);
  }
};
