# 设计系统构建完整流程

## 项目目标

从原型图项目中抽取可复用组件，构建统一的设计系统，实现 DRY 原则。

---

## 阶段 0：项目分析（1天）

### 输入
- `prototype-tdesign/` 原型图项目

### 输出
- `docs/analysis.md` - 分析报告
- `docs/component-list.md` - 组件清单

### 执行步骤

```bash
# 1. 列出所有页面
find prototype-tdesign/pages -name "*.html" > page-list.txt

# 2. 统计重复样式
grep -r "#0052D9" prototype-tdesign/ | wc -l
grep -r "border-radius" prototype-tdesign/ | wc -l

# 3. 识别组件模式
# 在每个页面中标记：
# - 哪些区块重复出现？
# - 哪些样式多次使用？
# - 哪些交互模式相似？
```

**分析维度**：
- ✅ 视觉重复：相同的卡片、按钮、表单
- ✅ 样式重复：相同的颜色、间距、圆角
- ✅ 结构重复：相同的布局模式
- ✅ 交互重复：相同的点击、悬停效果

---

## 阶段 1：Design Tokens 提取（2天）

### 1.1 颜色系统

```bash
# 提取所有颜色值
grep -h "color:" prototype-tdesign/styles/tdesign-theme.css | sort | uniq
```

**创建文件**：`src/design-tokens/colors.json`

```json
{
  "brand": {
    "primary": "#0052D9",
    "primary-light": "#266FE8"
  },
  "functional": {
    "success": "#00A870",
    "error": "#E34D59"
  }
}
```

### 1.2 间距系统

**创建文件**：`src/design-tokens/spacing.json`

### 1.3 圆角系统

**创建文件**：`src/design-tokens/radius.json`

### 1.4 生成 SCSS 变量

```typescript
// scripts/generate-scss-tokens.ts
import tokens from '../src/design-tokens'

const scss = Object.entries(tokens.colors.brand)
  .map(([key, value]) => `$color-${key}: ${value};`)
  .join('\n')

fs.writeFileSync('src/styles/tokens.scss', scss)
```

**输出**：`src/styles/tokens.scss`
```scss
$color-primary: #0052D9;
$color-primary-light: #266FE8;
$spacing-s: 16rpx;
$radius-default: 12rpx;
```

---

## 阶段 2：组件抽取（3天）

### 2.1 组件优先级

| 优先级 | 组件 | 理由 |
|--------|------|------|
| P0 | Button, Card, Input | 最常用，影响面大 |
| P1 | Badge, Tag, Avatar | 次常用 |
| P2 | Progress, Divider | 特定场景 |

### 2.2 组件抽取流程（针对每个组件）

#### 步骤 1：查看原型图代码
```bash
# 以 Button 为例
cat prototype-tdesign/components/button.css
```

#### 步骤 2：创建组件目录
```bash
mkdir -p src/components/ui/Button
touch src/components/ui/Button/index.vue
touch src/components/ui/Button/types.ts
touch src/components/ui/Button/README.md
```

#### 步骤 3：编写组件（使用 Design Tokens）

**`src/components/ui/Button/index.vue`**：
```vue
<template>
  <button class="ui-button" :class="buttonClass">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonProps } from './types'

const props = withDefaults(defineProps<ButtonProps>(), {
  theme: 'primary',
  size: 'medium'
})

const buttonClass = computed(() => ({
  [`ui-button--${props.theme}`]: true,
  [`ui-button--${props.size}`]: true
}))
</script>

<style lang="scss" scoped>
@import '@/styles/tokens.scss';

.ui-button {
  // ✅ 使用 Design Tokens，不要硬编码！
  background-color: $color-primary;
  padding: $spacing-s $spacing-m;
  border-radius: $radius-default;
  
  &--primary {
    background-color: $color-primary;
  }
  
  &--success {
    background-color: $color-success;
  }
}
</style>
```

#### 步骤 4：编写类型定义

**`src/components/ui/Button/types.ts`**：
```typescript
export type ButtonTheme = 'primary' | 'success' | 'warning' | 'error'
export type ButtonSize = 'small' | 'medium' | 'large'

export interface ButtonProps {
  theme?: ButtonTheme
  size?: ButtonSize
  disabled?: boolean
}
```

