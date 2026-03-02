/**
 * 获取案例详情（公开接口）
 *
 * 返回完整案例信息，并自增浏览次数
 * 云存储字段（student_avatar/video_url/images）转为 CDN URL
 */
const { db, response, cloudFileIDToURL } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { id } = event;

  try {
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    const { data: caseDetail, error } = await db
      .from('academy_cases')
      .select('*')
      .eq('id', id)
      .eq('status', 1)
      .single();

    if (error && !error.message?.includes('0 rows')) {
      throw error;
    }

    if (!caseDetail) {
      return response.notFound('案例不存在或已下架');
    }

    // 自增浏览次数
    await db
      .from('academy_cases')
      .update({ view_count: (caseDetail.view_count || 0) + 1 })
      .eq('id', id);
    caseDetail.view_count = (caseDetail.view_count || 0) + 1;

    // 云存储 fileID → CDN URL
    if (caseDetail.student_avatar) {
      caseDetail.student_avatar = cloudFileIDToURL(caseDetail.student_avatar);
    }
    if (caseDetail.video_url) {
      caseDetail.video_url = cloudFileIDToURL(caseDetail.video_url);
    }

    // 解析 images JSON 并转换 URL
    try {
      if (caseDetail.images && typeof caseDetail.images === 'string') {
        caseDetail.images = JSON.parse(caseDetail.images);
      }
    } catch (e) { caseDetail.images = []; }
    if (Array.isArray(caseDetail.images)) {
      caseDetail.images = caseDetail.images.map(img => cloudFileIDToURL(img));
    }

    // 解析 achievements JSON
    try {
      if (caseDetail.achievements && typeof caseDetail.achievements === 'string') {
        caseDetail.achievements = JSON.parse(caseDetail.achievements);
      }
    } catch (e) { caseDetail.achievements = []; }

    // 派生封面图
    caseDetail.cover_image = (Array.isArray(caseDetail.images) && caseDetail.images.length > 0)
      ? caseDetail.images[0]
      : (caseDetail.student_avatar || null);

    return response.success(caseDetail);

  } catch (error) {
    console.error('[Course/getCaseDetail] 查询失败:', error);
    return response.error('查询案例详情失败', error);
  }
};
