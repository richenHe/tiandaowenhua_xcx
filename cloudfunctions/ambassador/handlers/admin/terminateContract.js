/**
 * 管理端接口：终止合约
 * Action: terminateContract
 *
 * 参数：
 * - signatureId: 合约签署ID（必填）
 * - reason: 终止原因（可选）
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { signatureId, reason = '' } = event;

  try {
    if (!signatureId) {
      return response.paramError('缺少必要参数: signatureId');
    }

    console.log(`[admin:terminateContract] 管理员 ${admin.id} 终止合约 ${signatureId}`);

    const { data: sig, error: fetchErr } = await db.from('contract_signatures')
      .select('id, status').eq('id', signatureId).single();
    if (fetchErr || !sig) return response.error('合约不存在');

    if (sig.status === 4) return response.error('合约已作废');

    await db.from('contract_signatures').update({ status: 4 }).eq('id', signatureId);

    return response.success({}, '合约已终止');

  } catch (error) {
    console.error('[admin:terminateContract] 失败:', error);
    return response.error('终止合约失败', error);
  }
};
