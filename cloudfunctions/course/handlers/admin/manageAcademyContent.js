/**
 * 管理商学院内容（管理端接口）
 * 支持创建、更新、删除商学院介绍
 */
const { findOne, insert, update, softDelete } = require('../../common/db');
const { response } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { operation, id, ...data } = event;

  try {
    // 参数验证
    const validation = validateRequired({ operation }, ['operation']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    switch (operation) {
      case 'create':
        return await createAcademyIntro(data);

      case 'update':
        return await updateAcademyIntro(id, data);

      case 'delete':
        return await deleteAcademyIntro(id);

      default:
        return response.paramError('无效的操作类型');
    }

  } catch (error) {
    console.error('[Course/manageAcademyContent] 操作失败:', error);
    return response.error('操作失败', error);
  }
};

// 创建商学院介绍
async function createAcademyIntro(data) {
  const { title, cover_image, summary, content, sort_order, status } = data;

  // 参数验证
  const validation = validateRequired({ title, content }, ['title', 'content']);
  if (!validation.valid) {
    return response.paramError(validation.message);
  }

  // 创建介绍
  const [result] = await insert('academy_intro', {
    title,
    cover_image,
    summary,
    content,
    sort_order: sort_order || 0,
    status: status !== undefined ? status : 1
  });

  return response.success({
    id: result.id
  }, '商学院介绍创建成功');
}

// 更新商学院介绍
async function updateAcademyIntro(id, data) {
  // 参数验证
  const validation = validateRequired({ id }, ['id']);
  if (!validation.valid) {
    return response.paramError(validation.message);
  }

  // 查询介绍是否存在
  const intro = await findOne('academy_intro', 'id = ? AND deleted_at IS NULL', [id]);
  if (!intro) {
    return response.notFound('商学院介绍不存在');
  }

  // 过滤允许更新的字段
  const allowedFields = ['title', 'cover_image', 'summary', 'content', 'sort_order', 'status'];
  const fieldsToUpdate = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      fieldsToUpdate[field] = data[field];
    }
  });

  if (Object.keys(fieldsToUpdate).length === 0) {
    return response.paramError('没有需要更新的字段');
  }

  // 更新介绍
  await update('academy_intro', fieldsToUpdate, 'id = ?', [id]);

  return response.success({
    message: '商学院介绍更新成功'
  });
}

// 删除商学院介绍
async function deleteAcademyIntro(id) {
  // 参数验证
  const validation = validateRequired({ id }, ['id']);
  if (!validation.valid) {
    return response.paramError(validation.message);
  }

  // 查询介绍是否存在
  const intro = await findOne('academy_intro', 'id = ? AND deleted_at IS NULL', [id]);
  if (!intro) {
    return response.notFound('商学院介绍不存在');
  }

  // 软删除介绍
  await softDelete('academy_intro', 'id = ?', [id]);

  return response.success({
    message: '商学院介绍删除成功'
  });
}
