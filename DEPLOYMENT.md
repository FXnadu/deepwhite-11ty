# 部署说明

## 问题说明

Pagefind 搜索功能需要在构建时生成索引文件。这些文件位于 `_site/pagefind/` 目录中，但 `_site/` 目录被 `.gitignore` 忽略，不会被提交到仓库。

**重要**：部署时必须运行构建命令，否则搜索框会消失。

## 构建命令

```bash
npm run build
```

这个命令会：
1. 运行 Eleventy 构建网站（`eleventy`）
2. 运行 Pagefind 生成搜索索引（`npx pagefind --site _site`）

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

部署后，检查以下文件是否存在：
- `/pagefind/pagefind-ui.css`
- `/pagefind/pagefind-ui.js`
- `/pagefind/pagefind.js`

如果这些文件不存在，说明构建步骤没有正确执行。

