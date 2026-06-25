-- ============================================
-- 多课程排期功能 - 数据库迁移
-- 日期：2026-06-21
-- 描述：class_records 从 1:1 课程关联升级为 N:M，
--       新增中间表 class_record_courses
-- ============================================

-- 1. 创建中间表
CREATE TABLE IF NOT EXISTS class_record_courses (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
  class_record_id INT NOT NULL COMMENT '排期ID',
  course_id INT NOT NULL COMMENT '课程ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_record_course (class_record_id, course_id),
  INDEX idx_class_record_id (class_record_id),
  INDEX idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='排期-课程关联表';

-- 2. 迁移现有数据（将 class_records.course_id 写入中间表）
INSERT INTO class_record_courses (class_record_id, course_id)
SELECT id, course_id FROM class_records
WHERE course_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM class_record_courses crc
    WHERE crc.class_record_id = class_records.id
    AND crc.course_id = class_records.course_id
  );

-- 3. 验证迁移结果
SELECT
  (SELECT COUNT(*) FROM class_records WHERE course_id IS NOT NULL) AS total_records,
  (SELECT COUNT(*) FROM class_record_courses) AS migrated_records;
