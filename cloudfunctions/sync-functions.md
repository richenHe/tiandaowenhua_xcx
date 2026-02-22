# 云函数公共代码同步指南

> 当修改 `common/` 或 `business-logic/` 公共代码后，使用本指南批量更新所有云函数

## 📋 同步流程

### 1. 确认修改内容

**检查是否修改了以下公共代码：**
- ✅ `cloudfunctions/common/` - 公共工具层（db.js, auth.js, response.js, utils.js, storage.js）
- ✅ `cloudfunctions/business-logic/` - 业务逻辑层（payment.js, points.js, ambassador.js 等）

### 2. 复制公共代码（可选）

**如果各云函数的 common/ 和 business-logic/ 目录不是软链接，需要手动复制：**

```bash
# Windows PowerShell
# 复制 common 到各云函数
Copy-Item -Path "cloudfunctions/common/*" -Destination "cloudfunctions/user/common/" -Recurse -Force
Copy-Item -Path "cloudfunctions/common/*" -Destination "cloudfunctions/order/common/" -Recurse -Force
Copy-Item -Path "cloudfunctions/common/*" -Destination "cloudfunctions/course/common/" -Recurse -Force
Copy-Item -Path "cloudfunctions/common/*" -Destination "cloudfunctions/ambassador/common/" -Recurse -Force
Copy-Item -Path "cloudfunctions/common/*" -Destination "cloudfunctions/system/common/" -Recurse -Force

# 复制 business-logic 到各云函数
Copy-Item -Path "cloudfunctions/business-logic/*" -Destination "cloudfunctions/user/business-logic/" -Recurse -Force
Copy-Item -Path "cloudfunctions/business-logic/*" -Destination "cloudfunctions/order/business-logic/" -Recurse -Force
Copy-Item -Path "cloudfunctions/business-logic/*" -Destination "cloudfunctions/course/business-logic/" -Recurse -Force
Copy-Item -Path "cloudfunctions/business-logic/*" -Destination "cloudfunctions/ambassador/business-logic/" -Recurse -Force
Copy-Item -Path "cloudfunctions/business-logic/*" -Destination "cloudfunctions/system/business-logic/" -Recurse -Force
```

```bash
# Linux/Mac
# 复制 common 到各云函数
cp -r cloudfunctions/common/* cloudfunctions/user/common/
cp -r cloudfunctions/common/* cloudfunctions/order/common/
cp -r cloudfunctions/common/* cloudfunctions/course/common/
cp -r cloudfunctions/common/* cloudfunctions/ambassador/common/
cp -r cloudfunctions/common/* cloudfunctions/system/common/

# 复制 business-logic 到各云函数
cp -r cloudfunctions/business-logic/* cloudfunctions/user/business-logic/
cp -r cloudfunctions/business-logic/* cloudfunctions/order/business-logic/
cp -r cloudfunctions/business-logic/* cloudfunctions/course/business-logic/
cp -r cloudfunctions/business-logic/* cloudfunctions/ambassador/business-logic/
cp -r cloudfunctions/business-logic/* cloudfunctions/system/business-logic/
```

### 3. 批量更新云函数代码

**使用 CloudBase MCP 工具批量更新（推荐）：**

#### 方式一：AI 辅助批量更新（推荐）

直接告诉 AI：

```
请帮我使用 mcp_cloudbase_updateFunctionCode 批量更新以下云函数的代码：
- user
- order
- course
- ambassador
- system

functionRootPath: D:\project\cursor\work\xcx\cloudfunctions
```

AI 会自动依次调用 MCP 工具更新所有云函数。

#### 方式二：手动逐个更新

按顺序告诉 AI 更新每个云函数：

1. **更新 user 云函数**
   ```
   使用 mcp_cloudbase_updateFunctionCode 更新 user 云函数
   - name: user
   - functionRootPath: D:\project\cursor\work\xcx\cloudfunctions
   ```

2. **更新 order 云函数**
   ```
   使用 mcp_cloudbase_updateFunctionCode 更新 order 云函数
   - name: order
   - functionRootPath: D:\project\cursor\work\xcx\cloudfunctions
   ```

3. **更新 course 云函数**
   ```
   使用 mcp_cloudbase_updateFunctionCode 更新 course 云函数
   - name: course
   - functionRootPath: D:\project\cursor\work\xcx\cloudfunctions
   ```

4. **更新 ambassador 云函数**
   ```
   使用 mcp_cloudbase_updateFunctionCode 更新 ambassador 云函数
   - name: ambassador
   - functionRootPath: D:\project\cursor\work\xcx\cloudfunctions
   ```

5. **更新 system 云函数**
   ```
   使用 mcp_cloudbase_updateFunctionCode 更新 system 云函数
   - name: system
   - functionRootPath: D:\project\cursor\work\xcx\cloudfunctions
   ```

## ⚠️ 重要注意事项

### 1. 排除 callbacks 云函数
- ❌ **禁止更新 callbacks 云函数**
- callbacks 采用 HTTP 触发器，部署方式不同
- 该云函数需独立维护

### 2. 使用正确的 MCP 工具
- ✅ 使用 `updateFunctionCode` - 仅更新代码
- ❌ 不要使用 `updateFunctionConfig` - 会修改运行时配置

### 3. functionRootPath 路径说明
- 必须是云函数的**父目录**（`cloudfunctions`）
- 不是云函数目录本身（如 `cloudfunctions/user`）
- Windows 示例: `D:\project\cursor\work\xcx\cloudfunctions`
- Linux/Mac 示例: `/path/to/project/cloudfunctions`

### 4. 更新失败处理
如果某个云函数更新失败：
1. 检查云函数名称是否正确
2. 检查 functionRootPath 路径是否正确
3. 检查云函数目录是否包含 `index.js`
4. 查看错误日志，根据提示修复
5. 尝试在 CloudBase 控制台手动上传

### 5. 验证更新结果
更新完成后，建议：
1. 在 CloudBase 控制台查看云函数版本号是否更新
2. 测试关键接口是否正常工作
3. 查看云函数日志，确认无报错

## 📊 同步检查清单

**每次修改公共代码后必须执行：**

- [ ] 已识别修改的公共代码（common/ 或 business-logic/）
- [ ] 已复制最新代码到所有云函数目录（如需要）
- [ ] 已使用 `updateFunctionCode` 更新所有云函数
- [ ] 已排除 `callbacks` 云函数
- [ ] 已验证所有云函数更新成功
- [ ] 已测试关键接口功能正常

## 🔧 故障排查

### 问题1：找不到云函数
```
错误：云函数 xxx 不存在
```
**解决**：检查云函数名称拼写是否正确，使用 `getFunctionList` 查看所有云函数

### 问题2：路径错误
```
错误：找不到云函数目录
```
**解决**：确认 `functionRootPath` 指向 `cloudfunctions` 父目录，不是云函数本身

### 问题3：上传超时
```
错误：上传超时
```
**解决**：检查网络连接，或稍后重试

### 问题4：权限不足
```
错误：权限不足
```
**解决**：确认 CloudBase 环境已登录，有云函数管理权限

## 📚 相关文档

- [CloudBase 云函数文档](https://docs.cloudbase.net/cloud-function/)
- [项目开发规范](.cursorrules)
- [云函数标准部署规范](云函数标准部署规范.md)

---

**最后更新：** 2026-02-12
**维护者：** 项目开发团队










