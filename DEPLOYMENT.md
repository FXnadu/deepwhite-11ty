# 部署说明

## 概述

站点基于 Eleventy 构建，并在构建完成后通过自定义脚本写入 `_site/search-index.json`（供 `src/js/search.js` 使用）。`_site/` 目录由 `.gitignore` 忽略，因此部署时始终需要重新构建。

**重要**：部署时必须运行构建命令，否则搜索索引与静态资源都不会被生成。

## 构建命令

```bash
npm run build
```

这个命令会：
1. 运行 Eleventy 构建网站（`eleventy`）
2. 触发 `.eleventy.js` 中的 `eleventy.after` 钩子，写入 `_site/search-index.json`

## 不同部署平台的配置

### GitHub Pages

如果使用 GitHub Actions 自动部署，已创建 `.github/workflows/deploy.yml` 文件，会自动运行构建。

如果使用 GitHub Pages 的自动部署，需要在仓库设置中：
1. 进入 Settings → Pages
2. 在 "Build and deployment" 部分，选择 "GitHub Actions"
3. 确保 workflow 文件 `.github/workflows/deploy.yml` 存在

### Netlify

在 Netlify 控制台中设置：
- **Build command**: `npm run build`
- **Publish directory**: `_site`

或者在项目根目录创建 `netlify.toml`：
```toml
[build]
  command = "npm run build"
  publish = "_site"
```

### Vercel

在 Vercel 项目设置中：
- **Build Command**: `npm run build`
- **Output Directory**: `_site`

或者在项目根目录创建 `vercel.json`：
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "_site"
}
```

### 其他平台

确保在部署时：
1. 安装依赖：`npm install` 或 `npm ci`
2. 运行构建：`npm run build`
3. 部署 `_site/` 目录的内容

## 验证部署

部署后建议确认以下文件存在，以确保静态资源正确输出：
- `/.nojekyll`
- `/search-index.json`
