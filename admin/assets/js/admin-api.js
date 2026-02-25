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
          window.location.href = (window.CONFIG?.BASE_PATH || '/tiandaowenhua/') + 'login.html';
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
    window.location.href = (window.CONFIG?.BASE_PATH || '/tiandaowenhua/') + 'login.html';
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
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'getAdminAnnouncementList', params);
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

  // 轮播图管理
  static async getBannerList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'getAdminBannerList', params);
  }

  static async createBanner(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'createBanner', data);
  }

  static async updateBanner(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'updateBanner', data);
  }

  static async deleteBanner(id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'deleteBanner', { id });
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

  static async createAmbassadorLevelConfig(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'createAmbassadorLevelConfig', data);
  }

  static async deleteAmbassadorLevelConfig(level) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.SYSTEM, 'deleteAmbassadorLevelConfig', { level });
  }

  // ==================== 用户模块 (4个接口) ====================

  static async getUserList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.USER, 'getUserList', params);
  }

  static async createUser(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.USER, 'createUser', data);
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

  // 标记提现已转账（status 1→2）
  static async markWithdrawTransferred(withdrawal_id, transfer_no = '', transfer_remark = '') {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'markWithdrawTransferred', { withdrawal_id, transfer_no, transfer_remark });
  }

  // 退款管理
  static async getRefundList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'getRefundList', params);
  }

  static async approveRefund(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'approveRefund', data);
  }

  static async rejectRefund(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'rejectRefund', data);
  }

  // 提现管理
  static async getWithdrawList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'getWithdrawList', params);
  }

  static async approveWithdraw(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'approveWithdraw', data);
  }

  static async rejectWithdraw(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'rejectWithdraw', data);
  }

  static async markWithdrawTransferred(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'markWithdrawTransferred', data);
  }

  static async exportWithdrawTransferList() {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'exportWithdrawTransferList');
  }

  // 订单状态管理
  static async updateOrderStatus(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'updateOrderStatus', data);
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
    // 兼容两种调用方式：deleteCourse(id) 或 deleteCourse({ courseId })
    const courseId = typeof id === 'object' ? (id.courseId || id.id) : id;
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'deleteCourse', { id: courseId });
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
    // 兼容两种调用方式：deleteCase(id) 或 deleteCase({ caseId })
    const caseId = typeof id === 'object' ? (id.caseId || id.id) : id;
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'deleteCase', { id: caseId });
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
    // 兼容两种调用方式：deleteMaterial(id) 或 deleteMaterial({ materialId })
    const materialId = typeof id === 'object' ? (id.materialId || id.id) : id;
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'deleteMaterial', { id: materialId });
  }

  // 学院内容
  static async manageAcademyContent(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'manageAcademyContent', data);
  }

  // 排期管理（别名方法，向后兼容）
  static async getScheduleList(params = {}) {
    return this.getClassRecordList(params);
  }

  static async createSchedule(data) {
    return this.createClassRecord(data);
  }

  static async updateSchedule(data) {
    return this.updateClassRecord(data);
  }

  static async deleteSchedule(data) {
    const id = typeof data === 'object' ? (data.scheduleId || data.id) : data;
    return this.deleteClassRecord(id);
  }

  // 获取全部课程
  static async getAllCourses() {
    const data = await this.getCourseList({ page: 1, pageSize: 9999 });
    return data.list || [];
  }

  // 案例状态管理
  static async updateCaseStatus(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'updateCaseStatus', data);
  }

  // ==================== 大使模块 (15个接口) ====================

  // 大使管理
  static async getAmbassadorList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'getAmbassadorList', params);
  }

  static async getAmbassadorDetail(ambassador_id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'getAmbassadorDetail', { ambassador_id });
  }

  static async updateAmbassadorLevel(userId, level) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'updateAmbassadorLevel', { user_id: userId, level });
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

  // 大使模块别名方法（向后兼容）
  static async getAmbassadorApplicationList(params = {}) {
    return this.getApplicationList(params);
  }

  static async getAmbassadorActivityList(params = {}) {
    return this.getActivityList(params);
  }

  static async getContractList(params = {}) {
    return this.getSignatureList(params);
  }

  static async renewContract(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'renewContract', data);
  }

  static async terminateContract(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'terminateContract', data);
  }

  // ==================== 商城商品模块 ====================

  static async getMallGoodsList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'getMallGoodsList', params);
  }

  static async createMallGoods(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'createMallGoods', data);
  }

  static async updateMallGoods(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'updateMallGoods', data);
  }

  static async deleteMallGoods(id) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'deleteMallGoods', { id });
  }

  // ==================== 兑换管理模块 ====================

  static async getExchangeList(params = {}) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'getExchangeList', params);
  }

  static async confirmPickup(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.ORDER, 'confirmPickup', data);
  }

  // ==================== 系统模块别名方法 ====================

  static async getAdminList(params = {}) {
    return this.getAdminUserList(params);
  }

  static async getSystemConfig(config_key = null) {
    return this.getConfig(config_key);
  }

  static async updateSystemConfig(data) {
    if (typeof data === 'object' && !data.config_key) {
      throw new Error('批量更新配置需要逐个调用 updateConfig');
    }
    return this.updateConfig(data.config_key, data.config_value);
  }

  static async getLevelConfig() {
    return this.getAmbassadorLevelConfigs();
  }

  static async updateLevelConfig(data) {
    return this.updateAmbassadorLevelConfig(data);
  }

  static async getNotificationList(params = {}) {
    return this.getNotificationLogs(params);
  }

  static async handleFeedback(data) {
    return this.replyFeedback(data.feedbackId, data.replyContent || '已处理');
  }

  // ==================== 预约管理别名方法 ====================

  /** 单次签到 — 别名，签到状态 = 2 */
  static async checkInAppointment({ appointmentId }) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'updateAppointmentStatus', { id: appointmentId, status: 2 });
  }

  /** 取消预约 — 别名，取消状态 = 3 */
  static async cancelAppointment({ appointmentId }) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.COURSE, 'updateAppointmentStatus', { id: appointmentId, status: 3 });
  }

  /** 批量签到 — 兼容大写 CheckIn 的别名 */
  static async batchCheckIn({ appointment_ids }) {
    return this.batchCheckin(appointment_ids);
  }

  // ==================== 大使管理别名方法 ====================

  /** 调整积分（实际 action: adjustPoints） */
  static async adjustPoints(data) {
    return this.call(CONFIG.CLOUD_FUNCTIONS.AMBASSADOR, 'adjustPoints', data);
  }

  /** 调整大使积分 — 别名，将 userId 映射为 user_id */
  static async adjustAmbassadorPoints({ userId, point_type, amount, reason }) {
    return this.adjustPoints({ user_id: userId, point_type, amount, reason });
  }

  /** 大使升级 — 别名，调用 updateAmbassadorLevel */
  static async upgradeAmbassador({ userId, targetLevel }) {
    return this.updateAmbassadorLevel(userId, targetLevel);
  }

  /** 删除活动别名 */
  static async deleteAmbassadorActivity({ activityId }) {
    return this.deleteActivity(activityId);
  }

  /** 创建活动别名 */
  static async createAmbassadorActivity(data) {
    return this.createActivity(data);
  }

  /** 更新活动别名 */
  static async updateAmbassadorActivity(data) {
    return this.updateActivity(data);
  }

  // ==================== 管理员管理别名方法 ====================

  /** 创建管理员别名 */
  static async createAdmin(data) {
    return this.createAdminUser(data);
  }

  /** 更新管理员别名 */
  static async updateAdmin(data) {
    return this.updateAdminUser(data);
  }

  /** 删除管理员别名，将 { adminId } 映射为 id */
  static async deleteAdmin({ adminId }) {
    return this.deleteAdminUser(adminId);
  }

  /** 切换管理员状态 — 后端暂无此 action，通过 updateAdminUser 实现 */
  static async toggleAdminStatus({ adminId }) {
    throw new Error('切换管理员状态功能暂未开放，请在编辑管理员中修改状态字段');
  }

  // ==================== 通知管理别名方法 ====================

  /** 删除通知配置 — 后端暂无此 action */
  static async deleteNotificationConfig({ id }) {
    throw new Error('删除通知配置功能暂未开放');
  }

  // ==================== 用户关系别名方法 ====================

  /** 获取推荐关系树 — 后端暂无此 action */
  static async getReferralTree(params = {}) {
    throw new Error('推荐关系树功能暂未开放');
  }
}

// 显式挂载到 window 对象，确保全局可访问
window.AdminAPI = AdminAPI;
