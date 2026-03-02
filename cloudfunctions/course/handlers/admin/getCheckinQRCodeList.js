/**
 * 获取签到二维码列表（管理端接口）
 *
 * 支持按 classRecordId 过滤，返回分页列表。
 */
const { db } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');
const { executePaginatedQuery } = require('../../common');

module.exports = async (event, context) => {
  const { classRecordId, page = 1, pageSize = 20 } = event;

  try {
    let query = db
      .from('checkin_qrcodes')
      .select('*', { count: 'exact' })
      .order('id', { ascending: true });

    if (classRecordId) {
      query = query.eq('class_record_id', parseInt(classRecordId));
    }

    const result = await executePaginatedQuery(query, page, pageSize);

    const list = (result.list || []).map(item => ({
      ...item,
      qrcode_url: cloudFileIDToURL(item.qrcode_url || '')
    }));

    return response.success({ ...result, list });

  } catch (error) {
    console.error('[Course/getCheckinQRCodeList] 查询失败:', error);
    return response.error('查询签到码列表失败', error);
  }
};
