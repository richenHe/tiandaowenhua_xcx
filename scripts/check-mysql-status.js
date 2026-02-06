/**
 * 通过 MySQL 连接检查数据库状态
 */

const mysql = require('mysql2/promise');

const ENV_ID = 'cloud1-0gnn3mn17b581124';
const MYSQL_INSTANCE = 'tnt-e300s320g';

async function checkMySQLDatabase() {
  console.log('='.repeat(80));
  console.log('检查 MySQL 数据库状态');
  console.log('='.repeat(80));
  console.log(`环境 ID: ${ENV_ID}`);
  console.log(`MySQL 实例: ${MYSQL_INSTANCE}\n`);

  let connection;

  try {
    // 连接配置
    const mysqlConfig = {
      host: `${MYSQL_INSTANCE}.mysql.${ENV_ID}.clbas.com`,
      port: 3306,
      user: 'root',
      password: process.env.MYSQL_PASSWORD || '',
      connectTimeout: 30000
    };

    console.log('[1/5] 连接 MySQL...');
    console.log(`  Host: ${mysqlConfig.host}`);
    console.log(`  Port: ${mysqlConfig.port}`);
    console.log(`  User: ${mysqlConfig.user}`);
    console.log(`  Password: ${mysqlConfig.password ? '已设置' : '未设置'}\n`);

    connection = await mysql.createConnection(mysqlConfig);
    console.log('✓ MySQL 连接成功\n');

    // 列出所有数据库
    console.log('[2/5] 列出所有数据库...');
    const [databases] = await connection.query('SHOW DATABASES');
    console.log(`✓ 找到 ${databases.length} 个数据库:\n`);
    databases.forEach((db, index) => {
      console.log(`  ${index + 1}. ${db.Database}`);
    });

    // 检查 tiandao_culture 数据库是否存在
    console.log('\n[3/5] 检查 tiandao_culture 数据库...');
    const hasTiandaoDb = databases.some(db => db.Database === 'tiandao_culture');

    if (hasTiandaoDb) {
      console.log('✓ tiandao_culture 数据库已存在\n');

      // 切换到 tiandao_culture 数据库
      await connection.query('USE tiandao_culture');

      // 列出所有表
      console.log('[4/5] 列出 tiandao_culture 数据库中的表...');
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`✓ 找到 ${tables.length} 张表:\n`);

      if (tables.length > 0) {
        tables.forEach((table, index) => {
          const tableName = Object.values(table)[0];
          console.log(`  ${index + 1}. ${tableName}`);
        });
      } else {
        console.log('  （暂无表）');
      }
    } else {
      console.log('✗ tiandao_culture 数据库不存在\n');

      // 检查默认数据库中的表
      console.log('[4/5] 检查默认数据库中的表...');
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`✓ 找到 ${tables.length} 张表:\n`);

      if (tables.length > 0) {
        tables.forEach((table, index) => {
          const tableName = Object.values(table)[0];
          console.log(`  ${index + 1}. ${tableName}`);
        });
      }
    }

    // 输出建议
    console.log('\n[5/5] 部署建议');
    console.log('='.repeat(80));

    if (!hasTiandaoDb) {
      console.log('❌ 天道文化数据库尚未创建');
      console.log('\n建议执行以下步骤：');
      console.log('  1. 设置 MySQL 密码环境变量：');
      console.log('     export MYSQL_PASSWORD="your_password"');
      console.log('  2. 部署用户模块（首次验证）：');
      console.log('     node scripts/deploy-database.js --module=users');
      console.log('  3. 验证通过后部署剩余模块：');
      console.log('     node scripts/deploy-database.js --module=remaining');
    } else if (tables.length === 0) {
      console.log('⚠️  数据库已创建但没有表');
      console.log('\n建议执行以下步骤：');
      console.log('  1. 部署用户模块：');
      console.log('     node scripts/deploy-database.js --module=users');
      console.log('  2. 部署剩余模块：');
      console.log('     node scripts/deploy-database.js --module=remaining');
    } else if (tables.length < 28) {
      console.log(`⚠️  数据库有 ${tables.length} 张表，但应该有 28 张表`);
      console.log('\n建议执行以下步骤：');
      console.log('  1. 检查哪些表缺失');
      console.log('  2. 重新运行部署脚本：');
      console.log('     node scripts/deploy-database.js --module=remaining');
    } else {
      console.log('✅ 数据库部署完整！');
      console.log(`\n共有 ${tables.length} 张表，符合预期。`);
      console.log('\n后续步骤：');
      console.log('  1. 插入初始数据：');
      console.log('     node scripts/init-data.js');
      console.log('  2. 配置安全规则（在 CloudBase 控制台）');
      console.log('  3. 开始云函数开发');
    }

  } catch (error) {
    console.error('\n✗ 检查失败:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n可能的原因：');
      console.log('  1. MySQL 实例未启动');
      console.log('  2. 连接地址不正确');
      console.log('  3. 网络访问受限');
      console.log('\n解决方案：');
      console.log('  1. 登录 CloudBase 控制台');
      console.log('  2. 检查 MySQL 实例状态');
      console.log('  3. 确认实例连接信息');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n可能的原因：');
      console.log('  1. 密码不正确');
      console.log('  2. 用户权限不足');
      console.log('\n解决方案：');
      console.log('  1. 重置 MySQL root 密码');
      console.log('  2. 设置环境变量：export MYSQL_PASSWORD="your_password"');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ MySQL 连接已关闭');
    }
  }
}

checkMySQLDatabase();
