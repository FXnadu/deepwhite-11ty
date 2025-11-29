# 页面进场动画使用指南

## 概述

"Special DeepWhite" 粒子进场动画是一个可复用的模板效果，可以在任何页面上通过简单的标记启用。

## 使用方法

### 方法 1：使用 `entryAnimation` 字段（推荐）

在任何页面的 front matter 中添加 `entryAnimation: true` 即可启用动画：

```yaml
---
title: "我的页面"
layout: "base.njk"
entryAnimation: true
---
```

或者使用 `showcase.njk` 布局：

```yaml
---
title: "我的展示页面"
layout: "showcase.njk"
entryAnimation: true
---
```

### 方法 2：使用 `special-archive` 标签（向后兼容）

如果页面有 `tags: ['special-archive']` 标签，也会自动启用动画：

```yaml
---
title: "特殊归档页面"
layout: "showcase.njk"
tags:
  - special-archive
---
```

## 动画效果

启用后，页面加载时会自动播放以下动画：

1. **粒子汇聚阶段**（0-1.2秒）：粒子从屏幕四周飞入，汇聚成 "Special DeepWhite" 文字
2. **展示阶段**（1.2-2.5秒）：文字保持显示
3. **爆炸阶段**（2.5秒后）：粒子炸开并消失，页面内容优雅浮现

动画会自动检测页面背景色：
- **深色背景**：使用白色粒子
- **浅色背景**：使用黑色粒子

## 技术细节

- **CSS 文件**：`/css/special-archive-entry.css`
- **JS 文件**：`/js/special-archive-entry.js`
- **自动加载**：布局文件会自动检测并加载所需资源
- **版本控制**：资源文件会自动附加版本号，确保缓存更新

## 示例

### 示例 1：普通页面启用动画

```yaml
---
title: "关于我"
layout: "base.njk"
entryAnimation: true
---
```

### 示例 2：展示页面启用动画

```yaml
---
title: "我的作品"
layout: "showcase.njk"
bodyClass: "custom-body"
entryAnimation: true
---
```

### 示例 3：特殊归档页面（自动启用）

```yaml
---
title: "实验性页面"
layout: "showcase.njk"
tags:
  - special-archive
specialSummary: "这是一个实验性页面"
---
```

## 注意事项

1. 动画会在页面首次加载时播放，刷新页面会重新播放
2. 动画期间页面滚动会被禁用，动画结束后自动恢复
3. 确保页面内容被包裹在布局的 `<main>` 或相应容器中，动画才能正确应用
4. 如果页面有自定义背景色，动画会自动适配粒子颜色

## 禁用动画

如果页面有 `special-archive` 标签但不想显示动画，可以显式设置：

```yaml
---
title: "特殊页面"
layout: "base.njk"
tags:
  - special-archive
entryAnimation: false
---
```

