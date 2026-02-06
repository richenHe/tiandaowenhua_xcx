/**
 * 检查 CloudBase 数据库状态
 */

const cloudbase = require('@cloudbase/node-sdk');

const ENV_ID = 'cloud1-0gnn3mn17b581124';

async function checkDatabase() {
  console.log('='.repeat(80));
  console.log('检查 CloudBase 数据库状态');
  console.log('='.repeat(80));
  console.log(`环境 ID: ${ENV_ID}\n`);

  try {
    // 初始化 CloudBase
    console.log('[1/3] 初始化 CloudBase SDK...');
    const app = cloudbase.init({
      env: ENV_ID
    });
    console.log('✓ CloudBase SDK 初始化成功\n');

    // 获取数据库实例
    console.log('[2/3] 获取数据库实例...');
    const db = app.database();
    console.log('✓ 数据库实例获取成功\n');

    // 列出所有集合（NoSQL 数据库）
    console.log('[3/3] 列出所有数据库集合...');
    console.log('注意: CloudBase 有两种数据库类型：');
    console.log('  1. NoSQL 数据库（集合）- 通过 SDK 访问');
    console.log('  2. SQL 数据库（MySQL 表）- 需要通过 MySQL 连接\n');

    // 尝试列出集合
    try {
      const collections = await db.listCollections();
      console.log(`✓ 找到 ${collections.collections.length} 个 NoSQL 集合:\n`);

      if (collections.collections.length > 0) {
        collections.collections.forEach((col, index) => {
          console.log(`  ${index + 1}. ${col.name}`);
        });
      } else {
        console.log('  （暂无集合）');
      }
    } catch (error) {
      console.log('✗ 无法列出集合:', error.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('SQL 数据库检查');
    console.log('='.repeat(80));
    console.log('从截图看到，SQL 数据库中有以下表：');
    console.log('  1. relation_data_depart');
    console.log('  2. sys_department');
    console.log('  3. sys_user');
    console.log('\n这些表不是天道文化小程序的表。');
    console.log('\n可能的原因：');
    console.log('  1. 部署脚本尚未执行');
    console.log('  2. 部署到了不同的数据库');
    console.log('  3. MySQL 连接配置不正确');
    console.log('\n建议操作：');
    console.log('  1. 检查 MySQL 实例连接信息');
    console.log('  2. 确认是否有多个 MySQL 实例');
    console.log('  3. 运行部署脚本创建天道文化数据库表');

  } catch (error) {
    console.error('\n✗ 检查失败:', error.message);
    console.error(error.stack);
  }
}

checkDatabase();
