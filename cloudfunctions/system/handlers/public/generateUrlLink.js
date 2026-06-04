/**
 * 生成小程序加密 URL Link 跳转链接
 *
 * 直接调用微信 HTTP API（POST /wxa/generate_urllink），
 * 不依赖 wx-server-sdk openapi，避免 openapi access_token 鉴权问题。
 *
 * 生成 https://wxaurl.cn/xxx 格式链接，微信内外均可使用：
 * - 微信内部：自动转为开放标签方式打开（场景值 1167）
 * - 微信外部：直接唤起小程序（场景值 1194）
 *
 * 环境变量依赖：WECHAT_APPID、WECHAT_APP_SECRET
 *
 * 请求参数：
 *   - path: string（必填）目标页面路径
 *   - query: string（可选）页面参数，默认空
 *   - env_version: string（可选）小程序版本，默认 'release'
 *   - expire_interval: number（可选）有效期天数，0=永久有效，默认 30
 *
 * 返回：
 *   - url_link: string 生成的小程序链接
 *
 * @see https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/qrcode-link/url-link/generateUrlLink.html
 */

const https = require('https')

// access_token 模块级缓存（云函数热实例复用）
let _accessTokenCache = null
let _accessTokenExpiry = 0

/**
 * 支持的页面路径白名单
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

/**
 * 获取微信 access_token（带模块级缓存，提前 5 分钟过期）
 */
async function getAccessToken() {
  const now = Date.now()
  if (_accessTokenCache && now < _accessTokenExpiry) {
    return _accessTokenCache
  }

  const APPID = process.env.WECHAT_APPID
  const SECRET = process.env.WECHAT_APP_SECRET

  if (!APPID || !SECRET) {
    throw new Error('缺少环境变量 WECHAT_APPID 或 WECHAT_APP_SECRET')
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`

  const result = await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })

  if (!result.access_token) {
    throw new Error(`获取 access_token 失败: ${result.errmsg || JSON.stringify(result)}`)
  }

  _accessTokenCache = result.access_token
  _accessTokenExpiry = now + (result.expires_in - 300) * 1000

  return _accessTokenCache
}

/**
 * 调用微信 generate_urllink API
 */
async function callGenerateUrlLink(accessToken, params) {
  const postData = JSON.stringify(params)

  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://api.weixin.qq.com/wxa/generate_urllink?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
      },
      (res) => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
        })
      }
    )
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

module.exports = async (event, context) => {
  const { path, query = '', env_version = 'release', expire_interval = 30 } = event

  if (!path) {
    return { success: false, code: 400, message: '缺少必填参数 path' }
  }

  if (!ALLOWED_PATHS.includes(path)) {
    return { success: false, code: 400, message: `不支持生成该页面的跳转链接: ${path}` }
  }

  if (!['release', 'trial', 'develop'].includes(env_version)) {
    return { success: false, code: 400, message: 'env_version 只能是 release/trial/develop' }
  }

  if (expire_interval < 0 || expire_interval > 30) {
    return { success: false, code: 400, message: 'expire_interval 须在 0~30 天之间（0=永久有效）' }
  }

  try {
    const accessToken = await getAccessToken()

    // 构造请求参数
    const params = { path, query, env_version }

    // 设置有效期：0 表示永久有效
    if (expire_interval > 0) {
      params.expire_type = 1
      params.expire_interval = expire_interval
    }

    const result = await callGenerateUrlLink(accessToken, params)

    if (result.errcode !== 0) {
      console.error('[generateUrlLink] 微信 API 返回错误:', JSON.stringify(result))
      return {
        success: false,
        code: result.errcode,
        message: `生成 URL Link 失败: ${result.errmsg} (errcode=${result.errcode})`
      }
    }

    console.log('[generateUrlLink] 生成成功:', result.url_link)

    return {
      success: true,
      url_link: result.url_link
    }
  } catch (error) {
    console.error('[generateUrlLink] 生成失败:', error)
    return {
      success: false,
      code: 500,
      message: error.message || '生成 URL Link 失败'
    }
  }
}
