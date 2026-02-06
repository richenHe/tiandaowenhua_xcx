/**
 * 验证数据库部署结果
 */

const mysql = require('mysql2/promise');

// 使用与 deploy-database.js 相同的连接配置
const MYSQL_CONFIG = {
  host: 'sh-cynosdbmysql-grp-llpn0et0.sql.tencentcdb.com',
  port: 26327,
  user: 'tiandao_admin',
  password: 'Linmengqi521',  // 与 deploy-database.js 中相同的密码
  database: 'tiandao_culture'
};

async function verifyDeployment() {
  console.log('='.repeat(80));
  console.log('验证数据库部署结果');
  console.log('='.repeat(80));
  console.log(`数据库: ${MYSQL_CONFIG.database}\n`);

  let connection;

  try {
    // 1. 连接数据库
    console.log('[1/5] 连接 MySQL...');
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✓ MySQL 连接成功\n');

    // 2. 检查表数量
    console.log('[2/5] 检查表数量...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✓ 共有 ${tables.length} 张表（预期 28 张）\n`);

    if (tables.length !== 28) {
      console.log('⚠️  表数量不符合预期！');
    }

    // 3. 检查 _openid 字段
    console.log('[3/5] 检查 _openid 字段...');
    const [openidTables] = await connection.query(`
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = 'tiandao_culture'
        AND column_name = '_openid'
      ORDER BY table_name
    `);
    console.log(`✓ 有 ${openidTables.length} 张表包含 _openid 字段（预期 15 张）:\n`);
    openidTables.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.table_name}`);
    });

    // 4. 检查关键表结构
    console.log('\n[4/5] 检查关键表结构...');

    // 检查 users 表
    const [usersColumns] = await connection.query(`
      SELECT column_name, column_type, is_nullable, column_default, column_comment
      FROM information_schema.columns
      WHERE table_schema = 'tiandao_culture'
        AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log(`\n✓ users 表有 ${usersColumns.length} 个字段`);

    // 检查关键字段
    const keyFields = ['uid', '_openid', 'ambassador_level', 'referee_code', 'merit_points'];
    const missingFields = keyFields.filter(field =>
      !usersColumns.some(col => col.column_name === field)
    );

    if (missingFields.length > 0) {
      console.log(`⚠️  users 表缺少字段: ${missingFields.join(', ')}`);
    } else {
      console.log('✓ users 表关键字段完整');
    }

    // 检查索引
    const [usersIndexes] = await connection.query(`
      SHOW INDEX FROM users
    `);
    console.log(`✓ users 表有 ${usersIndexes.length} 个索引`);

    // 5. 输出验证报告
    console.log('\n[5/5] 验证报告');
    console.log('='.repeat(80));

    const allChecks = [
      { name: '表数量', expected: 28, actual: tables.length, pass: tables.length === 28 },
      { name: '_openid 字段表数量', expected: 15, actual: openidTables.length, pass: openidTables.length === 15 },
      { name: 'users 表字段', expected: '完整', actual: missingFields.length === 0 ? '完整' : '缺失', pass: missingFields.length === 0 },
      { name: 'users 表索引', expected: '> 0', actual: usersIndexes.length, pass: usersIndexes.length > 0 }
    ];

    console.log('\n验证结果:\n');
    allChecks.forEach(check => {
      const status = check.pass ? '✓' : '✗';
      console.log(`  ${status} ${check.name}: ${check.actual} ${check.pass ? '' : `(预期: ${check.expected})`}`);
    });

    const allPassed = allChecks.every(check => check.pass);

    console.log('\n' + '='.repeat(80));
    if (allPassed) {
      console.log('✅ 所有验证通过！数据库部署成功！');
      console.log('\n后续步骤:');
      console.log('  1. 插入初始数据:');
      console.log('     node scripts/init-data.js');
      console.log('  2. 配置安全规则（在 CloudBase 控制台）');
      console.log('  3. 开始云函数开发');
    } else {
      console.log('⚠️  部分验证未通过，请检查上述问题');
    }
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n✗ 验证失败:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ MySQL 连接已关闭');
    }
  }
}

verifyDeployment();
