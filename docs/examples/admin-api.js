/**
 * Web 管理后台 API 工具类
 * 用于调用云函数管理端接口
 * 
 * 使用示例：
 * import AdminAPI from '@/utils/admin-api';
 * 
 * // 登录
 * await AdminAPI.login('admin', '123456');
 * 
 * // 获取用户列表
 * const users = await AdminAPI.getUserList(1, 20);
 */

import cloudbase from '@cloudbase/js-sdk';

// 初始化 CloudBase
const app = cloudbase.init({
  env: 'your-env-id'  // 替换为你的环境ID
});

class AdminAPI {
  /**
   * 调用云函数
   * @param {string} name - 云函数名称（user/order/course/ambassador/system）
   * @param {string} action - 接口 action
   * @param {object} data - 请求参数
   * @returns {Promise<any>} 响应数据
   */
  static async call(name, action, data = {}) {
    // 获取 Token（登录接口除外）
    const token = localStorage.getItem('adminToken');
    
    if (!token && action !== 'login') {
      throw new Error('未登录，请先登录');
    }

    try {
      const result = await app.callFunction({
        name,
        data: {
          action,
          jwtToken: token,  // 自动注入 Token
          ...data
        }
      });

      const response = result.result;

      // 处理响应
      if (!response.success) {
        // Token 过期或无效
        if (response.code === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminInfo');
          window.location.href = '/admin/login';
          throw new Error('登录已过期，请重新登录');
        }
        
        // 权限不足
        if (response.code === 403) {
          throw new Error('权限不足');
        }
        
        throw new Error(response.message || '请求失败');
      }

      return response.data;
    } catch (error) {
      console.error(`[${name}.${action}] 调用失败:`, error);
      throw error;
    }
  }

  // ==================== 系统模块 ====================

  /**
   * 管理员登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<{token: string, admin: object}>}
   */
  static async login(username, password) {
    const result = await this.call('system', 'login', { username, password });
    
    // 保存 Token 和管理员信息
    if (result.token) {
      localStorage.setItem('adminToken', result.token);
      localStorage.setItem('adminInfo', JSON.stringify(result.admin));
    }
    
    return result;
  }

