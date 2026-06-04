-- ============================================
-- 迁移 001: 课程分类动态化管理
-- 日期: 2026-05-25
-- 说明: 新建 course_categories 表 + courses 加 category_id
-- 执行方式: 在 CloudBase 控制台 MySQL 中执行此脚本
-- 控制台地址: https://tcb.cloud.tencent.com/dev?envId=cloud1-0gnn3mn17b581124#/db/mysql/table/default/
-- ============================================

-- 1. 创建 course_categories 表
CREATE TABLE IF NOT EXISTS course_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  sort_order INT DEFAULT 0 COMMENT '排序权重（越大越靠后）',
  status TINYINT DEFAULT 1 COMMENT '0禁用/1启用',
  is_system TINYINT DEFAULT 0 COMMENT '0自定义/1系统内置(不可删改)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='课程分类表';

-- 2. 预置系统分类
INSERT INTO course_categories (id, name, sort_order, status, is_system) VALUES
  (1, '初探班', 1, 1, 1),
  (2, '密训班', 2, 1, 1),
  (3, '咨询服务', 3, 1, 1),
  (4, '沙龙', 4, 1, 1)
ON DUPLICATE KEY UPDATE id=id;

-- 3. courses 表新增 category_id 字段
-- 先检查字段是否存在（忽略错误）
ALTER TABLE courses ADD COLUMN category_id INT DEFAULT NULL COMMENT '分类ID（关联 course_categories.id）' AFTER type;

-- 4. 迁移已有数据：category_id = type（系统分类一一对应）
UPDATE courses SET category_id = type WHERE category_id IS NULL;
