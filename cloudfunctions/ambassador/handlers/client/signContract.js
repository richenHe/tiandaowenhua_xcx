/**
 * 客户端接口：签署协议
 * Action: signContract
 *
 * 流程：
 * 1. 验证参数（templateId + signatureFileId + agreed）
 * 2. 查询协议模板 & 当前用户手机号
 * 3. 下载模板 docx + 签名 PNG
 * 4. 用 docxtemplater 注入签名图片 / 电话 / 日期，生成已签版 docx
 * 5. 上传已签版 docx 到云存储
 * 6. INSERT contract_signatures（含 signature_image_id）
 * 7. 判断等级升级
 */

const https = require('https');
const http = require('http');
const cloudbase = require('@cloudbase/node-sdk');

const { db, update, insert } = require('../../common/db');
const { response, formatDateTime, cloudFileIDToURL } = require('../../common');

// 初始化 CloudBase app（用于上传文件）
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });

/**
 * 通过 HTTPS/HTTP 下载文件，返回 Buffer
 */
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

/**
 * 构造 OOXML 内联图片 drawing XML
 * cx/cy 单位为 EMU（1cm = 360000 EMU）
 */
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

/**
 * 直接扫描 docx XML，注入签名/电话/日期（签名区域）以及姓名/证件号（文档头部）。
 * 无需模板占位符，适用于任意标准 Word 合同。
 *
 * 定位策略（签名区）：
 *   取文档 LAST 一个「甲方」—— 正文条款中的甲方在前，签名区在末尾。
 *   然后从该位置向后查找「负责人」「电话」「日期」——表格左列先于右列出现在 XML 中。
 *   注入顺序逆序（从文档末尾向前），保证先插入不影响后续位置计算。
 *
 * 定位策略（头部区）：
 *   取文档 FIRST 一个「甲方」，并检查其附近是否有「身份证」字样（头部特征）。
 */
