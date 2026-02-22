/**
 * 创建课程（管理端接口）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const {
    name,
    type,
    cover_image,
    description,
    content,
    outline,
    teacher,
    duration,
    current_price,
    original_price,
    retrain_price,
    allow_retrain,
    sort_order,
    status
  } = event;

  try {
    // 参数验证
    const validation = validateRequired(
      { name, type, current_price },
      ['name', 'type', 'current_price']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 创建课程
    const [result] = await insert('courses', {
      name,
      type,
      cover_image,
      description,
      content,
      outline,
      teacher,
      duration,
      current_price,
      original_price: original_price || current_price,
      retrain_price: retrain_price || 0,
      allow_retrain: allow_retrain ? 1 : 0,
      sort_order: sort_order || 0,
      status: status !== undefined ? status : 1
    });

    return response.success({
      course_id: result.id
    }, '课程创建成功');

  } catch (error) {
    console.error('[Course/createCourse] 创建失败:', error);
    return response.error('创建课程失败', error);
  }
};
