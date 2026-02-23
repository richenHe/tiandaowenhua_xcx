-- ============================================
-- 支付回调常用查询脚本
-- ============================================

-- ============================================
-- 1. 订单查询
-- ============================================

-- 1.1 查询订单详情
SELECT
  order_no,
  user_id,
  order_type,
  related_id,
  final_amount,
  pay_status,
  pay_time,
  transaction_id,
  referee_id,
  is_reward_granted,
  reward_granted_at,
  created_at,
  updated_at
FROM orders
WHERE order_no = 'ORD20260222001';

-- 1.2 查询今日订单统计
SELECT
  order_type,
  COUNT(*) as total,
  SUM(CASE WHEN pay_status = 1 THEN 1 ELSE 0 END) as paid,
  SUM(CASE WHEN pay_status = 0 THEN 1 ELSE 0 END) as unpaid,
  SUM(final_amount) as total_amount,
  SUM(CASE WHEN pay_status = 1 THEN final_amount ELSE 0 END) as paid_amount
FROM orders
WHERE DATE(created_at) = CURDATE()
GROUP BY order_type;

-- 1.3 查询最近支付成功的订单
SELECT
  order_no,
  user_id,
  order_type,
  final_amount,
  pay_time,
  TIMESTAMPDIFF(SECOND, created_at, pay_time) as pay_duration
FROM orders
WHERE pay_status = 1
ORDER BY pay_time DESC
LIMIT 20;

-- 1.4 查询待处理订单（已支付但未发放课程）
SELECT
  o.order_no,
  o.user_id,
  o.order_type,
  o.final_amount,
  o.pay_time,
  COUNT(uc.id) as course_count
FROM orders o
LEFT JOIN user_courses uc ON o.order_no = uc.order_no
WHERE o.order_type = 1
  AND o.pay_status = 1
  AND o.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY o.order_no
HAVING course_count = 0;

-- ============================================
-- 2. 课程查询
-- ============================================

-- 2.1 查询用户课程列表
SELECT
  uc.id,
  uc.course_name,
  uc.course_type,
  uc.buy_price,
  uc.is_gift,
  uc.gift_source,
  uc.attend_count,
  uc.buy_time,
  uc.order_no
FROM user_courses uc
WHERE uc.user_id = 1
  AND uc.status = 1
ORDER BY uc.buy_time DESC;

-- 2.2 查询赠送课程记录
SELECT
  uc.user_id,
  u.real_name,
  uc.course_name,
  uc.gift_source,
  uc.source_order_id,
  uc.buy_time
FROM user_courses uc
LEFT JOIN users u ON uc.user_id = u.id
WHERE uc.is_gift = 1
  AND DATE(uc.buy_time) = CURDATE()
ORDER BY uc.buy_time DESC;

-- 2.3 查询课程发放统计
SELECT
  c.name as course_name,
  COUNT(uc.id) as total_granted,
  SUM(CASE WHEN uc.is_gift = 0 THEN 1 ELSE 0 END) as purchased,
  SUM(CASE WHEN uc.is_gift = 1 THEN 1 ELSE 0 END) as gifted,
  SUM(uc.buy_price) as total_revenue
FROM user_courses uc
LEFT JOIN courses c ON uc.course_id = c.id
WHERE DATE(uc.buy_time) = CURDATE()
GROUP BY c.id;

-- 2.4 查询用户上课次数
SELECT
  u.id,
  u.real_name,
  uc.course_name,
  uc.attend_count,
  COUNT(a.id) as actual_attend
FROM users u
LEFT JOIN user_courses uc ON u.id = uc.user_id
LEFT JOIN appointments a ON u.id = a.user_id AND a.status = 2
WHERE u.id = 1
GROUP BY uc.id;

-- ============================================
-- 3. 奖励查询
-- ============================================

