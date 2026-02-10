/**
 * 微信退款回调处理器
 * 处理微信退款结果通知
 */
const crypto = require('crypto');
const { parseString } = require('xml2js');
const { promisify } = require('util');

const parseXML = promisify(parseString);

/**
 * 微信退款回调处理（支持 Event 和 HTTP 模式）
 * @param {Object} event - 请求事件对象
 * @param {Object} context - 上下文对象
 * @returns {Object} 响应
 */
module.exports = async (event, context) => {
  const isHTTP = context && context.httpContext;

  try {
    console.log('[Refund] 收到退款回调');

    // Event 模式测试
    if (!isHTTP) {
      return {
        success: true,
        code: 0,
        message: '退款回调接口测试成功',
        data: {
          note: '实际使用时需通过 HTTP 访问，接收微信退款的加密 XML 数据'
        }
      };
    }

    // 解析 XML 数据
    const xmlData = typeof event === 'string' ? event : JSON.stringify(event);
    const result = await parseXML(xmlData, { explicitArray: false });
    const data = result.xml;

    console.log('[Refund] 解析数据:', {
      return_code: data.return_code,
      out_trade_no: data.out_trade_no,
      out_refund_no: data.out_refund_no
    });

    // 检查通信标识
    if (data.return_code !== 'SUCCESS') {
      console.error('[Refund] 通信失败:', data.return_msg);
      return buildXMLResponse('FAIL', '通信失败');
    }

    // 解密退款信息
    const MCH_KEY = process.env.MCH_KEY || '';
    const refundInfo = decryptRefundInfo(data.req_info, MCH_KEY);

    if (!refundInfo) {
      console.error('[Refund] 解密退款信息失败');
      return buildXMLResponse('FAIL', '解密失败');
    }

    console.log('[Refund] 退款信息:', {
      out_trade_no: refundInfo.out_trade_no,
      out_refund_no: refundInfo.out_refund_no,
      refund_status: refundInfo.refund_status,
      settlement_refund_fee: refundInfo.settlement_refund_fee
    });

    // 处理退款成功逻辑
    if (refundInfo.refund_status === 'SUCCESS') {
      await handleRefundSuccess(refundInfo);
    } else {
      await handleRefundFail(refundInfo);
    }

    // 返回成功响应
    return buildXMLResponse('SUCCESS', 'OK');

  } catch (error) {
    console.error('[Refund] 处理失败:', error);
    return buildXMLResponse('FAIL', '处理失败');
  }
};

/**
 * 解密退款信息
 * @param {string} encryptedData - 加密数据
 * @param {string} mchKey - 商户密钥
 * @returns {Object|null} 解密后的退款信息
 */
function decryptRefundInfo(encryptedData, mchKey) {
  if (!mchKey) {
    console.warn('[Refund] 未配置商户密钥，无法解密');
    return null;
  }

  try {
    // 生成密钥：MD5(商户密钥)
    const key = crypto.createHash('md5').update(mchKey, 'utf8').digest('hex').toLowerCase();

    // Base64 解码
    const buffer = Buffer.from(encryptedData, 'base64');

    // AES-256-ECB 解密
    const decipher = crypto.createDecipheriv('aes-256-ecb', key, '');
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(buffer, 'binary', 'utf8');
    decrypted += decipher.final('utf8');

    // 解析 XML
    let result;
    parseString(decrypted, { explicitArray: false }, (err, parsed) => {
      if (err) {
        throw err;
      }
      result = parsed.root;
    });

    return result;

  } catch (error) {
    console.error('[Refund] 解密失败:', error);
    return null;
  }
}

/**
 * 处理退款成功逻辑
 * @param {Object} refundInfo - 退款信息
 */
