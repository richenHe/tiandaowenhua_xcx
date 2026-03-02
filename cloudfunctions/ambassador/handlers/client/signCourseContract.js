/**
 * 客户端接口：签署课程学习服务协议
 * Action: signCourseContract
 *
 * 流程：
 * 1. 验证参数（courseId + templateId + signatureFileId + agreed）
 * 2. 查询协议模板 & 用户手机号
 * 3. 下载模板 docx + 签名 PNG → 注入签名 → 上传已签版
 * 4. INSERT contract_signatures（含 course_id）
 * 5. UPDATE user_courses.contract_signed = 1
 * 
 * 与 signContract 的区别：不涉及大使等级升级逻辑
 */

const https = require('https');
const http = require('http');
const cloudbase = require('@cloudbase/node-sdk');

const { db, update } = require('../../common/db');
const { response, formatDateTime, cloudFileIDToURL } = require('../../common');

const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} 下载失败: ${url}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function buildInlineImageXml(relId, cx, cy, name, id) {
  return (
    `<w:r><w:drawing>` +
    `<wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"` +
    ` distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/>` +
    `<wp:effectExtent l="0" t="0" r="0" b="0"/>` +
    `<wp:docPr id="${id}" name="${name}"/>` +
    `<wp:cNvGraphicFramePr>` +
    `<a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>` +
    `</wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr>` +
    `<pic:cNvPr id="${id}" name="${name}"/>` +
    `<pic:cNvPicPr/>` +
    `</pic:nvPicPr>` +
    `<pic:blipFill>` +
    `<a:blip r:embed="${relId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>` +
    `<a:stretch><a:fillRect/></a:stretch>` +
    `</pic:blipFill>` +
    `<pic:spPr>` +
    `<a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
    `</pic:spPr>` +
    `</pic:pic>` +
    `</a:graphicData>` +
    `</a:graphic>` +
    `</wp:inline>` +
    `</w:drawing></w:r>`
  );
}

/**
 * 查找 <w:r> 的开始标签位置（排除 <w:rPr> 等以 <w:r 开头的标签）
 */
function findRunOpenTag(xml, beforePos) {
  let pos = beforePos;
  while (pos >= 0) {
    const idx = xml.lastIndexOf('<w:r', pos);
    if (idx === -1) return -1;
    const charAfter = xml[idx + 4];
    if (charAfter === '>' || charAfter === ' ') return idx;
    pos = idx - 1;
  }
  return -1;
}

/**
 * 在 docx XML 中找到标签文本后的冒号位置，精确插入内容。
 *
 * 核心改进：当标签与其他内容共享同一个 <w:r> run 时（如"甲方：...身份证号码："在同一 run 中），
 * 会拆分 run，确保内容插入到标签冒号之后、下一个标签之前。
 *
 * @param {string} xml       - document.xml 内容
 * @param {string} labelText - 要查找的标签（如 "甲方"、"电话"）
 * @param {string} insertXml - 要插入的 XML 内容
 * @param {number} fromPos   - 从此位置开始搜索
 */
function insertAfterLabelSmart(xml, labelText, insertXml, fromPos) {
  const labelIdx = xml.indexOf(labelText, fromPos || 0);
  if (labelIdx === -1) return xml;

  const tOpenIdx = xml.lastIndexOf('<w:t', labelIdx);
  if (tOpenIdx === -1) return xml;
  const tContentStart = xml.indexOf('>', tOpenIdx) + 1;
  const tCloseIdx = xml.indexOf('</w:t>', labelIdx);
  if (tCloseIdx === -1) return xml;

  const fullText = xml.slice(tContentStart, tCloseIdx);
  const labelPosInText = labelIdx - tContentStart;
  let splitPos = labelPosInText + labelText.length;

  // 向前搜索冒号（最多 15 字符，兼容"身份证号码："等较长标签）
  const afterLabel = fullText.slice(splitPos);
  for (let i = 0; i < Math.min(afterLabel.length, 15); i++) {
    if (afterLabel[i] === '：' || afterLabel[i] === ':') {
      splitPos += i + 1;
      break;
    }
  }

  const textBefore = fullText.slice(0, splitPos);
  const textAfter = fullText.slice(splitPos);

  // 剩余文本是否含有实际内容（中文字符或字母数字），如有则需拆分 run
  const hasRealContent = /[\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9]/.test(textAfter);
  if (!hasRealContent) {
    const runEnd = xml.indexOf('</w:r>', tCloseIdx);
    if (runEnd === -1) return xml;
    return xml.slice(0, runEnd + 6) + insertXml + xml.slice(runEnd + 6);
  }

  // 拆分 run：提取 <w:rPr>，将一个 run 拆成两个，中间插入内容
  const rOpenIdx = findRunOpenTag(xml, tOpenIdx);
  if (rOpenIdx === -1) return xml;

  const beforeT = xml.slice(rOpenIdx, tOpenIdx);
  const rPrMatch = beforeT.match(/<w:rPr>[\s\S]*?<\/w:rPr>/);
  const rPr = rPrMatch ? rPrMatch[0] : '';

  const rCloseIdx = xml.indexOf('</w:r>', tCloseIdx);
  if (rCloseIdx === -1) return xml;
  const afterRClose = rCloseIdx + '</w:r>'.length;

  let result = xml.slice(0, rOpenIdx);
  result += `<w:r>${rPr}<w:t xml:space="preserve">${textBefore}</w:t></w:r>`;
  result += insertXml;
  result += `<w:r>${rPr}<w:t xml:space="preserve">${textAfter}</w:t></w:r>`;
  result += xml.slice(afterRClose);

  return result;
}

async function injectSignatureIntoDocx(docxBuffer, signatureBuffer, phone, dateStr, realName, idNumber) {
  const PizZip = require('pizzip');
  const zip = new PizZip(docxBuffer);

  const mediaRelPath = 'media/sig_user.png';
  zip.file(`word/${mediaRelPath}`, signatureBuffer);

  const relsPath = 'word/_rels/document.xml.rels';
  const relsFile = zip.file(relsPath);
  if (!relsFile) throw new Error('无效 docx：缺少 word/_rels/document.xml.rels');
  let relsXml = relsFile.asText();
  const relId = 'rIdSig001';
  if (!relsXml.includes(relId)) {
    const rel =
      `<Relationship Id="${relId}"` +
      ` Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"` +
      ` Target="${mediaRelPath}"/>`;
    relsXml = relsXml.replace('</Relationships>', rel + '</Relationships>');
    zip.file(relsPath, relsXml);
  }

  const sigDrawing1 = buildInlineImageXml(relId, 1440000, 540000, 'UserSig1', 9901);
  const sigDrawing2 = buildInlineImageXml(relId, 1440000, 540000, 'UserSig2', 9902);
  const phoneXml = `<w:r><w:t xml:space="preserve">${phone}</w:t></w:r>`;
  const dateXml  = `<w:r><w:t xml:space="preserve">${dateStr}</w:t></w:r>`;
  const nameXml  = realName  ? `<w:r><w:t xml:space="preserve">${realName}</w:t></w:r>`  : '';
  const idXml    = idNumber  ? `<w:r><w:t xml:space="preserve">${idNumber}</w:t></w:r>` : '';

  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('无效 docx：缺少 word/document.xml');
  let docXml = docFile.asText();

  // ── Part A：签名区域注入（文档末尾） ──────────────────────────────────
  const lastJiafangIdx = docXml.lastIndexOf('甲方');
  if (lastJiafangIdx !== -1) {
    // 逆序注入（越靠后越先处理，保证之前位置的索引不受影响）
    if (docXml.indexOf('日期', lastJiafangIdx) !== -1) {
      docXml = insertAfterLabelSmart(docXml, '日期', dateXml, lastJiafangIdx);
    }
    if (docXml.indexOf('电话', lastJiafangIdx) !== -1) {
      docXml = insertAfterLabelSmart(docXml, '电话', phoneXml, lastJiafangIdx);
    }
    if (docXml.indexOf('负责人', lastJiafangIdx) !== -1) {
      docXml = insertAfterLabelSmart(docXml, '负责人', sigDrawing2, lastJiafangIdx);
    }
    docXml = insertAfterLabelSmart(docXml, '甲方', sigDrawing1, lastJiafangIdx);
    console.log('[signCourseContract] 签名区注入完成（甲方/负责人/电话/日期）');
  }

  // ── Part B：文档头部注入（姓名 + 证件号） ─────────────────────────────
  const firstJiafangIdx = docXml.indexOf('甲方');
  if (firstJiafangIdx !== -1) {
    const isHeaderArea = firstJiafangIdx < lastJiafangIdx - 100;
    if (isHeaderArea) {
      const nearbyText = docXml.slice(firstJiafangIdx, Math.min(firstJiafangIdx + 800, docXml.length));
      const hasIdField = nearbyText.includes('身份证') || nearbyText.includes('证件号');

      // 逆序注入头部：身份证（后面的）→ 甲方姓名（前面的）
      if (hasIdField && idXml) {
        const idLabelText = nearbyText.includes('身份证') ? '身份证' : '证件号';
        docXml = insertAfterLabelSmart(docXml, idLabelText, idXml, firstJiafangIdx);
        console.log('[signCourseContract] 头部证件号注入完成');
      }
      if (nameXml) {
        docXml = insertAfterLabelSmart(docXml, '甲方', nameXml, firstJiafangIdx);
        console.log('[signCourseContract] 头部姓名注入完成');
      }
    }
  }

  zip.file('word/document.xml', docXml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { courseId, templateId, template_id, signatureFileId, agreed, idNumber } = event;
  const finalTemplateId = templateId || template_id;

  try {
    console.log(`[signCourseContract] 签署课程学习协议:`, { user_id: user.id, courseId, template_id: finalTemplateId });

    if (!courseId) {
      return response.paramError('缺少必要参数: courseId');
    }
    if (!finalTemplateId || agreed !== true) {
      return response.paramError('缺少必要参数或未同意协议');
    }
    if (!signatureFileId) {
      return response.paramError('缺少手写签名文件（signatureFileId）');
    }

    // 查询协议模板
    const { data: template, error: templateError } = await db
      .from('contract_templates')
      .select('*')
      .eq('id', finalTemplateId)
      .single();

    if (templateError || !template) {
      return response.error('协议模板不存在');
    }
    if (template.status !== 1) {
      return response.error('该协议已停用');
    }
    if (!template.contract_file_id) {
      return response.error('该协议模板未配置电子合同文件，请联系管理员');
    }

    // 检查是否已签署
    const { data: existing } = await db
      .from('contract_signatures')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', Number(courseId))
      .eq('status', 1)
      .single();

    if (existing) {
      // 已签过，确保 user_courses 标记一致后直接返回
      await update('user_courses', { contract_signed: 1 }, { user_id: user.id, course_id: Number(courseId) });
      return response.error('您已签署过该课程的学习服务协议');
    }

    // 查用户信息
    const { data: userInfo } = await db
      .from('users')
      .select('phone, real_name')
      .eq('id', user.id)
      .single();

    const userPhone = userInfo?.phone || '';
    const userRealName = userInfo?.real_name || '';

    // 计算合约有效期（北京时间 UTC+8）
    const { formatBeijingDate } = require('../../common/utils');
    const signDate = new Date(Date.now() + 8 * 3600000);
    const contractStart = formatBeijingDate(new Date());
    const contractEndDate = new Date(signDate);
    contractEndDate.setUTCFullYear(contractEndDate.getUTCFullYear() + (template.validity_years || 1));
    // signDate 已含 +8h 偏移，直接用 UTC 方法取北京日期，避免 formatBeijingDate 再加一次 +8h
    const contractEnd = `${contractEndDate.getUTCFullYear()}-${String(contractEndDate.getUTCMonth() + 1).padStart(2, '0')}-${String(contractEndDate.getUTCDate()).padStart(2, '0')}`;

    const y = signDate.getUTCFullYear();
    const m = String(signDate.getUTCMonth() + 1).padStart(2, '0');
    const d2 = String(signDate.getUTCDate()).padStart(2, '0');
    const signDateCN = `${y}年${m}月${d2}日`;

    // 尝试生成已签版 docx
    let signedFileId = template.contract_file_id;
    const isDocx = (template.contract_file_id || '').toLowerCase().includes('.docx')
      || (template.contract_name || '').toLowerCase().includes('.docx');

    if (isDocx) {
      try {
        const templateUrl = cloudFileIDToURL(template.contract_file_id);
        const docxBuffer = await downloadBuffer(templateUrl);
        const signatureUrl = cloudFileIDToURL(signatureFileId);
        const signatureBuffer = await downloadBuffer(signatureUrl);

        const signedBuffer = await injectSignatureIntoDocx(
          docxBuffer, signatureBuffer, userPhone, signDateCN, userRealName, idNumber || ''
        );

        const signedCloudPath = `contracts/signed/course_${courseId}_${user.id}_${Date.now()}.docx`;
        const uploadResult = await app.uploadFile({
          cloudPath: signedCloudPath,
          fileContent: signedBuffer
        });
        signedFileId = uploadResult.fileID;
        console.log('[signCourseContract] 已签版 docx 上传成功:', signedFileId);
      } catch (docxErr) {
        console.warn('[signCourseContract] docx 签名注入失败（回退到原模板）:', docxErr.message || docxErr);
        signedFileId = template.contract_file_id;
      }
    }

    // 创建签署记录
    const { data: newSignature, error: insertError } = await db
      .from('contract_signatures')
      .insert({
        user_id: user.id,
        _openid: OPENID || '',
        contract_template_id: finalTemplateId,
        ambassador_level: user.ambassador_level || 0,
        course_id: Number(courseId),
        contract_name: template.contract_name,
        contract_version: template.version,
        contract_content: '',
        contract_file_id: signedFileId,
        signature_image_id: signatureFileId,
        contract_start: contractStart,
        contract_end: contractEnd,
        sign_time: formatDateTime(signDate),
        status: 1,
        sign_ip: event.ip_address || '',
        sign_device: event.device_info || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('[signCourseContract] 创建签署记录失败:', insertError);
      throw insertError;
    }

    // 更新 user_courses.contract_signed = 1
    await update('user_courses', { contract_signed: 1 }, { user_id: user.id, course_id: Number(courseId) });
    console.log(`[signCourseContract] user_courses.contract_signed 已更新 user_id=${user.id} course_id=${courseId}`);

    // 签约后触发推荐人奖励（支付时已跳过即时发放）
    await grantRefereeRewardAfterSign(user.id, Number(courseId), db);

    return response.success({
      signature_id: newSignature.id,
      signed_at: newSignature.sign_time,
      message: '学习服务协议签署成功'
    }, '签署成功');

  } catch (error) {
    console.error('[signCourseContract] 失败:', error);
    return response.error('签署课程学习协议失败', error);
  }
};

/**
 * 签约后发放推荐人奖励
 *
 * 查询该用户该课程对应的已支付、未发放奖励的订单，
 * 按 payment.js 中 calculateAndGrantReward 的完整规则发放。
 *
 * @param {number} userId   - 购课用户 ID
 * @param {number} courseId - 课程 ID
 * @param {Object} db       - Supabase 风格 DB 实例
 */
async function grantRefereeRewardAfterSign(userId, courseId, db) {
  try {
    const { data: orders } = await db
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .eq('related_id', courseId)
      .eq('order_type', 1)
      .eq('pay_status', 1)
      .eq('is_reward_granted', 0);

    if (!orders || orders.length === 0) {
      console.log('[signCourseContract] 无待发放奖励的订单, userId:', userId, 'courseId:', courseId);
      return;
    }

    const order = orders[0];
    if (!order.referee_id) {
      console.log('[signCourseContract] 订单无推荐人，标记已处理:', order.order_no);
      await markRewardGranted(db, order.order_no);
      return;
    }

    const { data: course } = await db
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (!course) {
      console.error('[signCourseContract] 课程不存在:', courseId);
      return;
    }

    const { data: referee } = await db
      .from('users')
      .select('*')
      .eq('id', order.referee_id)
      .single();

    if (!referee) {
      console.log('[signCourseContract] 推荐人不存在，跳过');
      await markRewardGranted(db, order.order_no);
      return;
    }

    const { data: config } = await db
      .from('ambassador_level_configs')
      .select('*')
      .eq('level', referee.ambassador_level)
      .single();

    if (!config || !config.can_earn_reward) {
      console.log('[signCourseContract] 推荐人等级不可获得奖励, level:', referee.ambassador_level);
      await markRewardGranted(db, order.order_no);
      return;
    }

    const { data: buyer } = await db
      .from('users')
      .select('real_name')
      .eq('id', order.user_id)
      .single();

    const buyerName = buyer?.real_name || '';
    const baseAmount = parseFloat(order.final_amount);
    const frozenBalance = parseFloat(referee.cash_points_frozen) || 0;
    const unfreezeAmount = parseFloat(config.unfreeze_per_referral) || 0;

    // 优先级1：初探班 + 有冻结积分 → 解冻
    if (course.type === 1 && unfreezeAmount > 0 && frozenBalance >= unfreezeAmount) {
      const newFrozen = frozenBalance - unfreezeAmount;
      const newAvailable = (parseFloat(referee.cash_points_available) || 0) + unfreezeAmount;

      await db.from('users').update({
        cash_points_frozen: newFrozen,
        cash_points_available: newAvailable
      }).eq('id', referee.id);

      await db.from('cash_points_records').insert({
        user_id: referee.id,
        _openid: referee._openid || '',
        type: 2,
        amount: unfreezeAmount,
        frozen_after: newFrozen,
        available_after: newAvailable,
        order_no: order.order_no,
        referee_user_id: order.user_id,
        referee_user_name: buyerName,
        remark: `推荐学员购买${course.name}，解冻积分`,
        created_at: formatDateTime(new Date())
      });

      console.log('[signCourseContract] 解冻积分:', unfreezeAmount, 'frozen:', newFrozen, 'available:', newAvailable);
      await markRewardGranted(db, order.order_no);
      return;
    }

    // 优先级2：按比例发放（功德分和积分互斥）
    const meritRate = course.type === 1
      ? (parseFloat(config.merit_rate_basic) || 0)
      : (parseFloat(config.merit_rate_advanced) || 0);
    const cashRate = course.type === 1
      ? (parseFloat(config.cash_rate_basic) || 0)
      : (parseFloat(config.cash_rate_advanced) || 0);

    if (meritRate > 0) {
      const meritPoints = Math.round(baseAmount * meritRate * 100) / 100;
      if (meritPoints > 0) {
        const { data: currentRef } = await db
          .from('users').select('merit_points').eq('id', referee.id).single();
        const newBalance = (parseFloat(currentRef?.merit_points) || 0) + meritPoints;

        await db.from('users').update({ merit_points: newBalance }).eq('id', referee.id);
        await db.from('merit_points_records').insert({
          user_id: referee.id,
          _openid: referee._openid || '',
          type: 1,
          source: course.type === 1 ? 1 : 2,
          amount: meritPoints,
          balance_after: newBalance,
          order_no: order.order_no,
          referee_user_id: order.user_id,
          referee_user_name: buyerName,
          remark: `推荐学员购买${course.name}，${(meritRate * 100).toFixed(0)}%功德分`,
          created_at: formatDateTime(new Date())
        });
        console.log('[signCourseContract] 功德分已发放:', meritPoints, '余额:', newBalance);
      }
    } else if (cashRate > 0) {
      const cashPoints = Math.round(baseAmount * cashRate * 100) / 100;
      if (cashPoints > 0) {
        const { data: currentRef } = await db
          .from('users').select('cash_points_available').eq('id', referee.id).single();
        const newAvailable = (parseFloat(currentRef?.cash_points_available) || 0) + cashPoints;

        await db.from('users').update({ cash_points_available: newAvailable }).eq('id', referee.id);
        await db.from('cash_points_records').insert({
          user_id: referee.id,
          _openid: referee._openid || '',
          type: 3,
          amount: cashPoints,
          available_after: newAvailable,
          order_no: order.order_no,
          referee_user_id: order.user_id,
          referee_user_name: buyerName,
          remark: `推荐学员购买${course.name}，${(cashRate * 100).toFixed(0)}%可提现积分`,
          created_at: formatDateTime(new Date())
        });
        console.log('[signCourseContract] 可提现积分已发放:', cashPoints, 'available:', newAvailable);
      }
    } else {
      console.log('[signCourseContract] 该等级未配置奖励比例，跳过');
    }

    await markRewardGranted(db, order.order_no);
  } catch (rewardError) {
    console.error('[signCourseContract] 推荐人奖励发放失败（不影响签约结果）:', rewardError);
  }
}

/**
 * 标记订单奖励已发放
 */
async function markRewardGranted(db, orderNo) {
  await db.from('orders').update({
    is_reward_granted: 1,
    reward_granted_at: formatDateTime(new Date())
  }).eq('order_no', orderNo);
  console.log('[signCourseContract] 订单已标记 is_reward_granted=1:', orderNo);
}