-- 3.1 查询推荐人功德分明细
SELECT
  mp.id,
  mp.type,
  mp.source,
  mp.amount,
  mp.order_no,
  mp.referee_user_name,
  mp.remark,
  mp.created_at
FROM merit_points_records mp
WHERE mp.user_id = 2
ORDER BY mp.created_at DESC
LIMIT 20;

-- 3.2 查询推荐人积分明细
SELECT
  cp.id,
  cp.type,
  CASE cp.type
    WHEN 1 THEN '获得冻结'
    WHEN 2 THEN '解冻'
    WHEN 3 THEN '获得可用'
    WHEN 4 THEN '提现'
  END as type_name,
  cp.amount,
  cp.order_no,
  cp.referee_user_name,
  cp.remark,
  cp.created_at
FROM cash_points_records cp
WHERE cp.user_id = 2
ORDER BY cp.created_at DESC
LIMIT 20;

-- 3.3 查询今日奖励发放统计
SELECT
  COUNT(DISTINCT o.order_no) as total_orders,
  COUNT(DISTINCT mp.id) as merit_granted,
  COUNT(DISTINCT cp.id) as cash_granted,
  SUM(mp.amount) as total_merit,
  SUM(cp.amount) as total_cash
FROM orders o
LEFT JOIN merit_points_records mp ON o.order_no = mp.order_no
LEFT JOIN cash_points_records cp ON o.order_no = cp.order_no
WHERE o.order_type = 1
  AND o.pay_status = 1
  AND o.referee_id IS NOT NULL
  AND DATE(o.pay_time) = CURDATE();

-- 3.4 查询奖励发放失败的订单
SELECT
  o.order_no,
  o.user_id,
  o.referee_id,
  o.final_amount,
  o.pay_time,
  o.is_reward_granted,
  COUNT(mp.id) as merit_count,
  COUNT(cp.id) as cash_count
FROM orders o
LEFT JOIN merit_points_records mp ON o.order_no = mp.order_no
LEFT JOIN cash_points_records cp ON o.order_no = cp.order_no
WHERE o.order_type = 1
  AND o.pay_status = 1
  AND o.referee_id IS NOT NULL
  AND DATE(o.pay_time) = CURDATE()
GROUP BY o.order_no
HAVING (o.is_reward_granted = 1 AND (merit_count = 0 OR cash_count = 0))
    OR (o.is_reward_granted = 0 AND (merit_count > 0 OR cash_count > 0));

-- ============================================
-- 4. 积分余额查询
-- ============================================

-- 4.1 查询用户积分余额
SELECT
  u.id,
  u.uid,
  u.real_name,
  u.ambassador_level,
  u.merit_points,
  u.cash_points_frozen,
  u.cash_points_available,
  (u.cash_points_frozen + u.cash_points_available) as total_cash_points
FROM users u
WHERE u.id = 2;

-- 4.2 查询积分余额与明细不一致的用户
SELECT
  u.id,
  u.uid,
  u.real_name,
  u.merit_points as current_merit,
  COALESCE(SUM(CASE WHEN mp.type = 1 THEN mp.amount ELSE -mp.amount END), 0) as calculated_merit,
  u.cash_points_frozen as current_frozen,
  COALESCE(SUM(CASE WHEN cp.type = 1 THEN cp.amount WHEN cp.type = 2 THEN -cp.amount ELSE 0 END), 0) as calculated_frozen
FROM users u
LEFT JOIN merit_points_records mp ON u.id = mp.user_id
LEFT JOIN cash_points_records cp ON u.id = cp.user_id AND cp.type IN (1, 2)
WHERE u.ambassador_level > 0
GROUP BY u.id
HAVING ABS(current_merit - calculated_merit) > 0.01
    OR ABS(current_frozen - calculated_frozen) > 0.01;