async function handleRefundSuccess(refundInfo) {
  const {
    out_trade_no,           // 商户订单号
    out_refund_no,          // 商户退款单号
    refund_id,              // 微信退款单号
    settlement_refund_fee,  // 退款金额（分）
    success_time            // 退款成功时间
  } = refundInfo;

  console.log('[Refund] 处理退款成功:', {
    orderNo: out_trade_no,
    refundNo: out_refund_no,
    refundId: refund_id,
    amount: settlement_refund_fee,
    successTime: success_time
  });

  try {
    // 引入公共模块
    const { findOne, update } = require('../common/db');

    // 1. 查询订单
    const order = await findOne('orders', { order_no: out_trade_no });

    if (!order) {
      console.error('[Refund] 订单不存在:', out_trade_no);
      return;
    }

    // 检查订单是否已退款
    if (order.refund_status === 1) {
      console.warn('[Refund] 订单已退款，避免重复处理:', out_trade_no);
      return;
    }

    // 2. 更新订单退款状态
    await update('orders', {
      refund_status: 1,
      refund_time: new Date(success_time),
      refund_id: refund_id,
      refund_amount: parseInt(settlement_refund_fee) / 100,
      updated_at: new Date()
    }, { id: order.id });

    console.log('[Refund] 订单退款状态已更新');

    // 3. 如果是课程订单，删除用户课程记录
    if (order.order_type === 1) {
      const { softDelete } = require('../common/db');
      await softDelete('user_courses', {
        user_id: order.user_id,
        course_id: order.related_id,
        order_id: order.id
      });
      console.log('[Refund] 用户课程记录已删除');
    }

    // 4. 回退推荐人奖励（如果有）
    if (order.referee_id) {
      await rollbackReferralReward(order);
      console.log('[Refund] 推荐人奖励已回退');
    }

    // 5. 发送退款成功通知
    try {
      const business = require('../business-logic');
      const user = await findOne('users', { id: order.user_id });

      if (user && user._openid) {
        await business.sendSubscribeMessage({
          touser: user._openid,
          template_id: 'refund_success_template',
          data: {
            order_no: out_trade_no,
            refund_amount: (parseInt(settlement_refund_fee) / 100).toFixed(2),
            time: new Date().toLocaleString('zh-CN')
          }
        });
        console.log('[Refund] 退款成功通知已发送');
      }
    } catch (notifyError) {
      console.error('[Refund] 发送通知失败:', notifyError);
      // 通知失败不影响主流程
    }

  } catch (error) {
    console.error('[Refund] 业务处理失败:', error);
    throw error;
  }
}

/**
 * 处理退款失败逻辑
 * @param {Object} refundInfo - 退款信息
 */
async function handleRefundFail(refundInfo) {
  const {
    out_trade_no,
    out_refund_no,
    refund_status
  } = refundInfo;

  console.log('[Refund] 退款失败:', {
    orderNo: out_trade_no,
    refundNo: out_refund_no,
    status: refund_status
  });

  try {
    const { findOne, update } = require('../common/db');

    // 查询订单
    const order = await findOne('orders', { order_no: out_trade_no });

    if (!order) {
      console.error('[Refund] 订单不存在:', out_trade_no);
      return;
    }

    // 更新订单退款状态为失败
    await update('orders', {
      refund_status: 2, // 2 表示退款失败
      updated_at: new Date()
    }, { id: order.id });

    console.log('[Refund] 订单退款状态已更新为失败');

  } catch (error) {
    console.error('[Refund] 处理退款失败逻辑出错:', error);
    throw error;
  }
}

/**
 * 回退推荐人奖励
 * @param {Object} order - 订单对象
 */
async function rollbackReferralReward(order) {
  try {
    const { findOne, update, insert } = require('../common/db');

    // 查询推荐人
    const referee = await findOne('users', { id: order.referee_id });

    if (!referee) {
      console.warn('[Refund] 推荐人不存在:', order.referee_id);
      return;
    }

    // 计算需要回退的奖励金额
    const rewardAmount = order.final_amount * 0.1; // 假设奖励比例为 10%

    // 扣减推荐人的积分
    await update('users', {
      cash_points_available: referee.cash_points_available - rewardAmount,
      updated_at: new Date()
    }, { id: referee.id });

    // 记录积分变动
    await insert('cash_points_records', {
      user_id: referee.id,
      change_type: 4, // 4 表示退款扣减
      change_amount: -rewardAmount,
      balance_after: referee.cash_points_available - rewardAmount,
      related_order_id: order.id,
      remark: `订单退款，回退推荐奖励（订单号：${order.order_no}）`,
      created_at: new Date()
    });

    console.log('[Refund] 推荐人奖励已回退:', {
      refereeId: referee.id,
      amount: rewardAmount
    });

  } catch (error) {
    console.error('[Refund] 回退推荐人奖励失败:', error);
    throw error;
  }
}

/**
 * 构建 XML 响应
 * @param {string} returnCode - 返回状态码
 * @param {string} returnMsg - 返回信息
 * @returns {Object} HTTP 响应
 */
function buildXMLResponse(returnCode, returnMsg) {
  const xml = `<xml>
  <return_code><![CDATA[${returnCode}]]></return_code>
  <return_msg><![CDATA[${returnMsg}]]></return_msg>
</xml>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/xml' },
    body: xml
  };
}