async function injectSignatureIntoDocx(docxBuffer, signatureBuffer, phone, dateStr, realName, idNumber) {
  const PizZip = require('pizzip');
  const zip = new PizZip(docxBuffer);

  // 1. 将签名 PNG 写入 word/media/
  const mediaRelPath = 'media/sig_user.png';
  zip.file(`word/${mediaRelPath}`, signatureBuffer);

  // 2. 在 word/_rels/document.xml.rels 中添加图片关系
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

  // 3. 构造 drawing XML（宽 4cm × 高 1.5cm）+ 文本 XML
  const sigDrawing1 = buildInlineImageXml(relId, 1440000, 540000, 'UserSig1', 9901);
  const sigDrawing2 = buildInlineImageXml(relId, 1440000, 540000, 'UserSig2', 9902);
  const phoneXml = `<w:r><w:t xml:space="preserve">${phone}</w:t></w:r>`;
  const dateXml  = `<w:r><w:t xml:space="preserve">${dateStr}</w:t></w:r>`;
  const nameXml  = realName  ? `<w:r><w:t xml:space="preserve">${realName}</w:t></w:r>`  : '';
  const idXml    = idNumber  ? `<w:r><w:t xml:space="preserve">${idNumber}</w:t></w:r>` : '';

  // 4. 修改 word/document.xml
  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('无效 docx：缺少 word/document.xml');
  let docXml = docFile.asText();

  // ── Part A：签名区域注入（文档末尾） ──────────────────────────────────
  const lastJiafangIdx = docXml.lastIndexOf('甲方');
  if (lastJiafangIdx === -1) {
    console.warn('[signContract] 未找到「甲方」字样，跳过签名区注入');
  } else {
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
    console.log('[signContract] 签名区注入完成（甲方/负责人/电话/日期）');
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
        console.log('[signContract] 头部证件号注入完成');
      }
      if (nameXml) {
        docXml = insertAfterLabelSmart(docXml, '甲方', nameXml, firstJiafangIdx);
        console.log('[signContract] 头部姓名注入完成');
      }
    }
  }

  zip.file('word/document.xml', docXml);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { templateId, template_id, signatureFileId, agreed, idNumber } = event;
  const finalTemplateId = templateId || template_id;

  try {
    console.log(`[signContract] 签署协议:`, { user_id: user.id, template_id: finalTemplateId });

    // ── 参数验证 ──────────────────────────────────────────────────────────────
    if (!finalTemplateId || agreed !== true) {
      return response.paramError('缺少必要参数或未同意协议');
    }
    if (!signatureFileId) {
      return response.paramError('缺少手写签名文件（signatureFileId）');
    }

    // ── 查询协议模板 ──────────────────────────────────────────────────────────
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

    // ── 检查是否已签署（按等级判断）──────────────────────────────
    const { data: existingList } = await db
      .from('contract_signatures')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('ambassador_level', template.ambassador_level)
      .eq('status', 1)
      .limit(1);

    if (existingList && existingList.length > 0) {
      return response.error('您已签署过该等级的协议');
    }

    // ── 查询用户信息 ───────────────────────────────────────────────────────────
    const { data: userInfo } = await db
      .from('users')
      .select('phone, real_name')
      .eq('id', user.id)
      .single();

    const userPhone = userInfo?.phone || '';
    const userRealName = userInfo?.real_name || '';

    // ── 计算合约有效期（北京时间 UTC+8）────────────────────────────────────────
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

    // ── 尝试生成已签版 docx ───────────────────────────────────────────────────
    let signedFileId = template.contract_file_id; // 默认回退：使用原模板

    const isDocx = (template.contract_file_id || '').toLowerCase().includes('.docx')
      || (template.contract_name || '').toLowerCase().includes('.docx');

    if (isDocx) {
      try {
        console.log('[signContract] 开始生成已签版 docx');

        // 1. 下载模板 docx
        const templateUrl = cloudFileIDToURL(template.contract_file_id);
        const docxBuffer = await downloadBuffer(templateUrl);

        // 2. 下载签名图片
        const signatureUrl = cloudFileIDToURL(signatureFileId);
        const signatureBuffer = await downloadBuffer(signatureUrl);

        // 3. 注入签名/电话/日期 + 头部姓名/证件号
        const signedBuffer = await injectSignatureIntoDocx(
          docxBuffer,
          signatureBuffer,
          userPhone,
          signDateCN,
          userRealName,
          idNumber || ''
        );

        // 4. 上传已签版 docx
        const signedCloudPath = `contracts/signed/${user.id}_${Date.now()}.docx`;
        const uploadResult = await app.uploadFile({
          cloudPath: signedCloudPath,
          fileContent: signedBuffer
        });
        signedFileId = uploadResult.fileID;
        console.log('[signContract] 已签版 docx 上传成功:', signedFileId);
      } catch (docxErr) {
        // docx 处理失败时记录警告但不中断签署流程，使用原模板文件作为合同快照
        console.warn('[signContract] docx 签名注入失败（已回退到原模板）:', docxErr.message || docxErr);
        signedFileId = template.contract_file_id;
      }
    } else {
      // PDF 等非 docx 文件无法注入，直接使用原模板作为合同快照
      console.log('[signContract] 模板为非 docx 文件，跳过签名注入，使用原文件');
      signedFileId = template.contract_file_id;
    }

    // ── 创建签署记录（status=1 直接生效） ────────────────────────────────────────
    const nowStr = formatDateTime(signDate);
    const { data: newSignature, error: insertError } = await db
      .from('contract_signatures')
      .insert({
        user_id:              user.id,
        user_name:            userInfo?.real_name || '',
        _openid:              OPENID || '',
        contract_template_id: finalTemplateId,
        ambassador_level:     template.ambassador_level,
        contract_name:        template.contract_name,
        contract_version:     template.version,
        contract_content:     '',
        contract_file_id:     signedFileId,
        signature_image_id:   signatureFileId,
        contract_start:       contractStart,
        contract_end:         contractEnd,
        sign_time:            nowStr,
        status:               1,
        sign_ip:              event.ip_address || '',
        sign_device:          event.device_info || null
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[signContract] 创建签署记录失败:`, insertError);
      throw insertError;
    }

    console.log(`[signContract] 用户 ${user.id} 签署协议成功，直接生效，signature_id=${newSignature.id}`);

    // ── 直接执行大使升级逻辑（无需审核） ──────────────────────────────────────
    const targetLevel = template.ambassador_level;
    const today = contractStart;

    await update('users',
      { ambassador_level: targetLevel, ambassador_start_date: today },
      { id: user.id }
    );
    console.log(`[signContract] 用户 ${user.id} 升级至等级 ${targetLevel}`);

    // 查看等级配置，判断是否需发冻结积分
    const { data: levelConfig } = await db
      .from('ambassador_level_configs')
      .select('upgrade_payment_amount, frozen_points')
      .eq('level', targetLevel)
      .single();

    const needsPayment = levelConfig && Number(levelConfig.upgrade_payment_amount) > 0;
    if (needsPayment) {
      const { count: paidCount } = await db
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('order_type', 4)
        .eq('related_id', targetLevel)
        .eq('pay_status', 1);

      if ((paidCount || 0) > 0) {
        const frozenPoints = Number(levelConfig.frozen_points || 0);
        if (frozenPoints > 0) {
          const { data: currentUser } = await db
            .from('users')
            .select('cash_points_frozen')
            .eq('id', user.id)
            .single();

          const currentFrozen = Number(currentUser?.cash_points_frozen || 0);
          await update('users',
            { cash_points_frozen: currentFrozen + frozenPoints },
            { id: user.id }
          );

          const levelNameMap = { 2: '青鸾', 3: '鸿鹄', 4: '金凤' };
          const levelLabel = levelNameMap[targetLevel] || `等级${targetLevel}`;

          await insert('cash_points_records', {
            user_id:    user.id,
            _openid:    OPENID || '',
            type:       1,
            amount:     frozenPoints,
            remark:     `升级${levelLabel}大使升级费转为冻结积分`,
            created_at: nowStr
          });

          console.log(`[signContract] 用户 ${user.id} 获得 ${frozenPoints} 冻结积分`);
        }
      }
    }

    const levelNameMap = { 1: '准青鸾', 2: '青鸾', 3: '鸿鹄', 4: '金凤' };
    return response.success({
      signature_id:     newSignature.id,
      ambassador_level: targetLevel,
      level_name:       levelNameMap[targetLevel] || `等级${targetLevel}`,
      signed_at:        newSignature.sign_time,
      message:          `签署成功，您已升级为${levelNameMap[targetLevel] || ''}大使`
    }, '签署成功');

  } catch (error) {
    console.error(`[signContract] 失败:`, error);
    return response.error('签署协议失败', error);
  }
};
