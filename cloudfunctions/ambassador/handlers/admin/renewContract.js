/**
 * 管理端接口：续签合约
 * Action: renewContract
 *
 * 参数：
 * - signatureId: 原合约签署ID（必填）
 * - contractEnd: 新的到期时间（必填，ISO 日期字符串）
 */
const { db, response, formatDateTime } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { signatureId, contractEnd } = event;

  try {
    if (!signatureId || !contractEnd) {
      return response.paramError('缺少必要参数: signatureId, contractEnd');
    }

    console.log(`[admin:renewContract] 管理员 ${admin.id} 续签合约 ${signatureId}`);

    // 查询原合约
    const { data: sig, error: fetchErr } = await db.from('contract_signatures')
      .select('*').eq('id', signatureId).single();
    if (fetchErr || !sig) return response.error('合约不存在');

    if (sig.status === 4) return response.error('已作废合约无法续签');

    // 将原合约状态置为已续签(3)
    await db.from('contract_signatures').update({ status: 3 }).eq('id', signatureId);

    // 创建新的续签合约（继承原合约的电子合同文件快照）
    const now = formatDateTime(new Date());
    const dateOnly = (s) => (s && typeof s === 'string' ? s.slice(0, 10) : null);
    const { data: newSig, error: insertErr } = await db.from('contract_signatures').insert({
      user_id: sig.user_id,
      contract_template_id: sig.contract_template_id,
      ambassador_level: sig.ambassador_level,
      contract_name: sig.contract_name,
      contract_version: sig.contract_version,
      contract_file_id: sig.contract_file_id || null,
      sign_time: now,
      contract_start: dateOnly(sig.contract_end) || now.slice(0, 10),
      contract_end: dateOnly(contractEnd) || contractEnd,
      status: 1,
      sign_type: 2,
      admin_id: admin?.id || null,
      _openid: sig._openid || ''
    }).select().single();

    if (insertErr) throw insertErr;

    return response.success({ id: newSig.id }, '续签成功');

  } catch (error) {
    console.error('[admin:renewContract] 失败:', error);
    return response.error('续签合约失败', error);
  }
};