#### 步骤 5：编写组件文档

**`src/components/ui/Button/README.md`**：
```markdown
# Button 按钮

## 何时使用
- 标记一个（或封装一组）操作命令，响应用户点击行为，触发相应的业务逻辑

## API

### Props
| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| theme | 主题 | 'primary' \| 'success' \| 'warning' \| 'error' | 'primary' |
| size | 尺寸 | 'small' \| 'medium' \| 'large' | 'medium' |
| disabled | 是否禁用 | boolean | false |

## 示例

### 基础用法
\`\`\`vue
<Button theme="primary">主要按钮</Button>
\`\`\`

### 不同尺寸
\`\`\`vue
<Button size="small">小按钮</Button>
<Button size="medium">中按钮</Button>
<Button size="large">大按钮</Button>
\`\`\`
```

#### 步骤 6：添加到索引文件

**`src/components/ui/index.ts`**：
```typescript
export { default as Button } from './Button/index.vue'
export { default as Card } from './Card/index.vue'
// ...其他组件
```

### 2.3 DRY 检查清单

每完成一个组件，检查：
- [ ] 是否使用了 Design Tokens？（不能硬编码颜色/间距）
- [ ] 是否有重复的样式片段？
- [ ] 是否可以提取为更小的子组件？
- [ ] 是否符合命名规范？

---

## 阶段 3：Playground 构建（1天）

### 3.1 创建预览页面

**`playground/index.html`**：
```html
<!DOCTYPE html>
<html>
<head>
  <title>设计系统 - 组件预览</title>
  <link rel="stylesheet" href="../src/styles/tokens.scss">
</head>
<body>
  <h1>天道文化设计系统</h1>
  
  <!-- 设计令牌展示 -->
  <section id="design-tokens">
    <h2>Design Tokens</h2>
    
    <h3>颜色</h3>
    <div class="token-grid">
      <div class="token-item">
        <div class="color-swatch" style="background: #0052D9"></div>
        <p>Primary<br>#0052D9</p>
      </div>
      <div class="token-item">
        <div class="color-swatch" style="background: #00A870"></div>
        <p>Success<br>#00A870</p>
      </div>
    </div>
    
    <h3>间距</h3>
    <div class="spacing-demo">
      <div style="width: 16rpx; height: 40rpx; background: #0052D9"></div>
      <p>16rpx (spacing-s)</p>
    </div>
  </section>
  
  <!-- 组件展示 -->
  <section id="button">
    <h2>Button 按钮</h2>
    
    <h3>不同主题</h3>
    <button class="ui-button ui-button--primary">Primary</button>
    <button class="ui-button ui-button--success">Success</button>
    <button class="ui-button ui-button--warning">Warning</button>
    <button class="ui-button ui-button--error">Error</button>
    
    <h3>不同尺寸</h3>
    <button class="ui-button ui-button--small">Small</button>
    <button class="ui-button ui-button--medium">Medium</button>
    <button class="ui-button ui-button--large">Large</button>
    
    <h3>禁用状态</h3>
    <button class="ui-button ui-button--primary" disabled>Disabled</button>
  </section>
  
  <section id="card">
    <h2>Card 卡片</h2>
    <div class="ui-card">
      <div class="ui-card__header">标题</div>
      <div class="ui-card__body">内容</div>
    </div>
  </section>
  
  <!-- ...其他所有组件 -->
</body>
</html>
```

### 3.2 自动化生成 Playground

**`scripts/generate-playground.ts`**：
```typescript
import fs from 'fs'
import path from 'path'

// 扫描 src/components/ui/ 目录
const components = fs.readdirSync('src/components/ui')

let html = '<html><body><h1>组件库</h1>'

components.forEach(comp => {
  const readme = fs.readFileSync(`src/components/ui/${comp}/README.md`, 'utf-8')
  // 解析 README 中的示例代码
  const examples = extractExamples(readme)
  
  html += `<section id="${comp.toLowerCase()}">
    <h2>${comp}</h2>
    ${examples.join('\n')}
  </section>`
})

html += '</body></html>'
fs.writeFileSync('playground/index.html', html)
```

