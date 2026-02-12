/**
 * 云函数公共层入口
 */

const db = require('./db');
const response = require('./response');
const utils = require('./utils');
const auth = require('./auth');
const storage = require('./storage');

module.exports = {
  db,
  response,
  utils,
  auth,
  storage,
  // 解构导出常用函数（兼容 common-utils 规范）
  ...auth,
  ...response,
  ...utils,
  ...db  // 添加 db 函数解构导出
};





