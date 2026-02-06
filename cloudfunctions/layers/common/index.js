/**
 * 云函数公共层入口
 */

const db = require('./db');
const response = require('./response');
const utils = require('./utils');

module.exports = {
  db,
  response,
  utils
};