---

## 阶段 4：组件规范文档（1天）

### 4.1 创建规范文档

**`docs/component-guidelines.md`**：
```markdown
# 组件开发规范

## 命名规范
- 组件名：大驼峰 (PascalCase)，如 `Button`、`UserCard`
- 文件名：index.vue
- 样式类名：BEM 命名，如 `.ui-button__text`

## 目录结构
\`\`\`
components/ui/
└── ComponentName/
    ├── index.vue          # 组件主文件
    ├── types.ts           # TypeScript 类型
    ├── README.md          # 组件文档
    └── __tests__/         # 单元测试（可选）
        └── index.test.ts
\`\`\`

## Props 设计原则
1. 使用 TypeScript 类型约束
2. 提供合理的默认值
3. 遵循 Vue 官方命名规范（小驼峰）

## 样式约定
1. 必须使用 Design Tokens
2. 禁止硬编码颜色、间距
3. 使用 scoped 样式
4. 类名前缀统一为 `ui-`

## 示例
\`\`\`vue
<template>
  <div class="ui-card">...</div>
</template>

<style lang="scss" scoped>
@import '@/styles/tokens.scss';

.ui-card {
  background: $color-white;  // ✅ 使用 token
  padding: $spacing-m;       // ✅ 使用 token
  border-radius: $radius-default; // ✅ 使用 token
  
  // ❌ 不要这样写：
  // background: #FFFFFF;
  // padding: 24rpx;
}
</style>
\`\`\`
```

---

## 阶段 5：验收与优化（1天）

### 5.1 验收检查清单

#### Design Tokens
- [ ] 所有颜色都已提取为 token
- [ ] 所有间距都已提取为 token
- [ ] 所有圆角都已提取为 token
- [ ] 没有硬编码的设计值

#### 组件库
- [ ] 所有组件在 `/components/ui/` 下
- [ ] 每个组件有独立文件夹
- [ ] 每个组件有类型定义
- [ ] 每个组件有文档

#### DRY 原则
- [ ] 没有重复的样式片段
- [ ] 没有重复的组件逻辑
- [ ] 公共样式已提取

#### Playground
- [ ] 所有组件都可预览
- [ ] 所有变体都已展示
- [ ] Design Tokens 可视化展示

### 5.2 性能优化
- [ ] 按需导入组件
- [ ] CSS 体积优化
- [ ] 未使用的样式清理

---

## 最终目录结构

```
universal-cloudbase-uniapp-template/
├── src/
│   ├── design-tokens/           # 设计令牌
│   │   ├── colors.json
│   │   ├── spacing.json
│   │   ├── radius.json
│   │   └── index.ts
│   ├── components/
│   │   └── ui/                  # UI 组件库
│   │       ├── Button/
│   │       │   ├── index.vue
│   │       │   ├── types.ts
│   │       │   └── README.md
│   │       ├── Card/
│   │       ├── Input/
│   │       └── index.ts         # 统一导出
│   └── styles/
│       ├── tokens.scss          # 从 design-tokens 生成
│       └── common.scss
├── playground/                  # 组件预览
│   └── index.html
├── docs/                        # 文档
│   ├── analysis.md
│   ├── component-guidelines.md
│   └── design-tokens.md
└── scripts/                     # 脚本
    ├── generate-tokens.ts
    └── generate-playground.ts
```

---

## 工作量预估

| 阶段 | 工作内容 | 预计时间 |
|------|---------|---------|
| 0 | 项目分析 | 1天 |
| 1 | Design Tokens | 2天 |
| 2 | 组件抽取（10个） | 3天 |
| 3 | Playground | 1天 |
| 4 | 规范文档 | 1天 |
| 5 | 验收优化 | 1天 |
| **总计** | | **9天** |

---

## 关键成功因素

1. **严格使用 Design Tokens**：所有样式值必须来自 tokens
2. **完整的文档**：每个组件都有清晰的使用文档
3. **可视化预览**：Playground 必须包含所有组件
4. **持续维护**：设计系统是活的，需要不断迭代











