# 硬编码 Emoji 图标清单

> 范围：`universal-cloudbase-uniapp-template/src` 目录下所有 UI 展示用硬编码 emoji
> 不包含：控制台日志(console.log)、动态传参、zuowei/Qclaw 子项目

---

## 一、课程类型映射（多处重复定义）

| Emoji | 含义 | 出现位置 |
|-------|------|---------|
| 📚 | 基础课程 | `order/confirm/index.vue:252`, `course/detail/index.vue:204`, `order/refund-apply/index.vue:276` |
| 🎓 | 进阶课程 | `order/confirm/index.vue:252`, `course/detail/index.vue:204`, `index/index.vue:223`, `mall/index.vue:280`, `order/refunded/index.vue:124`, `order/cancelled/index.vue:118`, `ambassador/exchange-records/index.vue:190`, `course/my-courses/index.vue:130` |
| 🔄 | 复训课程 | `order/confirm/index.vue:252`, `course/detail/index.vue:204`, `mall/index.vue:281` |
| 🎤 | 活动课程 | `course/detail/index.vue:204`, `index/index.vue:225` |
| 💬 | 沙龙/研讨 | `course/my-courses/index.vue:131` |

---

## 二、大使等级映射（多处重复定义）

| Emoji | 含义 | 出现位置 |
|-------|------|---------|
| 👤 | 普通用户 | `ambassador/upgrade-guide/index.vue:224` |
| 🥚 | 蛋级 | `ambassador/upgrade-guide/index.vue:224`, `ambassador/level/index.vue:298`, `mine/index.vue:321` |
| 🐦 | 雏鸟 | `ambassador/upgrade-guide/index.vue:224`, `ambassador/level/index.vue:299` |
| 🦅 | 雄鹰 | `ambassador/upgrade-guide/index.vue:224`, `ambassador/level/index.vue:300` |
| 🐦‍🔥 | 金凤 | `ambassador/upgrade-guide/index.vue:224`, `ambassador/level/index.vue:301`, `ambassador/upgrade-guide/index.vue:255` |

---

## 三、成长等级系统

| Emoji | 含义 | 出现位置 |
|-------|------|---------|
| 🌱 | 种子 | `utils/growth-level.ts:20`, `mine/index.vue:54,58,62-67,160`, `mine/referral-list/index.vue:179,190`, `academy/intro/index.vue:225` |
| 🌿 | 幼苗 | `utils/growth-level.ts:20`, `mine/index.vue:68,161`, `mine/referral-list/index.vue:189`, `ambassador/level/index.vue:298` |
| 🍀 | 三叶草 | `utils/growth-level.ts:20`, `mine/index.vue:69,162`, `mine/referral-list/index.vue:188` |
| 🌳 | 大树 | `utils/growth-level.ts:20`, `mine/index.vue:70,163`, `mine/referral-list/index.vue:187` |
| 🌟 | 星星 | `mine/index.vue:82,164`, `mine/referral-list/index.vue:186` |

---

## 四、页面标题/标签类 emoji

