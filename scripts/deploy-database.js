/**
 * 天道文化小程序 - 云数据库部署脚本
 *
 * 功能：
 * 1. 连接 CloudBase MySQL 数据库
 * 2. 创建数据库 tiandao_culture
 * 3. 支持 --module=users 和 --module=remaining 参数
 * 4. 按顺序执行建表 SQL
 * 5. 验证表创建结果
 * 6. 输出部署报告
 */

const cloudbase = require('@cloudbase/node-sdk');
const mysql = require('mysql2/promise');

// CloudBase 配置
const ENV_ID = 'cloud1-0gnn3mn17b581124';
const MYSQL_INSTANCE = 'tnt-e300s320g';
const DATABASE_NAME = 'tiandao_culture';

// MySQL 账号配置（请在控制台创建账号后填写）
const MYSQL_USER = 'tiandao_admin';  // 在控制台创建的账号名
const MYSQL_PASSWORD = 'Linmengqi521';  // 在控制台设置的密码

// 解析命令行参数
const args = process.argv.slice(2);
const moduleArg = args.find(arg => arg.startsWith('--module='));
const deployModule = moduleArg ? moduleArg.split('=')[1] : 'all';

console.log('='.repeat(80));
console.log('天道文化小程序 - 云数据库部署脚本');
console.log('='.repeat(80));
console.log(`部署模块: ${deployModule}`);
console.log(`环境 ID: ${ENV_ID}`);
console.log(`MySQL 实例: ${MYSQL_INSTANCE}`);
console.log(`数据库名: ${DATABASE_NAME}`);
console.log('='.repeat(80));
console.log('');

