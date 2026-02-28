/**
 * 微信小程序码生成模块
 *
 * 支持两种调用方式：
 *   1. cloud.openapi（小程序端 wx.cloud.callFunction 触发时可用）
 *   2. 直接 HTTP 调用微信 API（admin 后台 HTTP Access Service 触发时使用）
 *
 * 使用场景：大使推广码、签到码、分享码
 */
const https = require('https');

let _cloud = null;

// access_token 缓存（有效期 7200 秒，提前 5 分钟刷新）
let _tokenCache = { token: null, expireAt: 0 };

/**
 * 初始化小程序码模块
 * @param {Object} cloud - wx-server-sdk 的 cloud 实例
 */
function initQRCode(cloud) {
  _cloud = cloud;
}

function _checkInit() {
  if (!_cloud) {
    throw new Error('小程序码模块未初始化，请先调用 business.init(cloud)');
  }
}

/**
 * 通过 HTTPS 发起请求
 * @private
 */
function _httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json') || contentType.includes('text/')) {
          try {
            resolve({ json: JSON.parse(buffer.toString()), buffer: null });
          } catch {
            resolve({ json: null, buffer });
          }
        } else {
          resolve({ json: null, buffer });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * 获取微信 access_token（带缓存）
 * @private
 */
async function _getAccessToken() {
  if (_tokenCache.token && Date.now() < _tokenCache.expireAt) {
    return _tokenCache.token;
  }

  const appId = process.env.WECHAT_APPID;
  const appSecret = process.env.WECHAT_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('缺少 WECHAT_APPID 或 WECHAT_APP_SECRET 环境变量，无法获取 access_token');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const { json } = await _httpsRequest(url);

  if (!json || json.errcode) {
    throw new Error(`获取 access_token 失败: ${json?.errmsg || '未知错误'} (${json?.errcode})`);
  }

  _tokenCache = {
    token: json.access_token,
    expireAt: Date.now() + (json.expires_in - 300) * 1000
  };

  console.log('[QRCode] access_token 获取成功，有效期:', json.expires_in, '秒');
  return json.access_token;
}

/**
 * 通过直接 HTTP 调用微信 API 生成小程序码
 * @private
 */
async function _getUnlimitedViaHttp(params) {
  const accessToken = await _getAccessToken();
  const url = `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`;

  const body = JSON.stringify({
    scene: params.scene,
    page: params.page,
    check_path: false,
    width: params.width,
    env_version: params.envVersion || 'release'
  });

  const { json, buffer } = await _httpsRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    },
    body
  });

  // 微信 API 返回 JSON 表示出错，返回二进制图片表示成功
  if (json) {
    console.error('[QRCode] HTTP API 返回错误 JSON:', JSON.stringify(json));
    throw new Error(`wxacode.getUnlimited 失败: ${json.errmsg || '未知错误'} (${json.errcode})`);
  }

  if (!buffer || buffer.length < 100) {
    // 尝试把小 buffer 当 JSON 解析，获取更多错误信息
    let detail = `length=${buffer ? buffer.length : 0}`;
    if (buffer && buffer.length > 0) {
      try {
        const errJson = JSON.parse(buffer.toString());
        console.error('[QRCode] HTTP API 返回短响应 JSON:', JSON.stringify(errJson));
        throw new Error(`wxacode.getUnlimited 失败: ${errJson.errmsg || '未知'} (${errJson.errcode || 'unknown'})`);
      } catch (parseErr) {
        if (parseErr.message.includes('wxacode.getUnlimited')) throw parseErr;
        detail = `${detail}, content="${buffer.toString().slice(0, 200)}"`;
      }
    }
    console.error('[QRCode] HTTP API 返回数据异常:', detail);
    throw new Error(`wxacode.getUnlimited 返回数据异常 (${detail})`);
  }

  return buffer;
}

