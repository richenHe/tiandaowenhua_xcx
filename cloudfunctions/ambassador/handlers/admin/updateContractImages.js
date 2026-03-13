/**
 * 管理端接口：补充/更新合约照片
 * Action: updateContractImages
 *
 * 参数：
 * - signatureId: 合约签署记录ID（必填）
 * - contractImages: 合同照片 fileID 数组（必填，≥1张）
 *
 * 用途：管理员在合约详情中补充线下合同照片
 */
const { db } = require('../../common/db');
const { response } = require('../../common');

module.exports = async (event, context) => {
  const { admin } = context;
  const { signatureId, contractImages } = event;

  try {
    if (!signatureId) {
      return response.paramError('缺少必要参数: signatureId');
    }
    if (!Array.isArray(contractImages) || contractImages.length === 0) {
      return response.paramError('请至少上传一张合同照片');
    }

    console.log(`[updateContractImages] 管理员 ${admin.id} 更新合约 ${signatureId} 的照片, 共 ${contractImages.length} 张`);

    // 验证合约存在
    const { data: signature, error: findErr } = await db
      .from('contract_signatures')
      .select('id, status')
      .eq('id', signatureId)
      .single();

    if (findErr || !signature) {
      return response.error('合约记录不存在');
    }

    // 更新 contract_images 字段（updated_at 由 MySQL ON UPDATE 自动维护）
    const { error: updateErr } = await db
      .from('contract_signatures')
      .update({ contract_images: JSON.stringify(contractImages) })
      .eq('id', signatureId);

    if (updateErr) throw updateErr;

    console.log(`[updateContractImages] 合约 ${signatureId} 照片更新成功`);
    return response.success({ updated: true });

  } catch (error) {
    console.error(`[updateContractImages] 失败:`, error);
    return response.error('更新合约照片失败', error);
  }
};
