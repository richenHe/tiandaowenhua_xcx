/**
 * 数据库连接模块
 * 用于云函数中的 MySQL 数据库操作
 */

const mysql = require('mysql2/promise');

// 数据库连接池配置
let pool = null;

/**
 * 获取数据库连接池
 * @returns {Promise<mysql.Pool>}
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'tiandao_culture',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+08:00',
      dateStrings: true
    });
  }
  return pool;
}

/**
 * 执行查询（只读操作）
 * @param {string} sql - SQL 查询语句
 * @param {Array} params - 参数数组
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * 执行单条数据插入
 * @param {string} table - 表名
 * @param {Object} data - 数据对象
 * @param {string} openid - 用户 openid（自动添加到 _openid 字段）
 * @returns {Promise<Object>} 插入结果
 */
async function insert(table, data, openid) {
  const pool = getPool();
  
  // 自动添加 _openid 字段
  const insertData = { ...data, _openid: openid };
  
  const fields = Object.keys(insertData);
  const values = Object.values(insertData);
  const placeholders = fields.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
  const [result] = await pool.execute(sql, values);
  
  return {
    id: result.insertId,
    affectedRows: result.affectedRows
  };
}

/**
 * 执行更新操作
 * @param {string} table - 表名
 * @param {Object} data - 更新数据对象
 * @param {Object} where - WHERE 条件对象
 * @param {string} openid - 用户 openid（用于权限检查）
 * @returns {Promise<Object>} 更新结果
 */
async function update(table, data, where, openid) {
  const pool = getPool();
  
  const setFields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const setValues = Object.values(data);
  
  // 构建 WHERE 条件（自动添加 _openid 检查）
  const whereFields = Object.keys(where);
  whereFields.push('_openid');
  const whereClause = whereFields.map(key => `${key} = ?`).join(' AND ');
  const whereValues = [...Object.values(where), openid];
  
  const sql = `UPDATE ${table} SET ${setFields} WHERE ${whereClause}`;
  const [result] = await pool.execute(sql, [...setValues, ...whereValues]);
  
  return {
    affectedRows: result.affectedRows,
    changedRows: result.changedRows
  };
}

/**
 * 执行删除操作（软删除：更新 is_deleted 字段）
 * @param {string} table - 表名
 * @param {Object} where - WHERE 条件对象
 * @param {string} openid - 用户 openid（用于权限检查）
 * @returns {Promise<Object>} 删除结果
 */
async function softDelete(table, where, openid) {
  return update(table, { is_deleted: 1 }, where, openid);
}

/**
 * 执行事务
 * @param {Function} callback - 事务回调函数，接收 connection 参数
 * @returns {Promise<any>} 事务执行结果
 */
async function transaction(callback) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  query,
  insert,
  update,
  softDelete,
  transaction,
  getPool
};


