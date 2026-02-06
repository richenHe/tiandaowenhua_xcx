/**
 * 反馈消息模块 SQL（3张表）
 */

module.exports = [
  // feedbacks 表
  `CREATE TABLE IF NOT EXISTS feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '反馈ID',
    user_id INT NOT NULL COMMENT '用户ID',
    user_uid VARCHAR(64) COMMENT '用户UID',
    user_name VARCHAR(50) COMMENT '用户姓名',
    user_phone VARCHAR(20) COMMENT '用户手机号',
    _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT 'CloudBase 用户标识（用于数据隔离）',
    feedback_type TINYINT NOT NULL COMMENT '反馈类型：1功能建议/2课程内容/3课程服务/4系统问题/5其他',
    course_id INT COMMENT '关联课程ID（课程相关反馈）',
    course_name VARCHAR(100) COMMENT '关联课程名称',
    content TEXT NOT NULL COMMENT '反馈内容',
    images JSON COMMENT '图片列表',
    contact VARCHAR(100) COMMENT '联系方式',
    status TINYINT DEFAULT 0 COMMENT '状态：0待处理/1处理中/2已处理/3已关闭',
    reply TEXT COMMENT '回复内容',
    reply_time DATETIME COMMENT '回复时间',
    reply_admin_id INT COMMENT '回复管理员ID',
    priority TINYINT DEFAULT 0 COMMENT '优先级：0普通/1紧急/2非常紧急',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_reply_admin_id (reply_admin_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status_priority (status, priority)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='反馈表'`,

  // notification_configs 表
  `CREATE TABLE IF NOT EXISTS notification_configs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    config_name VARCHAR(100) NOT NULL COMMENT '配置名称',
    config_code VARCHAR(50) NOT NULL COMMENT '配置编码（唯一标识）',
    course_id INT COMMENT '关联课程ID（0表示通用）',
    trigger_type TINYINT NOT NULL COMMENT '触发类型：1预约成功/2上课提醒/3签到成功/4支付成功/5手动发送',
    trigger_time_offset INT DEFAULT 0 COMMENT '触发时间偏移（分钟，负数表示提前）',
    template_id VARCHAR(100) COMMENT '微信订阅消息模板ID',
    template_name VARCHAR(100) COMMENT '模板名称',
    title VARCHAR(100) COMMENT '消息标题',
    content_template TEXT COMMENT '消息内容模板（支持变量）',
    page_path VARCHAR(200) COMMENT '点击跳转页面路径',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用/1启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_config_code (config_code),
    INDEX idx_course_id (course_id),
    INDEX idx_trigger_type (trigger_type),
    INDEX idx_status (status),
    INDEX idx_course_trigger (course_id, trigger_type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息配置表'`,

  // notification_logs 表
  `CREATE TABLE IF NOT EXISTS notification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    user_id INT NOT NULL COMMENT '用户ID',
    user_uid VARCHAR(64) COMMENT '用户UID',
    openid VARCHAR(128) COMMENT '微信OpenID',
    _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT 'CloudBase 用户标识（用于数据隔离）',
    config_id INT COMMENT '消息配置ID',
    template_id VARCHAR(100) COMMENT '微信模板ID',
    class_record_id INT COMMENT '关联上课计划ID',
    order_no VARCHAR(32) COMMENT '关联订单号',
    appointment_id INT COMMENT '关联预约ID',
    title VARCHAR(100) COMMENT '消息标题',
    content TEXT COMMENT '消息内容',
    template_data JSON COMMENT '模板数据（发送给微信的数据）',
    send_type TINYINT DEFAULT 1 COMMENT '发送类型：1自动/2手动',
    send_status TINYINT DEFAULT 0 COMMENT '发送状态：0待发送/1已发送/2发送失败',
    send_time DATETIME COMMENT '发送时间',
    error_message TEXT COMMENT '发送失败时的错误信息',
    admin_id INT COMMENT '手动发送时的管理员ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_config_id (config_id),
    INDEX idx_class_record_id (class_record_id),
    INDEX idx_order_no (order_no),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_send_type (send_type),
    INDEX idx_send_status (send_status),
    INDEX idx_send_time (send_time),
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at),
    INDEX idx_class_status (class_record_id, send_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息发送日志表'`
];
