/**
 * 客户端接口：获取我的协议列表
 * Action: getMyContracts
 * 含 contract_file_url 供小程序「查看电子版合同」下载
 */
const { query } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');

/** 等级名称映射 */
const LEVEL_NAMES = { 1: '准青鸾', 2: '青鸾', 3: '鸿鹄', 4: '金凤' };

module.exports = async (event, context) => {
  const { OPENID, user } = context;

  try {
    console.log(`[getMyContracts] 查询协议列表:`, user.id);

    const { db } = require('../../common/db');

    // 只返回已生效的协议（status=1有效/2已过期/3已续签/4已作废），
    // 待审核(status=5)和已驳回(status=6)不展示在列表中
    const { data: signatures, error } = await db
      .from('contract_signatures')
      .select(`
        *,
        template:contract_templates!fk_contract_signatures_template(id, contract_name, ambassador_level, version, contract_file_id)
      `)
      .eq('user_id', user.id)
      .in('status', [1, 2, 3, 4])
      .order('id', { ascending: false });

    if (error) throw error;

    // 格式化返回数据（字段名适配前端）
    const contracts = (signatures || []).map(sig => {
      const fileId = sig.contract_file_id || sig.template?.contract_file_id || null;
      const contractFileUrl = fileId ? cloudFileIDToURL(fileId) : null;

      // 解析线下合同照片
      let contractImages = [];
      try {
        const raw = sig.contract_images;
        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          contractImages = (Array.isArray(parsed) ? parsed : []).map(id => cloudFileIDToURL(id));
        }
      } catch (e) { /* 解析失败忽略 */ }

      return {
        id: sig.id,
        template_id: sig.contract_template_id,
        contract_no: `CT${String(sig.id).padStart(6, '0')}`,
        title: sig.template?.contract_name || sig.contract_name || '未知协议',
        level: sig.ambassador_level,
        level_name: LEVEL_NAMES[sig.ambassador_level] || '未知等级',
        version: sig.contract_version,
        signed_at: sig.sign_time,
        effective_date: sig.contract_start,
        expiry_date: sig.contract_end,
        status: sig.status,
        status_text: Number(sig.status) === 1 ? '有效'
          : Number(sig.status) === 2 ? '已过期'
          : Number(sig.status) === 3 ? '已续签'
          : Number(sig.status) === 4 ? '已作废'
          : '未知',
        sign_type: sig.sign_type || 1,
        contract_file_url: contractFileUrl,
        contract_images: contractImages
      };
    });

    console.log(`[getMyContracts] 查询成功，共 ${contracts.length} 条协议`);

    // 返回数组，与前端 Contract[] 类型一致
    return response.success(contracts);

  } catch (error) {
    console.error(`[getMyContracts] 失败:`, error);
    return response.error('查询协议列表失败', error);
  }
};
