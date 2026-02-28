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

const { db, update } = require('../../common/db');
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
 * 将签名图片和文本注入 docx 模板，返回已签版 Buffer
 * 模板中需预留占位符：
 *   {%signature}  × 2（甲方/负责人签名，图片占位）
 *   {phone}       × 1（自动填入用户手机号）
 *   {date}        × 1（自动填入签署日期，格式 YYYY年MM月DD日）
 */
async function injectSignatureIntoDocx(docxBuffer, signatureBuffer, phone, dateStr) {
  // 动态 require（只有 ambassador 云函数才装了这些包）
  const PizZip = require('pizzip');
  const Docxtemplater = require('docxtemplater');
  const ImageModule = require('docxtemplater-image-module-free');

  const imageModule = new ImageModule({
    centered: false,
    fileType: 'docx',
    getImage(tagValue) {
      // tagValue 就是 data.signature（Buffer）
      if (Buffer.isBuffer(tagValue)) return tagValue;
      return null;
    },
    getSize() {
      // 签名图片尺寸：宽 150px × 高 55px（约 4cm × 1.5cm @96dpi）
      return [150, 55];
    }
  });

  const zip = new PizZip(docxBuffer);
  const doc = new Docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true,
    // 占位符缺失时不报错，返回空字符串
    nullGetter(part) {
      if (!part.module) return '';
      return null;
    }
  });

  doc.render({
    signature: signatureBuffer,  // 对应模板中的 {%signature}
    phone,                       // 对应模板中的 {phone}
    date: dateStr                // 对应模板中的 {date}
  });

  return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = async (event, context) => {
  const { OPENID, user } = context;
  const { templateId, template_id, signatureFileId, agreed } = event;
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

    // ── 检查是否已签署 ────────────────────────────────────────────────────────
    const { data: existing } = await db
      .from('contract_signatures')
      .select('id')
      .eq('user_id', user.id)
      .eq('contract_template_id', finalTemplateId)
      .single();

    if (existing) {
      return response.error('您已签署过该协议');
    }

    // ── 查询用户手机号 ────────────────────────────────────────────────────────
    const { data: userInfo } = await db
      .from('users')
      .select('phone, real_name')
      .eq('id', user.id)
      .single();

    const userPhone = userInfo?.phone || '';

    // ── 计算合约有效期 ────────────────────────────────────────────────────────
    const formatDate = (d) => d.toISOString().slice(0, 10);
    const signDate = new Date();
    const contractStart = formatDate(signDate);
    const contractEndDate = new Date(signDate);
    contractEndDate.setFullYear(contractEndDate.getFullYear() + (template.validity_years || 1));
    const contractEnd = formatDate(contractEndDate);

    // 签署日期（中文格式，用于注入合同）
    const y = signDate.getFullYear();
    const m = String(signDate.getMonth() + 1).padStart(2, '0');
    const d2 = String(signDate.getDate()).padStart(2, '0');
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

        // 3. 注入签名/电话/日期
        const signedBuffer = await injectSignatureIntoDocx(
          docxBuffer,
          signatureBuffer,
          userPhone,
          signDateCN
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

    // ── 创建签署记录 ──────────────────────────────────────────────────────────
    const { data: newSignature, error: insertError } = await db
      .from('contract_signatures')
      .insert({
        user_id: user.id,
        _openid: OPENID || '',
        contract_template_id: finalTemplateId,
        ambassador_level: template.ambassador_level,
        contract_name: template.contract_name,
        contract_version: template.version,
        // 已签版文件（含手写签名）
        contract_file_id: signedFileId,
        // 原始手写签名图片 cloud:// 路径
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
      console.error(`[signContract] 创建签署记录失败:`, insertError);
      throw insertError;
    }

    // ── 判断等级升级 ──────────────────────────────────────────────────────────
    const targetLevel = template.ambassador_level;
    let levelUpgraded = false;

    const { data: levelConfig } = await db
      .from('ambassador_level_configs')
      .select('upgrade_payment_amount')
      .eq('level', targetLevel)
      .single();

    const needsPayment = levelConfig && Number(levelConfig.upgrade_payment_amount) > 0;

    if (!needsPayment) {
      const today = new Date().toISOString().slice(0, 10);
      await update('users',
        {
          ambassador_level: targetLevel,
          ambassador_start_date: today
        },
        { id: user.id }
      );
      levelUpgraded = true;
      console.log(`[signContract] 用户 ${user.id} 升级至等级 ${targetLevel}`);
    }

    return response.success({
      signature_id: newSignature.id,
      ambassador_level: targetLevel,
      level_upgraded: levelUpgraded,
      needs_payment: needsPayment,
      signed_at: newSignature.sign_time,
      message: levelUpgraded ? '协议签署成功，等级已升级' : '协议签署成功，请完成支付后升级等级'
    }, '签署成功');

  } catch (error) {
    console.error(`[signContract] 失败:`, error);
    return response.error('签署协议失败', error);
  }
};