// 建表 SQL（按模块分组）
const SQL_MODULES = {
  // 模块1：用户模块（2张表）
  users: [
    // users 表
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID（主键）',
      uid VARCHAR(64) NOT NULL COMMENT 'CloudBase 用户唯一标识',
      openid VARCHAR(128) COMMENT '微信 OpenID',
      _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT 'CloudBase 用户标识（用于数据隔离和访问控制）',
      real_name VARCHAR(50) COMMENT '真实姓名',
      phone VARCHAR(20) COMMENT '手机号',
      gender TINYINT COMMENT '性别：0女/1男',
      avatar VARCHAR(255) COMMENT '头像URL',
      nickname VARCHAR(50) COMMENT '微信昵称',
      birth_bazi JSON COMMENT '出生八字信息',
      province VARCHAR(50) COMMENT '省份',
      city VARCHAR(50) COMMENT '城市',
      industry VARCHAR(50) COMMENT '行业',
      personal_intro VARCHAR(500) COMMENT '个人简介',
      profile_completed TINYINT(1) DEFAULT 0 COMMENT '资料是否完善：0否/1是',
      ambassador_level TINYINT DEFAULT 0 COMMENT '大使等级：0普通用户/1准青鸾/2青鸾/3鸿鹄',
      ambassador_start_date DATE COMMENT '成为大使的日期',
      referee_code VARCHAR(10) COMMENT '推荐码（6位字母数字组合）',
      is_first_recommend TINYINT(1) DEFAULT 0 COMMENT '是否已完成首次推荐（用于青鸾解冻积分）',
      referee_id INT COMMENT '推荐人ID（关联 users.id）',
      referee_uid VARCHAR(64) COMMENT '推荐人UID（辅助字段）',
      referee_confirmed_at DATETIME COMMENT '推荐人确认时间（首次支付后锁定）',
      referee_updated_at DATETIME COMMENT '推荐人最后修改时间',
      merit_points DECIMAL(10,2) DEFAULT 0.00 COMMENT '功德分余额',
      cash_points_frozen DECIMAL(10,2) DEFAULT 0.00 COMMENT '冻结积分',
      cash_points_available DECIMAL(10,2) DEFAULT 0.00 COMMENT '可用积分',
      cash_points_pending DECIMAL(10,2) DEFAULT 0.00 COMMENT '提现中的积分',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      UNIQUE KEY uk_uid (uid),
      UNIQUE KEY uk_referee_code (referee_code),
      INDEX idx_openid (openid),
      INDEX idx_phone (phone),
      INDEX idx_referee_id (referee_id),
      INDEX idx_ambassador_level (ambassador_level),
      INDEX idx_profile_completed (profile_completed),
      INDEX idx_referee_updated_at (referee_updated_at),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'`,

    // referee_change_logs 表
    `CREATE TABLE IF NOT EXISTS referee_change_logs (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
      user_id INT NOT NULL COMMENT '用户ID',
      user_uid VARCHAR(64) COMMENT '用户UID',
      _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT 'CloudBase 用户标识（用于数据隔离）',
      old_referee_id INT COMMENT '原推荐人ID',
      old_referee_uid VARCHAR(64) COMMENT '原推荐人UID',
      old_referee_name VARCHAR(50) COMMENT '原推荐人姓名（冗余）',
      new_referee_id INT COMMENT '新推荐人ID',
      new_referee_uid VARCHAR(64) COMMENT '新推荐人UID',
      new_referee_name VARCHAR(50) COMMENT '新推荐人姓名（冗余）',
      change_type TINYINT NOT NULL COMMENT '变更类型：1首次设置/2用户主动修改/3管理员修改/4订单页修改',
      change_source TINYINT NOT NULL COMMENT '变更来源：1小程序用户资料/2订单支付页/3后台管理',
      order_no VARCHAR(32) COMMENT '关联订单号（订单页修改时）',
      admin_id INT COMMENT '操作管理员ID（管理员修改时）',
      remark VARCHAR(500) COMMENT '变更备注',
      change_ip VARCHAR(50) COMMENT '变更IP地址',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
      INDEX idx_user_id (user_id),
      INDEX idx_change_type (change_type),
      INDEX idx_change_source (change_source),
      INDEX idx_order_no (order_no),
      INDEX idx_admin_id (admin_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推荐人变更日志表'`
  ],

  // 模块2：课程模块（2张表）
  courses: [
    `CREATE TABLE IF NOT EXISTS courses (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT '课程ID',
      name VARCHAR(100) NOT NULL COMMENT '课程名称',
      type TINYINT NOT NULL COMMENT '课程类型：1初探班/2密训班/3咨询服务',
      cover_image VARCHAR(255) COMMENT '封面图片URL',
      description VARCHAR(500) COMMENT '课程简介',
      content TEXT COMMENT '详细介绍（HTML）',
      outline TEXT COMMENT '课程大纲',
      teacher VARCHAR(100) COMMENT '讲师信息',
      duration VARCHAR(50) COMMENT '课程时长（如：2天）',
      original_price DECIMAL(10,2) NOT NULL COMMENT '原价',
      current_price DECIMAL(10,2) NOT NULL COMMENT '现价',
      retrain_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '复训价格',
      allow_retrain TINYINT(1) DEFAULT 1 COMMENT '是否允许复训：0否/1是',
      included_course_ids JSON COMMENT '包含的课程ID列表',
      stock INT DEFAULT -1 COMMENT '库存数量（-1表示无限）',
      sold_count INT DEFAULT 0 COMMENT '已售数量',
      sort_order INT DEFAULT 0 COMMENT '排序权重（越大越靠前）',
      status TINYINT DEFAULT 1 COMMENT '状态：0下架/1上架',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_type (type),
      INDEX idx_status (status),
      INDEX idx_sort_order (sort_order),
      INDEX idx_type_status (type, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程表'`,

    `CREATE TABLE IF NOT EXISTS user_courses (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户课程ID',
      user_id INT NOT NULL COMMENT '用户ID',
      user_uid VARCHAR(64) COMMENT '用户UID',
      _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT 'CloudBase 用户标识（用于数据隔离）',
      course_id INT NOT NULL COMMENT '课程ID',
      course_type TINYINT NOT NULL COMMENT '课程类型（冗余存储）：1初探班/2密训班/3咨询服务',
      course_name VARCHAR(100) COMMENT '课程名称（冗余存储）',
      order_no VARCHAR(32) COMMENT '关联订单号',
      buy_price DECIMAL(10,2) COMMENT '购买价格',
      buy_time DATETIME COMMENT '购买时间',
      is_gift TINYINT(1) DEFAULT 0 COMMENT '是否赠送：0否/1是（密训班赠送的初探班）',
      gift_source VARCHAR(100) COMMENT '赠送来源说明',
      attend_count INT DEFAULT 1 COMMENT '可上课次数（初始为1，表示可首次上课）',
      first_class_time DATETIME COMMENT '首次上课时间',
      last_attend_time DATETIME COMMENT '最后上课时间',
      status TINYINT DEFAULT 1 COMMENT '状态：0无效/1有效/2已退款',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_user_id (user_id),
      INDEX idx_course_id (course_id),
      INDEX idx_course_type (course_type),
      INDEX idx_order_no (order_no),
      INDEX idx_is_gift (is_gift),
      INDEX idx_status (status),
      INDEX idx_user_course (user_id, course_id),
      INDEX idx_user_type (user_id, course_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户课程表'`
  ],

  // 模块3：订单模块（1张表）
  orders: [
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
      order_no VARCHAR(32) NOT NULL COMMENT '订单号（格式：ORD + 年月日 + 8位随机数）',
      order_type TINYINT NOT NULL COMMENT '订单类型：1课程/2复训/4大使升级',
      order_name VARCHAR(100) NOT NULL COMMENT '订单名称',
      user_id INT NOT NULL COMMENT '用户ID',
      user_uid VARCHAR(64) COMMENT '用户UID',
      user_name VARCHAR(50) COMMENT '用户姓名（冗余）',
      user_phone VARCHAR(20) COMMENT '用户手机号（冗余）',
      _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT 'CloudBase 用户标识（用于数据隔离）',
      related_id INT COMMENT '关联ID：课程ID/用户课程ID/目标等级',
      class_record_id INT COMMENT '上课记录ID（复训专用）',
      original_amount DECIMAL(10,2) NOT NULL COMMENT '原价',
      discount_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '优惠金额',
      final_amount DECIMAL(10,2) NOT NULL COMMENT '应付金额',
      referee_id INT COMMENT '推荐人ID',
      referee_uid VARCHAR(64) COMMENT '推荐人UID',
      referee_name VARCHAR(50) COMMENT '推荐人姓名（冗余）',
      referee_level TINYINT COMMENT '推荐人等级（下单时）',
      referee_updated_at DATETIME COMMENT '推荐人修改时间',
      pay_status TINYINT DEFAULT 0 COMMENT '支付状态：0待支付/1已支付/2已取消/3已关闭/4已退款',
      pay_method VARCHAR(20) DEFAULT 'wechat' COMMENT '支付方式',
      pay_time DATETIME COMMENT '支付时间',
      transaction_id VARCHAR(64) COMMENT '微信支付交易号',
      prepay_id VARCHAR(64) COMMENT '微信预支付交易会话标识',
      refund_status TINYINT DEFAULT 0 COMMENT '退款状态：0无退款/1退款中/2已退款/3退款失败',
      refund_amount DECIMAL(10,2) COMMENT '退款金额',
      refund_time DATETIME COMMENT '退款时间',
      refund_reason VARCHAR(200) COMMENT '退款原因',
      is_reward_granted TINYINT(1) DEFAULT 0 COMMENT '是否已发放推荐人奖励',
      reward_granted_at DATETIME COMMENT '奖励发放时间',
      order_metadata JSON COMMENT '订单元数据',
      expire_at DATETIME COMMENT '订单过期时间（创建后30分钟）',
      remark VARCHAR(500) COMMENT '订单备注',
      admin_remark VARCHAR(500) COMMENT '管理员备注',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      UNIQUE KEY uk_order_no (order_no),
      INDEX idx_user_id (user_id),
      INDEX idx_order_type (order_type),
      INDEX idx_pay_status (pay_status),
      INDEX idx_referee_id (referee_id),
      INDEX idx_related_id (related_id),
      INDEX idx_class_record_id (class_record_id),
      INDEX idx_transaction_id (transaction_id),
      INDEX idx_prepay_id (prepay_id),
      INDEX idx_expire_at (expire_at),
      INDEX idx_pay_time (pay_time),
      INDEX idx_created_at (created_at),
      INDEX idx_user_type_status (user_id, order_type, pay_status),
      INDEX idx_user_pay_status (user_id, pay_status),
      INDEX idx_type_status_time (order_type, pay_status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表'`
  ],

  // 模块4：预约模块（2张表）
  appointments: [
    `CREATE TABLE IF NOT EXISTS class_records (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT '上课计划ID',
      course_id INT NOT NULL COMMENT '课程ID',
      course_name VARCHAR(100) COMMENT '课程名称（冗余）',
      course_type TINYINT COMMENT '课程类型（冗余）',
      period VARCHAR(20) COMMENT '期数（如：第10期）',
      class_date DATE NOT NULL COMMENT '上课日期',
      class_time VARCHAR(50) COMMENT '上课时间（如：09:00-17:00）',
      class_location VARCHAR(200) COMMENT '上课地点',
      teacher VARCHAR(100) COMMENT '讲师',
      total_quota INT NOT NULL DEFAULT 30 COMMENT '总名额',
      booked_quota INT DEFAULT 0 COMMENT '已预约名额',
      booking_deadline DATETIME COMMENT '预约截止时间',
      retrain_deadline DATETIME COMMENT '复训报名截止时间（开课前3天）',
      status TINYINT DEFAULT 1 COMMENT '状态：0取消/1正常/2已结束',
      remark VARCHAR(500) COMMENT '备注',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_course_id (course_id),
      INDEX idx_class_date (class_date),
      INDEX idx_status (status),
      INDEX idx_course_date (course_id, class_date),
      INDEX idx_booking_deadline (booking_deadline),
      INDEX idx_retrain_deadline (retrain_deadline)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='上课计划表'`,

    `CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY COMMENT '预约ID',
      user_id INT NOT NULL COMMENT '用户ID',
      user_uid VARCHAR(64) COMMENT '用户UID',
      user_name VARCHAR(50) COMMENT '用户姓名（冗余）',
      user_phone VARCHAR(20) COMMENT '用户手机号（冗余）',
      _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT 'CloudBase 用户标识（用于数据隔离）',
      class_record_id INT NOT NULL COMMENT '上课计划ID',
      user_course_id INT NOT NULL COMMENT '用户课程ID',
      course_id INT COMMENT '课程ID（冗余）',
      course_name VARCHAR(100) COMMENT '课程名称（冗余）',
      is_retrain TINYINT(1) DEFAULT 0 COMMENT '是否复训：0首次/1复训',
      order_no VARCHAR(32) COMMENT '关联订单号（复训专用）',
      checkin_code VARCHAR(20) COMMENT '签到码',
      checkin_time DATETIME COMMENT '签到时间',
      checkin_admin_id INT COMMENT '签到操作管理员ID',
      status TINYINT DEFAULT 0 COMMENT '状态：0待上课/1已签到/2缺席/3已取消',
      cancel_reason VARCHAR(200) COMMENT '取消原因',
      cancel_time DATETIME COMMENT '取消时间',
      remark VARCHAR(500) COMMENT '备注',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '预约时间',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_user_id (user_id),
      INDEX idx_class_record_id (class_record_id),
      INDEX idx_user_course_id (user_course_id),
      INDEX idx_course_id (course_id),
      INDEX idx_is_retrain (is_retrain),
      INDEX idx_order_no (order_no),
      INDEX idx_status (status),
      INDEX idx_checkin_time (checkin_time),
      INDEX idx_user_class (user_id, class_record_id),
      INDEX idx_class_status (class_record_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约表'`
  ]
};

// 剩余模块的 SQL（模块5-9）
const ambassadorSQL = require('./sql-modules/ambassador.js');
const academyMallSQL = require('./sql-modules/academy-mall.js');
const contractSQL = require('./sql-modules/contract.js');
const feedbackSQL = require('./sql-modules/feedback.js');
const adminSQL = require('./sql-modules/admin.js');

SQL_MODULES.remaining = [
  // 模块5：大使模块（7张表）
  ...ambassadorSQL,
  // 模块6：商学院商城模块（5张表）
  ...academyMallSQL,
  // 模块7：协议模块（2张表）
  ...contractSQL,
  // 模块8：反馈消息模块（3张表）
  ...feedbackSQL,
  // 模块9：后台管理模块（4张表）
  ...adminSQL
];

/**
 * 主函数
 */
async function main() {
  let connection;

  try {
    // 1. 初始化 CloudBase
    console.log('[1/6] 初始化 CloudBase SDK...');
    const app = cloudbase.init({
      env: ENV_ID
    });
    console.log('✓ CloudBase SDK 初始化成功\n');

    // 2. 连接 MySQL
    console.log('[2/6] 连接 CloudBase MySQL...');
    console.log('提示: 请确保已在 CloudBase 控制台启用 MySQL 实例');
    console.log('提示: 如果连接失败，请检查以下内容：');
    console.log('  1. MySQL 实例是否已启动');
    console.log('  2. 网络是否可访问');
    console.log('  3. 密码是否正确（通过环境变量 MYSQL_PASSWORD 设置）\n');

    // CloudBase MySQL 连接配置（使用外网地址）
    const mysqlConfig = {
      host: 'sh-cynosdbmysql-grp-llpn0et0.sql.tencentcdb.com',
      port: 26327,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      multipleStatements: true,
      connectTimeout: 30000
    };

    console.log(`连接地址: ${mysqlConfig.host}:${mysqlConfig.port}`);
    console.log(`用户名: ${mysqlConfig.user}`);
    console.log(`密码: ${mysqlConfig.password ? '已设置' : '未设置（使用空密码）'}\n`);

    connection = await mysql.createConnection(mysqlConfig);
    console.log('✓ MySQL 连接成功\n');

    // 3. 创建数据库
    console.log('[3/6] 创建数据库...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DATABASE_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE ${DATABASE_NAME}`);
    console.log(`✓ 数据库 ${DATABASE_NAME} 已创建/选择\n`);

    // 4. 执行建表 SQL
    console.log('[4/6] 执行建表 SQL...');
    const sqlToExecute = getSQLToExecute(deployModule);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < sqlToExecute.length; i++) {
      const sql = sqlToExecute[i];
      const tableName = extractTableName(sql);

      try {
        process.stdout.write(`  [${i + 1}/${sqlToExecute.length}] 创建表 ${tableName}...`);
        await connection.query(sql);
        console.log(' ✓');
        successCount++;
      } catch (error) {
        console.log(' ✗');
        console.error(`    错误: ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n✓ 建表完成: 成功 ${successCount} 个, 失败 ${failCount} 个\n`);

    // 5. 验证表创建
    console.log('[5/6] 验证表创建结果...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✓ 当前数据库共有 ${tables.length} 张表:\n`);

    tables.forEach((row, index) => {
      const tableName = Object.values(row)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });
    console.log('');

    // 6. 输出部署报告
    console.log('[6/6] 部署报告');
    console.log('='.repeat(80));
    console.log(`部署模块: ${deployModule}`);
    console.log(`数据库名: ${DATABASE_NAME}`);
    console.log(`表总数: ${tables.length}`);
    console.log(`成功: ${successCount}`);
    console.log(`失败: ${failCount}`);
    console.log(`状态: ${failCount === 0 ? '✓ 全部成功' : '✗ 部分失败'}`);
    console.log('='.repeat(80));

    if (deployModule === 'users') {
      console.log('\n提示: 用户模块部署完成，请验证后再执行剩余模块部署:');
      console.log('  node scripts/deploy-database.js --module=remaining\n');
    }

  } catch (error) {
    console.error('\n✗ 部署失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ MySQL 连接已关闭');
    }
  }
}

/**
 * 根据部署模块获取要执行的 SQL
 */
function getSQLToExecute(module) {
  if (module === 'users') {
    return SQL_MODULES.users;
  } else if (module === 'remaining') {
    return [
      ...SQL_MODULES.courses,
      ...SQL_MODULES.orders,
      ...SQL_MODULES.appointments,
      ...SQL_MODULES.remaining
    ];
  } else {
    // all - 部署所有模块
    return [
      ...SQL_MODULES.users,
      ...SQL_MODULES.courses,
      ...SQL_MODULES.orders,
      ...SQL_MODULES.appointments,
      ...SQL_MODULES.remaining
    ];
  }
}

/**
 * 从 SQL 中提取表名
 */
function extractTableName(sql) {
  const match = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i);
  return match ? match[1] : 'unknown';
}

// 运行主函数
main();
