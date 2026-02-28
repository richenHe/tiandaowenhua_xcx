/**
 * 生成签到二维码（管理端接口）
 *
 * 为指定排期生成小程序签到码，上传云存储并存入 checkin_qrcodes 表。
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

    // 查询排期信息
    const { data: classRecord, error: findError } = await db
      .from('class_records')
      .select('id, course_name, class_date, status')
      .eq('id', recordId)
      .single();

    if (findError && !findError.message?.includes('0 rows')) {
      throw findError;
    }

    if (!classRecord) {
      return response.notFound('排期不存在');
    }

    if (classRecord.status === 0) {
      return response.error('该排期已取消，无法生成签到码');
    }

    // 调用 business-logic 生成小程序码并上传云存储
    const qrResult = await business.generateCheckinQRCode({
      classRecordId: recordId
    });

    // 存入 checkin_qrcodes 表
    const { error: insertError } = await db
      .from('checkin_qrcodes')
      .insert({
        class_record_id: recordId,
        course_name: classRecord.course_name || '',
        class_date: classRecord.class_date,
        qrcode_url: qrResult.fileID,
        scene: qrResult.scene,
        status: 1,
        created_by: admin?.id || null,
        created_at: formatDateTime(new Date())
      });

    if (insertError) throw insertError;

    console.log(`[Course/generateCheckinQRCode] 生成成功: class_record_id=${recordId}, fileID=${qrResult.fileID}`);

    return response.success({
      qrcode_url: cloudFileIDToURL(qrResult.fileID),
      file_id: qrResult.fileID,
      scene: qrResult.scene,
      class_record_id: recordId,
      course_name: classRecord.course_name,
      class_date: classRecord.class_date
    }, '签到码生成成功');

  } catch (error) {
    console.error('[Course/generateCheckinQRCode] 生成失败:', error);
    return response.error('生成签到码失败', error);
  }
};
