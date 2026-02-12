/**
 * 统一响应拦截器
 * 处理接口响应，统一处理错误码
 */

import { updateProfileStatus } from './preview-guard'

/**
 * 处理403错误（资料未完善）
 */
function handle403Error(response: any) {
  uni.showModal({
    title: '提示',
    content: response.message || '请先完善资料',
    confirmText: '去完善',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.redirectTo({
          url: response.redirect_url || '/pages/auth/complete-profile/index'
        })
      }
    }
  })
  
  // 更新本地缓存状态
  updateProfileStatus(false)
}

/**
 * 处理401错误（未登录）
 */
function handle401Error() {
  uni.showToast({
    title: '请先登录',
    icon: 'none',
    duration: 2000
  })
  
  setTimeout(() => {
    uni.redirectTo({
      url: '/pages/auth/login/index'
    })
  }, 2000)
}

/**
 * 处理404错误（资源不存在）
 */
function handle404Error(response: any) {
  uni.showToast({
    title: response.message || '资源不存在',
    icon: 'none',
    duration: 2000
  })
}

/**
 * 处理422错误（参数验证失败）
 */
function handle422Error(response: any) {
  uni.showToast({
    title: response.message || '参数验证失败',
    icon: 'none',
    duration: 2000
  })
}

/**
 * 处理通用错误
 */
function handleGeneralError(response: any) {
  uni.showToast({
    title: response.message || '请求失败',
    icon: 'none',
    duration: 2000
  })
}

/**
 * 响应拦截器
 * @param response 接口响应
 * @returns 处理后的响应，如果被拦截则返回null
 */
export function responseInterceptor(response: any): any {
  // 成功响应
  if (response.code === 0 || response.code === 200) {
    // 如果响应中包含 profile_completed 信息，更新本地缓存
    if (response.data && response.data.profile_completed !== undefined) {
      updateProfileStatus(response.data.profile_completed)
    }
    return response
  }

  // 错误响应，统一处理
  switch (response.code) {
    case 401:
      handle401Error()
      break
    case 403:
      handle403Error(response)
      break
    case 404:
      handle404Error(response)
      break
    case 422:
      handle422Error(response)
      break
    default:
      handleGeneralError(response)
  }

  // 返回null表示被拦截
  return null
}

/**
 * 安装响应拦截器到 CloudBase 实例
 */
export function installResponseInterceptor(cloudbaseInstance: any) {
  // 这里根据实际的 CloudBase 实例来配置拦截器
  // 如果使用的是 axios 或其他请求库，可以配置相应的拦截器
  
  console.log('响应拦截器已安装')
}

/**
 * 包装 uni.request，添加拦截器
 */
export function installUniRequestInterceptor() {
  const originalRequest = uni.request

  uni.request = function(options: UniApp.RequestOptions) {
    // 添加成功回调拦截
    const originalSuccess = options.success
    options.success = function(res: any) {
      // 拦截响应
      const interceptedRes = responseInterceptor(res.data)
      
      // 如果被拦截，不调用原始成功回调
      if (interceptedRes === null) {
        return
      }
      
      // 调用原始成功回调
      if (originalSuccess) {
        originalSuccess.call(this, res)
      }
    }

    // 调用原始 request
    originalRequest.call(uni, options)
  } as typeof uni.request
}














