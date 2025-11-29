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
  - `src/css/style.css`、`src/css/archive.css`、`src/css/about.css` 等所有 CSS 文件
  - `src/js/site.js`、`src/js/post-page.js`、`src/js/archive-page.js`、`src/js/search.js`  
- 版本号管理集中在：`src/_data/assets.js` 中的 `ASSET_VERSION` 常量：  
  - 修改 CSS / JS 且希望线上立即生效时：**把 `ASSET_VERSION` 改成一个新的字符串（例如日期加序号：`20251126-2`）**。  
  - 该版本号会自动拼接到所有核心 CSS/JS 的 URL 上（`/css/style.css?v=...`），强制浏览器与 CDN 拉取最新资源。  
  - **重要**：所有通过 `extraCss` 配置的 CSS 文件也会**自动获得版本号**，无需手动处理。只需在页面配置中写 `extraCss: ["/css/your-page.css"]`，模板会自动添加版本号后缀。
- **Cursor 约定**：今后只要由 AI 修改上述 CSS/JS 文件，我会自动同步更新 `ASSET_VERSION`，无需你手动记忆这一步骤。  

## 目录结构说明

| 路径 | 用途 |
| --- | --- |
| `src/_includes/base.njk` | 全站基础骨架。通过 `extraCss`/`extraJs`/`layoutScripts` 注入额外资源，`showFloatingActions` 控制右下角按钮。 |
| `src/_includes/post.njk` | 文章详情布局。默认启用浮动操作和 `post-page.js`（TOC 逻辑）。 |
| `src/_includes/layouts/showcase.njk` | 纯净画布布局，供炫技页面使用，不包含常规导航/容器。 |
| `src/index.njk` | 首页，分页数据来源 `collections.featured`。把想展示的文章 front matter 中添加 `tags: ['post', 'featured']` 即可。 |
| `src/about.md` | 关于页面（直接使用 `base.njk`）。 |
| `src/archive.md` | 归档页，加载 `archive.css`、`search.js`、`archive-page.js`。依赖 `collections.postsByYear`。 |
| `src/content/pages/special-archive/` | 炫技特别归档。分页展示带 `tags: ['special-archive']` 的自定义页面，无需搜索脚本。 |
| `src/content/pages/showcase/` | 存放炫技页面的独立目录，每个页面可自定义布局但需自带 `tags: ['special-archive']` 才会出现在归档中。 |
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
- **额外脚本/样式**：任意页面 front matter 中设置 `extraCss` / `extraJs`（可为字符串或数组）即可注入。**注意**：所有 `extraCss` 中的 CSS 文件会自动获得版本号（从 `assets.js` 的 `ASSET_VERSION` 读取），无需手动添加版本号参数。

### 炫技特别归档使用说明

- 自定义页面（推荐放在 `src/content/pages/showcase/<slug>/index.njk`）想要加入“炫技归档”时，在 front matter 中添加 `tags: ['special-archive']` 并设置 `layout: "showcase.njk"` 以获得无导航的画布环境。  
- 可选字段：  
  - `specialSummary`：对页面的摘要描述。  
  - `specialTags`: `['CSS', 'WebGL']` 这类自由标签，展示在卡片底部。  
  - `specialLabel`：用于 meta 行的额外说明，如「Prototype」或版本号。  
  - `specialOrder`：数字。值越大越靠前，未设置时按页面日期倒序。  
- 这些页面不会出现在常规文章归档或搜索索引中（除非它们自行引用 `tags: ['post']`，默认建议不要如此设置）。

## 部署要点

1. 执行 `npm run build`。  
2. 将 `_site/` 上传到任意静态空间。  
3. 若有子路径部署需求，构建前设置 `BASE_URL=/your-sub-path/`。  
4. Cloudflare / Netlify / GitHub Pages / 自建 Apache 均可直接复用 `src` 目录下已准备好的配置文件。
 
## 无需 AI 也能安全维护的操作流程（强烈建议）

### 日常改动流程（样式 / 交互 / 文章）

1. **在 `src/` 修改文件**  
   - 文章：修改 `src/content/posts/*.md`。  
   - 页面结构：修改 `src/content/pages/**`。  
   - 布局：修改 `src/_includes/layouts/*.njk`。  
   - 样式：修改 `src/css/style.css`、`src/css/archive.css`。  
   - 前端脚本：修改 `src/js/site.js`、`src/js/post-page.js`、`src/js/archive-page.js`、`src/js/search.js`。
2. **如改动影响 UI 或交互 → 更新 `ASSET_VERSION`**  
   - 打开 `src/_data/assets.js`，找到：  
     - `const ASSET_VERSION = "..."`  
   - 把字符串改成一个新的值（可以用日期+序号，例如：`20251201-1`）。  
   - 这一步会让线上浏览器 **强制加载新的 CSS/JS**，避免看到旧缓存。
3. **本地构建并自检**  
   ```bash
   npm run build
   ```  
   - 构建结束后，至少检查：  
     - `_site/index.html`（首页）  
     - `_site/archive/index.html`（归档）  
     - `_site/about/index.html`（关于）  
     - 最近修改的文章对应的 `_site/posts/.../index.html`  
   - **归档搜索自检**：  
     - `_site/archive/index.html` 中是否存在 `<div id="search" class="archive-search">`。  
     - `_site/js/search.js` 文件是否存在。  
     - 构建日志中不要出现关于 `search.js` 的警告。
4. **提交并推送**  
   ```bash
   git add -A
   git commit -m "chore: update content/styles/scripts"
   git push
   ```  
   - 等远端（如 Cloudflare）完成构建和部署后，再用浏览器访问线上站点确认。

### 归档搜索功能稳定性要点

- 搜索功能依赖三部分：  
  1. **索引文件**：构建后生成 `_site/search-index.json`；  
  2. **前端脚本**：`src/js/search.js` → 构建为 `_site/js/search.js`；  
  3. **归档模板挂载点**：`src/content/pages/archive/index.njk` 里的 `<div id="search" class="archive-search"></div>`。
- 构建结束后，`.eleventy.js` 会自动：  
  - 重新写入 `_site/search-index.json`；  
  - 检查 `_site/js/search.js` 是否存在，如缺失会在构建日志打印警告。  
- 若线上发现“归档页没有搜索框/搜索无反应”，可以按下面顺序排查：  
  1. 在本地重新 `npm run build`，确认 `_site/js/search.js`、`_site/search-index.json` 都存在；  
  2. 确认 `src/_data/assets.js` 中 `ASSET_VERSION` 已更新，并重新构建 + 推送；  
  3. 在浏览器中访问线上 `/archive/`，查看源代码：  
     - 是否包含 `<script type="module" src="/js/search.js"...>`；  
     - 是否包含 `class="simple-search-form"`；  
  4. 如仍有问题，在 Cloudflare 后台执行一次 **Purge Cache**（按 URL 或全部清除），再刷新页面。

### 出问题时的“最小回滚”策略

- 若某次改动导致线上页面异常（但本地还能正常构建）：  
  1. 使用 `git log` 找到上一次稳定的提交；  
  2. 使用 `git revert <稳定提交之后的那几次提交>` 回滚问题改动；  
  3. 再次运行：  
     ```bash
     npm run build
     git push
     ```  
  4. 等部署完成后确认站点恢复正常，再慢慢重新引入需要的改动。

以上规则设计的目标是：**就算没有 AI 助手、也不看 `.cursorrules`，只要按照本文件操作，就能安全地更新样式、脚本和内容，并在出现问题时有明确的排查和回滚路径。**
