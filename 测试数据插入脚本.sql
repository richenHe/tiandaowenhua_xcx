-- ====================================
-- 道天文化小程序测试数据脚本
-- 生成时间: 2026-02-12
-- 说明: 所有课程价格设置为 0.01元 方便测试支付
-- ====================================

-- 1. 更新课程价格为 0.01元
UPDATE tiandao_culture.courses 
SET current_price = 0.01, original_price = 0.01, retrain_price = 0.01
WHERE id > 0;

-- 2. 添加排课记录 (class_records)
INSERT INTO tiandao_culture.class_records 
  (_openid, course_id, class_date, class_time, class_location, teacher, total_quota, booked_quota, status) 
VALUES
  ('', 1, '2026-02-15', '09:00-12:00', '北京市朝阳区道天文化中心', '李老师', 30, 5, 1),
  ('', 1, '2026-02-22', '09:00-12:00', '北京市朝阳区道天文化中心', '李老师', 30, 3, 1),
  ('', 2, '2026-02-16', '14:00-17:00', '上海市浦东新区道天学院', '王老师', 20, 2, 1),
  ('', 3, '2026-02-20', '10:00-16:00', '深圳市南山区道天会所', '张老师', 15, 1, 1);

-- 3. 添加公告 (announcements)
INSERT INTO tiandao_culture.announcements 
  (_openid, title, content, summary, category, target_type, status) 
VALUES
  ('', '春节假期通知', '尊敬的各位学员，春节期间（2026年2月10日-2026年2月20日）暂停上课，祝大家新春快乐！', '春节期间暂停上课', 'general', 0, 1),
  ('', '新课程上线通知', '道天初探班新一期课程已开放报名，欢迎踊跃报名参加！详情请查看课程页面。', '初探班新一期开放报名', 'course', 0, 1),
  ('', '系统维护通知', '本周日（2026年2月16日）凌晨2:00-6:00进行系统维护，期间系统暂不可用，请大家提前安排好学习时间。', '系统维护', 'system', 0, 1);

-- 4. 添加大使等级配置 (ambassador_level_configs)
INSERT INTO tiandao_culture.ambassador_level_configs 
  (_openid, level, level_name, merit_rate_basic, merit_rate_advanced, cash_rate_basic, cash_rate_advanced, 
   frozen_points, unfreeze_per_referral, upgrade_payment_amount, gift_quota_basic, gift_quota_advanced, status) 
VALUES
  ('', 1, '准青鸾大使', 0.10, 0.10, 0.05, 0.05, 0.00, 0.00, 0.00, 5, 0, 1),
  ('', 2, '青鸾大使', 0.15, 0.15, 0.08, 0.08, 100.00, 10.00, 100.00, 10, 5, 1),
  ('', 3, '鸿鹄大使', 0.20, 0.20, 0.10, 0.10, 300.00, 15.00, 300.00, 20, 10, 1),
  ('', 4, '金凤大使', 0.25, 0.25, 0.12, 0.12, 500.00, 20.00, 500.00, 30, 15, 1);

-- 5. 添加协议模板 (contract_templates)
INSERT INTO tiandao_culture.contract_templates 
  (_openid, contract_name, contract_type, ambassador_level, version, content, validity_years, status) 
VALUES
  ('', '准青鸾大使服务协议', 1, 1, 'v1.0', '<h1>准青鸾大使服务协议</h1><p>本协议由道天文化与大使签署...</p>', 1, 1),
  ('', '青鸾大使服务协议', 1, 2, 'v1.0', '<h1>青鸾大使服务协议</h1><p>本协议由道天文化与青鸾大使签署...</p>', 2, 1),
  ('', '鸿鹄大使服务协议', 1, 3, 'v1.0', '<h1>鸿鹄大使服务协议</h1><p>本协议由道天文化与鸿鹄大使签署...</p>', 3, 1),
  ('', '金凤大使服务协议', 1, 4, 'v1.0', '<h1>金凤大使服务协议</h1><p>本协议由道天文化与金凤大使签署...</p>', 5, 1);

-- 6. 添加商城商品 (mall_goods)
INSERT INTO tiandao_culture.mall_goods 
  (_openid, goods_name, goods_image, description, merit_points_price, stock_quantity, limit_per_user, status) 
VALUES
  ('', '道天文化周边T恤', 'https://example.com/tshirt.jpg', '纯棉舒适，印有道天文化Logo', 100.00, 50, 2, 1),
  ('', '道天文化典藏书籍', 'https://example.com/book.jpg', '道天文化经典著作精装版', 200.00, 30, 1, 1),
  ('', '道天文化U盘', 'https://example.com/usb.jpg', '32GB高速U盘，预装课程资料', 150.00, 100, 3, 1),
  ('', '道天文化帆布包', 'https://example.com/bag.jpg', '环保帆布，大容量实用', 80.00, 80, 5, 1);

-- 7. 添加通知配置 (notification_configs)
INSERT INTO tiandao_culture.notification_configs 
  (_openid, name, config_name, config_code, trigger_type, template_id, title, content_template, page_path, status) 
VALUES
  ('', '订单支付成功通知', '订单支付成功', 'order_payment_success', 1, 'TEMPLATE_ID_001', '订单支付成功', '您的订单{{order_no}}已支付成功，金额：{{amount}}元', 'pages/order/detail/index', 1),
  ('', '课程预约成功通知', '课程预约成功', 'course_booking_success', 2, 'TEMPLATE_ID_002', '课程预约成功', '您已成功预约{{course_name}}，时间：{{class_time}}', 'pages/course/appointment/index', 1),
  ('', '大使升级成功通知', '大使升级成功', 'ambassador_upgrade_success', 3, 'TEMPLATE_ID_003', '大使升级成功', '恭喜您成功升级为{{level_name}}', 'pages/ambassador/level/index', 1);

-- 8. 添加系统配置 (system_configs)
INSERT INTO tiandao_culture.system_configs 
  (_openid, config_key, config_value, config_type, config_group, config_name, config_desc, status) 
VALUES
  ('', 'withdrawal_min_amount', '100', 'number', 'financial', '最低提现金额', '单次提现最低金额（元）', 1),
  ('', 'withdrawal_max_amount', '10000', 'number', 'financial', '最高提现金额', '单次提现最高金额（元）', 1),
  ('', 'withdrawal_fee_rate', '0.01', 'number', 'financial', '提现手续费率', '提现手续费率（百分比）', 1),
  ('', 'merit_points_exchange_rate', '1.0', 'number', 'financial', '功德值兑换比例', '功德值兑换现金的比例', 1),
  ('', 'customer_service_phone', '400-888-8888', 'string', 'contact', '客服电话', '官方客服电话', 1),
  ('', 'customer_service_hours', '周一至周五 9:00-18:00', 'string', 'contact', '客服工作时间', '客服工作时间说明', 1);

-- ====================================
-- 脚本执行完毕
-- 所有测试数据已准备就绪
-- ====================================




