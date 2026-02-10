/**
 * 预览模式路由守卫
 * 拦截操作类页面，提示用户完善资料
 */

// 白名单页面（查看类，无需完善资料即可访问）
const WHITE_LIST_PAGES = [
  '/pages/index/index',
  '/pages/course/list/index',
  '/pages/course/detail/index',
  '/pages/academy/intro/index',
  '/pages/academy/materials/index',
  '/pages/academy/cases/index',
  '/pages/auth/login/index',
  '/pages/auth/complete-profile/index',
  '/pages/mine/index',
  '/pages/ambassador/info/index',
  '/pages/mall/index'
]

// 操作类页面（需要完善资料才能访问）
const OPERATION_PAGES = [
  '/pages/order/payment/index',
  '/pages/course/appointment-confirm/index',
  '/pages/ambassador/apply/index',
  '/pages/ambassador/upgrade/index',
  '/pages/ambassador/upgrade-guide/index',
  '/pages/ambassador/contract-sign/index',
  '/pages/cash-points/withdraw/index',
  '/pages/feedback/submit/index'
]

/**
 * 检查页面是否在白名单中
 */
function isWhiteListPage(url: string): boolean {
  // 提取页面路径（去除参数）
  const path = url.split('?')[0]
  return WHITE_LIST_PAGES.some(page => path.includes(page))
}

/**
 * 检查页面是否是操作类页面
 */
function isOperationPage(url: string): boolean {
  const path = url.split('?')[0]
  return OPERATION_PAGES.some(page => path.includes(page))
}

/**
 * 检查用户资料是否完善
 */
async function checkProfileCompleted(): Promise<boolean> {
  try {
    // 从本地缓存获取
    const userInfo = uni.getStorageSync('userInfo')
    if (userInfo && userInfo.profile_completed !== undefined) {
      return userInfo.profile_completed === true || userInfo.profile_completed === 1
    }
    
    // 缓存不存在或无效，返回false（需要在拦截器中重新验证）
    return false
  } catch (error) {
    console.error('检查资料完善状态失败:', error)
    return false
  }
}

/**
 * 显示提示弹窗
 */
function showProfileReminder() {
  uni.showModal({
    title: '提示',
    content: '请先完善资料',
    confirmText: '去完善',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.redirectTo({
          url: '/pages/auth/complete-profile/index'
        })
      }
    }
  })
}

/**
 * 路由守卫拦截器
 */
export async function routeGuard(url: string): Promise<boolean> {
  // 白名单页面直接放行
  if (isWhiteListPage(url)) {
    return true
  }

  // 操作类页面需要检查资料是否完善
  if (isOperationPage(url)) {
    const profileCompleted = await checkProfileCompleted()
    if (!profileCompleted) {
      showProfileReminder()
      return false
    }
  }

  return true
}

/**
 * 安装路由守卫
 * 重写 uni.navigateTo 和 uni.redirectTo
 */
export function installRouteGuard() {
  const originalNavigateTo = uni.navigateTo
  const originalRedirectTo = uni.redirectTo

  // 重写 navigateTo
  uni.navigateTo = function(options: UniApp.NavigateToOptions) {
    routeGuard(options.url).then(allowed => {
      if (allowed) {
        originalNavigateTo.call(uni, options)
      } else {
        // 被拦截，调用 fail 回调
        options.fail?.({
          errMsg: 'navigateTo:fail 资料未完善'
        })
      }
    })
  } as typeof uni.navigateTo

  // 重写 redirectTo
  uni.redirectTo = function(options: UniApp.RedirectToOptions) {
    routeGuard(options.url).then(allowed => {
      if (allowed) {
        originalRedirectTo.call(uni, options)
      } else {
        // 被拦截，调用 fail 回调
        options.fail?.({
          errMsg: 'redirectTo:fail 资料未完善'
        })
      }
    })
  } as typeof uni.redirectTo
}

/**
 * 更新用户资料完善状态
 */
export function updateProfileStatus(profileCompleted: boolean) {
  try {
    const userInfo = uni.getStorageSync('userInfo') || {}
    userInfo.profile_completed = profileCompleted
    uni.setStorageSync('userInfo', userInfo)
  } catch (error) {
    console.error('更新资料状态失败:', error)
  }
}









