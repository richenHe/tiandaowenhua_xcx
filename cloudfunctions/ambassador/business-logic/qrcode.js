/**
 * 微信小程序码生成模块
 *
 * 功能：生成分享码，扫码后进入小程序登录页
 *
 * 实现方式：直接调用微信 HTTP API（/wxa/getwxacodeunlimit），
 * 不依赖 wx-server-sdk 的 openapi 权限配置，避免 errCode:-604101 问题。
 * 上传使用 @cloudbase/node-sdk（与 db.js 一致）。
 *
 * 环境变量依赖：WECHAT_APPID、WECHAT_APP_SECRET
 */

const https = require('https');

// cloud（@cloudbase/node-sdk app）实例由 business.init() 注入
let _cloud = null;

// access_token 模块级缓存（云函数热实例复用，避免频繁换取）
let _accessTokenCache = null;
let _accessTokenExpiry = 0;

/**
 * 初始化小程序码模块
 * @param {Object} cloud - @cloudbase/node-sdk 的 app 实例
 */
function initQRCode(cloud) {
  _cloud = cloud;
}

/**
 * 获取微信 access_token（带模块级缓存）
 * @private
 */
async function _getAccessToken() {
  const now = Date.now();
  if (_accessTokenCache && now < _accessTokenExpiry) {
    return _accessTokenCache;
  }

  const APPID = process.env.WECHAT_APPID;
  const SECRET = process.env.WECHAT_APP_SECRET;

  if (!APPID || !SECRET) {
    throw new Error('缺少环境变量 WECHAT_APPID 或 WECHAT_APP_SECRET');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;

  const result = await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });

  if (!result.access_token) {
    throw new Error(`获取 access_token 失败: ${result.errmsg || JSON.stringify(result)}`);
  }

  // 提前 5 分钟过期，单位 ms
  _accessTokenCache = result.access_token;
  _accessTokenExpiry = now + (result.expires_in - 300) * 1000;

  return _accessTokenCache;
}

/**
 * 调用微信 getwxacodeunlimit HTTP API
 * @private
 * @returns {Promise<Buffer>} 图片 Buffer
 */
async function _callWxaCodeHTTP(accessToken, params) {
  const postData = JSON.stringify(params);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.weixin.qq.com',
      path: `/wxa/getwxacodeunlimit?access_token=${accessToken}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        // 响应为 JSON 时说明出错（图片 Buffer 首字节不是 '{'）
        if (buffer.length > 0 && buffer[0] === 0x7B) {
          try {
            const json = JSON.parse(buffer.toString());
            reject(new Error(`wxacode API 错误: errCode=${json.errcode} errMsg=${json.errmsg}`));
          } catch (e) {
            reject(new Error('wxacode API 返回格式异常'));
          }
        } else {
          resolve(buffer);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * 生成分享码（无数量限制）
 *
 * @param {Object} options
 * @param {string} options.scene      - 场景值，最大 32 字符，如 'ref=A12345'
 * @param {string} [options.page]     - 落地页路径，默认 'pages/auth/login/index'
 * @param {number} [options.width]    - 二维码宽度 280-1280，默认 430
 * @param {string} [options.env_version] - 小程序版本，优先用环境变量 MINIPROGRAM_ENV_VERSION，默认 'trial'
 * @returns {Promise<Buffer>} 小程序码图片 Buffer
 */
async function generateShareQRCode(options) {
  const {
    scene,
    page = 'pages/auth/login/index',
    width = 430,
    env_version
  } = options;

  if (!scene) {
    throw new Error('scene 参数不能为空');
  }

  if (scene.length > 32) {
    throw new Error(`scene 参数长度不能超过 32 字符，当前: ${scene.length}`);
  }

  // 优先使用调用方传入的版本，其次读环境变量，最后默认 trial（正式上线改为 release）
  const envVersion = env_version || process.env.MINIPROGRAM_ENV_VERSION || 'trial';

  try {
    const accessToken = await _getAccessToken();
    const buffer = await _callWxaCodeHTTP(accessToken, {
      scene,
      page,
      check_path: false,
      env_version: envVersion,
      width: Math.max(280, Math.min(1280, width))
    });
    return buffer;
  } catch (error) {
    console.error('生成分享码失败:', error);
    throw new Error(`生成分享码失败: ${error.message}`);
  }
}

/**
 * 生成大使专属推广码并上传云存储
 *
 * @param {Object} options
 * @param {string|number} options.ambassadorId - 大使 ID
 * @param {string}        options.referralCode - 大使推荐码
 * @param {number}        [options.width=430]  - 二维码宽度
 * @returns {Promise<{buffer: Buffer, cloudPath: string, fileID: string}>}
 */
async function generateAmbassadorQRCode(options) {
  if (!_cloud) {
    throw new Error('小程序码模块未初始化，请先调用 business.init(cloud)');
  }

  const { ambassadorId, referralCode, width = 430 } = options;

  if (!ambassadorId || !referralCode) {
    throw new Error('ambassadorId 和 referralCode 不能为空');
  }

  const scene = `ref=${referralCode}`;
  const buffer = await generateShareQRCode({ scene, width });

  // 上传到云存储（@cloudbase/node-sdk uploadFile）
  const timestamp = Date.now();
  const cloudPath = `qrcodes/ambassadors/${ambassadorId}_${timestamp}.png`;

  const uploadResult = await _cloud.uploadFile({
    cloudPath,
    fileContent: buffer
  });

  return {
    buffer,
    cloudPath,
    fileID: uploadResult.fileID
  };
}

/**
 * 解码 scene 参数（前端用）
 * @param {string} scene - 如 'ref=A12345&other=val'
 * @returns {Object} 如 { ref: 'A12345', other: 'val' }
 */
function decodeScene(scene) {
  if (!scene || typeof scene !== 'string') return {};
  return scene.split('&').reduce((acc, part) => {
    const [k, v] = part.split('=');
    if (k) acc[k] = v || '';
    return acc;
  }, {});
}

module.exports = {
  initQRCode,
  generateShareQRCode,
  generateAmbassadorQRCode,
  decodeScene
};
