-- ============================================
-- 支付回调业务逻辑配置示例
-- ============================================

-- 1. 大使等级配置表
-- 所有奖励比例和数值从此表读取

-- 准青鸾大使（等级1）- 无奖励
INSERT INTO ambassador_level_configs (
  level,
  level_name,
  can_earn_reward,
  merit_rate_basic,
  merit_rate_advanced,
  cash_rate_basic,
  cash_rate_advanced,
  unfreeze_per_referral,
  upgrade_fee,
  gift_quota_basic,
  gift_quota_advanced,
  frozen_points,
  status,
  created_at
) VALUES (
  1,                    -- 等级
  '准青鸾大使',          -- 等级名称
  0,                    -- 不可获得奖励
  0.00,                 -- 推荐初探班功德分比例
  0.00,                 -- 推荐密训班功德分比例
  0.00,                 -- 推荐初探班积分比例
  0.00,                 -- 推荐密训班积分比例
  0.00,                 -- 每次解冻金额
  0.00,                 -- 升级费用（免费）
  0,                    -- 赠送初探班名额
  0,                    -- 赠送密训班名额
  0.00,                 -- 升级赠送冻结积分
  1,                    -- 状态（1启用）
  NOW()
);

-- 青鸾大使（等级2）
INSERT INTO ambassador_level_configs (
  level,
  level_name,
  can_earn_reward,
  merit_rate_basic,
  merit_rate_advanced,
  cash_rate_basic,
  cash_rate_advanced,
  unfreeze_per_referral,
  upgrade_fee,
  gift_quota_basic,
  gift_quota_advanced,
  frozen_points,
  status,
  created_at
) VALUES (
  2,
  '青鸾大使',
  1,                    -- 可获得奖励
  0.30,                 -- 推荐初探班功德分30%
  0.20,                 -- 推荐密训班功德分20%
  0.30,                 -- 推荐初探班积分30%
  0.20,                 -- 推荐密训班积分20%
  500.00,               -- 每次解冻500元
  0.00,                 -- 升级费用（免费，通过推荐达成）
  0,
  0,
  0.00,
  1,
  NOW()
);

-- 鸿鹄大使（等级3）
INSERT INTO ambassador_level_configs (
  level,
  level_name,
  can_earn_reward,
  merit_rate_basic,
  merit_rate_advanced,
  cash_rate_basic,
  cash_rate_advanced,
  unfreeze_per_referral,
  upgrade_fee,
  gift_quota_basic,
  gift_quota_advanced,
  frozen_points,
  status,
  created_at
) VALUES (
  3,
  '鸿鹄大使',
  1,
  0.30,                 -- 推荐初探班功德分30%
  0.20,                 -- 推荐密训班功德分20%
  0.30,                 -- 推荐初探班积分30%
  0.20,                 -- 推荐密训班积分20%
  500.00,               -- 每次解冻500元
  9800.00,              -- 升级费用9800元
  10,                   -- 赠送10个初探班名额
  2,                    -- 赠送2个密训班名额
  5000.00,              -- 赠送5000元冻结积分
  1,
  NOW()
);

-- ============================================
-- 2. 课程配置示例
-- ============================================

-- 初探班
INSERT INTO courses (
  id,
  name,
  type,
  price,
  original_price,
  description,
  included_course_ids,
  status,
  created_at
) VALUES (
  1,
  '天道文化初探班',
  1,                    -- 类型：初探班
  1688.00,              -- 价格
  1688.00,
  '孙膑道天道文化入门课程',
  NULL,                 -- 不包含其他课程
  1,
  NOW()
);

-- 密训班（包含初探班）
INSERT INTO courses (
  id,
  name,
  type,
  price,
  original_price,
  description,
  included_course_ids,
  status,
  created_at
) VALUES (
  2,
  '天道文化密训班',
  2,                    -- 类型：密训班
  38888.00,             -- 价格
  38888.00,
  '孙膑道天道文化深度课程',
  '[1]',                -- 包含初探班（课程ID=1）
  1,
  NOW()
);

-- ============================================
-- 3. 测试用户数据
-- ============================================

