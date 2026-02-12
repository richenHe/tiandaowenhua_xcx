/**
 * 成长等级工具函数
 */

/**
 * 根据活动次数计算成长等级显示
 * @param activityCount - 累计活动次数
 * @returns 显示的图标字符串
 */
export function getGrowthLevelDisplay(activityCount: number): string {
  const trees = Math.floor(activityCount / 64)      // 大树数量
  const fruits = Math.floor((activityCount % 64) / 16)  // 果实数量
  const flowers = Math.floor((activityCount % 16) / 4)  // 花朵数量
  const leaves = activityCount % 4                   // 绿叶数量

  let display = ''

  // 只显示最高等级
  if (trees > 0) {
    display = '🌳'.repeat(trees)
  } else if (fruits > 0) {
    display = '🍎'.repeat(fruits)
  } else if (flowers > 0) {
    display = '🌸'.repeat(flowers)
  } else if (leaves > 0) {
    display = '🍃'.repeat(leaves)
  } else {
    display = '🍃' // 默认显示1个绿叶
  }

  return display
}

/**
 * 获取成长等级名称
 * @param activityCount - 累计活动次数
 * @returns 等级名称
 */
export function getGrowthLevelName(activityCount: number): string {
  if (activityCount >= 64) return '大树'
  if (activityCount >= 16) return '果实'
  if (activityCount >= 4) return '花朵'
  return '绿叶'
}

/**
 * 获取成长等级描述
 * @param activityCount - 累计活动次数
 * @returns 等级描述
 */
export function getGrowthLevelDesc(activityCount: number): string {
  if (activityCount >= 64) return '最高等级'
  if (activityCount >= 16) return '沉淀、价值,代表核心成员'
  if (activityCount >= 4) return '绽放、活跃,代表进阶贡献'
  return '新生、起点,代表初级成员'
}

