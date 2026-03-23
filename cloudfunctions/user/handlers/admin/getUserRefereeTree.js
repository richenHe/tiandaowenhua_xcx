/**
 * 管理端接口：查询学员推荐关系树
 * Action: admin:getUserRefereeTree
 *
 * 支持单个查询（userId）和批量查询（userIds），用于推荐关系弹窗和 Word 导出。
 * - 向上：仅追溯一层推荐人（users.referee_id）
 * - 向下：递归查询全部下线，只计入 referee_confirmed_at IS NOT NULL 的正式绑定关系
 * - 每个节点附带课程标签：统一以 contract_signed=1 为判断依据（初探班/密训班均适用）
 */
const { db, response, findOne } = require('../../common');

const LEVEL_NAME_MAP = { 0: '普通用户', 1: '准青鸾大使', 2: '青鸾大使', 3: '鸿鹄大使' };

/**
 * 递归构建某用户的向下推荐树（正式绑定的下线）
 * @param {number} userId
 * @param {Map} userMap - userId -> user 对象
 * @param {Map} childrenMap - userId -> [child userId]
 * @param {Map} coursesMap - userId -> [course_name]（已按业务规则过滤）
 * @returns {{ id, real_name, ambassador_level, ambassador_level_name, courses, children }}
 */
function buildTree(userId, userMap, childrenMap, coursesMap) {
  const user = userMap.get(userId);
  if (!user) return null;

  const childIds = childrenMap.get(userId) || [];
  const children = childIds
    .map(cid => buildTree(cid, userMap, childrenMap, coursesMap))
    .filter(Boolean);

  return {
    id: user.id,
    real_name: user.real_name || '',
    ambassador_level: user.ambassador_level || 0,
    ambassador_level_name: LEVEL_NAME_MAP[user.ambassador_level] || '普通用户',
    // 统一以 contract_signed=1 判断（初探班首签到自动触发，密训班合同审核通过触发）
    courses: coursesMap.get(userId) || [],
    children
  };
}

/**
 * 批量查询指定用户列表的课程标签
 *
 * 统一判断条件：contract_signed = 1
 * - 初探班(need_contract=0)：首次签到时系统自动触发 triggerPostContractLogic 将 contract_signed 置 1
 * - 密训班(need_contract=1)：管理员录入合同审核通过后将 contract_signed 置 1
 * 两种课程均以 contract_signed=1 作为"正式确认"的统一依据。
 *
 * 排除无效(status=0)和已退款(status=2)的记录。
 *
 * @param {number[]} userIds
 * @returns {Map<number, string[]>} userId -> [course_name]
 */
async function buildCoursesMap(userIds) {
  if (!userIds || userIds.length === 0) return new Map();

  const { data: rows } = await db
    .from('user_courses')
    .select('user_id, course_name, course_type')
    .in('user_id', userIds)
    .in('course_type', [1, 2])   // 仅初探班和密训班
    .eq('contract_signed', 1)    // 统一依据：已签约（初探班首签到自动触发，密训班合同审核通过触发）
    .in('status', [1, 3]);       // 有效(1) 或 已过期(3)，排除无效(0)和已退款(2)

  const map = new Map();
  (rows || []).forEach(uc => {
    if (!map.has(uc.user_id)) map.set(uc.user_id, []);
    // 同一课程名去重（同类型可能有多条记录时）
    const names = map.get(uc.user_id);
    if (!names.includes(uc.course_name)) names.push(uc.course_name);
  });

  return map;
}

/**
 * 从数据库中递归加载以 rootId 为根的全部正式下线关系
 * 使用 BFS 批量查询，避免逐层串行请求。
 */
async function loadSubTree(rootId) {
  // BFS：按层批量查询子节点
  const userMap = new Map();
  const childrenMap = new Map();

  // 先查根节点自身
  const rootUser = await findOne('users', { id: rootId });
  if (!rootUser) return null;
  userMap.set(rootId, rootUser);

  let currentLevelIds = [rootId];

  while (currentLevelIds.length > 0) {
    // 批量查当前层所有节点的正式下线
    const { data: children } = await db
      .from('users')
      .select('id, real_name, ambassador_level, referee_id')
      .in('referee_id', currentLevelIds)
      .not('referee_confirmed_at', 'is', null);

    if (!children || children.length === 0) break;

    const nextLevelIds = [];
    children.forEach(child => {
      userMap.set(child.id, child);
      const parentId = child.referee_id;
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
      childrenMap.get(parentId).push(child.id);
      nextLevelIds.push(child.id);
    });

    currentLevelIds = nextLevelIds;
  }

  // BFS 结束后，一次性批量查询树内所有用户的课程标签
  const allUserIds = [...userMap.keys()];
  const coursesMap = await buildCoursesMap(allUserIds);

  return buildTree(rootId, userMap, childrenMap, coursesMap);
}

/**
 * 查询单个用户的推荐关系树（含向上一层推荐人）
 */
async function getSingleUserTree(userId) {
  const user = await findOne('users', { id: userId });
  if (!user) return null;

  // 向上一层：推荐人
  let referee = null;
  if (user.referee_id) {
    const refereeUser = await findOne('users', { id: user.referee_id });
    if (refereeUser) {
      referee = {
        id: refereeUser.id,
        real_name: refereeUser.real_name || '',
        ambassador_level: refereeUser.ambassador_level || 0,
        ambassador_level_name: LEVEL_NAME_MAP[refereeUser.ambassador_level] || '普通用户'
      };
    }
  }

  // 向下：完整递归下线树（以当前用户为根）
  const tree = await loadSubTree(userId);

  return {
    user: {
      id: user.id,
      real_name: user.real_name || '',
      ambassador_level: user.ambassador_level || 0,
      ambassador_level_name: LEVEL_NAME_MAP[user.ambassador_level] || '普通用户'
    },
    referee,
    tree
  };
}

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, userIds } = event;

  try {
    // 批量模式（用于 Word 导出）
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      console.log('[admin:getUserRefereeTree] 批量查询推荐树:', userIds);
      const results = [];
      for (const uid of userIds) {
        const data = await getSingleUserTree(parseInt(uid, 10));
        if (data) results.push(data);
      }
      return response.success(results);
    }

    // 单个模式（用于弹窗）
    if (!userId) {
      return response.paramError('请提供 userId 或 userIds');
    }

    console.log('[admin:getUserRefereeTree] 查询单个推荐树:', userId);
    const data = await getSingleUserTree(parseInt(userId, 10));
    if (!data) {
      return response.success(null, '未找到该用户');
    }
    return response.success(data);

  } catch (error) {
    console.error('[admin:getUserRefereeTree] 查询失败:', error);
    return response.error('查询推荐关系树失败', error);
  }
};
