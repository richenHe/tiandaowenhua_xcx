/**
 * CloudBase 数据库统一访问层
 * 
 * 使用 @cloudbase/node-sdk 原生 Relational Database API
 * 支持 Supabase 风格的 Query Builder
 * 
 * ⚠️ 注意：本模块已完全移除 rawQuery 支持
 * ⚠️ 所有查询必须使用 Query Builder（db.from()）
 * 
 * @see https://docs.cloudbase.net/database/relational-database
 */

const cloudbase = require('@cloudbase/node-sdk');

// 初始化 CloudBase
const app = cloudbase.init({
  env: cloudbase.SYMBOL_CURRENT_ENV
});

// 获取关系型数据库实例（Supabase 风格）
const db = app.rdb({
  instanceId: process.env.DB_INSTANCE_ID || 'tnt-e300s320g',
  database: process.env.DB_NAME || 'tiandao_culture'
});

/**
 * ==================== Supabase 风格 Query Builder ====================
 * 使用方式：
 * 
 * 1. 基础查询：
 *    const { data, error } = await db.from('users').select('*');
 * 
 * 2. 条件查询：
 *    const { data } = await db.from('users').select('*').eq('id', 1);
 *    const { data } = await db.from('users').select('*').gt('age', 18);
 * 
 * 3. 排序分页：
 *    const { data } = await db.from('users')
 *      .select('*')
 *      .order('created_at', { ascending: false })
 *      .range(0, 9);
 * 
 * 4. 插入数据：
 *    const { data } = await db.from('users').insert({ name: 'John' });
 * 
 * 5. 更新数据：
 *    const { data } = await db.from('users').update({ name: 'Jane' }).eq('id', 1);
 * 
 * 6. 删除数据：
 *    const { data } = await db.from('users').delete().eq('id', 1);
 * 
 * 7. 关联查询（需要外键）：
 *    const { data } = await db.from('orders')
 *      .select('*, users:users!fk_orders_user(id, name, email)')
 *      .eq('user_id', 1);
 * 
 * 8. 多表关联查询：
 *    const { data } = await db.from('appointments')
 *      .select(`
 *        *,
 *        user:users!fk_appointments_user(id, real_name, phone),
 *        course:courses!fk_appointments_course(name, type),
 *        class_record:class_records!fk_appointments_class_record(class_date, class_time)
 *      `)
 *      .eq('status', 1);
 */

/**
 * ==================== 高级 Query Builder 功能 ====================
 */

/**
 * 执行原始 RPC 调用（用于存储过程等）
 * 
 * @param {string} functionName - 函数名
 * @param {Object} params - 函数参数
 * @returns {Promise<any>} 函数返回结果
 * 
 * @example
 * const result = await rpc('calculate_total', { order_id: 123 });
 * 
 * @note 需要先在数据库中创建函数/存储过程
 */
async function rpc(functionName, params = {}) {
  try {
    const { data, error } = await db.rpc(functionName, params);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('[DB] rpc error:', error);
    throw error;
  }
}

/**
 * ==================== 便捷查询方法 ====================
 */

/**
 * 查询单条记录
 * 
 * @param {string} table - 表名
 * @param {Object} where - 查询条件
 * @returns {Promise<Object|null>} 查询结果
 * 
 * @example
 * const user = await findOne('users', { id: 1 });
 * const order = await findOne('orders', { order_no: 'ORD20260210001' });
 */