-- 4.3 查询今日积分变动
SELECT
  u.id,
  u.real_name,
  SUM(CASE WHEN mp.type = 1 THEN mp.amount ELSE -mp.amount END) as merit_change,
  SUM(CASE WHEN cp.type = 1 THEN cp.amount WHEN cp.type = 2 THEN -cp.amount ELSE 0 END) as frozen_change,
  SUM(CASE WHEN cp.type = 2 THEN cp.amount WHEN cp.type = 4 THEN -cp.amount ELSE 0 END) as available_change
FROM users u
LEFT JOIN merit_points_records mp ON u.id = mp.user_id AND DATE(mp.created_at) = CURDATE()
LEFT JOIN cash_points_records cp ON u.id = cp.user_id AND DATE(cp.created_at) = CURDATE()
WHERE u.ambassador_level > 0
GROUP BY u.id
HAVING merit_change != 0 OR frozen_change != 0 OR available_change != 0;

-- ============================================
-- 5. 预约和签到查询
-- ============================================

-- 5.1 查询用户预约记录
SELECT
  a.id,
  a.course_name,
  a.is_retrain,
  a.status,
  CASE a.status
    WHEN 0 THEN '待上课'
    WHEN 1 THEN '已完成'
    WHEN 2 THEN '已签到'
    WHEN 3 THEN '已取消'
  END as status_name,
  a.order_no,
  a.checkin_at,
  a.created_at
FROM appointments a
WHERE a.user_id = 1
ORDER BY a.created_at DESC;

-- 5.2 查询今日签到记录
SELECT
  a.id,
  u.real_name as user_name,
  a.course_name,
  a.is_retrain,
  a.checkin_at
FROM appointments a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.status = 2
  AND DATE(a.checkin_at) = CURDATE()
ORDER BY a.checkin_at DESC;

-- 5.3 查询复训预约统计
SELECT
  cr.id as class_id,
  c.name as course_name,
  cr.booked_quota,
  cr.max_quota,
  COUNT(a.id) as retrain_count
FROM class_records cr
LEFT JOIN courses c ON cr.course_id = c.id
LEFT JOIN appointments a ON cr.id = a.class_record_id AND a.is_retrain = 1
WHERE cr.status = 1
GROUP BY cr.id;

-- ============================================
-- 6. 大使升级查询
-- ============================================

-- 6.1 查询大使名额
SELECT
  aq.id,
  u.real_name,
  aq.quota_type,
  CASE aq.quota_type
    WHEN 1 THEN '初探班'
    WHEN 2 THEN '密训班'
  END as quota_type_name,
  aq.total_quantity,
  aq.used_quantity,
  aq.remaining_quantity,
  aq.expire_date,
  aq.source_remark,
  aq.created_at
FROM ambassador_quotas aq
LEFT JOIN users u ON aq.user_id = u.id
WHERE aq.user_id = 2
  AND aq.status = 1
ORDER BY aq.created_at DESC;

-- 6.2 查询今日大使升级
SELECT
  o.order_no,
  u.real_name,
  o.related_id as target_level,
  alc.level_name,
  o.final_amount,
  o.pay_time
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN ambassador_level_configs alc ON o.related_id = alc.level
WHERE o.order_type = 4
  AND o.pay_status = 1
  AND DATE(o.pay_time) = CURDATE()
ORDER BY o.pay_time DESC;

-- 6.3 查询大使等级分布
SELECT
  alc.level,
  alc.level_name,
  COUNT(u.id) as user_count
FROM ambassador_level_configs alc
LEFT JOIN users u ON alc.level = u.ambassador_level
GROUP BY alc.level
ORDER BY alc.level;

-- ============================================
-- 7. 错误日志查询
-- ============================================

-- 7.1 查询最近错误日志
SELECT
  id,
  error_type,
  order_no,
  error_message,
  created_at
FROM payment_error_logs
ORDER BY created_at DESC
LIMIT 20;

-- 7.2 查询今日错误统计
SELECT
  error_type,
  COUNT(*) as count,
  MAX(created_at) as last_error
