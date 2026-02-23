# 公共代码同步部署规范

> 📌 **适用场景**：修改 `cloudfunctions/common/` 或 `cloudfunctions/business-logic/` 下任何文件后，必须参考此文档同步所有云函数。

---

## 触发条件

| 修改目录 | 触发同步 |
|---------|---------|
| `cloudfunctions/common/`（db.js, auth.js, response.js, utils.js, storage.js） | ✅ 触发 |
| `cloudfunctions/business-logic/`（payment.js, points.js, ambassador.js 等） | ✅ 触发 |
| `cloudfunctions/callbacks/` | ❌ 不触发（独立维护） |

---

## 同步目标

| 云函数 | 同步 |
|--------|------|
| `user` | ✅ |
| `order` | ✅ |
| `course` | ✅ |
| `ambassador` | ✅ |
| `system` | ✅ |
| `callbacks` | ❌ 禁止同步，该函数独立维护 |

---

## 同步流程

### 步骤1：复制公共代码

将 `common/` 和 `business-logic/` 最新代码复制到各云函数目录。

### 步骤2：使用 MCP 批量更新云函数代码

按顺序执行，使用 `mcp_cloudbase_updateFunctionCode`：

```
更新 user 云函数：
- name: user
- functionRootPath: D:\project\cursor\work\xcx\cloudfunctions

更新 order 云函数：
- name: order
- functionRootPath: D:\project\cursor\work\xcx\cloudfunctions

更新 course 云函数：
- name: course
- functionRootPath: D:\project\cursor\work\xcx\cloudfunctions

更新 ambassador 云函数：
- name: ambassador
- functionRootPath: D:\project\cursor\work\xcx\cloudfunctions

更新 system 云函数：
- name: system
- functionRootPath: D:\project\cursor\work\xcx\cloudfunctions
```

> **注意**：使用 `updateFunctionCode`（更新代码），不要使用 `updateFunctionConfig`（更新配置）。

---

## 同步检查清单

- [ ] 已复制 `common/` 最新代码到所有云函数（除 callbacks）
- [ ] 已复制 `business-logic/` 最新代码到所有云函数（除 callbacks）
- [ ] 已使用 `updateFunctionCode` 更新所有 5 个云函数
- [ ] 未更新 `callbacks`（该函数独立维护）
- [ ] 更新完成后测试关键接口是否正常

---

## 注意事项

- **functionRootPath**：必须指向 `cloudfunctions` 目录（云函数的父目录），Windows 路径：`D:\project\cursor\work\xcx\cloudfunctions`
- **更新顺序**：建议 user → order → course → ambassador → system
- **某个失败不影响其他**：单个云函数更新失败，继续更新其他
- **持续失败**：检查云函数名称、路径、目录结构（必须包含 index.js）；如持续失败，尝试 CloudBase 控制台手动上传
