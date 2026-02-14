/**
 * Design Tokens - 设计令牌系统
 * 所有设计决策的单一数据源
 */

import colors from './colors.json'
import spacing from './spacing.json'
import radius from './radius.json'

export const tokens = {
  colors,
  spacing,
  radius
}

export default tokens

// 导出类型
export type ColorToken = keyof typeof colors
export type SpacingToken = keyof typeof spacing
export type RadiusToken = keyof typeof radius






























