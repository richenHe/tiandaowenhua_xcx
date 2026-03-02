/**
 * 定时任务：上课前一天发送订阅消息提醒
 *
 * 触发方式：cloudfunction.json timer trigger "send-course-reminder"，每日 9:00 执行
 *
 * 逻辑：
 *   1. 计算"明天"日期（北京时间）
 *   2. 查询 class_date = 明天 且 status = 1(未开始) 或 2(进行中) 的排期
 *   3. 查询这些排期下 status = 0(待上课) 的预约记录
 *   4. 通过 user_id 获取用户 openid
 *   5. 组装模板数据，调用 subscribeMessage.send
 *
 * 模板字段（模板ID: SYdGf0v5jj40k50FjfUB4ROStOWQiSvhVidHIsAsHYc）：
 *   date5         - 时间（class_date + class_time）
 *   thing10       - 上课地址（class_location，最多20字）
 *   thing15       - 主讲老师（teacher，最多20字）
 *   thing2        - 课程标题（course_name，最多20字）
 *   short_thing35 - 学习天数（class_end_date - class_date + 1，最多5字）
 */
const { db } = require('../../common/db');
const { response } = require('../../common');
const { formatBeijingDate } = require('../../common/utils');
const business = require('../../business-logic');

const TEMPLATE_ID = 'SYdGf0v5jj40k50FjfUB4ROStOWQiSvhVidHIsAsHYc';

/**
 * 截断字符串（微信模板字段有长度限制）
 * @param {string} value
 * @param {number} maxLen
 */
function truncate(value, maxLen) {
  if (!value) return '';
  if (value.length <= maxLen) return value;
  return value.substring(0, maxLen - 1) + '…';
}

/**
 * 将 YYYY-MM-DD 格式化为"2026年3月15日"
 */
function formatDateCN(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

/**
 * 计算学习天数
 */
function calcDays(classDate, classEndDate) {
  if (!classEndDate || classEndDate === classDate) return '1天';
  const start = new Date(classDate);
  const end = new Date(classEndDate);
  const days = Math.round((end - start) / 86400000) + 1;
  return `${days}天`;
}

module.exports = async (event, context) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const tomorrowStr = formatBeijingDate(tomorrow);

    console.log(`[sendCourseReminder] 查询明天(${tomorrowStr})有课的预约`);

    // 查询明天开课的排期（status=1 未开始 或 status=2 进行中）
    const { data: classRecords, error: crError } = await db
      .from('class_records')
      .select('id, course_name, class_date, class_end_date, class_time, class_location, teacher')
      .eq('class_date', tomorrowStr)
      .in('status', [1, 2]);

    if (crError) throw crError;

    if (!classRecords || classRecords.length === 0) {
      console.log('[sendCourseReminder] 明天没有排期，跳过');
      return response.success({ sent: 0, message: '明天没有排期' });
    }

    const classRecordIds = classRecords.map(cr => cr.id);
    console.log(`[sendCourseReminder] 找到 ${classRecords.length} 条排期: ${classRecordIds.join(',')}`);

    // 查询这些排期下待上课的预约
    const { data: appointments, error: apError } = await db
      .from('appointments')
      .select('id, user_id, class_record_id')
      .in('class_record_id', classRecordIds)
      .eq('status', 0);

    if (apError) throw apError;

    if (!appointments || appointments.length === 0) {
      console.log('[sendCourseReminder] 没有待上课的预约，跳过');
      return response.success({ sent: 0, message: '没有待上课的预约' });
    }

    // 获取所有相关用户的 openid
    const userIds = [...new Set(appointments.map(a => a.user_id))];
    const { data: users, error: uError } = await db
      .from('users')
      .select('id, openid')
      .in('id', userIds);

    if (uError) throw uError;

    const userMap = {};
    (users || []).forEach(u => { userMap[u.id] = u.openid; });

    // 排期数据索引
    const crMap = {};
    classRecords.forEach(cr => { crMap[cr.id] = cr; });

    // 组装批量发送参数（access_token 在 batchSendSubscribeMessage 内部只获取一次）
    const messages = [];
    for (const apt of appointments) {
      const openid = userMap[apt.user_id];
      if (!openid) {
        console.warn(`[sendCourseReminder] 用户 ${apt.user_id} 无 openid，跳过`);
        continue;
      }
      const cr = crMap[apt.class_record_id];
      const timeStr = formatDateCN(cr.class_date) + (cr.class_time ? ' ' + cr.class_time.split('-')[0] : '');
      messages.push({
        openid,
        templateId: TEMPLATE_ID,
        page: 'pages/mine/appointments/index',
        data: {
          date5: { value: timeStr },
          thing10: { value: truncate(cr.class_location || '待定', 20) },
          thing15: { value: truncate(cr.teacher || '待定', 20) },
          thing2: { value: truncate(cr.course_name || '课程', 20) },
          short_thing35: { value: calcDays(cr.class_date, cr.class_end_date) }
        }
      });
    }

    // 批量发送（共用一个 access_token，避免重复调用 token 接口）
    const batchResult = await business.batchSendSubscribeMessage(messages);
    const sent = batchResult.success;
    const failed = appointments.length - messages.length + batchResult.failed; // 含无 openid 的跳过数

    // 记录未授权（43101）等详细情况
    batchResult.results.forEach((r, i) => {
      if (!r.success) {
        if (r.errcode === 43101) {
          console.log(`[sendCourseReminder] 用户 ${messages[i].openid.slice(-6)} 未授权订阅，跳过`);
        } else {
          console.warn(`[sendCourseReminder] 用户 ${messages[i].openid.slice(-6)} 发送失败:`, r);
        }
      }
    });

    console.log(`[sendCourseReminder] 完成: 成功 ${sent}, 失败/跳过 ${failed}`);

    return response.success({
      date: tomorrowStr,
      total: appointments.length,
      sent,
      failed,
      message: `发送完成: 成功 ${sent}, 失败/跳过 ${failed}`
    });

  } catch (error) {
    console.error('[sendCourseReminder] 执行失败:', error);
    return response.error('发送上课提醒失败', error);
  }
};
