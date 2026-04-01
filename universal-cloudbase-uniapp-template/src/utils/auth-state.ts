/**
 * 业务登录态（与 App 原逻辑一致）
 * MP-WEIXIN 使用 wx.cloud，本地以 userInfo 缓存为准；未走 login 云函数则无有效 userInfo。
 */

const STORAGE_KEY = 'userInfo'

export function isBusinessLoggedIn(): boolean {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY)
    return !!(stored && stored.profile_completed !== undefined)
  } catch {
    return false
  }
}

/**
 * 跳转登录页（保留当前 Tab 栈，便于返回继续浏览）
 */
export function navigateToLogin(): void {
  uni.navigateTo({ url: '/pages/auth/login/index' })
}

/** 已登录返回 true；未登录则跳转登录并返回 false */
export function ensureLoggedIn(): boolean {
  if (isBusinessLoggedIn()) return true
  navigateToLogin()
  return false
}
