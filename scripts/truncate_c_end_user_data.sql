-- C 端用户及相关卫星表清空（保留 class_records、courses、mall_goods、后台 admin_* 等）
-- 说明：CloudBase MCP 等环境可能「一条语句一个连接」，SET FOREIGN_KEY_CHECKS 无法跨语句生效；
--       本脚本使用 DELETE + 依赖顺序，可逐条执行也可在控制台一次粘贴执行。
-- 执行前务必备份。清空 legacy_students 后如需历史学员可再执行 legacy_students_data.sql。
SET NAMES utf8mb4;

DELETE FROM tiandao_culture.appointment_checkins;
DELETE FROM tiandao_culture.quota_usage_records;
DELETE FROM tiandao_culture.ambassador_activity_registrations;
DELETE FROM tiandao_culture.seating_assignments;
DELETE FROM tiandao_culture.merit_points_records;
DELETE FROM tiandao_culture.cash_points_records;
DELETE FROM tiandao_culture.mall_exchange_records;
DELETE FROM tiandao_culture.ambassador_activity_records;
DELETE FROM tiandao_culture.ambassador_upgrade_logs;
DELETE FROM tiandao_culture.referee_change_logs;
DELETE FROM tiandao_culture.withdrawals;
DELETE FROM tiandao_culture.academy_progress;
DELETE FROM tiandao_culture.feedbacks;
DELETE FROM tiandao_culture.contract_signatures;
DELETE FROM tiandao_culture.notification_logs;
DELETE FROM tiandao_culture.subscription_message_logs;
DELETE FROM tiandao_culture.notification_subscriptions;
DELETE FROM tiandao_culture.performance_scores;
DELETE FROM tiandao_culture.user_blacklist;
DELETE FROM tiandao_culture.appointments;
DELETE FROM tiandao_culture.user_courses;
DELETE FROM tiandao_culture.orders;
DELETE FROM tiandao_culture.ambassador_quotas;
DELETE FROM tiandao_culture.ambassador_applications;
DELETE FROM tiandao_culture.checkin_qrcodes;
DELETE FROM tiandao_culture.ambassador_activities;
DELETE FROM tiandao_culture.legacy_students;
DELETE FROM tiandao_culture.users;
