/**
 * 更新课程（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：courses
 * type 字段为整数：1=初探班, 2=密训班, 3=咨询服务, 4=沙龙
 * type=4（沙龙）时：跳过有效期校验和上架合同检查
 *
 * @param {Object} event
 * @param {number}  event.id            - 课程 ID（必填）
 * @param {string}  event.name          - 课程名称
 * @param {string}  event.nickname      - 课程昵称，对应 DB 字段 nickname
 * @param {number}  event.type          - 课程类型（整数 1/2/3）
 * @param {string}  event.coverImage    - 封面图URL，对应 DB 字段 cover_image
 * @param {number}  event.currentPrice  - 现价，对应 DB 字段 current_price
 * @param {number}  event.originalPrice - 原价，对应 DB 字段 original_price
 * @param {number}  event.retrainPrice  - 重训价，对应 DB 字段 retrain_price
 * @param {number}  event.allowRetrain  - 是否允许重训，对应 DB 字段 allow_retrain
 * @param {number} event.validityDays - 课程有效期（天），必填正整数，对应 DB 字段 validity_days
 * @param {string}  event.duration      - 课程时长
 * @param {string}  event.description   - 简介
 * @param {string}  event.content       - 详情
 * @param {string}  event.outline       - 大纲
 * @param {string}  event.teacher       - 讲师
 * @param {number}  event.sortOrder     - 排序，对应 DB 字段 sort_order
 * @param {number}  event.status        - 状态
 * @param {number}  event.includedCourseIds - 赠送课程ID（密训班用，单个ID），对应 DB 字段 included_course_ids JSON
 * @param {number}  event.needContract  - 是否需要签订合同：0不需要/1需要，对应 DB 字段 need_contract
 */
const { db, findOne, update } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  // 接收 camelCase 参数（id 用于定位记录）
  const {
    id,
    name,
    nickname,
    type,
    coverImage,
    currentPrice,
    originalPrice,
    retrainPrice,
    allowRetrain,
    validityDays,
    duration,
    description,
    content,
    outline,
    teacher,
    sortOrder,
    status,
    includedCourseIds,
    needContract
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

    // 上架锁定：已上架课程只允许下架操作（修改 status），其他字段禁止修改
    if (course.status === 1) {
      const editFields = ['name', 'nickname', 'type', 'coverImage', 'currentPrice', 'originalPrice',
        'retrainPrice', 'allowRetrain', 'validityDays', 'duration', 'description', 'content',
        'outline', 'teacher', 'sortOrder', 'includedCourseIds', 'needContract'];
      const hasEditField = editFields.some(k => event[k] !== undefined);
      if (hasEditField) {
        return response.error('课程已上架，不可修改任何字段。如需修改请先下架课程。');
      }
      if (status === undefined) {
        return response.paramError('课程已上架，仅允许下架操作');
      }
    }

    // 转换 camelCase → snake_case，构建 DB 更新字段
    // 只添加实际传入的字段（undefined 表示未传，跳过）
    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (nickname !== undefined) fieldsToUpdate.nickname = nickname;
    if (type !== undefined) fieldsToUpdate.type = type;
    if (coverImage !== undefined) fieldsToUpdate.cover_image = coverImage;
    if (currentPrice !== undefined) fieldsToUpdate.current_price = currentPrice;
    if (originalPrice !== undefined) fieldsToUpdate.original_price = originalPrice;
    if (retrainPrice !== undefined) fieldsToUpdate.retrain_price = retrainPrice;
    if (allowRetrain !== undefined) fieldsToUpdate.allow_retrain = allowRetrain ? 1 : 0;
    // 沙龙课程(type=4)跳过有效期校验，其余类型必须为正整数
    const effectiveType = type !== undefined ? parseInt(type) : course.type;
    const isSalon = effectiveType === 4;
    if (validityDays !== undefined && !isSalon) {
      const vd = parseInt(validityDays);
      if (!vd || vd <= 0) {
        return response.paramError('课程有效期为必填项，请输入大于 0 的天数');
      }
      fieldsToUpdate.validity_days = vd;
    }
    if (duration !== undefined) fieldsToUpdate.duration = duration;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (content !== undefined) fieldsToUpdate.content = content;
    if (outline !== undefined) fieldsToUpdate.outline = outline;
    if (teacher !== undefined) fieldsToUpdate.teacher = teacher;
    if (sortOrder !== undefined) fieldsToUpdate.sort_order = sortOrder;
    // 密训班赠送课程：将单个 ID 转为 JSON 数组；传 null 表示清除；目标须为未删除的初探班
    if (includedCourseIds !== undefined) {
      const effectiveTypeForGift = type !== undefined ? parseInt(type, 10) : parseInt(course.type, 10);
      if (effectiveTypeForGift === 2) {
        if (!includedCourseIds) {
          fieldsToUpdate.included_course_ids = null;
        } else {
          const rawGiftId = Array.isArray(includedCourseIds) ? includedCourseIds[0] : includedCourseIds;
          const gid = parseInt(rawGiftId, 10);
          if (!gid) {
            fieldsToUpdate.included_course_ids = null;
          } else {
            const giftCourse = await findOne('courses', { id: gid });
            if (!giftCourse || Number(giftCourse.is_deleted) === 1) {
              return response.error('赠送课程不存在或已删除');
            }
            if (parseInt(giftCourse.type, 10) !== 1) {
              return response.error('赠送课程只能选择初探班类型的课程');
            }
            if (gid === parseInt(id, 10)) {
              return response.error('不能将赠送课程设置为本密训班自身');
            }
            fieldsToUpdate.included_course_ids = JSON.stringify([gid]);
          }
        }
      } else {
        fieldsToUpdate.included_course_ids = null;
      }
    }
    if (needContract !== undefined) fieldsToUpdate.need_contract = isSalon ? 0 : (parseInt(needContract) === 0 ? 0 : 1);
    if (status !== undefined) fieldsToUpdate.status = status;

    // 上架前检查是否已配置学习服务协议模板（沙龙课程和不需要合同的课程跳过检查）
    // need_contract 优先取本次提交值，否则取数据库已有值
    const effectiveNeedContract = needContract !== undefined ? parseInt(needContract) : course.need_contract;
    if (status === 1 && course.status !== 1 && !isSalon && effectiveNeedContract === 1) {
      const { data: templates } = await db
        .from('contract_templates')
        .select('id')
        .eq('course_id', id)
        .eq('contract_type', 4)
        .eq('status', 1)
        .is('deleted_at', null)
        .limit(1);

      if (!templates || templates.length === 0) {
        return response.error('课程上架前必须配置学习服务协议模板，请先在课程列表点击"合同"按钮上传协议文件');
      }
    }

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
