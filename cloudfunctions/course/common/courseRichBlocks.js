/**
 * 课程简介 / 课程大纲 图文块（文字 + 云存储图片）
 * DB：description_blocks、outline_blocks 存 JSON 数组；兼容旧版 description、outline
 */

const { cloudFileIDToURL } = require('./utils');

/**
 * 文字块可能含后台富文本 HTML，生成 description / outline 纯文本时用（无 DOM 环境）
 * @param {string} html
 * @returns {string}
 */
function htmlToPlainText(html) {
  if (html == null || html === '') return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 解析任意入参为数组（DB 字符串 / 已解析数组）
 * @param {unknown} raw
 * @returns {object[]}
 */
function parseBlocksRaw(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

/**
 * 清洗写入前的块列表（管理端 / 接口入参）
 * @param {unknown} input
 * @returns {{ type: 'text'|'image', text?: string, image?: string }[]}
 */
function sanitizeBlocksInput(input) {
  const arr = parseBlocksRaw(input);
  const out = [];
  for (const b of arr) {
    if (!b || typeof b !== 'object') continue;
    if (b.type === 'text') {
      const text = typeof b.text === 'string' ? b.text : (b.text != null ? String(b.text) : '');
      out.push({ type: 'text', text });
    } else if (b.type === 'image') {
      const image = typeof b.image === 'string' ? b.image.trim() : '';
      if (image) out.push({ type: 'image', image });
    }
  }
  return out;
}

/**
 * @param {unknown} blocks
 * @returns {string|null} JSON 字符串，无块时 null
 */
function serializeBlocksForDb(blocks) {
  const s = sanitizeBlocksInput(blocks);
  if (s.length === 0) return null;
  return JSON.stringify(s);
}

/**
 * 用于列表关键词搜索、旧字段 description（varchar 500）
 * @param {unknown} blocks
 * @param {number} maxLen
 * @returns {string|null}
 */
function blocksToDescriptionPlain(blocks, maxLen = 500) {
  const s = sanitizeBlocksInput(blocks);
  const parts = [];
  for (const b of s) {
    if (b.type === 'text' && b.text) parts.push(htmlToPlainText(b.text));
  }
  const t = parts.join('\n').trim();
  if (!t) return null;
  if (maxLen && t.length > maxLen) return t.slice(0, maxLen);
  return t;
}

/**
 * 旧版 outline 列：JSON 字符串数组，仅含文字（图片大纲不落在此列）
 * @param {unknown} blocks
 * @returns {string} JSON.stringify(string[])
 */
function blocksToOutlineLegacyJson(blocks) {
  const s = sanitizeBlocksInput(blocks);
  const lines = [];
  for (const b of s) {
    if (b.type === 'text' && b.text) {
      htmlToPlainText(b.text).split('\n').forEach((line) => {
        const x = String(line).trim();
        if (x) lines.push(x);
      });
    }
  }
  return JSON.stringify(lines);
}

/**
 * 旧 outline（JSON 数组或纯字符串）→ 仅文字块
 * @param {unknown} outlineVal
 * @returns {{ type: 'text', text: string }[]}
 */
function legacyOutlineToBlocks(outlineVal) {
  if (outlineVal == null || outlineVal === '') return [];
  let arr = [];
  if (typeof outlineVal === 'string') {
    try {
      const p = JSON.parse(outlineVal);
      arr = Array.isArray(p) ? p : (outlineVal.trim() ? [outlineVal] : []);
    } catch (e) {
      arr = outlineVal.trim() ? [outlineVal] : [];
    }
  } else if (Array.isArray(outlineVal)) {
    arr = outlineVal;
  }
  return arr
    .filter((x) => x != null && String(x).trim())
    .map((x) => ({ type: 'text', text: String(x).trim() }));
}

/**
 * 接口出参：图文块内图片转为 CDN URL；outline 保留为纯文字数组（兼容旧前端）
 * @param {object} row
 */
function enrichCourseRichFieldsForClient(row) {
  if (!row || typeof row !== 'object') return;

  let descBlocks = sanitizeBlocksInput(parseBlocksRaw(row.description_blocks));
  if (descBlocks.length === 0 && row.description) {
    descBlocks = [{ type: 'text', text: String(row.description) }];
  }
  row.description_blocks = descBlocks.map((b) => {
    if (b.type === 'image') {
      return { type: 'image', image: cloudFileIDToURL(b.image || '') };
    }
    return { type: 'text', text: b.text || '' };
  });

  let outBlocks = sanitizeBlocksInput(parseBlocksRaw(row.outline_blocks));
  if (outBlocks.length === 0) {
    outBlocks = legacyOutlineToBlocks(row.outline);
  }
  row.outline_blocks = outBlocks.map((b) => {
    if (b.type === 'image') {
      return { type: 'image', image: cloudFileIDToURL(b.image || '') };
    }
    return { type: 'text', text: b.text || '' };
  });

  const textOnly = [];
  for (const b of row.outline_blocks) {
    if (b.type === 'text' && b.text) {
      htmlToPlainText(b.text).split('\n').forEach((line) => {
        const x = line.trim();
        if (x) textOnly.push(x);
      });
    }
  }
  row.outline = textOnly;
}

module.exports = {
  parseBlocksRaw,
  sanitizeBlocksInput,
  serializeBlocksForDb,
  blocksToDescriptionPlain,
  blocksToOutlineLegacyJson,
  legacyOutlineToBlocks,
  enrichCourseRichFieldsForClient,
  htmlToPlainText,
};
