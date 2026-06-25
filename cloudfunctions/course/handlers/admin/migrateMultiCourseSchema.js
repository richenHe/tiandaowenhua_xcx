/**
 * 多课程排期 - 数据库迁移 Handler（一次性，迁移完成后可删除）
 * Action: migrateMultiCourseSchema
 *
 * 通过云函数执行 DDL，避免直接操作数据库的限制：
 * 1. 创建 class_record_courses 中间表（如不存在）
 * 2. 将现有 class_records.course_id 迁移到中间表
 *
 * 注意：此 handler 仅需执行一次，迁移完成后可从 index.js 路由中移除
 */
const { db, response } = require('../../common');

module.exports = async (event, context) => {
  try {
    const results = { steps: [] };

    // 步骤 1：创建中间表（如已存在则跳过）
    // CloudBase rdb 的 createTableIfNotExists 通过 raw SQL 执行
    try {
      // 尝试插入一条测试数据来验证表是否存在
      const { error: checkError } = await db
        .from('class_record_courses')
        .select('id')
        .limit(1);

      if (checkError) {
        // 表不存在，需要通过 REST API 创建
        // 由于 cloud function 内无法直接执行 DDL，输出 SQL 供手动执行
        results.steps.push({
          step: 'create_table',
          status: 'manual_required',
          sql: `CREATE TABLE IF NOT EXISTS class_record_courses (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
  class_record_id INT NOT NULL COMMENT '排期ID',
  course_id INT NOT NULL COMMENT '课程ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_record_course (class_record_id, course_id),
  INDEX idx_class_record_id (class_record_id),
  INDEX idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
          message: '请先在 CloudBase 控制台 → 数据库 → tiandao_culture 中执行以上 SQL 创建中间表，然后重新调用此接口'
        });
        return response.success(results, '需要先手动创建中间表，请查看 steps[0].sql');
      }

      results.steps.push({ step: 'create_table', status: 'exists', message: '中间表已存在' });
    } catch (e) {
      results.steps.push({
        step: 'create_table',
        status: 'manual_required',
        sql: `CREATE TABLE IF NOT EXISTS class_record_courses (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
  class_record_id INT NOT NULL COMMENT '排期ID',
  course_id INT NOT NULL COMMENT '课程ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_record_course (class_record_id, course_id),
  INDEX idx_class_record_id (class_record_id),
  INDEX idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
        message: '请先在 CloudBase 控制台 → 数据库 → tiandao_culture 中执行以上 SQL 创建中间表，然后重新调用此接口'
      });
      return response.success(results, '需要先手动创建中间表，请查看 steps[0].sql');
    }

    // 步骤 2：迁移现有数据
    const { data: existingRecords, error: fetchError } = await db
      .from('class_records')
      .select('id, course_id')
      .not('course_id', 'is', null);

    if (fetchError) {
      return response.error('查询现有排期失败', fetchError);
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const record of (existingRecords || [])) {
      // 检查是否已迁移
      const { data: existing } = await db
        .from('class_record_courses')
        .select('id')
        .eq('class_record_id', record.id)
        .eq('course_id', record.course_id)
        .limit(1);

      if (existing && existing.length > 0) {
        skippedCount++;
        continue;
      }

      // 插入关联记录
      const { error: insertError } = await db
        .from('class_record_courses')
        .insert({
          class_record_id: record.id,
          course_id: record.course_id,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        results.steps.push({
          step: 'migrate',
          record_id: record.id,
          status: 'error',
          error: insertError.message
        });
      } else {
        migratedCount++;
      }
    }

    results.steps.push({
      step: 'migrate_data',
      status: 'completed',
      total: (existingRecords || []).length,
      migrated: migratedCount,
      skipped: skippedCount
    });

    return response.success(results, `迁移完成：新增 ${migratedCount} 条，跳过 ${skippedCount} 条`);

  } catch (error) {
    console.error('[migrateMultiCourseSchema] 迁移失败:', error);
    return response.error('数据库迁移失败', error);
  }
};
