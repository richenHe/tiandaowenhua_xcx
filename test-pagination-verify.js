/**
 * 分页改造验证脚本
 * 用于快速验证接口是否改造成功
 */

const https = require('https');

// 配置信息（请根据实际情况修改）
const CONFIG = {
  ENV_ID: 'your-env-id', // 替换为你的环境ID
  TOKEN: 'your-token'     // 替换为你的管理员token
};

/**
 * 调用云函数
 */
function callCloudFunction(functionName, action, data = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      action,
      jwtToken: CONFIG.TOKEN,
      ...data
    });

    const options = {
      hostname: `${CONFIG.ENV_ID}.service.tcloudbase.com`,
      path: `/${functionName}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          let result = JSON.parse(body);

          // 解析 CloudBase HTTP API 响应
          if (result.body && typeof result.body === 'string') {
            result = JSON.parse(result.body);
          }

          resolve(result);
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 验证响应格式
 */
function validateResponse(data, testName) {
  const requiredFields = ['list', 'total', 'page', 'pageSize', 'totalPages', 'hasMore', 'hasPrev'];
  const missingFields = [];

  for (const field of requiredFields) {
    if (!(field in data)) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    console.log(`❌ ${testName} - 缺少字段: ${missingFields.join(', ')}`);
    return false;
  }

  // 验证字段类型
  const typeChecks = [
    { field: 'list', type: 'array', check: Array.isArray(data.list) },
    { field: 'total', type: 'number', check: typeof data.total === 'number' },
    { field: 'page', type: 'number', check: typeof data.page === 'number' },
    { field: 'pageSize', type: 'number', check: typeof data.pageSize === 'number' },
    { field: 'totalPages', type: 'number', check: typeof data.totalPages === 'number' },
    { field: 'hasMore', type: 'boolean', check: typeof data.hasMore === 'boolean' },
    { field: 'hasPrev', type: 'boolean', check: typeof data.hasPrev === 'boolean' }
  ];

  for (const check of typeChecks) {
    if (!check.check) {
      console.log(`❌ ${testName} - 字段类型错误: ${check.field} 应该是 ${check.type}`);
      return false;
    }
  }

  // 验证逻辑
  const totalPages = Math.ceil(data.total / data.pageSize);
  if (data.totalPages !== totalPages) {
    console.log(`❌ ${testName} - totalPages 计算错误: 期望 ${totalPages}, 实际 ${data.totalPages}`);
    return false;
  }

  if (data.hasMore !== (data.page < data.totalPages)) {
    console.log(`❌ ${testName} - hasMore 计算错误`);
    return false;
  }

  if (data.hasPrev !== (data.page > 1)) {
    console.log(`❌ ${testName} - hasPrev 计算错误`);
    return false;
  }

  console.log(`✅ ${testName} - 所有检查通过`);
  console.log(`   数据: total=${data.total}, page=${data.page}, pageSize=${data.pageSize}, totalPages=${data.totalPages}, hasMore=${data.hasMore}, hasPrev=${data.hasPrev}`);
  return true;
}

/**
 * 测试管理员列表接口
 */
async function testAdminUserList() {
  console.log('\n🧪 测试: system/getAdminUserList');
  console.log('='.repeat(60));

  try {
    // 测试1: 第一页
    console.log('\n📝 测试 1: 第一页数据');
    const result1 = await callCloudFunction('system', 'getAdminUserList', {
      page: 1,
      page_size: 5
    });

    if (!result1.success) {
      console.log(`❌ 请求失败: ${result1.message}`);
      return false;
    }

    if (!validateResponse(result1.data, '第一页')) {
      return false;
    }

    // 测试2: 第二页
    console.log('\n📝 测试 2: 第二页数据');
    const result2 = await callCloudFunction('system', 'getAdminUserList', {
      page: 2,
      page_size: 5
    });

    if (!result2.success) {
      console.log(`❌ 请求失败: ${result2.message}`);
      return false;
    }

    if (!validateResponse(result2.data, '第二页')) {
      return false;
    }

    // 测试3: pageSize 参数兼容性
    console.log('\n📝 测试 3: pageSize 参数兼容性');
    const result3 = await callCloudFunction('system', 'getAdminUserList', {
      page: 1,
      pageSize: 3  // 使用驼峰命名
    });

    if (!result3.success) {
      console.log(`❌ 请求失败: ${result3.message}`);
      return false;
    }

    if (!validateResponse(result3.data, 'pageSize参数')) {
      return false;
    }

    if (result3.data.pageSize !== 3) {
      console.log(`❌ pageSize 参数未生效: 期望 3, 实际 ${result3.data.pageSize}`);
      return false;
    }

    console.log('\n🎉 所有测试通过！');
    return true;

  } catch (error) {
    console.log(`\n❌ 测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始验证分页改造');
  console.log('='.repeat(60));

  // 检查配置
  if (CONFIG.ENV_ID === 'your-env-id' || CONFIG.TOKEN === 'your-token') {
    console.log('\n⚠️  请先配置 ENV_ID 和 TOKEN');
    console.log('   1. 打开 test-pagination-verify.js');
    console.log('   2. 修改 CONFIG.ENV_ID 为你的环境ID');
    console.log('   3. 修改 CONFIG.TOKEN 为你的管理员token');
    console.log('\n💡 获取 token 的方法:');
    console.log('   1. 打开管理后台并登录');
    console.log('   2. 打开浏览器控制台');
    console.log('   3. 执行: localStorage.getItem("admin_token")');
    process.exit(1);
  }

  const success = await testAdminUserList();

  if (success) {
    console.log('\n✅ 验证通过！可以继续批量改造其他接口。');
    process.exit(0);
  } else {
    console.log('\n❌ 验证失败！请检查问题后再继续。');
    process.exit(1);
  }
}

// 运行测试
main();
