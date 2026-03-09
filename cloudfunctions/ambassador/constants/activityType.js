/**
 * 活动类型与固定岗位常量
 *
 * 活动类型分布（图一）对应岗位设置（图二）的前三个固定岗位：
 * - 辅导员 → activity_type=1
 * - 会务义工 → activity_type=2
 * - 沙龙组织 → activity_type=3
 * 其他新增岗位均归入「其他活动」→ activity_type=4
 *
 * 这三个固定岗位：不可删除、不可修改名称
 */

/** 固定岗位名称（对应活动类型分布前三项，不可删除、不可改名称） */
const FIXED_POSITION_NAMES = ['辅导员', '会务义工', '沙龙组织'];

/** 岗位名称 → 活动类型映射 */
const POSITION_TO_ACTIVITY_TYPE = {
  辅导员: 1,
  会务义工: 2,
  沙龙组织: 3
};

/**
 * 判断岗位是否为固定岗位（辅导员/会务义工/沙龙组织）
 * @param {string} name - 岗位名称
 * @returns {boolean}
 */
function isFixedPosition(name) {
  if (!name || typeof name !== 'string') return false;
  return FIXED_POSITION_NAMES.includes(name.trim());
}

/**
 * 根据岗位名称推断活动类型
 * 仅辅导员、会务义工、沙龙组织三个固定名称对应 1/2/3，其余均为 4（其他活动）
 * @param {string} positionName - 岗位名称
 * @returns {number} 1辅导员/2会务义工/3沙龙组织/4其他
 */
function getActivityTypeByPosition(positionName) {
  if (!positionName) return 4;
  const name = positionName.trim();
  return POSITION_TO_ACTIVITY_TYPE[name] ?? 4;
}

module.exports = {
  FIXED_POSITION_NAMES,
  POSITION_TO_ACTIVITY_TYPE,
  isFixedPosition,
  getActivityTypeByPosition
};
