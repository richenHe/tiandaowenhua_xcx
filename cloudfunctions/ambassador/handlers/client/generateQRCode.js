/**
 * 客户端接口：生成推广二维码
 * Action: generateQRCode
 */
const { response } = require('../../common');
const business = require('../../business-logic');

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { scene_type, test_openid } = event;
  const isTestMode = !!test_openid;

  try {
    console.log(`[generateQRCode] 生成推广码:`, { user_id: user.id, scene_type, isTestMode });

    // 验证是否为大使
    if (user.ambassador_level === 0) {
      return response.error('仅大使可以生成推广码');
    }

    // 测试模式：跳过微信 API 调用，返回 mock 数据
    if (isTestMode) {
      return response.success({
        qrcode_url: 'https://via.placeholder.com/430x430.png?text=QRCode+Mock',
        referee_code: user.referee_code || 'TEST_CODE',
        share_text: `我是${user.real_name || '天道文化'}大使，邀请您一起学习！`,
        expires_at: null
      }, '推广码生成成功（测试模式）');
    }

    // 生成小程序码
    const qrcode = await business.generateAmbassadorQRCode({
      ambassadorId: user.id,
      referralCode: user.referee_code,
      scene_type: scene_type || 'share'
    });

    return response.success({
      qrcode_url: qrcode.url,
      referee_code: user.referee_code,
      share_text: `我是${user.real_name || '天道文化'}大使，邀请您一起学习！`,
      expires_at: qrcode.expires_at
    }, '推广码生成成功');

  } catch (error) {
    console.error(`[generateQRCode] 失败:`, error);
    return response.error('生成推广码失败', error);
  }
};