-- 普通用户（被推荐人）
INSERT INTO users (
  id,
  uid,
  real_name,
  phone,
  ambassador_level,
  referee_id,
  merit_points,
  cash_points_frozen,
  cash_points_available,
  status,
  created_at
) VALUES (
  1,
  'UID001',
  '张三',
  '13800138001',
  0,                    -- 普通用户
  2,                    -- 推荐人ID=2
  0.00,
  0.00,
  0.00,
  1,
  NOW()
);

-- 推荐人（青鸾大使）
INSERT INTO users (
  id,
  uid,
  real_name,
  phone,
  ambassador_level,
  referee_id,
  merit_points,
  cash_points_frozen,
  cash_points_available,
  ambassador_start_date,
  status,
  created_at
) VALUES (
  2,
  'UID002',
  '李四',
  '13800138002',
  2,                    -- 青鸾大使
  NULL,
  0.00,
  0.00,
  0.00,
  NOW(),
  1,
  NOW()
);

-- ============================================
-- 4. 测试订单数据
-- ============================================

-- 课程购买订单（初探班）
INSERT INTO orders (
  order_no,
  user_id,
  user_uid,
  order_type,
  related_id,
  final_amount,
  pay_status,
  referee_id,
  created_at
) VALUES (
  'ORD20260222001',
  1,                    -- 用户ID
  'UID001',
  1,                    -- 订单类型：课程购买
  1,                    -- 课程ID：初探班
  1688.00,
  0,                    -- 待支付
  2,                    -- 推荐人ID
  NOW()
);

-- 课程购买订单（密训班）
INSERT INTO orders (
  order_no,
  user_id,
  user_uid,
  order_type,
  related_id,
  final_amount,
  pay_status,
  referee_id,
  created_at
) VALUES (
  'ORD20260222002',
  1,
  'UID001',
  1,
  2,                    -- 课程ID：密训班
  38888.00,
  0,
  2,
  NOW()
);

-- 大使升级订单
INSERT INTO orders (
  order_no,
  user_id,
  user_uid,
  order_type,
  related_id,
  final_amount,
  pay_status,
  created_at
) VALUES (
  'ORD20260222003',
  2,
  'UID002',
  4,                    -- 订单类型：大使升级
  3,                    -- 目标等级：鸿鹄大使
  9800.00,
  0,
  NOW()
);

-- ============================================
-- 5. 查询验证
-- ============================================

-- 查看等级配置
SELECT
  level,
  level_name,
  can_earn_reward,
  merit_rate_basic,
  cash_rate_basic,
  unfreeze_per_referral,
  upgrade_fee
FROM ambassador_level_configs
ORDER BY level;

-- 查看课程配置
SELECT
  id,
  name,
  type,
  price,
  included_course_ids
FROM courses
WHERE status = 1;

-- 查看测试订单
SELECT
  order_no,
  user_id,
  order_type,
  related_id,
  final_amount,
  pay_status,
  referee_id
FROM orders
WHERE user_id IN (1, 2);

-- ============================================
-- 6. 奖励计算示例
-- ============================================

-- 初探班奖励计算（1688元）
-- 青鸾大使推荐：
--   功德分 = 1688 × 30% = 506.4
--   冻结积分 = 1688 × 30% = 506.4

-- 密训班奖励计算（38888元）
-- 青鸾大使推荐：
--   功德分 = 38888 × 20% = 7777.6
--   冻结积分 = 38888 × 20% = 7777.6

-- 鸿鹄大使升级（9800元）
-- 赠送内容：
--   初探班名额：10个
--   密训班名额：2个
--   冻结积分：5000元

-- ============================================
-- 7. 清理测试数据
-- ============================================

-- 清理订单
-- DELETE FROM orders WHERE order_no LIKE 'ORD20260222%';

-- 清理用户课程
-- DELETE FROM user_courses WHERE user_id = 1;

-- 清理积分明细
-- DELETE FROM merit_points_records WHERE user_id = 2;
-- DELETE FROM cash_points_records WHERE user_id = 2;

-- 重置用户积分
-- UPDATE users SET
--   merit_points = 0,
--   cash_points_frozen = 0,
--   cash_points_available = 0
-- WHERE id = 2;
