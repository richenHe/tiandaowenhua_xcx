/**
 * 客户端接口：生成推广二维码
 * Action: generateQRCode
 *
 * 使用微信 wxacode.getUnlimited 生成专属小程序码，scene 参数格式为 "ref={referee_code}"。
 * 新用户扫码后进入登录页，login.js 解析 scene 并绑定推荐人。
 * 如大使已有 qrcode_url（云存储 fileID），直接返回，避免重复生成。
 */
const { update } = require('../../common/db');
const { response, cloudFileIDToURL } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { scene_type, test_openid } = event;
  const isTestMode = !!test_openid;

  try {
    console.log(`[generateQRCode] 生成推广码:`, { user_id: user.id, scene_type, isTestMode });

    // 仅大使（level >= 1）可生成推广码
    if (user.ambassador_level === 0) {
      return response.error('仅大使可以生成推广码');
    }

    const shareText = `我是${user.real_name || '天道文化'}大使，邀请您一起学习！`;

    // 已有二维码时直接返回，无需重新生成
    if (user.qrcode_url) {
      console.log(`[generateQRCode] 已有二维码，直接返回:`, user.qrcode_url);
      return response.success({
        qrcode_url: cloudFileIDToURL(user.qrcode_url),
        referee_code: user.referee_code,
        share_text: shareText,
        expires_at: null
      }, '推广码获取成功');
    }

    // 测试模式：跳过微信 API 调用，返回 mock 数据
    if (isTestMode) {
      return response.success({
        qrcode_url: 'https://via.placeholder.com/430x430.png?text=QRCode+Mock',
        referee_code: user.referee_code || 'TEST_CODE',
        share_text: shareText,
        expires_at: null
      }, '推广码生成成功（测试模式）');
    }

    // 生成小程序码（scene 格式：ref={referee_code}）
    const qrcode = await business.generateAmbassadorQRCode({
      ambassadorId: user.id,
      referralCode: user.referee_code,
      scene_type: scene_type || 'share'
    });

    // 将 fileID 回写到 users 表，下次直接复用
    await update('users', { qrcode_url: qrcode.fileID }, { id: user.id });
    console.log(`[generateQRCode] qrcode_url 已回写 DB, fileID:`, qrcode.fileID);

    return response.success({
      qrcode_url: cloudFileIDToURL(qrcode.fileID),
      referee_code: user.referee_code,
      share_text: shareText,
      expires_at: null
    }, '推广码生成成功');

  } catch (error) {
    console.error(`[generateQRCode] 失败:`, error);
    return response.error('生成推广码失败', error);
  }
};
