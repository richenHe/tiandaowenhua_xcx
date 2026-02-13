/**
 * 统一页面模板工具
 * 提供通用的页面结构、加载、分页、表单等功能
 */

const PageTemplate = {
  /**
   * 创建标准列表页面
   * @param {Object} config - 配置对象
   * @returns {Object} Vue 组件配置
   */
  createListPage(config) {
    const {
      title,           // 页面标题
      api,             // API 方法（如 AdminAPI.getUserList）
      columns,         // 表格列配置
      searchFields,    // 搜索字段配置
      actions,         // 操作按钮配置
      rowActions,      // 行操作配置
    } = config;

    return {
      setup() {
        const { ref, reactive, onMounted } = Vue;
        
        // 状态
        const loading = ref(false);
        const tableData = ref([]);
        const pagination = reactive({
          current: 1,
          pageSize: 20,
          total: 0,
        });
        
        // 搜索表单
        const searchForm = reactive(
          searchFields.reduce((acc, field) => {
            acc[field.name] = field.default || '';
            return acc;
          }, {})
        );
        
        // 加载数据
        const loadData = async () => {
          loading.value = true;
          try {
            const result = await api({
              page: pagination.current,
              pageSize: pagination.pageSize,
              ...searchForm,
            });
            
            tableData.value = result.list || [];
            pagination.total = result.total || 0;
          } catch (error) {
            TDesign.MessagePlugin.error('加载数据失败: ' + error.message);
          } finally {
            loading.value = false;
          }
        };
        
        // 搜索
        const handleSearch = () => {
          pagination.current = 1;
          loadData();
        };
        
        // 重置
        const handleReset = () => {
          Object.keys(searchForm).forEach(key => {
            const field = searchFields.find(f => f.name === key);
            searchForm[key] = field?.default || '';
          });
          handleSearch();
        };
        
        // 分页变化
        const onPageChange = (pageInfo) => {
          pagination.current = pageInfo.current;
          pagination.pageSize = pageInfo.pageSize;
          loadData();
        };
        
        // 刷新
        const refresh = () => {
          loadData();
        };
        
        onMounted(() => {
          loadData();
        });
        
        return {
          loading,
          tableData,
          pagination,
          searchForm,
          searchFields,
          columns,
          actions,
          rowActions,
          handleSearch,
          handleReset,
          onPageChange,
          refresh,
        };
      }
    };
  },
  
  /**
   * 创建标准表单对话框
   * @param {Object} config - 配置对象
   * @returns {Object} 表单对话框配置
   */
  createFormDialog(config) {
    const {
      title,        // 对话框标题
      formFields,   // 表单字段配置
      api,          // 提交 API
      onSuccess,    // 成功回调
    } = config;
    
    return {
      setup() {
        const { ref, reactive } = Vue;
        
        const visible = ref(false);
        const loading = ref(false);
        const formData = reactive(
          formFields.reduce((acc, field) => {
            acc[field.name] = field.default || '';
            return acc;
          }, {})
        );
        
        // 打开对话框
        const open = (data = {}) => {
          Object.keys(data).forEach(key => {
            if (formData.hasOwnProperty(key)) {
              formData[key] = data[key];
            }
          });
          visible.value = true;
        };
        
        // 提交
        const handleSubmit = async () => {
          loading.value = true;
          try {
            await api(formData);
            TDesign.MessagePlugin.success('操作成功');
            visible.value = false;
            onSuccess && onSuccess();
          } catch (error) {
            TDesign.MessagePlugin.error('操作失败: ' + error.message);
          } finally {
            loading.value = false;
          }
        };
        
        return {
          visible,
          loading,
          formData,
          formFields,
          open,
          handleSubmit,
        };
      }
    };
  },
  
  /**
   * 确认对话框
   * @param {Object} options - 配置选项
   */
  confirm(options) {
    const {
      title = '确认操作',
      content,
      onConfirm,
    } = options;
    
    return TDesign.DialogPlugin.confirm({
      header: title,
      body: content,
      onConfirm: async () => {
        try {
          await onConfirm();
          TDesign.MessagePlugin.success('操作成功');
        } catch (error) {
          TDesign.MessagePlugin.error('操作失败: ' + error.message);
        }
      }
    });
  },
  
  /**
   * 格式化日期时间
   */
  formatDateTime(datetime) {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
  
  /**
   * 格式化金额
   */
  formatMoney(amount) {
    if (amount === null || amount === undefined) return '-';
    return '¥' + (amount / 100).toFixed(2);
  },
  
  /**
   * 状态标签颜色映射
   */
  getStatusTheme(status, type = 'default') {
    const themeMap = {
      // 支付状态
      pay_status: {
        0: 'warning',  // 未支付
        1: 'success',  // 已支付
        2: 'danger',   // 已退款
      },
      // 订单状态
      order_status: {
        0: 'warning',  // 待支付
        1: 'success',  // 已完成
        2: 'danger',   // 已取消
      },
      // 审核状态
      audit_status: {
        0: 'warning',  // 待审核
        1: 'success',  // 已通过
        2: 'danger',   // 已拒绝
      },
      // 通用状态
      default: {
        0: 'default',
        1: 'success',
        2: 'danger',
      }
    };
    
    return themeMap[type]?.[status] || themeMap.default[status] || 'default';
  },
};




