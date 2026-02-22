/**
 * 创建课程（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：courses
 * type 字段为整数：1=初探班, 2=密训班, 3=咨询服务
 *
 * @param {Object} event
 * @param {string}  event.name          - 课程名称（必填）
 * @param {number}  event.type          - 课程类型（必填，整数 1/2/3）
 * @param {number}  event.currentPrice  - 现价（必填），对应 DB 字段 current_price
 * @param {string}  event.coverImage    - 封面图URL，对应 DB 字段 cover_image
 * @param {number}  event.originalPrice - 原价，对应 DB 字段 original_price
 * @param {number}  event.retrainPrice  - 重训价，对应 DB 字段 retrain_price
 * @param {number}  event.allowRetrain  - 是否允许重训，对应 DB 字段 allow_retrain
 * @param {string}  event.duration      - 课程时长
 * @param {string}  event.description   - 简介
 * @param {string}  event.content       - 详情
 * @param {string}  event.outline       - 大纲
 * @param {string}  event.teacher       - 讲师
 * @param {number}  event.sortOrder     - 排序，对应 DB 字段 sort_order
 * @param {number}  event.status        - 状态（默认 1）
 */
const { insert } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  // 接收 camelCase 参数
  const {
    name,
    type,
    coverImage,
    currentPrice,
    originalPrice,
    retrainPrice,
    allowRetrain,
    duration,
    description,
    content,
    outline,
    teacher,
    sortOrder,
    status
  } = event;

  try {
    // 参数验证（camelCase key）
    const validation = validateRequired(
      { name, type, currentPrice },
      ['name', 'type', 'currentPrice']
    );
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // camelCase → snake_case，写入 DB
    const [result] = await insert('courses', {
      name,
      type,
      cover_image: coverImage || null,
      description: description || null,
      content: content || null,
      outline: outline || null,
      teacher: teacher || null,
      duration: duration || null,
      current_price: currentPrice,
      original_price: originalPrice || currentPrice,
      retrain_price: retrainPrice || 0,
      allow_retrain: allowRetrain ? 1 : 0,
      sort_order: sortOrder || 0,
      status: status !== undefined ? status : 1
    });

    return response.success({
      courseId: result.id,
      message: '课程创建成功'
    });

  } catch (error) {
    console.error('[Course/createCourse] 创建失败:', error);
    return response.error('创建课程失败', error);
  }
};
