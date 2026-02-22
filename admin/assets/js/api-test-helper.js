/**
 * API 测试辅助工具
 * 用于后台管理接口的自动化测试
 */

class APITestHelper {
  constructor(baseURL = '', token = '') {
    this.baseURL = baseURL || window.API_CONFIG?.baseURL || 'https://your-api-domain.com';
    this.token = token;
  }

  /**
   * 设置认证 Token
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * 获取请求头
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * 发送 HTTP 请求
   */
  async request(method, url, options = {}) {
    const { params, body, timeout = 30000 } = options;

    // 构建完整 URL
    let fullURL = this.baseURL + url;
    
    // 添加查询参数
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      fullURL += (fullURL.includes('?') ? '&' : '?') + queryString;
    }

    // 构建请求配置
    const requestConfig = {
      method: method.toUpperCase(),
      headers: this.getHeaders(),
      signal: AbortSignal.timeout(timeout)
    };

    // 添加请求体
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestConfig.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(fullURL, requestConfig);
      
      // 解析响应
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // 检查 HTTP 状态码
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || data || '请求失败'}`);
      }

      return {
        success: true,
        status: response.status,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * GET 请求
   */
  async get(url, params = {}) {
    return this.request('GET', url, { params });
  }

  /**
   * POST 请求
   */
  async post(url, body = {}) {
    return this.request('POST', url, { body });
  }

  /**
   * PUT 请求
   */
  async put(url, body = {}) {
    return this.request('PUT', url, { body });
  }

  /**
   * DELETE 请求
   */
  async delete(url, body = {}) {
    return this.request('DELETE', url, { body });
  }

  /**
   * 验证响应字段
   */
  validateFields(data, expectedFields, prefix = '') {
    const results = [];
    
    for (const field of expectedFields) {
      const fieldPath = prefix ? `${prefix}.${field}` : field;
      const exists = data && data.hasOwnProperty(field);
      const value = exists ? data[field] : undefined;
      const type = exists ? this.getFieldType(value) : 'undefined';
      
      results.push({
        field: fieldPath,
        exists,
        type,
        value: this.formatValue(value),
        isEmpty: exists && this.isEmpty(value)
      });
    }

    return results;
  }

  /**
   * 获取字段类型
   */
  getFieldType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }

  /**
   * 格式化值（用于显示）
   */
  formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') return 'Object';
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  }

  /**
   * 检查值是否为空
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  }

  /**
   * 批量验证字段（包括嵌套字段）
   */
  validateAllFields(response, testCase) {
    const checks = [];

    // 验证根级字段
    if (testCase.expectedFields) {
      const rootChecks = this.validateFields(response.data, testCase.expectedFields);
      checks.push(...rootChecks);
    }

    // 验证列表项字段
    if (testCase.itemFields && response.data?.list && Array.isArray(response.data.list) && response.data.list.length > 0) {
      const itemChecks = this.validateFields(response.data.list[0], testCase.itemFields, 'list[0]');
      checks.push(...itemChecks);
    }

    // 验证嵌套对象字段
    if (testCase.overviewFields && response.data?.overview) {
      const overviewChecks = this.validateFields(response.data.overview, testCase.overviewFields, 'overview');
      checks.push(...overviewChecks);
    }

    // 验证统计字段
    if (testCase.statsFields && response.data?.stats) {
      const statsChecks = this.validateFields(response.data.stats, testCase.statsFields, 'stats');
      checks.push(...statsChecks);
    }

    return checks;
  }

  /**
   * 生成测试报告
   */
  generateReport(results) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;

    const report = {
      summary: {
        total,
        passed,
        failed,
        passRate: parseFloat(passRate),
        testDate: new Date().toISOString(),
        duration: results.reduce((sum, r) => sum + (r.duration || 0), 0)
      },
      details: results.map(r => ({
        name: r.name,
        module: r.module,
        status: r.status,
        method: r.method,
        url: r.url,
        duration: r.duration,
        fieldChecks: r.fieldChecks,
        error: r.error
      })),
      failedTests: results.filter(r => r.status === 'failed').map(r => ({
        name: r.name,
        error: r.error,
        missingFields: r.fieldChecks?.filter(f => !f.exists).map(f => f.field) || []
      }))
    };

    return report;
  }

  /**
   * 导出报告为 JSON
   */
  exportReportJSON(results, filename = `api-test-report-${Date.now()}.json`) {
    const report = this.generateReport(results);
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 导出报告为 HTML
   */
  exportReportHTML(results, filename = `api-test-report-${Date.now()}.html`) {
    const report = this.generateReport(results);
    
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API 测试报告</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #fff; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 16px; }
    .summary-item { text-align: center; padding: 16px; background: #f5f5f5; border-radius: 4px; }
    .summary-value { font-size: 32px; font-weight: 600; margin-bottom: 8px; }
    .summary-label { font-size: 14px; color: #666; }
    .test-list { background: #fff; padding: 16px; border-radius: 8px; }
    .test-item { border: 1px solid #e0e0e0; border-radius: 4px; padding: 16px; margin-bottom: 16px; }
    .test-item.success { border-color: #00a870; background: #f0f9f6; }
    .test-item.failed { border-color: #e34d59; background: #fff0f1; }
    .test-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .test-name { font-weight: 600; }
    .test-status { padding: 4px 12px; border-radius: 4px; font-size: 12px; }
    .test-status.success { background: #00a870; color: #fff; }
    .test-status.failed { background: #e34d59; color: #fff; }
    .field-checks { margin-top: 12px; font-size: 12px; }
    .field-check { padding: 4px 0; }
    .field-check.success { color: #00a870; }
    .field-check.failed { color: #e34d59; }
    .error { background: #fff0f1; border: 1px solid #e34d59; padding: 12px; border-radius: 4px; margin-top: 12px; color: #e34d59; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>API 测试报告</h1>
      <p>测试时间: ${new Date(report.summary.testDate).toLocaleString('zh-CN')}</p>
      <div class="summary">
        <div class="summary-item">
          <div class="summary-value" style="color: #0052d9;">${report.summary.total}</div>
          <div class="summary-label">总测试数</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: #00a870;">${report.summary.passed}</div>
          <div class="summary-label">通过</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: #e34d59;">${report.summary.failed}</div>
          <div class="summary-label">失败</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${report.summary.passRate}%</div>
          <div class="summary-label">通过率</div>
        </div>
      </div>
    </div>
    
    <div class="test-list">
      <h2>测试详情</h2>
      ${report.details.map(test => `
        <div class="test-item ${test.status}">
          <div class="test-header">
            <div class="test-name">${test.name}</div>
            <span class="test-status ${test.status}">
              ${test.status === 'success' ? '✓ 通过' : '✗ 失败'}
            </span>
          </div>
          <div><strong>接口:</strong> ${test.method} ${test.url}</div>
          <div><strong>耗时:</strong> ${test.duration}ms</div>
          ${test.fieldChecks && test.fieldChecks.length > 0 ? `
            <div class="field-checks">
              <strong>字段验证:</strong>
              ${test.fieldChecks.map(check => `
                <div class="field-check ${check.exists ? 'success' : 'failed'}">
                  ${check.exists ? '✓' : '✗'} ${check.field} (${check.type})
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${test.error ? `<div class="error"><strong>错误:</strong> ${test.error}</div>` : ''}
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 导出报告为 CSV
   */
  exportReportCSV(results, filename = `api-test-report-${Date.now()}.csv`) {
    const rows = [
      ['测试名称', '模块', '状态', '方法', 'URL', '耗时(ms)', '缺失字段', '错误信息']
    ];

    results.forEach(r => {
      const missingFields = r.fieldChecks
        ?.filter(f => !f.exists)
        .map(f => f.field)
        .join('; ') || '';
      
      rows.push([
        r.name,
        r.module || '',
        r.status,
        r.method,
        r.url,
        r.duration || 0,
        missingFields,
        r.error || ''
      ]);
    });

    const csv = rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const bom = '\uFEFF'; // UTF-8 BOM
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// 导出到全局
window.APITestHelper = APITestHelper;