| Emoji | 用途 | 文件:行号 |
|-------|------|---------|
| 📅 | 即将开课/日期 | `course/schedule/index.vue:8,20`, `mine/contracts/index.vue:43`, `mine/appointments/index.vue:41`, `ambassador/activity-records/index.vue:267` |
| 💰 | 金额/积分 | `mine/index.vue:30`, `order/pending/index.vue:37`, `order/detail/index.vue:95`, `order/confirm/index.vue:86`, `ambassador/cash-points/index.vue:15,76`, `ambassador/withdraw/index.vue:14`, `mall/index.vue:22`, `ambassador/cash-points/index.vue:310` |
| 📋 | 信息/文案 | `order/detail/index.vue:96`, `academy/materials/index.vue:56`, `ambassador/contract-sign/index.vue:15`, `ambassador/contract-detail/index.vue:18`, `mall/index.vue:46`, `order/confirm.vue:4` |
| 🎯 | 推荐人 | `order/pending/index.vue:49`, `order/detail/index.vue:75`, `order/confirm/index.vue:48` |
| 👤 | 个人信息 | `order/confirm/index.vue:31` |
| 📖 | 课程简介 | `academy/intro/index.vue:44`, `course/detail.vue:4` |
| 🎁 | 赠送/兑换 | `course/detail/index.vue:115`, `ambassador/merit-points/index.vue:46`, `mall/index.vue:178` |
| 💎 | 功德分/奖励 | `mine/index.vue:29`, `ambassador/level/index.vue:25`, `ambassador/merit-points/index.vue:280`, `ambassador/upgrade-guide/index.vue:229` |
| 📊 | 统计 | `ambassador/exchange-records/index.vue:9`, `ambassador/level/index.vue:110` |
| 📱 | 手机素材/二维码 | `academy/intro/index.vue:149`, `academy/index.vue:42`, `ambassador/qrcode/index.vue:22` |
| 🏆 | 荣誉 | `academy/intro/index.vue:121,155`, `ambassador/level.vue:4` |
| 📢 | 公告 | `mine/index.vue:391`, `common/announcement/index.vue:107,111` |
| ⚠️ | 紧急公告 | `common/announcement/index.vue:108` |
| 💸 | 提现 | `ambassador/cash-points/index.vue:58`, `ambassador/withdraw/index.vue:58` |

---

## 五、状态/信息类 emoji

| Emoji | 用途 | 文件:行号 |
|-------|------|---------|
| ✅ | 复训资格/成功 | `course/appointment-confirm/index.vue:29`, `course/appointment-confirm.vue:4` |
| ❌ | 合同驳回/失败 | `course/my-courses/index.vue:58`, `utils/cloudbase.ts:50` |
| ⏰ | 时间 | `mine/contracts/index.vue:53` |
| ⏳ | 审核中 | `ambassador/upgrade-guide/index.vue:129` |
| 📍 | 地点 | `ambassador/activity-records/index.vue:140` |
| ⏱️ | 时长 | `ambassador/activity-records/index.vue:142` |
| 🎧 | 客服 | `mine/ai-service/index.vue:20`, `mine/index.vue:389` |
| 📝 | 表单/反馈 | `mine/contracts/index.vue:38`, `mine/index.vue:390`, `auth/complete-profile.vue:4` |

---

## 六、活动类型映射

文件：`ambassador/activity-records/index.vue:413`

| Emoji | 含义 |
|-------|------|
| 👨‍🏫 | 教学 |
| 🤝 | 合作 |
| 🎉 | 活动 |
| ✨ | 亮点 |
| 📋 | 记录 |
| 🎤 | 演讲 |

---

## 七、收益图标组

文件：`ambassador/upgrade-guide/index.vue:229` 中的 `BENEFIT_ICONS` 数组

```
💎 🎁 💰 👨‍🏫 🌟 🏆 🎯 ✨
```

---

## 八、功德分来源图标映射

文件：`ambassador/merit-points/index.vue:276-280`

| Emoji | 含义 |
|-------|------|
| ⭐ | 星级奖励 |
| 💎 | 默认(功德分) |

---

## 九、订单退款状态图标

文件：`order/refund-status/index.vue:170,179,188`

| Emoji | 含义 |
|-------|------|
| 💰 | 退款金额 |
| ❌ | 退款失败 |
| 📋 | 退款信息 |

---

## 十、占位符页面 emoji

| Emoji | 文件 |
|-------|------|
| ✅ | `course/appointment-confirm.vue:4` |
| 📖 | `course/detail.vue:4` |
| 📅 | `course/schedule.vue:4` |
| 📋 | `order/confirm.vue:4` |
| 🏆 | `ambassador/level.vue:4` |
| 📝 | `auth/complete-profile.vue:4` |

---

## 十一、其他零散

| Emoji | 用途 | 文件:行号 |
|-------|------|---------|
| ⬆️ | 升级 | `order/refund-apply/index.vue:276` |
| 🎨 | 海报 | `academy/materials/index.vue:42` |
| 🎬 | 视频 | `academy/materials/index.vue:83` |
| 💾 | 保存 | `academy/materials/index.vue:51,91` |
| 🏅 | 奖牌 | `academy/intro/index.vue:289` |
| 🌟 | 荣誉/星级 | `academy/intro/index.vue:290`, `ambassador/merit-points/index.vue:276` |

