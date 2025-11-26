# Deepwhite 11ty 主题使用手册

## 安装与构建

1. 安装依赖：`npm install`
2. 本地预览：`npm run start`（默认监听 `http://localhost:8080`）
3. 构建产物：`npm run build`，输出到 `_site/`

## 核心配置

- `.eleventy.js`  
  - 统一复制 `src/img`, `src/css`, `src/js` 以及 `_headers`、`_redirects`、`.htaccess`、`.nojekyll` 到输出目录。  
  - 过滤器：`toArray`（容错处理单值/数组）、`readableDate`、`isoDate`。  
  - 集合：`postsByYear`（归档页）、`featured`（首页推荐）、`allPostsForSearch`（客户端搜索）。  
  - `eleventy.after` 钩子在构建完成后写入 `_site/search-index.json`，供 `src/js/search.js` 使用。  
  - `pathPrefix` 读取 `BASE_URL`，可直接部署到子路径。

- `package.json`  
  - 仅保留 `@11ty/eleventy`, `gray-matter`, `luxon` 三个运行依赖。  
  - `start` = 热更新开发服务器，`build` = 纯静态导出。

## 静态资源版本与缓存（Cursor 规则重点）

- 站点通过 Cloudflare 等 CDN 对 `css` / `js` 采用了 `max-age=31536000, immutable` 的**强缓存策略**，同一 URL 的文件理论上会被缓存一年。  
- 为了保证「本地预览效果」与「线上 deepwhite.me」始终一致，**凡是对下列文件做了会影响 UI 或交互的改动时，必须同步更新版本号**：  
  - `src/css/style.css`、`src/css/archive.css`  
  - `src/js/site.js`、`src/js/post-page.js`、`src/js/archive-page.js`、`src/js/search.js`  
- 版本号管理集中在：`src/_data/assets.js` 中的 `ASSET_VERSION` 常量：  
  - 修改 CSS / JS 且希望线上立即生效时：**把 `ASSET_VERSION` 改成一个新的字符串（例如日期加序号：`20251126-2`）**。  
  - 该版本号会自动拼接到所有核心 CSS/JS 的 URL 上（`/css/style.css?v=...`），强制浏览器与 CDN 拉取最新资源。  
- **Cursor 约定**：今后只要由 AI 修改上述 CSS/JS 文件，我会自动同步更新 `ASSET_VERSION`，无需你手动记忆这一步骤。  

## 目录结构说明

| 路径 | 用途 |
| --- | --- |
| `src/_includes/base.njk` | 全站基础骨架。通过 `extraCss`/`extraJs`/`layoutScripts` 注入额外资源，`showFloatingActions` 控制右下角按钮。 |
| `src/_includes/post.njk` | 文章详情布局。默认启用浮动操作和 `post-page.js`（TOC 逻辑）。 |
| `src/index.njk` | 首页，分页数据来源 `collections.featured`。把想展示的文章 front matter 中添加 `tags: ['post', 'featured']` 即可。 |
| `src/about.md` | 关于页面（直接使用 `base.njk`）。 |
| `src/archive.md` | 归档页，加载 `archive.css`、`search.js`、`archive-page.js`。依赖 `collections.postsByYear`。 |
| `src/posts/`、`src/*.md` | Markdown 文章。front matter 需包含 `layout: "post.njk"`、`title`、`date`、`tags: ['post']`。`excerpt` 将进入首页与搜索索引。 |
| `src/css/style.css` | 全局样式。 |
| `src/css/archive.css` | 归档页和搜索组件样式。 |
| `src/js/site.js` | 站点级脚本：Mermaid 懒加载、浮动按钮。 |
| `src/js/post-page.js` | 文章页目录生成与高亮。 |
| `src/js/archive-page.js` | 归档页年份导航、滚动联动。 |
| `src/js/search.js` | 纯前端搜索，按需加载 `_site/search-index.json`。 |
| `src/_headers`, `_redirects`, `.htaccess`, `.nojekyll` | 直接复制到输出目录的部署配置（分别适配 Cloudflare Pages、Netlify、Apache、GitHub Pages）。 |

## 内容编辑建议

- **日期与标签**：所有文章的 front matter 至少包含 `date`（ISO 字符串即可）和 `tags: ['post']`。若需要进首页推荐，再追加 `featured` 标签。  
- **摘要**：`excerpt` 字段将用于首页与搜索结果；如缺省，将自动截取正文前 200 个字符。  
- **资源引用**：图片请放在 `src/img/`，构建时自动拷贝。  
- **额外脚本/样式**：任意页面 front matter 中设置 `extraCss` / `extraJs`（可为字符串或数组）即可注入。

## 部署要点

1. 执行 `npm run build`。  
2. 将 `_site/` 上传到任意静态空间。  
3. 若有子路径部署需求，构建前设置 `BASE_URL=/your-sub-path/`。  
4. Cloudflare / Netlify / GitHub Pages / 自建 Apache 均可直接复用 `src` 目录下已准备好的配置文件。


