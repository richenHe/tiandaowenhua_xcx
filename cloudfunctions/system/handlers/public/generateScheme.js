/**
 * 生成小程序 URL Scheme 跳转链接
 *
 * 通过微信云调用 openapi.urlscheme.generate 生成加密 URL Scheme，
 * 适用于在微信聊天、短信、邮件等场景中点击直接跳转到小程序指定页面。
 *
 * 请求参数：
 *   - path: string（必填）目标页面路径，如 'pages/course/my-courses/index'
 *   - query: string（可选）页面参数，如 'courseId=123'，默认空
 *   - env_version: string（可选）小程序版本，默认 'release'，可选 'trial'/'develop'
 *   - expire_interval: number（可选）有效期天数，默认 30，最长 30 天
 *
 * 返回：
 *   - openlink: string 生成的小程序 scheme 码，如 weixin://dl/business/?t=xxxxx
 *
 * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/qrcode-link/url-scheme/generateScheme.html
 */

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 支持的页面路径白名单（安全限制，防止生成任意页面链接）
 */
const ALLOWED_PATHS = [
  'pages/course/my-courses/index',
  'pages/course/detail/index',
  'pages/course/schedule/index',
  'pages/index/index',
  'pages/mall/index',
  'pages/academy/index',
  'pages/mine/index'
]

module.exports = async (event, context) => {
  const { path, query = '', env_version = 'release', expire_interval = 30 } = event

  // 参数校验
  if (!path) {
    return { success: false, code: 400, message: '缺少必填参数 path' }
  }

  if (!ALLOWED_PATHS.includes(path)) {
    return { success: false, code: 400, message: `不支持生成该页面的跳转链接: ${path}` }
  }

  if (!['release', 'trial', 'develop'].includes(env_version)) {
    return { success: false, code: 400, message: 'env_version 只能是 release/trial/develop' }
  }

  if (expire_interval < 1 || expire_interval > 30) {
    return { success: false, code: 400, message: 'expire_interval 须在 1~30 天之间' }
  }

  try {
    const result = await cloud.openapi.urlscheme.generate({
      jump_wxa: {
        path,
        query,
        env_version
      },
      is_expire: true,
      expire_type: 1,
      expire_interval
    })

    console.log('[generateScheme] 生成成功:', JSON.stringify(result))

    return {
      success: true,
      openlink: result.openlink,
      expire_days: expire_interval
    }
  } catch (error) {
    console.error('[generateScheme] 生成失败:', error)
    return {
      success: false,
      code: error.errCode || 500,
      message: error.message || '生成 URL Scheme 失败'
    }
  }
}
