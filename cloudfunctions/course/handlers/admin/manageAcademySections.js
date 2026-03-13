/**
 * 管理商学院板块（管理端接口）
 * 支持 list / detail / create / update / delete / updateSort / toggleStatus
 */
const { db, insert: dbInsert } = require('../../common/db');
const { response, formatDateTime } = require('../../common');
const { validateRequired } = require('../../common/utils');

module.exports = async (event, context) => {
  const { operation, ...data } = event;

  try {
    const validation = validateRequired({ operation }, ['operation']);
    if (!validation.valid) {
      return response.paramError(validation.message);
    }

    switch (operation) {
      case 'list':
        return await listSections(data);
      case 'detail':
        return await getDetail(data);
      case 'create':
        return await createSection(data);
      case 'update':
        return await updateSection(data);
      case 'delete':
        return await deleteSection(data);
      case 'updateSort':
        return await updateSort(data);
      case 'toggleStatus':
        return await toggleStatus(data);
      default:
        return response.paramError('无效的操作类型: ' + operation);
    }
  } catch (error) {
    console.error('[Course/manageAcademySections] 操作失败:', error);
    return response.error('操作失败', error);
  }
};

/** 查询全部板块（含隐藏） */
async function listSections(params) {
  const { data: list, error } = await db
    .from('academy_sections')
    .select('id, section_type, title, icon, content, sort_order, status, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;

  const processedList = (list || []).map(item => {
    let content = item.content;
    if (typeof content === 'string') {
      try { content = JSON.parse(content); } catch (e) { content = {}; }
    }
    return { ...item, content };
  });

  return response.success({ list: processedList, total: processedList.length });
}

/** 按 id 查询单个板块详情 */
async function getDetail({ id }) {
  const validation = validateRequired({ id }, ['id']);
  if (!validation.valid) return response.paramError(validation.message);

  const { data, error } = await db
    .from('academy_sections')
    .select('*')
    .eq('id', id);

  if (error) throw error;
  if (!data || data.length === 0) return response.notFound('板块不存在');

  const item = data[0];
  let content = item.content;
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch (e) { content = {}; }
  }

  return response.success({ ...item, content });
}

/** 新增板块 */
async function createSection(data) {
  const { sectionType, title, icon, content, sortOrder, status } = data;

  const validation = validateRequired({ sectionType, title }, ['sectionType', 'title']);
  if (!validation.valid) return response.paramError(validation.message);

  const validTypes = ['hero', 'quick_access', 'intro', 'concepts', 'teachers', 'timeline', 'honors'];
  if (!validTypes.includes(sectionType)) {
    return response.paramError('无效的板块类型: ' + sectionType);
  }

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content || {});
  const now = formatDateTime(new Date());

  const result = await dbInsert('academy_sections', {
    _openid: '',
    section_type: sectionType,
    title: title || '',
    icon: icon || '',
    content: contentStr,
    sort_order: sortOrder !== undefined ? sortOrder : 0,
    status: status !== undefined ? status : 1,
    created_at: now,
    updated_at: now
  });

  return response.success({ id: result?.[0]?.id }, '板块创建成功');
}

/** 更新板块 */
async function updateSection(data) {
  const { id, sectionType, title, icon, content, sortOrder, status } = data;

  const validation = validateRequired({ id }, ['id']);
  if (!validation.valid) return response.paramError(validation.message);

  const { data: existing, error: findError } = await db
    .from('academy_sections')
    .select('id')
    .eq('id', id);

  if (findError) throw findError;
  if (!existing || existing.length === 0) return response.notFound('板块不存在');

  const fieldsToUpdate = {};
  if (sectionType !== undefined) fieldsToUpdate.section_type = sectionType;
  if (title !== undefined) fieldsToUpdate.title = title;
  if (icon !== undefined) fieldsToUpdate.icon = icon;
  if (content !== undefined) {
    fieldsToUpdate.content = typeof content === 'string' ? content : JSON.stringify(content);
  }
  if (sortOrder !== undefined) fieldsToUpdate.sort_order = sortOrder;
  if (status !== undefined) fieldsToUpdate.status = status;

  if (Object.keys(fieldsToUpdate).length === 0) {
    return response.paramError('没有需要更新的字段');
  }

  fieldsToUpdate.updated_at = formatDateTime(new Date());

  const { error } = await db
    .from('academy_sections')
    .update(fieldsToUpdate)
    .eq('id', id);

  if (error) throw error;

  return response.success({ message: '板块更新成功' });
}

/** 删除板块 */
async function deleteSection({ id }) {
  const validation = validateRequired({ id }, ['id']);
  if (!validation.valid) return response.paramError(validation.message);

  const { data: existing, error: findError } = await db
    .from('academy_sections')
    .select('id')
    .eq('id', id);

  if (findError) throw findError;
  if (!existing || existing.length === 0) return response.notFound('板块不存在');

  const { error } = await db
    .from('academy_sections')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return response.success({ message: '板块删除成功' });
}

/** 批量更新排序 */
async function updateSort({ items }) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return response.paramError('请提供排序数据');
  }

  const now = formatDateTime(new Date());

  for (const item of items) {
    if (!item.id || item.sortOrder === undefined) continue;
    const { error } = await db
      .from('academy_sections')
      .update({ sort_order: item.sortOrder, updated_at: now })
      .eq('id', item.id);
    if (error) throw error;
  }

  return response.success({ message: '排序更新成功' });
}

/** 切换显示/隐藏 */
async function toggleStatus({ id }) {
  const validation = validateRequired({ id }, ['id']);
  if (!validation.valid) return response.paramError(validation.message);

  const { data: existing, error: findError } = await db
    .from('academy_sections')
    .select('id, status')
    .eq('id', id);

  if (findError) throw findError;
  if (!existing || existing.length === 0) return response.notFound('板块不存在');

  const newStatus = existing[0].status === 1 ? 0 : 1;

  const { error } = await db
    .from('academy_sections')
    .update({ status: newStatus, updated_at: formatDateTime(new Date()) })
    .eq('id', id);

  if (error) throw error;

  return response.success({ status: newStatus, message: newStatus === 1 ? '板块已显示' : '板块已隐藏' });
}