FROM payment_error_logs
WHERE DATE(created_at) = CURDATE()
GROUP BY error_type
ORDER BY count DESC;

-- 7.3 查询特定订单的错误
SELECT *
FROM payment_error_logs
WHERE order_no = 'ORD20260222001'
ORDER BY created_at DESC;

-- 7.4 查询错误趋势（最近7天）
SELECT
  DATE(created_at) as date,
  error_type,
  COUNT(*) as count
FROM payment_error_logs
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at), error_type
ORDER BY date DESC, count DESC;

-- ============================================
-- 8. 性能监控查询
-- ============================================

-- 8.1 查询订单处理时间
SELECT
  order_no,
  order_type,
  TIMESTAMPDIFF(SECOND, created_at, pay_time) as pay_duration,
  TIMESTAMPDIFF(SECOND, pay_time, updated_at) as process_duration
FROM orders
WHERE pay_status = 1
  AND DATE(pay_time) = CURDATE()
ORDER BY process_duration DESC
LIMIT 20;

-- 8.2 查询平均处理时间
SELECT
  order_type,
  COUNT(*) as total,
  AVG(TIMESTAMPDIFF(SECOND, created_at, pay_time)) as avg_pay_duration,
  AVG(TIMESTAMPDIFF(SECOND, pay_time, updated_at)) as avg_process_duration,
  MAX(TIMESTAMPDIFF(SECOND, pay_time, updated_at)) as max_process_duration
FROM orders
WHERE pay_status = 1
  AND DATE(pay_time) = CURDATE()
GROUP BY order_type;

-- 8.3 查询数据库表大小
SELECT
  table_name,
  table_rows,
  ROUND(data_length / 1024 / 1024, 2) as data_mb,
  ROUND(index_length / 1024 / 1024, 2) as index_mb,
  ROUND((data_length + index_length) / 1024 / 1024, 2) as total_mb
FROM information_schema.tables
WHERE table_schema = 'tiandao_culture'
  AND table_name IN ('orders', 'user_courses', 'merit_points_records', 'cash_points_records', 'appointments')
ORDER BY (data_length + index_length) DESC;

-- ============================================
-- 9. 数据一致性检查
-- ============================================

-- 9.1 检查订单与课程记录一致性
SELECT
  o.order_no,
  o.user_id,
  o.pay_status,
  o.pay_time,
  COUNT(uc.id) as course_count
FROM orders o
LEFT JOIN user_courses uc ON o.order_no = uc.order_no
WHERE o.order_type = 1
  AND o.pay_status = 1
  AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY o.order_no
HAVING course_count = 0;

-- 9.2 检查奖励发放一致性
SELECT
  o.order_no,
  o.referee_id,
  o.is_reward_granted,
  COUNT(mp.id) as merit_count,
  COUNT(cp.id) as cash_count
FROM orders o
LEFT JOIN merit_points_records mp ON o.order_no = mp.order_no
LEFT JOIN cash_points_records cp ON o.order_no = cp.order_no
WHERE o.order_type = 1
  AND o.pay_status = 1
  AND o.referee_id IS NOT NULL
  AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY o.order_no
HAVING (o.is_reward_granted = 1 AND (merit_count = 0 OR cash_count = 0))
    OR (o.is_reward_granted = 0 AND (merit_count > 0 OR cash_count > 0));

-- 9.3 检查密训班赠送课程
SELECT
  o.order_no,
  o.user_id,
  o.related_id as course_id,
  COUNT(CASE WHEN uc.is_gift = 0 THEN 1 END) as main_course,
  COUNT(CASE WHEN uc.is_gift = 1 THEN 1 END) as gift_course
FROM orders o
LEFT JOIN user_courses uc ON o.order_no = uc.order_no
WHERE o.order_type = 1
  AND o.pay_status = 1
  AND o.related_id = 2  -- 密训班ID
  AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY o.order_no
HAVING main_course = 0 OR gift_course = 0;