  /**
   * 退出登录
   */
  static logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    window.location.href = '/admin/login';
  }

  /**
   * 获取当前登录的管理员信息
   * @returns {object|null}
   */
  static getCurrentAdmin() {
    const adminInfoStr = localStorage.getItem('adminInfo');
    return adminInfoStr ? JSON.parse(adminInfoStr) : null;
  }

  /**
   * 获取统计数据
   * @returns {Promise<object>}
   */
  static async getStatistics() {
    return this.call('system', 'getStatistics');
  }

  /**
   * 获取系统配置
   * @returns {Promise<object>}
   */
  static async getConfig() {
    return this.call('system', 'getConfig');
  }

  /**
   * 更新系统配置
   * @param {object} config - 配置项
   * @returns {Promise<void>}
   */
  static async updateConfig(config) {
    return this.call('system', 'updateConfig', config);
  }

  /**
   * 获取反馈列表
   * @param {object} params - 查询参数
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getFeedbackList(params = {}) {
    return this.call('system', 'getFeedbackList', params);
  }

  /**
   * 回复反馈
   * @param {number} feedbackId - 反馈ID
   * @param {string} reply - 回复内容
   * @returns {Promise<void>}
   */
  static async replyFeedback(feedbackId, reply) {
    return this.call('system', 'replyFeedback', { feedbackId, reply });
  }

  /**
   * 获取公告列表
   * @param {object} params - 查询参数
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getAnnouncementList(params = {}) {
    return this.call('system', 'getAnnouncementList', params);
  }

  /**
   * 创建公告
   * @param {object} announcement - 公告信息
   * @returns {Promise<{id: number}>}
   */
  static async createAnnouncement(announcement) {
    return this.call('system', 'createAnnouncement', announcement);
  }

  /**
   * 更新公告
   * @param {number} announcementId - 公告ID
   * @param {object} updates - 更新内容
   * @returns {Promise<void>}
   */
  static async updateAnnouncement(announcementId, updates) {
    return this.call('system', 'updateAnnouncement', { announcementId, ...updates });
  }

  /**
   * 删除公告
   * @param {number} announcementId - 公告ID
   * @returns {Promise<void>}
   */
  static async deleteAnnouncement(announcementId) {
    return this.call('system', 'deleteAnnouncement', { announcementId });
  }

  // ==================== 用户模块 ====================

  /**
   * 获取用户列表
   * @param {number} page - 页码
   * @param {number} pageSize - 每页数量
   * @param {object} filters - 筛选条件
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getUserList(page = 1, pageSize = 20, filters = {}) {
    return this.call('user', 'getUserList', { page, pageSize, ...filters });
  }

  /**
   * 获取用户详情
   * @param {number} userId - 用户ID
   * @returns {Promise<object>}
   */
  static async getUserDetail(userId) {
    return this.call('user', 'getUserDetail', { userId });
  }

  /**
   * 更新用户推荐人
   * @param {number} userId - 用户ID
   * @param {number} refereeId - 新推荐人ID
   * @param {string} reason - 修改原因
   * @returns {Promise<void>}
   */
  static async updateUserReferee(userId, refereeId, reason) {
    return this.call('user', 'updateUserReferee', { userId, refereeId, reason });
  }

  /**
   * 获取推荐人变更日志
   * @param {number} userId - 用户ID
   * @returns {Promise<array>}
   */
  static async getRefereeChangeLogs(userId) {
    return this.call('user', 'getRefereeChangeLogs', { userId });
  }

  // ==================== 订单模块 ====================

  /**
   * 获取订单列表
   * @param {object} params - 查询参数
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getOrderList(params = {}) {
    return this.call('order', 'getOrderList', params);
  }

  /**
   * 获取订单详情
   * @param {number} orderId - 订单ID
   * @returns {Promise<object>}
   */
  static async getOrderDetail(orderId) {
    return this.call('order', 'getOrderDetail', { orderId });
  }

  /**
   * 订单退款
   * @param {number} orderId - 订单ID
   * @param {number} refundAmount - 退款金额（分）
   * @param {string} refundReason - 退款原因
   * @returns {Promise<void>}
   */
  static async refundOrder(orderId, refundAmount, refundReason) {
    return this.call('order', 'refund', { orderId, refundAmount, refundReason });
  }

  /**
   * 提现审核
   * @param {number} withdrawId - 提现记录ID
   * @param {number} status - 审核状态（2=通过, 3=拒绝）
   * @param {string} rejectReason - 拒绝原因（拒绝时必填）
   * @returns {Promise<void>}
   */
  static async withdrawAudit(withdrawId, status, rejectReason = '') {
    return this.call('order', 'withdrawAudit', { withdrawId, status, rejectReason });
  }

  // ==================== 课程模块 ====================

  /**
   * 获取课程列表
   * @param {object} params - 查询参数
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getCourseList(params = {}) {
    return this.call('course', 'getCourseList', params);
  }

  /**
   * 创建课程
   * @param {object} course - 课程信息
   * @returns {Promise<{id: number}>}
   */
  static async createCourse(course) {
    return this.call('course', 'createCourse', course);
  }

  /**
   * 更新课程
   * @param {number} courseId - 课程ID
   * @param {object} updates - 更新内容
   * @returns {Promise<void>}
   */
  static async updateCourse(courseId, updates) {
    return this.call('course', 'updateCourse', { courseId, ...updates });
  }

  /**
   * 删除课程
   * @param {number} courseId - 课程ID
   * @returns {Promise<void>}
   */
  static async deleteCourse(courseId) {
    return this.call('course', 'deleteCourse', { courseId });
  }

  /**
   * 获取排期列表
   * @param {object} params - 查询参数
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getClassRecordList(params = {}) {
    return this.call('course', 'getClassRecordList', params);
  }

  /**
   * 创建排期
   * @param {object} classRecord - 排期信息
   * @returns {Promise<{id: number}>}
   */
  static async createClassRecord(classRecord) {
    return this.call('course', 'createClassRecord', classRecord);
  }

  /**
   * 获取预约列表
   * @param {object} params - 查询参数
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getAppointmentList(params = {}) {
    return this.call('course', 'getAppointmentList', params);
  }

  /**
   * 更新预约状态
   * @param {number} appointmentId - 预约ID
   * @param {number} status - 状态（2=已到场, 3=已取消）
   * @returns {Promise<void>}
   */
  static async updateAppointmentStatus(appointmentId, status) {
    return this.call('course', 'updateAppointmentStatus', { appointmentId, status });
  }

  /**
   * 批量签到
   * @param {number} classRecordId - 排期ID
   * @param {array} userIds - 用户ID列表
   * @returns {Promise<{successCount: number}>}
   */
  static async batchCheckin(classRecordId, userIds) {
    return this.call('course', 'batchCheckin', { classRecordId, userIds });
  }

  // ==================== 大使模块 ====================

  /**
   * 获取大使申请列表
   * @param {object} params - 查询参数
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getApplicationList(params = {}) {
    return this.call('ambassador', 'getApplicationList', params);
  }

  /**
   * 审核大使申请
   * @param {number} applicationId - 申请ID
   * @param {number} status - 审核状态（2=通过, 3=拒绝）
   * @param {string} rejectReason - 拒绝原因（拒绝时必填）
   * @returns {Promise<void>}
   */
  static async auditApplication(applicationId, status, rejectReason = '') {
    return this.call('ambassador', 'auditApplication', { applicationId, status, rejectReason });
  }

  /**
   * 获取大使列表
   * @param {object} params - 查询参数
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getAmbassadorList(params = {}) {
    return this.call('ambassador', 'getAmbassadorList', params);
  }

  /**
   * 获取大使详情
   * @param {number} userId - 用户ID
   * @returns {Promise<object>}
   */
  static async getAmbassadorDetail(userId) {
    return this.call('ambassador', 'getAmbassadorDetail', { userId });
  }

  /**
   * 获取活动列表
   * @param {object} params - 查询参数
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getActivityList(params = {}) {
    return this.call('ambassador', 'getActivityList', params);
  }

  /**
   * 创建活动
   * @param {object} activity - 活动信息
   * @returns {Promise<{id: number}>}
   */
  static async createActivity(activity) {
    return this.call('ambassador', 'createActivity', activity);
  }

  /**
   * 更新活动
   * @param {number} activityId - 活动ID
   * @param {object} updates - 更新内容
   * @returns {Promise<void>}
   */
  static async updateActivity(activityId, updates) {
    return this.call('ambassador', 'updateActivity', { activityId, ...updates });
  }

  /**
   * 删除活动
   * @param {number} activityId - 活动ID
   * @returns {Promise<void>}
   */
  static async deleteActivity(activityId) {
    return this.call('ambassador', 'deleteActivity', { activityId });
  }

  /**
   * 获取合同模板列表
   * @returns {Promise<array>}
   */
  static async getContractTemplateList() {
    return this.call('ambassador', 'getContractTemplateList');
  }

  /**
   * 创建合同模板
   * @param {object} template - 模板信息
   * @returns {Promise<{id: number}>}
   */
  static async createContractTemplate(template) {
    return this.call('ambassador', 'createContractTemplate', template);
  }

  /**
   * 获取签名列表
   * @param {object} params - 查询参数
   * @returns {Promise<{list: array, total: number}>}
   */
  static async getSignatureList(params = {}) {
    return this.call('ambassador', 'getSignatureList', params);
  }

  /**
   * 获取即将过期的合同
   * @param {number} days - 几天内过期（默认30天）
   * @returns {Promise<array>}
   */
  static async getExpiringContracts(days = 30) {
    return this.call('ambassador', 'getExpiringContracts', { days });
  }
}

export default AdminAPI;









