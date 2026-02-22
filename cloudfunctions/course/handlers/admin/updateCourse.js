/**
 * 更新课程（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：courses
 * type 字段为整数：1=初探班, 2=密训班, 3=咨询服务
 *
 * @param {Object} event
 * @param {number}  event.id            - 课程 ID（必填）
 * @param {string}  event.name          - 课程名称
 * @param {number}  event.type          - 课程类型（整数 1/2/3）
 * @param {string}  event.coverImage    - 封面图URL，对应 DB 字段 cover_image
 * @param {number}  event.currentPrice  - 现价，对应 DB 字段 current_price
 * @param {number}  event.originalPrice - 原价，对应 DB 字段 original_price
 * @param {number}  event.retrainPrice  - 重训价，对应 DB 字段 retrain_price
 * @param {number}  event.allowRetrain  - 是否允许重训，对应 DB 字段 allow_retrain
 * @param {string}  event.duration      - 课程时长
 * @param {string}  event.description   - 简介
 * @param {string}  event.content       - 详情
 * @param {string}  event.outline       - 大纲
 * @param {string}  event.teacher       - 讲师
 * @param {number}  event.sortOrder     - 排序，对应 DB 字段 sort_order
 * @param {number}  event.status        - 状态
 */
const { findOne, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  // 接收 camelCase 参数（id 用于定位记录）
  const {
    id,
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
    // 参数验证
    const validation = validateRequired({ id }, ['id']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 查询课程是否存在
    const course = await findOne('courses', { id });
    if (!course) {
      return response.notFound('课程不存在');
    }

    // 转换 camelCase → snake_case，构建 DB 更新字段
    // 只添加实际传入的字段（undefined 表示未传，跳过）
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (type !== undefined) fieldsToUpdate.type = type;
    if (coverImage !== undefined) fieldsToUpdate.cover_image = coverImage;
    if (currentPrice !== undefined) fieldsToUpdate.current_price = currentPrice;
    if (originalPrice !== undefined) fieldsToUpdate.original_price = originalPrice;
    if (retrainPrice !== undefined) fieldsToUpdate.retrain_price = retrainPrice;
    if (allowRetrain !== undefined) fieldsToUpdate.allow_retrain = allowRetrain ? 1 : 0;
    if (duration !== undefined) fieldsToUpdate.duration = duration;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (content !== undefined) fieldsToUpdate.content = content;
    if (outline !== undefined) fieldsToUpdate.outline = outline;
    if (teacher !== undefined) fieldsToUpdate.teacher = teacher;
    if (sortOrder !== undefined) fieldsToUpdate.sort_order = sortOrder;
    if (status !== undefined) fieldsToUpdate.status = status;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return response.paramError('没有需要更新的字段');
    }

    // 更新课程（fieldsToUpdate 仅含 DB 真实存在的列）
    await update('courses', fieldsToUpdate, { id });

    return response.success({
      success: true,
      message: '课程更新成功'
    });

  } catch (error) {
    console.error('[Course/updateCourse] 更新失败:', error);
    return response.error('更新课程失败', error);
  }
};
