/**
 * 删除签到二维码（管理端接口）
 *
 * 硬删除指定的签到二维码记录。
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { id } = event;

  try {
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const qrcodeId = parseInt(id);

    // 确认记录存在
    const { data: existing, error: findError } = await db
      .from('checkin_qrcodes')
      .select('id')
      .eq('id', qrcodeId)
      .single();

    if (findError && !findError.message?.includes('0 rows')) {
      throw findError;
    }

    if (!existing) {
      return response.notFound('签到码不存在');
    }

    const { error: deleteError } = await db
      .from('checkin_qrcodes')
      .delete()
      .eq('id', qrcodeId);

    if (deleteError) throw deleteError;

    console.log(`[Course/deleteCheckinQRCode] 删除成功: id=${qrcodeId}`);

    return response.success({ id: qrcodeId }, '签到码删除成功');

  } catch (error) {
    console.error('[Course/deleteCheckinQRCode] 删除失败:', error);
    return response.error('删除签到码失败', error);
  }
};
