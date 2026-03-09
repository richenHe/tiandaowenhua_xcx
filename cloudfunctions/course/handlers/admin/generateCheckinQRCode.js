/**
 * 生成签到二维码（管理端接口）
 *
 * 每个排期只保留一条 checkin_qrcodes 记录，重新生成时覆盖旧记录。
 * scene 格式：ci={class_record_id}，落地页：pages/course/checkin/index
 */
const { db } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');
const { validateRequired, formatDateTime } = require('../../common/utils');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { classRecordId } = event;
  const { admin } = context;

  try {
    const validation = validateRequired({ classRecordId }, ['classRecordId']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const recordId = parseInt(classRecordId);

    const { data: classRecord, error: findError } = await db
      .from('class_records')
      .select('id, course_name, class_date, status')
      .eq('id', recordId)
      .single();

    if (findError && !findError.message?.includes('0 rows')) throw findError;
    if (!classRecord) return response.notFound('排期不存在');
    if (classRecord.status === 0) return response.error('该排期已取消，无法生成签到码');

    // 生成小程序码并上传云存储
    const qrResult = await business.generateCheckinQRCode({ classRecordId: recordId });

    // 查询是否已有该排期的签到码记录
    const { data: existing } = await db
      .from('checkin_qrcodes')
      .select('id, qrcode_url')
      .eq('class_record_id', recordId)
      .limit(1);

    const now = formatDateTime(new Date());

    if (existing && existing.length > 0) {
      // 覆盖：更新现有记录
      await db.from('checkin_qrcodes')
        .update({
          qrcode_url: qrResult.fileID,
          scene: qrResult.scene,
          course_name: classRecord.course_name || '',
          class_date: classRecord.class_date,
          status: 1,
          created_by: admin?.id || null,
          created_at: now
        })
        .eq('id', existing[0].id);

      console.log(`[generateCheckinQRCode] 覆盖生成: class_record_id=${recordId}`);
    } else {
      // 新增
      await db.from('checkin_qrcodes').insert({
        class_record_id: recordId,
        course_name: classRecord.course_name || '',
        class_date: classRecord.class_date,
        qrcode_url: qrResult.fileID,
        scene: qrResult.scene,
        _openid: '',
        status: 1,
        created_by: admin?.id || null,
        created_at: now
      });

      console.log(`[generateCheckinQRCode] 新增生成: class_record_id=${recordId}`);
    }

    return response.success({
      qrcode_url: cloudFileIDToURL(qrResult.fileID),
      file_id: qrResult.fileID,
      scene: qrResult.scene,
      class_record_id: recordId,
      course_name: classRecord.course_name,
      class_date: classRecord.class_date
    }, '签到码生成成功');

  } catch (error) {
    console.error('[generateCheckinQRCode] 生成失败:', error);
    return response.error('生成签到码失败', error);
  }
};
