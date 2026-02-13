// admin/assets/js/cloudbase.js
// 确保在 HTML 中已引入 CDN: <script src="https://imgcache.qq.com/qcloud/cloudbase-js-sdk/2.6.0/cloudbase.full.js"></script>

console.log('🔧 cloudbase.js 开始加载...');

/**
 * 初始化 CloudBase
 * 使用轮询机制等待 SDK 加载完成
 */
function initCloudBase() {
  console.log('🔧 开始初始化 CloudBase...');

  // 检查 CloudBase SDK 是否加载
  if (!window.cloudbase) {
    console.warn('⚠️ CloudBase SDK 尚未加载，等待中...');
    return false;
  }

  // 检查 ENV_ID 是否存在
  if (!window.CONFIG || !window.CONFIG.ENV_ID) {
    console.warn('⚠️ 环境 ID 尚未配置，等待中...');
    return false;
  }

  console.log('✅ CloudBase SDK 已加载');
  console.log('✅ 环境 ID:', window.CONFIG.ENV_ID);

  try {
    // 初始化 CloudBase
    const app = window.cloudbase.init({
      env: window.CONFIG.ENV_ID // 从 config.js 读取环境 ID
    });

    console.log('✅ CloudBase 初始化成功');

    // 认证
    const auth = app.auth();

    // 云存储
    const storage = app.uploadFile.bind(app);
    const getTempFileURL = app.getTempFileURL.bind(app);
    const deleteFile = app.deleteFile.bind(app);

    // 导出到全局（先导出，以便后续使用）
    window.CloudStorage = {
      app,
      auth,
      uploadFile: storage,
      getTempFileURL,
      deleteFile,
      isAuthenticated: false // 认证状态标记
    };

    console.log('✅ CloudStorage 对象已挂载到 window');
    console.log('📦 可用方法:', Object.keys(window.CloudStorage));
    
    // 🔥 执行匿名登录（异步）- 使用新版 API
    console.log('🔐 开始匿名登录...');
    auth.signInAnonymously()
      .then(() => {
        console.log('✅ 匿名登录成功！');
        window.CloudStorage.isAuthenticated = true;
        
        // 获取当前用户信息
        const user = auth.currentUser;
        if (user) {
          console.log('👤 当前用户 UID:', user.uid);
        }
      })
      .catch((error) => {
        console.error('❌ 匿名登录失败:', error);
        console.error('   请在 CloudBase 控制台开启匿名登录功能');
        console.error('   链接: https://tcb.cloud.tencent.com/dev?envId=' + window.CONFIG.ENV_ID + '#/identity/login-manage');
      });
    
    return true;
  } catch (error) {
    console.error('❌ CloudBase 初始化失败:', error);
    return false;
  }
}

// 尝试立即初始化
if (!initCloudBase()) {
  console.log('⏳ 等待依赖加载...');
  
  // 使用轮询机制，每100ms检查一次
  let retryCount = 0;
  const maxRetries = 50; // 最多重试50次（5秒）
  
  const checkInterval = setInterval(() => {
    retryCount++;
    
    if (initCloudBase()) {
      clearInterval(checkInterval);
      console.log('✅ CloudBase 延迟初始化成功');
    } else if (retryCount >= maxRetries) {
      clearInterval(checkInterval);
      console.error('❌ CloudBase 初始化超时！请检查：');
      console.error('   1. CDN 链接是否正确');
      console.error('   2. 网络连接是否正常');
      console.error('   3. config.js 是否正确加载');
    }
  }, 100);
}