/**
 * 生成分享码（无数量限制）
 *
 * 优先使用 cloud.openapi（小程序端），失败后回退到直接 HTTP 调用（admin 端）
 *
 * @param {Object} options
 * @param {string} options.scene - 场景值，最大 32 字符
 * @param {string} [options.page='pages/auth/login/index'] - 落地页路径
 * @param {number} [options.width=430] - 二维码宽度，280-1280 px
 * @returns {Promise<Buffer>} 小程序码图片 Buffer
 */
async function generateShareQRCode(options) {
  _checkInit();

  const {
    scene,
    page = 'pages/auth/login/index',
    width = 430
  } = options;

  if (!scene) {
    throw new Error('scene 参数不能为空');
  }
  if (scene.length > 32) {
    throw new Error('scene 参数长度不能超过 32 字符');
  }

  const qrWidth = Math.max(280, Math.min(1280, width));
  const envVersion = options.envVersion || 'release';

  // 优先使用 cloud.openapi
  try {
    const result = await _cloud.openapi.wxacode.getUnlimited({
      scene,
      page,
      checkPath: false,
      width: qrWidth,
      envVersion
    });

    if (result.errCode && result.errCode !== 0) {
      throw new Error(`errCode: ${result.errCode}`);
    }

    console.log('[QRCode] cloud.openapi 生成成功, bufferLen:', result.buffer?.length);
    return result.buffer;
  } catch (openapiErr) {
    console.log('[QRCode] cloud.openapi 不可用，回退到 HTTP 方式:', openapiErr.message);
  }

  // 回退：直接调用微信 HTTP API
  const buffer = await _getUnlimitedViaHttp({ scene, page, width: qrWidth, envVersion });
  console.log('[QRCode] HTTP 方式生成成功, bufferLen:', buffer.length);
  return buffer;
}

/**
 * 生成大使专属推广码并上传云存储
 *
 * @param {Object} options
 * @param {string} options.ambassadorId - 大使 ID
 * @param {string} options.referralCode - 大使推荐码
 * @param {number} [options.width=430] - 二维码宽度
 * @returns {Promise<Object>} { buffer, cloudPath, fileID }
 */
async function generateAmbassadorQRCode(options) {
  _checkInit();

  const { ambassadorId, referralCode, width = 430 } = options;

  if (!ambassadorId || !referralCode) {
    throw new Error('ambassadorId 和 referralCode 不能为空');
  }

  const scene = `ref=${referralCode}`;
  const buffer = await generateShareQRCode({ scene, width });

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
 * 生成签到二维码并上传云存储
 *
 * @param {Object} options
 * @param {number} options.classRecordId - 排期 ID
 * @param {number} [options.width=430] - 二维码宽度
 * @returns {Promise<Object>} { buffer, cloudPath, fileID, scene }
 */
async function generateCheckinQRCode(options) {
  _checkInit();

  const { classRecordId, width = 430, envVersion = 'trial' } = options;

  if (!classRecordId) {
    throw new Error('classRecordId 不能为空');
  }

  const scene = `ci=${classRecordId}`;
  const page = 'pages/course/checkin/index';

  // 签到码默认指向体验版（trial），正式上线后改为 release
  const buffer = await generateShareQRCode({ scene, page, width, envVersion });

  const timestamp = Date.now();
  const cloudPath = `qrcodes/checkin/${classRecordId}_${timestamp}.png`;

  const uploadResult = await _cloud.uploadFile({
    cloudPath,
    fileContent: buffer
  });

  return {
    buffer,
    cloudPath,
    fileID: uploadResult.fileID,
    scene
  };
}

/**
 * 解码 scene 参数为键值对象
 * @param {string} scene - scene 字符串，如 'ref=A12345&type=1'
 * @returns {Object} 解析后的参数对象
 */
function decodeScene(scene) {
  if (!scene || typeof scene !== 'string') {
    return {};
  }

  const params = {};
  const parts = scene.split('&');

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key) {
      params[key] = value || '';
    }
  }

  return params;
}

module.exports = {
  initQRCode,
  generateShareQRCode,
  generateAmbassadorQRCode,
  generateCheckinQRCode,
  decodeScene
};
