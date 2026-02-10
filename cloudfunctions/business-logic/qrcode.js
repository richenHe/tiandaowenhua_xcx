/**
 * 微信小程序码生成模块（简化版）
 *
 * 功能：生成分享码，扫码后进入小程序登录页
 *
 * 使用场景：
 *   - 大使专属推广码
 *   - 分享拉新
 */

// cloud 实例由初始化时注入
let _cloud = null;

/**
 * 初始化小程序码模块
 * @param {Object} cloud - wx-server-sdk 的 cloud 实例
 */
function initQRCode(cloud) {
  _cloud = cloud;
}

/**
 * 检查 cloud 实例是否已初始化
 * @private
 */
function _checkInit() {
  if (!_cloud) {
    throw new Error('小程序码模块未初始化，请先调用 business.init(cloud)');
  }
}

/**
 * 生成分享码（无数量限制）
 *
 * 扫码后进入指定页面（默认登录页），通过 scene 参数传递推荐码等信息
 *
 * @param {Object} options - 配置选项
 * @param {string} options.scene - 场景值，最大 32 字符，如 'ref=A12345'
 * @param {string} [options.page='pages/auth/login/index'] - 落地页路径
 * @param {number} [options.width=430] - 二维码宽度，280-1280 px
 * @returns {Promise<Buffer>} 小程序码图片 Buffer
 *
 * @example
 * const buffer = await generateShareQRCode({
 *   scene: 'ref=A12345'
 * });
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

  try {
    const result = await _cloud.openapi.wxacode.getUnlimited({
      scene,
      page,
      checkPath: false,
      width: Math.max(280, Math.min(1280, width)),
      envVersion: 'release'
    });

    if (result.errCode && result.errCode !== 0) {
      throw new Error(`生成小程序码失败: ${result.errMsg || '未知错误'} (${result.errCode})`);
    }

    return result.buffer;
  } catch (error) {
    console.error('生成分享码失败:', error);
    throw new Error(`生成分享码失败: ${error.message}`);
  }
}

/**
 * 生成大使专属推广码并上传云存储
 *
 * @param {Object} options - 配置选项
 * @param {string} options.ambassadorId - 大使 ID
 * @param {string} options.referralCode - 大使推荐码
 * @param {number} [options.width=430] - 二维码宽度
 * @returns {Promise<Object>} { buffer, cloudPath, fileID }
 *
 * @example
 * const result = await generateAmbassadorQRCode({
 *   ambassadorId: 'amb_123',
 *   referralCode: 'A12345'
 * });
 * // result.fileID 可存入数据库
 */
async function generateAmbassadorQRCode(options) {
  _checkInit();

  const {
    ambassadorId,
    referralCode,
    width = 430
  } = options;

  if (!ambassadorId || !referralCode) {
    throw new Error('ambassadorId 和 referralCode 不能为空');
  }

  // 生成 scene 参数
  const scene = `ref=${referralCode}`;

  // 生成小程序码
  const buffer = await generateShareQRCode({ scene, width });

  // 上传到云存储
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
 * 解码 scene 参数
 * 小程序端使用，将 scene 字符串解析为对象
 *
 * @param {string} scene - scene 字符串
 * @returns {Object} 解析后的参数对象
 *
 * @example
 * // 小程序端 pages/auth/login/index.js
 * onLoad(query) {
 *   if (query.scene) {
 *     const scene = decodeURIComponent(query.scene);
 *     const params = decodeScene(scene);
 *     // params = { ref: 'A12345' }
 *   }
 * }
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
  decodeScene
};
