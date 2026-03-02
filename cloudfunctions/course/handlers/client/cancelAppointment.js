/**
 * 取消预约（客户端接口）
 * 已废弃：复训费支付后不可取消，统一禁止取消预约
 */
const { response } = require('../../common');

module.exports = async (event, context) => {
  return response.error('当前不支持取消预约');
};
