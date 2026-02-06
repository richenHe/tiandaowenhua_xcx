/**
 * 快速验证数据库部署结果（使用与 deploy-database.js 相同的配置）
 */

const mysql = require('mysql2/promise');

// 从环境变量或 deploy-database.js 读取配置
const ENV_ID = 'cloud1-0gnn3mn17b581124';
const MYSQL_INSTANCE = 'tnt-e300s320g';
const DATABASE_NAME = 'tiandao_culture';

async function quickVerify() {
  console.log('='.repeat(80));
  console.log('快速验证数据库部署结果');
  console.log('='.repeat(80));
  console.log('提示: 请确保已设置环境变量 MYSQL_PASSWORD\n');

  let connection;

  try {
    // 使用与 deploy-database.js 相同的连接配置
    const mysqlConfig = {
      host: `${MYSQL_INSTANCE}.mysql.${ENV_ID}.clbas.com`,
      port: 3306,
      user: 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: DATABASE_NAME,
      connectTimeout: 30000
    };

    console.log('[1/4] 连接 MySQL...');
    console.log(`  密码: ${mysqlConfig.password ? '已设置' : '未设置（尝试空密码）'}\n`);

    connection = await mysql.createConnection(mysqlConfig);
    console.log('✓ MySQL 连接成功\n');

    // 检查表数量
    console.log('[2/4] 检查表数量...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✓ 共有 ${tables.length} 张表（预期 28 张）\n`);

    if (tables.length === 28) {
      console.log('✅ 表数量正确！\n');
    } else {
      console.log(`⚠️  表数量不符合预期（实际: ${tables.length}, 预期: 28）\n`);
    }

    // 列出所有表
    console.log('[3/4] 表清单:\n');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${String(index + 1).padStart(2, ' ')}. ${tableName}`);
    });

    // 检查 _openid 字段
    console.log('\n[4/4] 检查 _openid 字段...');
    const [openidTables] = await connection.query(`
      SELECT table_name
      FROM information_schema.columns
      WHERE table_schema = '${DATABASE_NAME}'
        AND column_name = '_openid'
      ORDER BY table_name
    `);
    console.log(`✓ 有 ${openidTables.length} 张表包含 _openid 字段（预期 15 张）\n`);

    if (openidTables.length === 15) {
      console.log('✅ _openid 字段数量正确！\n');
    }

    // 输出验证结果
    console.log('='.repeat(80));
    console.log('验证结果');
    console.log('='.repeat(80));

    const checks = [
      { name: '表数量', pass: tables.length === 28, value: `${tables.length}/28` },
      { name: '_openid 字段表数量', pass: openidTables.length === 15, value: `${openidTables.length}/15` }
    ];

    checks.forEach(check => {
      const status = check.pass ? '✅' : '⚠️';
      console.log(`${status} ${check.name}: ${check.value}`);
    });

    const allPassed = checks.every(c => c.pass);

    console.log('='.repeat(80));

    if (allPassed) {
      console.log('\n🎉 数据库部署验证通过！\n');
      console.log('后续步骤:');
      console.log('  1. 插入初始数据:');
      console.log('     node scripts/init-data.js');
      console.log('  2. 配置安全规则（在 CloudBase 控制台将所有表设置为 ADMINONLY）');
      console.log('  3. 开始云函数开发\n');
    } else {
      console.log('\n⚠️  部分验证未通过，请检查上述问题\n');
    }

  } catch (error) {
    console.error('\n✗ 验证失败:', error.message);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n解决方案:');
      console.log('  设置密码环境变量后重试:');
      console.log('  Windows PowerShell: $env:MYSQL_PASSWORD="your_password"');
      console.log('  Windows CMD: set MYSQL_PASSWORD=your_password');
      console.log('  Linux/Mac: export MYSQL_PASSWORD="your_password"\n');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ MySQL 连接已关闭\n');
    }
  }
}

quickVerify();
