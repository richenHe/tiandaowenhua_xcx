<!-- Web 管理后台登录页面示例 -->
<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">天道文化管理后台</h1>
      <p class="login-subtitle">欢迎登录</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-login" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </div>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AdminAPI from '@/utils/admin-api';

const router = useRouter();

// 表单数据
const form = ref({
  username: '',
  password: ''
});

// 加载状态
const loading = ref(false);

// 错误信息
const error = ref('');

/**
 * 处理登录
 */
async function handleLogin() {
  // 清除之前的错误
  error.value = '';
  
  // 验证表单
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码';
    return;
  }

  loading.value = true;

  try {
    // 调用登录接口
    const result = await AdminAPI.login(
      form.value.username,
      form.value.password
    );

    console.log('登录成功:', result);

    // Token 已自动保存到 localStorage（在 AdminAPI.login 中）
    
    // 跳转到管理后台首页
    router.push('/admin/dashboard');
  } catch (err) {
    console.error('登录失败:', err);
    error.value = err.message || '登录失败，请重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.login-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.login-subtitle {
  margin: 0 0 32px;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.login-form {
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  font-size: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-actions {
  margin-top: 32px;
}

.btn-login {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  padding: 12px;
  font-size: 14px;
  color: #f56c6c;
  background-color: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  text-align: center;
}
</style>




