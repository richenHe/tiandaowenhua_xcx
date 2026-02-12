/**
 * Web 管理后台 API 工具类 - 完整版
 * 包含所有 64 个管理端接口
 * 
 * 使用 CloudBase HTTP API 调用云函数
 */

class AdminAPI {
  static async call(name, action, data = {}) {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    
    if (!token && action !== 'login') {
      throw new Error('未登录，请先登录');
    }

    try {
      // 使用 CloudBase HTTP API 调用云函数
      const apiUrl = `https://${CONFIG.ENV_ID}.service.tcloudbase.com/${name}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          jwtToken: token,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let result = await response.json();

      // 如果返回的是 HTTP Access Service 的格式（带 body 字段），解析 body
      if (result.body && typeof result.body === 'string') {
        try {
          result = JSON.parse(result.body);
        } catch (e) {
          console.error('解析响应 body 失败:', e);
        }
      }

      console.log(`[${name}.${action}] 返回:`, result);

      if (!result.success) {
        if (result.code === 401) {
          localStorage.clear();
          window.location.href = 'login.html';
          throw new Error('登录已过期');
        }
        throw new Error(result.message || '请求失败');
      }

      return result.data;
    } catch (error) {
      console.error(`[${name}.${action}] 调用失败:`, error);
      throw error;
    }
  }

  // ==================== 系统模块 (21个接口) ====================

  static async login(username, password) {
    const result = await this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'login', { username, password });
    if (result.token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, result.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_INFO, JSON.stringify(result.admin));
    }
    return result;
  }

  static logout() {
    localStorage.clear();
    window.location.href = 'login.html';
  }

  static getCurrentAdmin() {
    const adminInfoStr = localStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_INFO);
    return adminInfoStr ? JSON.parse(adminInfoStr) : null;
  }

  static async getStatistics() {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'getStatistics');
  }

  // 管理员管理
  static async getAdminUserList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'getAdminUserList', params);
  }

  static async createAdminUser(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'createAdminUser', data);
  }

  static async updateAdminUser(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'updateAdminUser', data);
  }

  static async deleteAdminUser(id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'deleteAdminUser', { id });
  }

  // 系统配置
  static async getConfig(config_key) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'getConfig', { config_key });
  }

  static async updateConfig(config_key, config_value) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'updateConfig', { config_key, config_value });
  }

  // 公告管理
  static async getAnnouncementList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'getAnnouncementList', params);
  }

  static async createAnnouncement(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'createAnnouncement', data);
  }

  static async updateAnnouncement(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'updateAnnouncement', data);
  }

  static async deleteAnnouncement(id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'deleteAnnouncement', { id });
  }

  // 反馈管理
  static async getFeedbackList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'getFeedbackList', params);
  }

  static async replyFeedback(feedback_id, reply_content) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'replyFeedback', { feedback_id, reply_content });
  }

  // 通知管理
  static async getNotificationConfigList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'getNotificationConfigList', params);
  }

  static async createNotificationConfig(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'createNotificationConfig', data);
  }

  static async updateNotificationConfig(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'updateNotificationConfig', data);
  }

  static async getNotificationLogs(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'getNotificationLogs', params);
  }

  static async sendNotification(user_ids, template_id, data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'sendNotification', { user_ids, template_id, data });
  }

  // 等级配置
  static async getAmbassadorLevelConfigs() {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'getAmbassadorLevelConfigs');
  }

  static async initAmbassadorLevelConfigs() {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'initAmbassadorLevelConfigs');
  }

  static async updateAmbassadorLevelConfig(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'updateAmbassadorLevelConfig', data);
  }

  // ==================== 用户模块 (4个接口) ====================

  static async getUserList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.USER, 'getUserList', params);
  }

  static async getUserDetail(userId) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.USER, 'getUserDetail', { userId });
  }

  static async updateUserReferee(userId, newRefereeId, reason) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.USER, 'updateUserReferee', { userId, newRefereeId, reason });
  }

  static async getRefereeChangeLogs(userId, params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.USER, 'getRefereeChangeLogs', { userId, ...params });
  }

  // ==================== 订单模块 (4个接口) ====================

  static async getOrderList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'getOrderList', params);
  }

  static async getOrderDetail(order_no) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'getOrderDetail', { order_no });
  }

  static async refund(order_no, refund_amount, refund_reason) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'refund', { order_no, refund_amount, refund_reason });
  }

  static async withdrawAudit(withdrawal_id, status, reject_reason = '') {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'withdrawAudit', { withdrawal_id, status, reject_reason });
  }

  // ==================== 课程模块 (20个接口) ====================

  // 课程管理
  static async getCourseList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'getCourseList', params);
  }

  static async createCourse(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'createCourse', data);
  }

  static async updateCourse(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'updateCourse', data);
  }

  static async deleteCourse(id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'deleteCourse', { id });
  }

  // 排期管理
  static async getClassRecordList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'getClassRecordList', params);
  }

  static async createClassRecord(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'createClassRecord', data);
  }

  static async updateClassRecord(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'updateClassRecord', data);
  }

  static async deleteClassRecord(id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'deleteClassRecord', { id });
  }

  // 预约管理
  static async getAppointmentList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'getAppointmentList', params);
  }

  static async updateAppointmentStatus(appointment_id, status) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'updateAppointmentStatus', { appointment_id, status });
  }

  static async batchCheckin(appointment_ids) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'batchCheckin', { appointment_ids });
  }

  // 案例管理
  static async getCaseList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'getCaseList', params);
  }

  static async createCase(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'createCase', data);
  }

  static async updateCase(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'updateCase', data);
  }

  static async deleteCase(id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'deleteCase', { id });
  }

  // 资料管理
  static async getMaterialList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'getMaterialList', params);
  }

  static async createMaterial(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'createMaterial', data);
  }

  static async updateMaterial(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'updateMaterial', data);
  }

  static async deleteMaterial(id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'deleteMaterial', { id });
  }

  // 学院内容
  static async manageAcademyContent(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'manageAcademyContent', data);
  }

  // ==================== 大使模块 (15个接口) ====================

  // 大使管理
  static async getAmbassadorList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'getAmbassadorList', params);
  }

  static async getAmbassadorDetail(ambassador_id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'getAmbassadorDetail', { ambassador_id });
  }

  // 申请管理
  static async getApplicationList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'getApplicationList', params);
  }

  static async auditApplication(application_id, approved, reject_reason = '') {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'auditApplication', { application_id, approved, reject_reason });
  }

  // 活动管理
  static async getActivityList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'getActivityList', params);
  }

  static async createActivity(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'createActivity', data);
  }

  static async updateActivity(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'updateActivity', data);
  }

  static async deleteActivity(id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'deleteActivity', { id });
  }

  // 合约管理
  static async getContractTemplateList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'getContractTemplateList', params);
  }

  static async createContractTemplate(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'createContractTemplate', data);
  }

  static async updateContractTemplate(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'updateContractTemplate', data);
  }

  static async deleteContractTemplate(id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'deleteContractTemplate', { id });
  }

  static async getSignatureList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'getSignatureList', params);
  }

  static async getContractVersions(template_id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'getContractVersions', { template_id });
  }

  static async getExpiringContracts(days = 30) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'getExpiringContracts', { days });
  }
}

// 显式挂载到 window 对象，确保全局可访问
window.AdminAPI = AdminAPI;
