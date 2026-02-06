/**
 * 后台管理模块 SQL（4张表）
 */

module.exports = [
  // admin_users 表
  `CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '管理员ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    avatar VARCHAR(255) COMMENT '头像URL',
    role VARCHAR(50) NOT NULL DEFAULT 'admin' COMMENT '角色：super_admin超级管理员/admin管理员/operator操作员',
    permissions JSON COMMENT '权限列表',
    last_login_time DATETIME COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    login_count INT DEFAULT 0 COMMENT '登录次数',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用/1启用',
    created_by INT COMMENT '创建人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_phone (phone),
    INDEX idx_email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表'`,

  // admin_operation_logs 表
  `CREATE TABLE IF NOT EXISTS admin_operation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    admin_id INT NOT NULL COMMENT '管理员ID',
    admin_name VARCHAR(50) COMMENT '管理员姓名',
    operation_type VARCHAR(50) NOT NULL COMMENT '操作类型',
    operation_name VARCHAR(100) COMMENT '操作名称',
    operation_desc VARCHAR(500) COMMENT '操作描述',
    related_table VARCHAR(50) COMMENT '关联表名',
    related_id INT COMMENT '关联记录ID',
    request_method VARCHAR(10) COMMENT '请求方法',
    request_url VARCHAR(255) COMMENT '请求URL',
    request_params TEXT COMMENT '请求参数',
    response_data TEXT COMMENT '响应数据',
    before_data JSON COMMENT '变更前数据',
    after_data JSON COMMENT '变更后数据',
    ip_address VARCHAR(50) COMMENT '操作IP',
    user_agent VARCHAR(500) COMMENT '用户代理',
    result TINYINT DEFAULT 1 COMMENT '执行结果：0失败/1成功',
    error_message TEXT COMMENT '错误信息',
    remark TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    INDEX idx_admin_id (admin_id),
    INDEX idx_operation_type (operation_type),
    INDEX idx_related_table (related_table),
    INDEX idx_related_id (related_id),
    INDEX idx_result (result),
    INDEX idx_created_at (created_at),
    INDEX idx_admin_type (admin_id, operation_type),
    INDEX idx_table_id (related_table, related_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表'`,

  // system_configs 表
  `CREATE TABLE IF NOT EXISTS system_configs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    config_key VARCHAR(100) NOT NULL COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type VARCHAR(20) DEFAULT 'string' COMMENT '值类型：string/number/boolean/json',
    config_group VARCHAR(50) DEFAULT 'general' COMMENT '配置分组',
    config_name VARCHAR(100) COMMENT '配置名称',
    config_desc VARCHAR(500) COMMENT '配置描述',
    is_system TINYINT(1) DEFAULT 0 COMMENT '是否系统配置（不可删除）',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用/1启用',
    updated_by INT COMMENT '最后修改人ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_config_key (config_key),
    INDEX idx_config_group (config_group),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表'`,

  // announcements 表
  `CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '公告ID',
    title VARCHAR(200) NOT NULL COMMENT '公告标题',
    content TEXT NOT NULL COMMENT '公告内容（HTML）',
    summary VARCHAR(500) COMMENT '公告摘要',
    cover_image VARCHAR(255) COMMENT '封面图片',
    category VARCHAR(50) DEFAULT 'general' COMMENT '分类：general通用/course课程/activity活动/system系统',
    target_type TINYINT DEFAULT 0 COMMENT '目标类型：0全部用户/1普通用户/2大使用户',
    target_level TINYINT COMMENT '目标大使等级（target_type=2时）',
    is_top TINYINT(1) DEFAULT 0 COMMENT '是否置顶',
    is_popup TINYINT(1) DEFAULT 0 COMMENT '是否弹窗显示',
    start_time DATETIME COMMENT '开始时间',
    end_time DATETIME COMMENT '结束时间',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    status TINYINT DEFAULT 1 COMMENT '状态：0草稿/1已发布/2已下架',
    created_by INT COMMENT '创建人ID',
    published_at DATETIME COMMENT '发布时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category),
    INDEX idx_target_type (target_type),
    INDEX idx_is_top (is_top),
    INDEX idx_is_popup (is_popup),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order),
    INDEX idx_created_by (created_by),
    INDEX idx_status_time (status, start_time, end_time)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表'`
];
