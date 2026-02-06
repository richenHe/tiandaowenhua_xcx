/**
 * 商学院商城模块 SQL（5张表）
 */

module.exports = [
  // academy_intro 表
  `CREATE TABLE IF NOT EXISTS academy_intro (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '介绍ID',
    title VARCHAR(100) NOT NULL COMMENT '标题',
    content TEXT COMMENT '介绍内容（HTML）',
    cover_image VARCHAR(255) COMMENT '封面图片',
    team JSON COMMENT '团队成员信息',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用/1启用',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商学院介绍表'`,

  // academy_materials 表
  `CREATE TABLE IF NOT EXISTS academy_materials (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '素材ID',
    title VARCHAR(100) NOT NULL COMMENT '素材标题',
    category VARCHAR(50) NOT NULL COMMENT '分类：poster海报/copywriting文案/video视频',
    image_url VARCHAR(255) COMMENT '图片URL',
    video_url VARCHAR(255) COMMENT '视频URL',
    content TEXT COMMENT '文案内容',
    tags JSON COMMENT '标签列表',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    share_count INT DEFAULT 0 COMMENT '分享次数',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    status TINYINT DEFAULT 1 COMMENT '状态：0下架/1上架',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order),
    INDEX idx_created_at (created_at),
    INDEX idx_category_status (category, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈素材表'`,

  // academy_cases 表
  `CREATE TABLE IF NOT EXISTS academy_cases (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '案例ID',
    student_name VARCHAR(50) NOT NULL COMMENT '学员姓名',
    student_avatar VARCHAR(255) COMMENT '学员头像',
    student_title VARCHAR(100) COMMENT '学员头衔/职业',
    title VARCHAR(200) NOT NULL COMMENT '案例标题',
    summary VARCHAR(500) COMMENT '案例摘要',
    content TEXT COMMENT '详细内容（HTML）',
    video_url VARCHAR(255) COMMENT '视频URL',
    images JSON COMMENT '图片列表',
    course_id INT COMMENT '关联课程ID',
    course_name VARCHAR(100) COMMENT '关联课程名称',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    like_count INT DEFAULT 0 COMMENT '点赞次数',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    is_featured TINYINT(1) DEFAULT 0 COMMENT '是否精选',
    status TINYINT DEFAULT 1 COMMENT '状态：0下架/1上架',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_course_id (course_id),
    INDEX idx_is_featured (is_featured),
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学员案例表'`,

  // mall_goods 表
  `CREATE TABLE IF NOT EXISTS mall_goods (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '商品ID',
    goods_name VARCHAR(100) NOT NULL COMMENT '商品名称',
    goods_image VARCHAR(255) COMMENT '商品图片',
    description TEXT COMMENT '商品描述',
    merit_points_price DECIMAL(10,2) NOT NULL COMMENT '功德分价格',
    stock_quantity INT DEFAULT -1 COMMENT '库存数量（-1表示无限）',
    sold_quantity INT DEFAULT 0 COMMENT '已售数量',
    limit_per_user INT DEFAULT 0 COMMENT '每人限兑数量（0表示不限）',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    status TINYINT DEFAULT 1 COMMENT '状态：0下架/1上架',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order),
    INDEX idx_merit_points_price (merit_points_price)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商城商品表'`,

  // mall_exchange_records 表
  `CREATE TABLE IF NOT EXISTS mall_exchange_records (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '兑换ID',
    exchange_no VARCHAR(32) NOT NULL COMMENT '兑换单号（格式：EX + 年月日 + 8位随机数）',
    user_id INT NOT NULL COMMENT '用户ID',
    user_uid VARCHAR(64) COMMENT '用户UID',
    user_name VARCHAR(50) COMMENT '用户姓名',
    _openid VARCHAR(64) DEFAULT '' NOT NULL COMMENT 'CloudBase 用户标识（用于数据隔离）',
    goods_id INT NOT NULL COMMENT '商品ID',
    goods_name VARCHAR(100) NOT NULL COMMENT '商品名称（冗余）',
    goods_image VARCHAR(255) COMMENT '商品图片（冗余）',
    quantity INT NOT NULL DEFAULT 1 COMMENT '兑换数量',
    unit_price DECIMAL(10,2) NOT NULL COMMENT '单价（功德分）',
    total_cost DECIMAL(10,2) NOT NULL COMMENT '总成本',
    merit_points_used DECIMAL(10,2) NOT NULL COMMENT '使用功德分',
    cash_points_used DECIMAL(10,2) DEFAULT 0.00 COMMENT '补充的积分',
    status TINYINT DEFAULT 1 COMMENT '状态：1已兑换/2已领取/3已取消',
    pickup_time DATETIME COMMENT '领取时间',
    pickup_admin_id INT COMMENT '领取确认管理员ID',
    remark VARCHAR(500) COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '兑换时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_exchange_no (exchange_no),
    INDEX idx_user_id (user_id),
    INDEX idx_goods_id (goods_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_user_status (user_id, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='兑换记录表'`
];
