# Design Tokens 提取计划

## 第一步：颜色系统
```bash
grep "color:" prototype-tdesign/styles/tdesign-theme.css > tokens-color.txt
```

提取内容：
- 品牌色（primary、secondary）
- 功能色（success、warning、error、info）
- 中性色（gray scale）
- 背景色（page、container、hover、active）
- 文本色（primary、secondary、placeholder、disabled）

## 第二步：间距系统
```bash
grep "padding\|margin" prototype-tdesign/styles/tdesign-theme.css > tokens-spacing.txt
```

提取内容：
- xs: 8rpx
- s: 16rpx
- m: 24rpx
- l: 32rpx
- xl: 48rpx

## 第三步：圆角系统
```bash
grep "radius" prototype-tdesign/styles/tdesign-theme.css > tokens-radius.txt
```

提取内容：
- small: 6rpx
- default: 12rpx
- large: 24rpx
- round: 999rpx
- circle: 50%

## 第四步：阴影系统
```bash
grep "shadow" prototype-tdesign/styles/tdesign-theme.css > tokens-shadow.txt
```

## 第五步：字体系统
```bash
grep "font" prototype-tdesign/styles/tdesign-theme.css > tokens-typography.txt
```

## 输出文件结构
```
/src/design-tokens/
├── colors.json
├── spacing.json
├── radius.json
├── shadows.json
├── typography.json
└── index.ts          // 统一导出
```











