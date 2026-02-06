/**
 * 协议模块 SQL（2张表）
 */

module.exports = [
  // contract_templates 表
  `CREATE TABLE IF NOT EXISTS contract_templates (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '模板ID',
    contract_name VARCHAR(100) NOT NULL COMMENT '协议名称',
    contract_type TINYINT NOT NULL COMMENT '协议类型：1传播大使协议/2青鸾大使协议/3鸿鹄大使补充协议',
    ambassador_level TINYINT NOT NULL COMMENT '适用大使等级：1准青鸾/2青鸾/3鸿鹄',
    version VARCHAR(20) NOT NULL COMMENT '版本号（如：v1.0）',
    version_note VARCHAR(500) COMMENT '版本说明',
    content TEXT NOT NULL COMMENT '协议内容（HTML，支持变量占位符）',
    validity_years INT DEFAULT 1 COMMENT '协议有效期（年）',
    effective_time DATETIME COMMENT '生效时间',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用/1启用',
    created_by INT COMMENT '创建管理员ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_contract_type (contract_type),
    INDEX idx_ambassador_level (ambassador_level),
    INDEX idx_version (version),
    INDEX idx_status (status),
    INDEX idx_type_level_status (contract_type, ambassador_level, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='协议模板表'`,

  // contract_signatures 表
  `CREATE TABLE IF NOT EXISTS contract_signatures (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '签署ID',
    user_id INT NOT NULL COMMENT '用户ID',
    user_uid VARCHAR(64) COMMENT '用户UID',
    user_name VARCHAR(50) COMMENT '用户姓名',
    _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT 'CloudBase 用户标识（用于数据隔离）',
    contract_template_id INT NOT NULL COMMENT '协议模板ID',
    ambassador_level TINYINT NOT NULL COMMENT '签署时的大使等级',
    contract_name VARCHAR(100) NOT NULL COMMENT '协议名称',
    contract_version VARCHAR(20) NOT NULL COMMENT '协议版本',
    contract_content TEXT NOT NULL COMMENT '协议完整内容（已填充变量）',
    contract_start DATE NOT NULL COMMENT '合同开始日期',
    contract_end DATE NOT NULL COMMENT '合同结束日期',
    sign_time DATETIME NOT NULL COMMENT '签署时间',
    sign_type TINYINT DEFAULT 1 COMMENT '签署类型：1用户签署/2管理员续签',
    sign_phone_suffix VARCHAR(4) COMMENT '签署手机号后四位',
    sign_ip VARCHAR(50) COMMENT '签署IP地址',
    sign_device JSON COMMENT '签署设备信息',
    admin_id INT COMMENT '操作管理员ID（续签时）',
    status TINYINT DEFAULT 1 COMMENT '状态：0已作废/1有效/2已过期/3已续签',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_contract_template_id (contract_template_id),
    INDEX idx_ambassador_level (ambassador_level),
    INDEX idx_contract_end (contract_end),
    INDEX idx_sign_time (sign_time),
    INDEX idx_sign_type (sign_type),
    INDEX idx_status (status),
    INDEX idx_user_status (user_id, status),
    INDEX idx_admin_id (admin_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='协议签署记录表'`
];
