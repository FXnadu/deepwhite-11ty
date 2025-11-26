---
title: "Typography Lab 排版示例"
date: 2025-11-25
layout: "post.njk"
tags:
  - post
excerpt: "一页汇总所有 Markdown 元素，方便校验字体、字距与代码样式。"
---

> 这是一段“引言”式的开场，用来感受新的字距与行距设定。刻意保持 2-3 行，可以直观比较段落灰度。

## 中英混排 / Bilingual Sample

在中文段落中穿插英文句子时，`inline code` 与 **强调** 应该视觉上克制而清晰。  
<span lang="en">Precision is kindness, and typography is the most patient craft.</span>

### 更细一级的小标题

字级与分隔线保持节制，避免出现过于厚重的装饰。有时可以像这样使用 `mark` 来突出关键词：<mark>排版即逻辑</mark>。

#### H4 适合放置分组标签

H4 被全大写和更紧凑的字间距处理，可用来标识不同模块。

## 列表与混排

- 极简不是减少内容，而是减少噪音。
- 早晚各读 20 分钟，观察眼睛对字距变化的适应性。
- 使用 <kbd>⌘</kbd> + <kbd>K</kbd> 呼出命令面板，确保快捷键说明易读。

1. Ordered 列表用于流程描述。
2. 第二步可以混合 `code`、链接与 <span lang="en">English cue</span>。
3. 第三步验证数字序号与段落间距。

> “排版的意义在于让阅读这件事发生得更轻松。” —— 田英章

## 代码示例

内联代码 `const measure = "68ch";` 应与正文对齐，而多行代码块需要更清晰的背景与边界。

```js
const measure = "68ch";
const zhLeading = 1.65;
const latinLeading = 1.7;

function applyRhythm(language) {
  return language === "zh" ? zhLeading : latinLeading;
}
```

```bash
npm run build
```

## 表格

| Pattern            | Purpose               | Notes |
| ------------------ | --------------------- | ----- |
| 68ch measure       | 控制阅读宽度          | 与容器宽度互补 |
| 1.65 line-height   | 中文舒适节奏          | 英文可略高 |
| Monospace unifying | 代码与系统提示一致性 | `JetBrains Mono` 首选 |

## 额外元素

`<kbd>`、`<mark>`、`<code>` 等元素已经统一处理，也可以使用分隔线来断开大段内容：

---

术语列表示例：

Typography
: 研究字形、字号、字距的艺术与科学。

Micro-typography
: 关注连字、标点悬挂、对齐精度等细节的领域。