async function findOne(table, where) {
  try {
    let query = db.from(table).select('*');
    
    // 添加查询条件
    for (const [key, value] of Object.entries(where)) {
      query = query.eq(key, value);
    }
    
    const { data, error } = await query.single();
    
    // 如果错误是"未找到记录"，返回 null 而不是抛出错误
    if (error) {
      if (error.code === 'INVALID_REQUEST' && error.message.includes('0 rows')) {
        return null;
      }
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error('[DB] findOne error:', error);
    throw error;
  }
}

/**
 * 查询多条记录
 * 
 * @param {string} table - 表名
 * @param {Object} options - 查询选项
 * @param {Object} options.where - 查询条件
 * @param {Array<string>} options.columns - 查询字段
 * @param {Object} options.orderBy - 排序 { column, ascending }
 * @param {number} options.limit - 限制数量
 * @param {number} options.offset - 偏移量
 * @returns {Promise<Array>} 查询结果
 * 
 * @example
 * const users = await query('users', {
 *   where: { ambassador_level: 2 },
 *   orderBy: { column: 'created_at', ascending: false },
 *   limit: 10
 * });
 */
async function query(table, options = {}) {
  try {
    const { where = {}, columns = '*', orderBy, limit, offset } = options;
    
    let queryBuilder = db.from(table).select(columns);
    
    // 添加查询条件
    for (const [key, value] of Object.entries(where)) {
      if (value === null) {
        queryBuilder = queryBuilder.is(key, null);
      } else {
        queryBuilder = queryBuilder.eq(key, value);
      }
    }
    
    // 排序
    if (orderBy) {
      queryBuilder = queryBuilder.order(orderBy.column, { 
        ascending: orderBy.ascending !== false 
      });
    }
    
    // 分页
    if (limit !== undefined) {
      const start = offset || 0;
      const end = start + limit - 1;
      queryBuilder = queryBuilder.range(start, end);
    }
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('[DB] query error:', error);
    throw error;
  }
}

/**
 * 插入记录
 * 
 * @param {string} table - 表名
 * @param {Object|Array} data - 插入数据（单条或多条）
 * @returns {Promise<Array>} 插入的记录
 * 
 * @example
 * const newUser = await insert('users', { name: 'John', email: 'john@example.com' });
 * const newUsers = await insert('users', [{ name: 'John' }, { name: 'Jane' }]);
 */
async function insert(table, data) {
  try {
    const { data: result, error } = await db
      .from(table)
      .insert(data)
      .select();
    
    if (error) {
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error('[DB] insert error:', error);
    throw error;
  }
}

/**
 * 更新记录
 * 
 * @param {string} table - 表名
 * @param {Object} data - 更新数据
 * @param {Object} where - 更新条件
 * @returns {Promise<Array>} 更新的记录
 * 
 * @example
 * await update('users', { name: 'Jane' }, { id: 1 });
 * await update('orders', { status: 1 }, { order_no: 'ORD20260210001' });
 */
async function update(table, data, where) {
  try {
    let queryBuilder = db.from(table).update(data);
    
    // 添加更新条件
    for (const [key, value] of Object.entries(where)) {
      queryBuilder = queryBuilder.eq(key, value);
    }
    
    const { data: result, error } = await queryBuilder.select();
    
    if (error) {
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error('[DB] update error:', error);
    throw error;
  }
}

/**
 * 删除记录（物理删除）
 * 
 * @param {string} table - 表名
 * @param {Object} where - 删除条件
 * @returns {Promise<void>}
 * 
 * @example
 * await deleteRecord('users', { id: 1 });
 */
async function deleteRecord(table, where) {
  try {
    let queryBuilder = db.from(table).delete();
    
    // 添加删除条件
    for (const [key, value] of Object.entries(where)) {
      queryBuilder = queryBuilder.eq(key, value);
    }
    
    const { error } = await queryBuilder;
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('[DB] deleteRecord error:', error);
    throw error;
  }
}

/**
 * 软删除记录（更新 deleted_at 字段）
 * 
 * @param {string} table - 表名
 * @param {Object} where - 删除条件
 * @returns {Promise<Array>} 更新的记录
 * 
 * @example
 * await softDelete('users', { id: 1 });
 */
async function softDelete(table, where) {
  try {
    return await update(table, { deleted_at: new Date().toISOString() }, where);
  } catch (error) {
    console.error('[DB] softDelete error:', error);
    throw error;
  }
}

/**
 * 统计记录数
 * 
 * @param {string} table - 表名
 * @param {Object} where - 查询条件
 * @returns {Promise<number>} 记录数量
 * 
 * @example
 * const total = await count('users', { ambassador_level: 2 });
 */
async function count(table, where = {}) {
  try {
    let queryBuilder = db.from(table).select('*', { count: 'exact', head: true });
    
    // 添加查询条件
    for (const [key, value] of Object.entries(where)) {
      queryBuilder = queryBuilder.eq(key, value);
    }
    
    const { count: total, error } = await queryBuilder;
    
    if (error) {
      throw error;
    }
    
    return total || 0;
  } catch (error) {
    console.error('[DB] count error:', error);
    throw error;
  }
}

/**
 * 事务支持（TODO: 需要确认 CloudBase SDK 事务 API）
 * 
 * @param {Function} callback - 事务回调函数
 * @returns {Promise<any>}
 * 
 * @example
 * await transaction(async (tx) => {
 *   await tx.from('users').update({ balance: 100 }).eq('id', 1);
 *   await tx.from('orders').insert({ user_id: 1, amount: 100 });
 * });
 */
async function transaction(callback) {
  // CloudBase SDK 事务支持需要确认
  throw new Error('Transaction support needs to be implemented based on CloudBase SDK capabilities');
}

/**
 * ==================== 批量操作 ====================
 */

/**
 * 批量插入数据（优化版本）
 * 
 * @param {string} table - 表名
 * @param {Array<Object>} records - 记录数组
 * @param {number} batchSize - 每批次大小（默认100）
 * @returns {Promise<Array>} 所有插入的记录
 * 
 * @example
 * const users = [
 *   { name: 'John', email: 'john@example.com' },
 *   { name: 'Jane', email: 'jane@example.com' }
 * ];
 * await batchInsert('users', users);
 */
async function batchInsert(table, records, batchSize = 100) {
  try {
    const results = [];
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await insert(table, batch);
      results.push(...result);
    }
    
    return results;
  } catch (error) {
    console.error('[DB] batchInsert error:', error);
    throw error;
  }
}

/**
 * Upsert 操作（插入或更新）
 * 
 * @param {string} table - 表名
 * @param {Object|Array} data - 数据
 * @param {Object} options - 选项
 * @param {Array<string>} options.onConflict - 冲突字段（唯一键）
 * @returns {Promise<Array>} 插入/更新的记录
 * 
 * @example
 * await upsert('users', 
 *   { id: 1, name: 'John', email: 'john@example.com' },
 *   { onConflict: ['id'] }
 * );
 */
async function upsert(table, data, options = {}) {
  try {
    const { onConflict = [] } = options;
    
    const { data: result, error } = await db
      .from(table)
      .upsert(data, { onConflict: onConflict.join(',') })
      .select();
    
    if (error) {
      throw error;
    }
    
    return result;
  } catch (error) {
    console.error('[DB] upsert error:', error);
    throw error;
  }
}

module.exports = {
  // 原始数据库客户端（Supabase 风格）
  db,
  app,
  
  // 便捷查询方法
  findOne,
  query,
  insert,
  update,
  deleteRecord,
  softDelete,
  count,
  
  // 批量操作
  batchInsert,
  upsert,
  
  // 高级功能
  rpc,
  transaction
};
