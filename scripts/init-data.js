/**
 * 天道文化小程序 - 初始数据插入脚本
 *
 * 功能：
 * 1. 插入系统配置数据
 * 2. 插入课程基础数据
 * 3. 插入管理员账号（可选）
 */

const mysql = require('mysql2/promise');

// MySQL 连接配置（与 deploy-database.js 相同）
const MYSQL_CONFIG = {
  host: 'sh-cynosdbmysql-grp-llpn0et0.sql.tencentcdb.com',
  port: 26327,
  user: 'tiandao_admin',
  password: 'Linmengqi521',
  database: 'tiandao_culture'
};

const DATABASE_NAME = 'tiandao_culture';

console.log('='.repeat(80));
console.log('天道文化小程序 - 初始数据插入脚本');
console.log('='.repeat(80));
console.log(`数据库名: ${DATABASE_NAME}`);
console.log('='.repeat(80));
console.log('');

/**
 * 初始数据 SQL
 */
const INIT_DATA_SQL = {
  // 系统配置
  system_configs: `
    INSERT INTO system_configs (config_key, config_value, config_type, config_group, config_name, config_desc, is_system) VALUES
    -- 复训规则
    ('retrain_price_course_1', '500', 'number', 'retrain', '初探班复训价格', '初探班复训费用（元）', 1),
    ('retrain_price_course_2', '1000', 'number', 'retrain', '密训班复训价格', '密训班复训费用（元）', 1),
    ('retrain_deadline_days', '3', 'number', 'retrain', '复训报名截止天数', '开课前N天截止复训报名', 1),

    -- 功德分规则
    ('merit_points_rate_course_1', '0.3', 'number', 'merit_points', '初探班功德分比例', '推荐初探班获得功德分比例（30%）', 1),
    ('merit_points_rate_course_2', '0.2', 'number', 'merit_points', '密训班功德分比例', '推荐密训班获得功德分比例（20%）', 1),

    -- 积分规则
    ('cash_points_frozen_level_2', '1688', 'number', 'cash_points', '青鸾冻结积分', '升级青鸾大使获得的冻结积分', 1),
    ('cash_points_frozen_level_3', '16880', 'number', 'cash_points', '鸿鹄冻结积分', '升级鸿鹄大使获得的冻结积分', 1),
    ('withdraw_min_amount', '100', 'number', 'cash_points', '最低提现金额', '积分提现最低金额（元）', 1),
    ('withdraw_max_amount', '50000', 'number', 'cash_points', '最高提现金额', '单笔提现最高金额（元）', 1),
    ('points_to_cash_ratio', '100', 'number', 'cash_points', '积分兑换现金比例', '100积分=1元', 1),

    -- 佣金规则
    ('upgrade_price_level_3', '9800', 'number', 'commission', '鸿鹄升级费用', '升级鸿鹄大使需支付的费用（元）', 1),
    ('quota_count_level_3', '10', 'number', 'commission', '鸿鹄名额数量', '升级鸿鹄大使获得的初探班名额数量', 1)
    ON DUPLICATE KEY UPDATE config_value=VALUES(config_value)
  `,

  // 课程数据
  courses: `
    INSERT INTO courses (id, name, type, current_price, original_price, retrain_price, description, status, sort_order) VALUES
    (1, '初探班', 1, 1688.00, 1688.00, 500.00, '天道文化初探班课程，带您初探天道奥秘', 1, 100),
    (2, '密训班', 2, 38888.00, 38888.00, 11666.00, '天道文化密训班课程，深度掌握天道文化精髓', 1, 90)
    ON DUPLICATE KEY UPDATE
      current_price=VALUES(current_price),
      original_price=VALUES(original_price),
      retrain_price=VALUES(retrain_price),
      description=VALUES(description)
  `,

  // 设置密训班包含初探班
  course_relations: `
    UPDATE courses SET included_course_ids = '[1]' WHERE id = 2
  `,

  // 管理员账号（密码：admin123，需要在实际使用时修改）
  admin_users: `
    INSERT INTO admin_users (username, password, real_name, role, permissions, status) VALUES
    ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '系统管理员', 'super_admin', '["*"]', 1)
    ON DUPLICATE KEY UPDATE real_name=VALUES(real_name)
  `
};

/**
 * 主函数
 */
async function main() {
  let connection;

  try {
    // 1. 连接 MySQL
    console.log('[1/5] 连接 CloudBase MySQL...');
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✓ MySQL 连接成功\n');

    // 2. 插入系统配置
    console.log('[2/5] 插入系统配置...');
    await connection.query(INIT_DATA_SQL.system_configs);
    console.log('✓ 系统配置插入成功（12 条记录）\n');

    // 3. 插入课程数据
    console.log('[3/5] 插入课程数据...');
    await connection.query(INIT_DATA_SQL.courses);
    console.log('✓ 课程数据插入成功（2 条记录）\n');

    // 4. 设置课程关联
    console.log('[4/5] 设置课程关联关系...');
    await connection.query(INIT_DATA_SQL.course_relations);
    console.log('✓ 密训班已设置包含初探班\n');

    // 5. 插入管理员账号（可选）
    console.log('[5/5] 插入管理员账号...');
    try {
      await connection.query(INIT_DATA_SQL.admin_users);
      console.log('✓ 管理员账号插入成功');
      console.log('  用户名: admin');
      console.log('  默认密码: admin123');
      console.log('  ⚠️  请在首次登录后立即修改密码！\n');
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('✓ 管理员账号已存在，跳过\n');
      } else {
        throw error;
      }
    }

    // 6. 验证数据
    console.log('验证插入的数据...');
    const [configs] = await connection.query('SELECT COUNT(*) as count FROM system_configs');
    const [courses] = await connection.query('SELECT COUNT(*) as count FROM courses');
    const [admins] = await connection.query('SELECT COUNT(*) as count FROM admin_users');

    console.log(`  系统配置: ${configs[0].count} 条`);
    console.log(`  课程数据: ${courses[0].count} 条`);
    console.log(`  管理员账号: ${admins[0].count} 个\n`);

    // 7. 输出报告
    console.log('='.repeat(80));
    console.log('初始数据插入完成');
    console.log('='.repeat(80));
    console.log('✓ 系统配置: 12 条');
    console.log('✓ 课程数据: 2 条（初探班、密训班）');
    console.log('✓ 管理员账号: 1 个（admin/admin123）');
    console.log('='.repeat(80));
    console.log('\n后续步骤:');
    console.log('1. 登录后台管理系统');
    console.log('2. 修改管理员密码');
    console.log('3. 配置课程详细信息（封面图、详情等）');
    console.log('4. 配置消息模板');
    console.log('5. 配置协议模板\n');

  } catch (error) {
    console.error('\n✗ 初始数据插入失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ MySQL 连接已关闭\n');
    }
  }
}

// 运行主函数
main();
