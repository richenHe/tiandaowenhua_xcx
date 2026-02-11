-- ============================================
-- 活动记录功能数据库SQL
-- 创建时间：2026-02-11
-- 说明：根据 pages/ambassador/activity-records/index.vue 页面需求生成
-- ============================================

-- 1. 创建大使活动记录表
CREATE TABLE IF NOT EXISTS ambassador_activity_records (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '活动记录ID',
  user_id INT NOT NULL COMMENT '大使用户ID',
  user_uid VARCHAR(64) DEFAULT NULL COMMENT '大使用户UID',
  _openid VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'CloudBase 用户标识',

  -- 活动基本信息
  activity_type TINYINT NOT NULL COMMENT '活动类型：1辅导员/2会务义工/3沙龙组织/4其他',
  activity_name VARCHAR(100) NOT NULL COMMENT '活动名称（如：担任辅导员、会务义工）',
  activity_desc VARCHAR(500) DEFAULT NULL COMMENT '活动描述（如：初探班第12期、商学院年度总结会）',

  -- 关联信息
  class_record_id INT DEFAULT NULL COMMENT '关联上课计划ID（辅导员专用）',
  course_name VARCHAR(100) DEFAULT NULL COMMENT '课程名称（辅导员专用）',

  -- 活动详情
  location VARCHAR(200) DEFAULT NULL COMMENT '活动地点（如：北京市朝阳区、线上活动）',
  start_time DATETIME NOT NULL COMMENT '活动开始时间',
  end_time DATETIME DEFAULT NULL COMMENT '活动结束时间',
  duration VARCHAR(50) DEFAULT NULL COMMENT '活动时长（如：3天、5小时、7天）',

  -- 参与信息
  participant_count INT DEFAULT NULL COMMENT '参与人数（学员数、参会人数、转化人数等）',
  merit_points DECIMAL(10,2) DEFAULT 0.00 COMMENT '获得功德分',

  -- 备注信息
  note TEXT DEFAULT NULL COMMENT '活动备注/总结（如：协助讲师教学，解答学员疑问...）',
  images JSON DEFAULT NULL COMMENT '活动图片列表',

  -- 状态信息
  status TINYINT DEFAULT 1 COMMENT '状态：0无效/1有效/2待审核',
  audit_admin_id INT DEFAULT NULL COMMENT '审核管理员ID',
  audit_time DATETIME DEFAULT NULL COMMENT '审核时间',
  audit_remark VARCHAR(500) DEFAULT NULL COMMENT '审核备注',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  -- 索引
  INDEX idx_user_id (user_id),
  INDEX idx_activity_type (activity_type),
  INDEX idx_class_record_id (class_record_id),
  INDEX idx_start_time (start_time),
  INDEX idx_status (status),
  INDEX idx_user_type (user_id, activity_type),
  INDEX idx_created_at (created_at),

  -- 外键约束
  CONSTRAINT fk_activity_records_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_activity_records_class_record FOREIGN KEY (class_record_id) REFERENCES class_records(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='大使活动记录表';

-- 2. 在 users 表新增累计活动次数字段（用于成长等级计算）
ALTER TABLE users
ADD COLUMN total_activity_count INT DEFAULT 0 COMMENT '累计活动次数（用于成长等级计算：🍃绿叶/🌸花朵/🍎果实/🌳大树）',
ADD INDEX idx_total_activity_count (total_activity_count);

-- 3. 插入客服电话配置（用于预约确认页）
INSERT INTO system_configs (config_key, config_value, config_type, config_group, config_name, config_desc, is_system, status)
VALUES (
  'customer_service_phone',
  '400-123-4567',
  'string',
  'contact',
  '客服电话',
  '平台客服联系电话',
  1,
  1
)
ON DUPLICATE KEY UPDATE
  config_value = VALUES(config_value),
  updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- 测试数据（可选，需要替换实际的 user_id）
-- ============================================
/*
-- 假设用户ID为1，插入4条测试活动记录
INSERT INTO ambassador_activity_records
  (user_id, user_uid, _openid, activity_type, activity_name, activity_desc, location, start_time, duration, participant_count, merit_points, note, status)
VALUES
  -- 辅导员记录
  (1, 'test_uid_001', 'test_openid_001', 1, '担任辅导员', '初探班第12期', '北京市朝阳区', '2024-01-15 09:00:00', '3天', 30, 500.00, '协助讲师教学，解答学员疑问，组织课堂讨论，效果良好', 1),

  -- 会务义工记录
  (1, 'test_uid_001', 'test_openid_001', 2, '会务义工', '商学院年度总结会', '北京国际会议中心', '2024-01-10 14:00:00', '5小时', 200, 300.00, '负责签到、场地布置、茶歇服务、会场秩序维护等工作', 1),

  -- 沙龙组织记录
  (1, 'test_uid_001', 'test_openid_001', 3, '组织沙龙活动', '天道文化学习沙龙（第3期）', '北京市海淀区', '2024-01-08 15:00:00', '3小时', 25, 800.00, '策划组织线下学习沙龙，分享天道文化学习心得，促进学员交流', 1),

  -- 其他活动记录
  (1, 'test_uid_001', 'test_openid_001', 4, '协助推广活动', '春季招生推广', '线上活动', '2024-01-05 00:00:00', '7天', 12, 200.00, '制作宣传素材，朋友圈推广，社群维护，成功转化12位学员', 1);

-- 更新用户的累计活动次数
UPDATE users SET total_activity_count = 4 WHERE id = 1;
*/

-- ============================================
-- 页面需要的字段说明
-- ============================================
/*
根据 pages/ambassador/activity-records/index.vue 分析：

1. 活动统计卡片（第13-29行）：
   - 累计活动次数：COUNT(*) 或 users.total_activity_count
   - 累计功德分：SUM(merit_points)
   - 本月活动次数：COUNT(*) WHERE MONTH(start_time) = MONTH(NOW())

2. 活动类型统计（第43-66行）：
   - 辅导员次数：COUNT(*) WHERE activity_type = 1
   - 会务义工次数：COUNT(*) WHERE activity_type = 2
   - 沙龙组织次数：COUNT(*) WHERE activity_type = 3
   - 其他活动次数：COUNT(*) WHERE activity_type = 4

3. 活动记录列表（第82-197行）：
   每条记录需要的字段：
   - activity_type: 活动类型（用于显示图标和样式）
   - activity_name: 活动名称（如：担任辅导员）
   - activity_desc: 活动描述（如：初探班第12期）
   - merit_points: 功德分（如：+500.0）
   - location: 活动地点（如：北京市朝阳区）
   - start_time: 活动时间（如：2024-01-15 09:00）
   - duration: 活动时长（如：3天）
   - participant_count: 参与人数（如：30人）
   - note: 活动备注（如：协助讲师教学...）

4. Tab筛选（第68-77行）：
   - 全部：不筛选
   - 辅导员：activity_type = 1
   - 义工：activity_type = 2
   - 沙龙：activity_type = 3
*/

-- ============================================
-- SQL执行完毕
-- ============================================