---

## 统计

- **总计约 200+ 处硬编码 emoji**
- **覆盖 30+ 个文件**
- **涉及模块**：首页、课程、订单、大使、个人中心、商城、商学院、公告等几乎所有业务模块
- **去重后的独立 emoji 数量**：约 50 个

---

## 十二、设计尺寸规范（给设计直接出稿）

> 基准：按 `750px` 设计稿口径整理  
> 交付建议：优先出 `SVG`，同时导出透明底 `PNG`  
> 原则：**同一语义只做一套母版**，再按场景导出不同尺寸，避免一个图标做出多个风格版本

### 1. 母版与导出规则

| 类型 | 母版尺寸 | 常用导出尺寸 | 说明 |
|------|---------|-------------|------|
| 小图标 | `64×64px` | `40×40px` / `48×48px` / `64×64px` | 用于课程类型、状态、活动类型、收益来源等普通小图标 |
| 标题/入口图标 | `80×80px` | `80×80px` | 用于页面标题左侧、列表入口、小圆角底板图标 |
| 等级/徽记图标 | `96×96px` | `64×64px` / `72×72px` / `96×96px` | 用于大使等级、成长等级、功德分专属徽记 |
| 空状态/占位图标 | `160×160px` | `120×120px` / `160×160px` | 用于占位页、空页面、大图标提示态 |

### 2. 各组图标尺寸分配

| 分组 | 图标 | 设计母版尺寸 | 备注 |
|------|------|-------------|------|
| 课程类型映射 | `📚 🎓 🔄 🎤 💬` | `64×64px` | 小图标，统一按一套课程类母版出稿 |
| 大使等级映射 | `👤 🥚 🐦 🦅 🐦‍🔥` | `96×96px` | 等级体系建议整组统一设计 |
| 成长等级系统 | `🌱 🌿 🍀 🌳 🌟` | `96×96px` | 成长体系建议整组统一设计 |
| 页面标题/标签类 | `📅 💰 📋 🎯 👤 📖 🎁 💎 📊 📱 🏆 📢 ⚠️ 💸` | `80×80px` | 页面标题、入口、卡片头统一按标题图标规格 |
| 状态/信息类 | `✅ ❌ ⏰ ⏳ 📍 ⏱️ 🎧 📝` | `64×64px` | 成功/失败/时间/客服等功能性小图标 |
| 活动类型映射 | `👨‍🏫 🤝 🎉 ✨ 📋 🎤` | `64×64px` | 活动记录列表用小图标规格 |
| 收益图标组 | `💎 🎁 💰 👨‍🏫 🌟 🏆 🎯 ✨` | `64×64px` | 收益说明、规则说明内的小图标 |
| 功德分来源图标 | `⭐ 💎` | `64×64px` | 来源图标按小图标规格即可 |
| 订单退款状态图标 | `💰 ❌ 📋` | `64×64px` | 退款页状态图标 |
| 占位符页面 | `✅ 📖 📅 📋 🏆 📝` | `160×160px` | 空状态/占位页大图标 |
| 其他零散 | `⬆️ 🎨 🎬 💾 🏅 🌟` | `64×64px` | 普通功能入口与说明性图标 |

### 3. 去重后图标尺寸总表

