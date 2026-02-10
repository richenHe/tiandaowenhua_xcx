/**
 * 配置缓存管理模块
 * 从 ambassador_level_configs 表读取大使等级配置，带内存缓存（TTL 5分钟）
 */

const { db } = require('common');

// ==================== 内存缓存 ====================

let _levelConfigCache = null;
let _levelConfigCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

/**
 * 获取所有等级配置（带缓存）
 * 从 ambassador_level_configs 表读取
 * @returns {Promise<Object>} { level: config } 的 Map 结构
 */
async function getAllLevelConfigs() {
  const now = Date.now();
  if (_levelConfigCache && (now - _levelConfigCacheTime) < CACHE_TTL) {
    return _levelConfigCache;
  }

  const configs = await db.query(
    'SELECT * FROM ambassador_level_configs WHERE status = 1 ORDER BY level ASC'
  );

  // 转为 { level: config } 的 Map 结构
  _levelConfigCache = {};
  for (const config of configs) {
    _levelConfigCache[config.level] = config;
  }
  _levelConfigCacheTime = now;

  return _levelConfigCache;
}

/**
 * 获取指定等级配置
 * @param {number} level - 大使等级（0/1/2/3）
 * @returns {Promise<Object|null>} 等级配置对象
 */
async function getLevelConfig(level) {
  const configs = await getAllLevelConfigs();
  return configs[level] || null;
}

/**
 * 强制刷新缓存（管理员修改配置后调用）
 */
function refreshLevelConfigCache() {
  _levelConfigCache = null;
  _levelConfigCacheTime = 0;
}

/**
 * 获取等级名称（从数据库读取）
 * @param {number} level - 大使等级
 * @returns {Promise<string>}
 */
async function getLevelName(level) {
  const config = await getLevelConfig(level);
  return config ? config.level_name : '未知等级';
}

module.exports = {
  getAllLevelConfigs,
  getLevelConfig,
  refreshLevelConfigCache,
  getLevelName
};

