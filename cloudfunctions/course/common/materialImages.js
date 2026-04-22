/**
 * 朋友圈素材（academy_materials）多图字段解析与归一化
 * DB：`images` 为 JSON 数组（cloud:// fileID，最多 9 条）；空则兼容旧数据 `image_url` 单图
 */

/**
 * 将 DB 中的 images 列解析为 fileID 字符串数组
 * @param {unknown} raw - JSON 列或已解析的数组
 * @returns {string[]}
 */
function parseImagesColumn(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw.map((s) => String(s || '').trim()).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p.map((s) => String(s || '').trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * 合并 images 列与旧版 image_url，得到最多 9 个 fileID
 * @param {{ images?: unknown, image_url?: string|null }} row
 * @returns {string[]}
 */
function getMaterialImageFileIds(row) {
  const fromJson = parseImagesColumn(row.images);
  if (fromJson.length) return fromJson.slice(0, 9);
  if (row.image_url) return [String(row.image_url).trim()].filter(Boolean);
  return [];
}

/**
 * 校验并截断为最多 9 个非空 fileID（写入 DB 前）
 * @param {unknown} imageUrls
 * @param {string} [legacyImageUrl] - 兼容仅传 imageUrl 的旧客户端
 * @returns {string[]}
 */
function normalizeImageUrlsForSave(imageUrls, legacyImageUrl) {
  let list = [];
  if (Array.isArray(imageUrls)) {
    list = imageUrls.map((s) => String(s || '').trim()).filter(Boolean);
  } else if (imageUrls && typeof imageUrls === 'string') {
    try {
      const p = JSON.parse(imageUrls);
      if (Array.isArray(p)) list = p.map((s) => String(s || '').trim()).filter(Boolean);
    } catch {
      list = [];
    }
  }
  if (!list.length && legacyImageUrl) {
    list = [String(legacyImageUrl).trim()].filter(Boolean);
  }
  return list.slice(0, 9);
}

module.exports = {
  parseImagesColumn,
  getMaterialImageFileIds,
  normalizeImageUrlsForSave
};
