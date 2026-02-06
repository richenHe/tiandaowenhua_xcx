/**
 * 测试 CloudBase MySQL 连接
 */

const mysql = require('mysql2/promise');

const ENV_ID = 'cloud1-0gnn3mn17b581124';
const MYSQL_INSTANCE = 'tnt-e300s320g';

async function testConnection() {
  console.log('测试 CloudBase MySQL 连接...\n');

  // 尝试不同的连接方式
  const configs = [
    {
      name: '方式1: 标准连接',
      config: {
        host: `${MYSQL_INSTANCE}.mysql.${ENV_ID}.clbas.com`,
        port: 3306,
        user: 'root',
        password: process.env.MYSQL_PASSWORD || '',
        connectTimeout: 10000
      }
    },
    {
      name: '方式2: 使用 tcb 域名',
      config: {
        host: `${MYSQL_INSTANCE}.mysql.${ENV_ID}.tcb.tencentcloudapi.com`,
        port: 3306,
        user: 'root',
        password: process.env.MYSQL_PASSWORD || '',
        connectTimeout: 10000
      }
    },
    {
      name: '方式3: 直接使用实例名',
      config: {
        host: MYSQL_INSTANCE,
        port: 3306,
        user: 'root',
        password: process.env.MYSQL_PASSWORD || '',
        connectTimeout: 10000
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n${name}`);
    console.log(`  Host: ${config.host}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  User: ${config.user}`);
    console.log(`  Password: ${config.password ? '已设置' : '未设置'}`);

    try {
      const connection = await mysql.createConnection(config);
      console.log('  ✓ 连接成功！');

      // 测试查询
      const [rows] = await connection.query('SELECT VERSION() as version');
      console.log(`  MySQL 版本: ${rows[0].version}`);

      await connection.end();
      console.log('  ✓ 这是正确的连接方式！\n');
      return config;
    } catch (error) {
      console.log(`  ✗ 连接失败: ${error.message}`);
    }
  }

  console.log('\n所有连接方式都失败了。');
  console.log('\n可能的原因：');
  console.log('1. MySQL 实例未启动或未正确配置');
  console.log('2. 需要在 CloudBase 控制台获取正确的连接信息');
  console.log('3. 需要配置网络访问权限');
  console.log('4. 密码不正确（请设置环境变量 MYSQL_PASSWORD）');
  console.log('\n建议：');
  console.log('1. 登录 CloudBase 控制台: https://console.cloud.tencent.com/tcb');
  console.log('2. 进入 MySQL 实例管理页面');
  console.log('3. 查看连接信息和访问凭证');
  console.log('4. 确保实例状态为"运行中"');
}

testConnection().catch(console.error);
