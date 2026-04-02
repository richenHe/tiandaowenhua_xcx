/**
 * 管理端接口：查询学员推荐关系树
 * Action: admin:getUserRefereeTree
 *
 * 支持单个查询（userId）和批量查询（userIds），用于推荐关系弹窗和 Word 导出。
 * - 向上：仅追溯一层推荐人（users.referee_id）
 * - 向下：递归全部下线（凡 referee_id 指向当前节点或其祖先均计入，含未正式绑定）
 * - 每个节点附带 referee_bole_status：相对直接伯乐（referee_id）为 无/已绑定/未绑定（以 referee_confirmed_at 是否非空为准）
 * - 每个节点附带课程标签：统一以 contract_signed=1 为判断依据（初探班/密训班均适用）
 */
const { db, response, findOne } = require('../../common');

const LEVEL_NAME_MAP = { 0: '普通用户', 1: '准青鸾大使', 2: '青鸾大使', 3: '鸿鹄大使' };

/**
 * 相对伯乐（users.referee_id 指向的用户）的正式绑定状态
 * @param {{ referee_id?: number|null, referee_confirmed_at?: string|null }} user
 * @returns {'none'|'bound'|'unbound'}
 */
function computeRefereeBoleStatus(user) {
  if (!user || user.referee_id == null) return 'none';
  if (user.referee_confirmed_at) return 'bound';
  return 'unbound';
}

/**
 * 递归构建某用户的向下推荐树
 * @param {number} userId
 * @param {Map} userMap - userId -> user 对象
 * @param {Map} childrenMap - userId -> [child userId]
 * @param {Map} coursesMap - userId -> [course_name]（已按业务规则过滤）
 * @returns {{ id, real_name, ambassador_level, ambassador_level_name, referee_bole_status, courses, children }}
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
    referee_bole_status: computeRefereeBoleStatus(user),
    // 统一以 contract_signed=1 判断（初探班首签到自动触发，密训班合同审核通过触发）
    courses: coursesMap.get(userId) || [],
    children
  };
}

/**
 * 批量查询指定用户列表的课程标签
 *
 * 统一判断条件：contract_signed = 1
 * - 初探班（need_contract=0）：首次签到时系统自动触发 triggerPostContractLogic 将 contract_signed 置 1
 * - 密训班（need_contract=1）：管理员录入合同审核通过后将 contract_signed 置 1
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
 * 从数据库中递归加载以 rootId 为根的全部下线（含 referee_confirmed_at 为空的扫码未锁定关系）
 * 使用 BFS 批量查询，避免逐层串行请求。
 */
async function loadSubTree(rootId) {
  const userMap = new Map();
  const childrenMap = new Map();

  const rootUser = await findOne('users', { id: rootId });
  if (!rootUser) return null;
  userMap.set(rootId, rootUser);

  let currentLevelIds = [rootId];

  while (currentLevelIds.length > 0) {
    const { data: children } = await db
      .from('users')
      .select('id, real_name, ambassador_level, referee_id, referee_confirmed_at')
      .in('referee_id', currentLevelIds);

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

  const tree = await loadSubTree(userId);

  return {
    user: {
      id: user.id,
      real_name: user.real_name || '',
      ambassador_level: user.ambassador_level || 0,
      ambassador_level_name: LEVEL_NAME_MAP[user.ambassador_level] || '普通用户',
      referee_bole_status: computeRefereeBoleStatus(user)
    },
    referee,
    tree
  };
}

module.exports = async (event, context) => {
  const { admin } = context;
  const { userId, userIds } = event;

  try {
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      console.log('[admin:getUserRefereeTree] 批量查询推荐树:', userIds);
      const results = [];
      for (const uid of userIds) {
        const data = await getSingleUserTree(parseInt(uid, 10));
        if (data) results.push(data);
      }
      return response.success(results);
    }

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