-- ============================================
-- 10. 业务报表查询
-- ============================================

-- 10.1 今日业务概览
SELECT
  '订单总数' as metric,
  COUNT(*) as value
FROM orders
WHERE DATE(created_at) = CURDATE()
UNION ALL
SELECT
  '支付成功',
  COUNT(*)
FROM orders
WHERE pay_status = 1 AND DATE(pay_time) = CURDATE()
UNION ALL
SELECT
  '课程发放',
  COUNT(*)
FROM user_courses
WHERE DATE(buy_time) = CURDATE()
UNION ALL
SELECT
  '奖励发放',
  COUNT(DISTINCT order_no)
FROM merit_points_records
WHERE DATE(created_at) = CURDATE()
UNION ALL
SELECT
  '签到人数',
  COUNT(*)
FROM appointments
WHERE status = 2 AND DATE(checkin_at) = CURDATE();

-- 10.2 本周业务趋势
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN pay_status = 1 THEN 1 ELSE 0 END) as paid_orders,
  SUM(CASE WHEN pay_status = 1 THEN final_amount ELSE 0 END) as revenue
FROM orders
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date;

-- 10.3 课程销售排行
SELECT
  c.name as course_name,
  COUNT(uc.id) as total_sold,
  SUM(CASE WHEN uc.is_gift = 0 THEN 1 ELSE 0 END) as purchased,
  SUM(CASE WHEN uc.is_gift = 1 THEN 1 ELSE 0 END) as gifted,
  SUM(uc.buy_price) as revenue
FROM user_courses uc
LEFT JOIN courses c ON uc.course_id = c.id
WHERE uc.buy_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY c.id
ORDER BY revenue DESC;

-- 10.4 推荐人排行榜
SELECT
  u.id,
  u.real_name,
  u.ambassador_level,
  COUNT(DISTINCT o.order_no) as referral_count,
  SUM(o.final_amount) as referral_amount,
  SUM(mp.amount) as total_merit,
  SUM(cp.amount) as total_cash
FROM users u
LEFT JOIN orders o ON u.id = o.referee_id AND o.pay_status = 1
LEFT JOIN merit_points_records mp ON u.id = mp.user_id
LEFT JOIN cash_points_records cp ON u.id = cp.user_id AND cp.type = 1
WHERE u.ambassador_level > 0
  AND o.pay_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY u.id
ORDER BY referral_amount DESC
LIMIT 10;

-- ============================================
-- 11. 数据修复脚本（谨慎使用）
-- ============================================

-- 11.1 修正积分余额（示例，需根据实际情况调整）
-- UPDATE users u
-- SET merit_points = (
--   SELECT COALESCE(SUM(CASE WHEN type = 1 THEN amount ELSE -amount END), 0)
--   FROM merit_points_records
--   WHERE user_id = u.id
-- )
-- WHERE id = 2;

-- 11.2 标记已发放奖励的订单
-- UPDATE orders
-- SET is_reward_granted = 1, reward_granted_at = NOW()
-- WHERE order_no IN (
--   SELECT DISTINCT order_no
--   FROM merit_points_records
--   WHERE order_no IS NOT NULL
-- )
-- AND is_reward_granted = 0;

-- ============================================
-- 12. 索引检查和优化
-- ============================================

-- 12.1 查看表索引
SHOW INDEX FROM orders;
SHOW INDEX FROM user_courses;
SHOW INDEX FROM merit_points_records;
SHOW INDEX FROM cash_points_records;

-- 12.2 分析表
ANALYZE TABLE orders;
ANALYZE TABLE user_courses;
ANALYZE TABLE merit_points_records;
ANALYZE TABLE cash_points_records;

-- 12.3 优化表
-- OPTIMIZE TABLE orders;
-- OPTIMIZE TABLE user_courses;
-- OPTIMIZE TABLE merit_points_records;
-- OPTIMIZE TABLE cash_points_records;
