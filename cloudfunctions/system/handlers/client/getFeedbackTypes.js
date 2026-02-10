/**
 * 客户端接口：获取反馈类型列表
 * Action: getFeedbackTypes
 *
 * 功能：返回系统支持的反馈类型
 */
const { response } = require('../../common');

module.exports = async (event, context) => {
  try {
    console.log('[getFeedbackTypes] 获取反馈类型');

    // 反馈类型配置
    const feedbackTypes = [
      { value: 1, label: '课程内容', icon: 'book' },
      { value: 2, label: '功能建议', icon: 'bulb' },
      { value: 3, label: '系统问题', icon: 'error-circle' },
      { value: 4, label: '服务态度', icon: 'service' },
      { value: 5, label: '其他反馈', icon: 'chat' }
    ];

    return response.success(feedbackTypes, '获取成功');

  } catch (error) {
    console.error('[getFeedbackTypes] 失败:', error);
    return response.error('获取反馈类型失败', error);
  }
};
