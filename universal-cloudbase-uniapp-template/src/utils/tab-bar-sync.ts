/**
 * 与 custom-tab-bar 同步当前选中项（页面 onShow 中调用）
 */
export const TAB_BAR_INDEX = {
  HOME: 0,
  MALL: 1,
  ACADEMY: 2,
  MINE: 3
} as const

export function syncTabBarSelected(index: number): void {
  uni.$emit('tabBarSync', index)
}
