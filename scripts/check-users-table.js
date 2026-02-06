/**
 * 详细检查 users 表结构
 */

const mysql = require('mysql2/promise');

const MYSQL_CONFIG = {
  host: 'sh-cynosdbmysql-grp-llpn0et0.sql.tencentcdb.com',
  port: 26327,
  user: 'tiandao_admin',
  password: 'Linmengqi521',
  database: 'tiandao_culture'
};

async function checkUsersTable() {
  console.log('='.repeat(80));
  console.log('详细检查 users 表结构');
  console.log('='.repeat(80));

  let connection;

  try {
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✓ MySQL 连接成功\n');

    // 查询 users 表的所有字段
    console.log('users 表字段列表:\n');
    const [columns] = await connection.query(`
      SELECT
        column_name,
        column_type,
        is_nullable,
        column_default,
        column_comment
      FROM information_schema.columns
      WHERE table_schema = 'tiandao_culture'
        AND table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log(`共 ${columns.length} 个字段:\n`);
    columns.forEach((col, index) => {
      const name = (col.column_name || col.COLUMN_NAME || '').toString();
      const type = (col.column_type || col.COLUMN_TYPE || '').toString();
      const comment = (col.column_comment || col.COLUMN_COMMENT || '').toString();
      console.log(`${String(index + 1).padStart(2, ' ')}. ${name.padEnd(30, ' ')} ${type.padEnd(20, ' ')} ${comment}`);
    });

    // 检查关键字段
    console.log('\n' + '='.repeat(80));
    console.log('关键字段检查:\n');

    const keyFields = [
      'id',
      'uid',
      '_openid',
      'openid',
      'real_name',
      'phone',
      'ambassador_level',
      'referee_code',
      'referee_id',
      'merit_points',
      'cash_points_frozen',
      'cash_points_available'
    ];

    keyFields.forEach(field => {
      const exists = columns.some(col => {
        const colName = (col.column_name || col.COLUMN_NAME || '').toString();
        return colName === field;
      });
      const status = exists ? '✓' : '✗';
      console.log(`  ${status} ${field}`);
    });

    // 查询索引
    console.log('\n' + '='.repeat(80));
    console.log('索引列表:\n');
    const [indexes] = await connection.query('SHOW INDEX FROM users');

    const indexMap = {};
    indexes.forEach(idx => {
      if (!indexMap[idx.Key_name]) {
        indexMap[idx.Key_name] = {
          name: idx.Key_name,
          unique: idx.Non_unique === 0,
          columns: []
        };
      }
      indexMap[idx.Key_name].columns.push(idx.Column_name);
    });

    Object.values(indexMap).forEach((idx, i) => {
      const type = idx.unique ? 'UNIQUE' : 'INDEX';
      console.log(`${String(i + 1).padStart(2, ' ')}. ${type.padEnd(8, ' ')} ${idx.name.padEnd(30, ' ')} (${idx.columns.join(', ')})`);
    });

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n✗ 检查失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ MySQL 连接已关闭');
    }
  }
}

checkUsersTable();
