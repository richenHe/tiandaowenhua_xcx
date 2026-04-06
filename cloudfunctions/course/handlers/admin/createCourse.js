/**
 * 创建课程（管理端接口）
 *
 * 接收 camelCase 参数（前端规范），内部转换为 snake_case 存入数据库
 *
 * DB 表：courses
 * type 字段为整数：1=初探班, 2=密训班, 3=咨询服务, 4=沙龙
 * type=4（沙龙）时：免费课程，跳过价格/有效期校验，写入 price=0, validity_days=NULL
 *
 * @param {Object} event
 * @param {string}  event.name          - 课程名称（必填）
 * @param {string}  event.nickname      - 课程昵称，对应 DB 字段 nickname
 * @param {number}  event.type          - 课程类型（必填，整数 1/2/3）
 * @param {number}  event.currentPrice  - 现价（必填），对应 DB 字段 current_price
 * @param {string}  event.coverImage    - 封面图URL，对应 DB 字段 cover_image
 * @param {number}  event.originalPrice - 原价，对应 DB 字段 original_price
 * @param {number}  event.allowRetrain  - 是否允许重训，对应 DB 字段 allow_retrain
 * @param {number} event.validityDays - 课程有效期（天），必填正整数，对应 DB 字段 validity_days
 * @param {string}  event.duration      - 课程时长
 * @param {string}  event.description   - 简介
 * @param {string}  event.content       - 详情
 * @param {string}  event.outline       - 大纲
 * @param {string}  event.teacher       - 讲师
 * @param {number}  event.sortOrder     - 排序，对应 DB 字段 sort_order
 * @param {number}  event.status        - 状态（新课程强制为 0=下架）
 * @param {number}  event.includedCourseIds - 赠送课程ID（密训班用，单个ID），对应 DB 字段 included_course_ids JSON
 * @param {number}  event.needContract  - 是否需要签订合同：0不需要/1需要，对应 DB 字段 need_contract
 */
const { insert, findOne } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');
const {
  sanitizeBlocksInput,
  serializeBlocksForDb,
  blocksToDescriptionPlain,
  blocksToOutlineLegacyJson,
  legacyOutlineToBlocks,
} = require('../../common/courseRichBlocks');

module.exports = async (event, context) => {
  // 接收 camelCase 参数，同时兼容 snake_case（防止旧客户端传参）
  const name = event.name;
  const nickname = event.nickname;
  const type = event.type;
  const coverImage = event.coverImage || event.cover_image;
  const currentPrice = event.currentPrice || event.current_price;
  const originalPrice = event.originalPrice || event.original_price;
  const allowRetrain = event.allowRetrain !== undefined ? event.allowRetrain : event.allow_retrain;
  const validityDays = event.validityDays !== undefined ? event.validityDays : event.validity_days;
  const duration = event.duration;
  const description = event.description;
  const content = event.content;
  const outline = event.outline;
  const descriptionBlocksRaw = event.descriptionBlocks !== undefined ? event.descriptionBlocks : event.description_blocks;
  const outlineBlocksRaw = event.outlineBlocks !== undefined ? event.outlineBlocks : event.outline_blocks;
  const teacher = event.teacher;
  const sortOrder = event.sortOrder || event.sort_order;
  const includedCourseIds = event.includedCourseIds || event.included_course_ids;
  const needContract = event.needContract !== undefined ? event.needContract : event.need_contract;

  try {
    const isSalon = parseInt(type) === 4;

    // 参数验证：沙龙课程无需价格，其余类型 currentPrice 必填
    const requiredFields = isSalon ? ['name', 'type'] : ['name', 'type', 'currentPrice'];
    const requiredObj = isSalon ? { name, type } : { name, type, currentPrice };
    const validation = validateRequired(requiredObj, requiredFields);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    // 非沙龙课程：有效期必填且为正整数；沙龙课程：默认365天（上完课硬删除，有效期无实际影响）
    let validityDaysParsed = isSalon ? 365 : null;
    if (!isSalon) {
      validityDaysParsed = validityDays != null ? parseInt(validityDays) : null;
      if (!validityDaysParsed || validityDaysParsed <= 0) {
        return response.paramError('课程有效期为必填项，请输入大于 0 的天数');
      }
    }

    // 密训班赠送课程：仅允许绑定未删除的初探班（type=1）
    let includedCourseIdsJson = null;
    if (parseInt(type) === 2 && includedCourseIds) {
      const rawGiftId = Array.isArray(includedCourseIds) ? includedCourseIds[0] : includedCourseIds;
      const gid = parseInt(rawGiftId, 10);
      if (gid) {
        const giftCourse = await findOne('courses', { id: gid });
        if (!giftCourse || Number(giftCourse.is_deleted) === 1) {
          return response.error('赠送课程不存在或已删除');
        }
        if (parseInt(giftCourse.type, 10) !== 1) {
          return response.error('赠送课程只能选择初探班类型的课程');
        }
        includedCourseIdsJson = JSON.stringify([gid]);
      }
    }

    // 图文块：优先 descriptionBlocks / outlineBlocks；兼容仅传 description、outline 的旧客户端
    let descBlocks = sanitizeBlocksInput(descriptionBlocksRaw);
    if (descBlocks.length === 0 && description) {
      descBlocks = [{ type: 'text', text: String(description) }];
    }
    let outBlocks = sanitizeBlocksInput(outlineBlocksRaw);
    if (outBlocks.length === 0 && outline) {
      outBlocks = legacyOutlineToBlocks(outline);
    }
    const outlineLegacy = blocksToOutlineLegacyJson(outBlocks);
    const descPlain = blocksToDescriptionPlain(descBlocks, 500);

    // camelCase → snake_case，写入 DB（新课程强制 status=0 下架）
    const [result] = await insert('courses', {
      name,
      nickname: nickname || null,
      type,
      cover_image: coverImage || null,
      description: descPlain,
      description_blocks: serializeBlocksForDb(descBlocks),
      content: content || null,
      outline: outlineLegacy === '[]' ? null : outlineLegacy,
      outline_blocks: serializeBlocksForDb(outBlocks),
      teacher: teacher || null,
      duration: isSalon ? null : (duration || null),
      current_price: isSalon ? 0 : currentPrice,
      original_price: isSalon ? 0 : (originalPrice || currentPrice),
      allow_retrain: isSalon ? 0 : (allowRetrain ? 1 : 0),
      validity_days: validityDaysParsed,
      included_course_ids: includedCourseIdsJson,
      need_contract: isSalon ? 0 : (parseInt(needContract) === 0 ? 0 : 1),
      sort_order: sortOrder || 0,
      status: 0
    });

    return response.success({
      course_id: result.id
    }, '课程创建成功');

  } catch (error) {
    console.error('[Course/createCourse] 创建失败:', error);
    return response.error('创建课程失败', error);
  }
};
