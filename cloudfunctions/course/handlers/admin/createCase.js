/**
 * 创建案例（管理端接口）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const {
    title,
    category,
    cover_image,
    summary,
    content,
    author,
    sort_order,
    status
  } = event;

  try {
    // 参数验证
    const validation = validateRequired({ title, content }, ['title', 'content']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 创建案例
    const caseId = await insert('academy_cases', {
      title,
      category,
      cover_image,
      summary,
      content,
      author,
      view_count: 0,
      sort_order: sort_order || 0,
      status: status !== undefined ? status : 1
    });

    return response.success({
      message: '案例创建成功',
      case_id: caseId
    });

  } catch (error) {
    console.error('[Course/createCase] 创建失败:', error);
    return response.error('创建案例失败', error);
  }
};