| Emoji | 含义 | 设计尺寸 |
|------|------|---------|
| `🗺` | 概览/手册 | `80×80px` |
| `👥` | 用户/推荐列表 | `80×80px` |
| `📖` | 说明/课程简介 | `80×80px`；占位页版本 `160×160px` |
| `🔑` | 登录 | `80×80px` |
| `🏠` | 首页 | `80×80px` |
| `🛒` | 购课/订单 | `80×80px` |
| `📄` | 合同/文件 | `80×80px` |
| `📚` | 基础课程/我的课程 | `64×64px`；如做标题入口可同步导出 `80×80px` |
| `🎓` | 进阶课程 | `64×64px` |
| `🔄` | 复训课程/重复流程 | `64×64px` |
| `🎤` | 活动课程/演讲 | `64×64px` |
| `💬` | 沙龙/研讨/反馈 | `64×64px`；如做入口图标导出 `80×80px` |
| `👤` | 普通用户/个人信息 | `80×80px`；等级体系版本 `96×96px` |
| `🥚` | 蛋级 | `96×96px` |
| `🐦` | 雏鸟 | `96×96px` |
| `🦅` | 雄鹰 | `96×96px` |
| `🐦‍🔥` | 金凤 | `96×96px` |
| `🌱` | 种子 | `96×96px` |
| `🌿` | 幼苗 | `96×96px` |
| `🍀` | 三叶草 | `96×96px` |
| `🌳` | 大树 | `96×96px` |
| `🌟` | 星星/荣誉星级 | `96×96px`；小图标版本导出 `64×64px` |
| `📅` | 日期/预约 | `80×80px`；占位页版本 `160×160px` |
| `💰` | 金额/积分/退款金额 | `80×80px`；说明性小图标导出 `64×64px` |
| `📋` | 信息/清单/退款信息 | `80×80px`；小图标导出 `64×64px`；占位页版本 `160×160px` |
| `🎯` | 推荐人/目标 | `80×80px`；收益小图标导出 `64×64px` |
| `🎁` | 赠送/兑换/奖励 | `80×80px`；收益小图标导出 `64×64px` |
| `💎` | 功德分/奖励 | `96×96px` 母版；标题导出 `80×80px`；小图标导出 `64×64px` |
| `📊` | 统计 | `80×80px` |
| `📱` | 手机素材/二维码 | `80×80px` |
| `🏆` | 荣誉 | `80×80px`；收益小图标导出 `64×64px`；占位页版本 `160×160px` |
| `📢` | 公告 | `80×80px` |
| `⚠️` | 紧急公告/警告 | `80×80px`；状态小图标导出 `64×64px` |
| `💸` | 提现 | `80×80px` |
| `✅` | 成功/复训资格 | `64×64px`；占位页版本 `160×160px` |
| `❌` | 失败/驳回 | `64×64px` |
| `⏰` | 时间 | `64×64px` |
| `⏳` | 审核中 | `64×64px` |
| `📍` | 地点 | `64×64px` |
| `⏱️` | 时长 | `64×64px` |
| `🎧` | 客服 | `64×64px`；入口版可导出 `80×80px` |
| `📝` | 表单/反馈/申请 | `64×64px`；入口版 `80×80px`；占位页版本 `160×160px` |
| `👨‍🏫` | 教学 | `64×64px` |
| `🤝` | 合作 | `64×64px` |
| `🎉` | 活动 | `64×64px` |
| `✨` | 亮点 | `64×64px` |
| `⭐` | 星级奖励 | `64×64px` |
| `⬆️` | 升级 | `64×64px` |
| `🎨` | 海报/设计 | `64×64px` |
| `🎬` | 视频 | `64×64px` |
| `💾` | 保存 | `64×64px` |
| `🏅` | 奖牌 | `64×64px`；如并入荣誉体系可同步导出 `80×80px` |
| `🛍` | 商城兑换 | `80×80px` |
| `📜` | 协议 | `80×80px` |
| `🙌` | 志愿活动 | `80×80px` |
| `🏛` | 商学院介绍 | `80×80px` |
| `🖼` | 朋友圈素材 | `80×80px` |
| `👩‍🎓` | 学员案例 | `80×80px` |
| `🖥` | 后台/管理端 | `80×80px` |
| `🔗` | 推荐关系 | `80×80px` |
| `🚫` | 拉黑/禁止 | `64×64px` |

### 4. 交付给设计时的补充要求

- 所有图标统一出 `SVG`
- 同步导出透明底 `PNG`
- 小图标导出：`64×64px`
- 标题/入口图标导出：`80×80px`
- 等级/徽记图标导出：`96×96px`
- 占位页大图标导出：`160×160px`
- 同一图标如果有多场景复用，以**最大母版**为准设计，再缩放导出，不要分别重画
