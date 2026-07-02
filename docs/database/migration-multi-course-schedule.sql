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

-- 2. 数据迁移：已废弃（不执行）
-- 说明：多课程排期方案里，主课程继续用 class_records.course_id，本中间表只存"关联课程"
-- （后台排课时手动勾选的子课）。不应把现有主课程迁进中间表，否则主课程会被误当成关联课程。
-- 中间表初始为空。下方原迁移语句保留注释，仅供追溯。
-- INSERT INTO class_record_courses (class_record_id, course_id)
-- SELECT id, course_id FROM class_records
-- WHERE course_id IS NOT NULL;

-- 3. 验证表已创建（初始行数应为 0，等待后台排期写入关联课程）
SELECT COUNT(*) AS middle_table_rows FROM class_record_courses;
