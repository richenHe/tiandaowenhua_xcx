/**
 * 插入测试用户数据
 * 用于测试云函数的用户认证功能
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertTestUser() {
  const connection = await mysql.createConnection({
    host: 'gz-cynosdbmysql-grp-2xaxm80c.sql.tencentcdb.com',
    port: 22483,
    user: 'xcx',
    password: 'xCX020202',
    database: 'tiandao_culture',
    timezone: '+08:00'
  });

  try {
    console.log('📝 准备插入测试用户...\n');

    // 测试用户数据
    const testUser = {
      _openid: 'test-openid-123456',  // 测试 openid
      username: 'test_user_' + Date.now(),
      real_name: '测试用户',
      phone: '13800138000',
      user_type: 'student',
      onboarding_status: 'completed'
    };

    const [result] = await connection.execute(
      `INSERT INTO users (_openid, username, real_name, phone, user_type, onboarding_status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        testUser._openid,
        testUser.username,
        testUser.real_name,
        testUser.phone,
        testUser.user_type,
        testUser.onboarding_status
      ]
    );

    console.log('✅ 测试用户创建成功!');
    console.log(`   用户ID: ${result.insertId}`);
    console.log(`   用户名: ${testUser.username}`);
    console.log(`   OpenID: ${testUser._openid}\n`);

    // 验证插入
    const [rows] = await connection.execute(
      'SELECT id, username, real_name, phone, user_type, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    console.log('📋 用户信息:');
    console.table(rows);

    console.log('\n💡 提示: 使用此 openid 测试云函数:');
    console.log(`   ${testUser._openid}`);

  } catch (error) {
    console.error('❌ 插入失败:', error.message);
  } finally {
    await connection.end();
  }
}

insertTestUser();
















