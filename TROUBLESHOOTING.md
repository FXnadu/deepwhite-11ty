# 问题排查文档

本文档记录项目中遇到的重要问题及其解决方案，供后续参考。

## Special Archive 页面无法访问问题（2025-11-27）

### 问题描述

1. **症状**：
   - 点击品牌链接 "Deepwhite" 无法跳转到 `/special-archive/` 页面，返回 404
   - 手动输入 `https://deepwhite.me/special-archive/` 可以访问，但页面列表为空
   - 列表中的页面（如 `/showcase/glitch-neon/`）只能通过手动输入 URL 访问

2. **环境差异**：
   - 本地开发环境：页面正常显示，列表正常渲染
   - 远程部署环境：页面无法访问或列表为空

### 根本原因分析

#### 原因 1：Eleventy 分页机制的限制
- **核心问题**：Eleventy 的分页功能在数据源为空数组时，**不会生成任何页面**
- **触发条件**：当 `collections.specialArchivePages` 集合为空时，即使模板存在，Eleventy 也不会生成 `/special-archive/index.html`
- **为什么本地正常**：本地可能已有带 `tags: ['special-archive']` 的页面文件，集合不为空

#### 原因 2：集合过滤条件过于严格
- **原始代码**：使用 `inputPath.includes(\`${path.sep}content${path.sep}pages${path.sep}\`)` 来过滤页面
- **问题**：不同操作系统和构建环境的路径分隔符（`/` vs `\`）和路径格式可能不一致
- **结果**：远程构建时过滤条件匹配失败，集合被判定为空

#### 原因 3：占位符结构不完整
- **问题**：占位符对象缺少 Eleventy 分页所需的必要属性（`url`、`date`、`inputPath` 等）
- **影响**：即使添加了占位符，分页机制仍可能因为结构不完整而失败

#### 原因 4：分页配置位置不一致
- **问题**：`special-archive` 的分页配置在 `index.njk` 的 front matter 中，而其他页面（`home`、`archive`）都在 `.11tydata.js` 中
- **影响**：配置分散可能导致数据传递和计算时机问题

### 解决方案

#### 步骤 1：简化集合过滤逻辑
**文件**：`.eleventy.js`

**修改前**：
```javascript
eleventyConfig.addCollection("specialArchivePages", (collectionApi) =>
  collectionApi
    .getAll()
    .filter((item) => {
      const tags = item.data?.tags || [];
      return (
        isContentPage(item.inputPath || "") &&  // 路径检查可能失败
        tags.includes(SPECIAL_ARCHIVE_TAG)
      );
    })
    .sort((a, b) => resolveSpecialOrder(b) - resolveSpecialOrder(a))
);
```

**修改后**：
```javascript
const isSpecialArchiveEntry = (item = {}) => {
  const tags = item.data?.tags;
  return Array.isArray(tags) && tags.includes(SPECIAL_ARCHIVE_TAG);
};

eleventyConfig.addCollection("specialArchivePages", (collectionApi) =>
  (() => {
    const entries = collectionApi
      .getAll()
      .filter(isSpecialArchiveEntry)  // 只检查 tags，不依赖路径
      .sort((a, b) => resolveSpecialOrder(b) - resolveSpecialOrder(a));

    return entries.length ? entries : [createSpecialArchivePlaceholder()];
  })()
);
```

**关键改进**：
- 移除了对 `inputPath` 的路径检查，只依赖 `tags` 数组
- 确保集合永远不为空（至少包含一个占位符）

#### 步骤 2：完善占位符结构
**文件**：`.eleventy.js`

**修改前**：
```javascript
const createSpecialArchivePlaceholder = () => ({
  data: {
    __specialArchivePlaceholder: true,
  },
});
```

**修改后**：
```javascript
const createSpecialArchivePlaceholder = () => {
  const placeholderDate = new Date();
  return {
    url: "/special-archive/placeholder/",
    date: placeholderDate,
    inputPath: "src/content/pages/special-archive/.placeholder",
    fileSlug: "placeholder",
    data: {
      __specialArchivePlaceholder: true,
      title: "Placeholder",
    },
  };
};
```

**关键改进**：
- 添加了 `url`、`date`、`inputPath`、`fileSlug` 等 Eleventy 分页所需的属性
- 确保占位符对象结构完整，能被分页机制正确处理

#### 步骤 3：将分页配置移至 .11tydata.js
**文件**：`src/content/pages/special-archive/special-archive.11tydata.js`

**修改前**（在 `index.njk` 的 front matter 中）：
```njk
---
pagination:
  data: collections.specialArchivePages
  size: 6
---
```

**修改后**（在 `.11tydata.js` 中）：
```javascript
module.exports = {
  // ... 其他配置
  pagination: {
    data: "collections.specialArchivePages",
    size: 6,
    alias: "pageEntries",
  },
  eleventyComputed: {
    permalink: (data) => paginateUrl(data.pagination?.pageNumber || 0),
    hasSpecialEntries: (data) => {
      const entries = data.pageEntries || data.pagination?.items || [];
      return Array.isArray(entries) && entries.some(
        (entry) => entry && !entry.data?.__specialArchivePlaceholder
      );
    },
  },
};
```

**关键改进**：
- 与其他页面（`home`、`archive`）保持一致的分页配置方式
- 使用 `alias` 提供更清晰的数据访问路径
- 更新 `hasSpecialEntries` 计算逻辑，正确检测真实条目

#### 步骤 4：更新模板以过滤占位符
**文件**：`src/content/pages/special-archive/index.njk`

**关键修改**：
```njk
{%- for entry in entries -%}
{%- if not entry.data.__specialArchivePlaceholder -%}
  {# 渲染卡片 #}
{%- endif -%}
{%- endfor -%}
```

**作用**：确保占位符不会在页面上显示，只用于保证分页生成

### 验证步骤

1. **本地验证**：
   ```bash
   npm run build
   ls -la _site/special-archive/
   # 应该能看到 index.html 文件
   ```

2. **检查生成的 HTML**：
   ```bash
   grep -A 3 "special-archive-list" _site/special-archive/index.html
   # 应该能看到列表内容或"还没有特殊页面"的提示
   ```

3. **远程验证**：
   - 推送代码到远程仓库
   - 等待构建完成
   - 访问 `/special-archive/` 页面，确认可以正常访问

### 预防措施

1. **新增特殊归档页面时**：
   - 确保 front matter 中包含 `tags: ['special-archive']`
   - 不需要关心文件路径，只要 tags 正确即可
   - 提交代码时，确保所有相关文件都已提交到 Git

2. **部署前检查**：
   - 运行 `npm run build` 确保构建成功
   - 检查 `_site/special-archive/index.html` 是否存在
   - 验证集合不为空（至少有一个占位符）

3. **集合设计原则**：
   - 避免依赖文件路径进行过滤（路径格式可能因环境而异）
   - 优先使用 front matter 中的 `tags` 或 `data` 字段
   - 对于分页依赖的集合，考虑添加占位符机制，确保集合永远不为空

### 相关文件

- `.eleventy.js` - 集合定义和占位符创建
- `src/content/pages/special-archive/special-archive.11tydata.js` - 分页配置
- `src/content/pages/special-archive/index.njk` - 页面模板
- `src/content/pages/showcase/*/index.njk` - 特殊归档的源页面（需包含 `tags: ['special-archive']`）

### 相关提交

- `7276a18` - 新增特殊归档页面模板
- `dc89871` - 补全 special-archive 来源页面
- `0fe6ef7` - 保证 special-archive 永远产出页面
- `33c4e37` - 修复 special-archive 集合过滤条件
- `06de66d` - 修复 special-archive 分页配置：移至 .11tydata.js 并完善占位符结构

---

## 品牌链接显示问题（2025-11-27）

### 问题描述

在特殊归档页面，品牌链接 "Deepwhite" 应该显示为全大写 "DEEPWHITE"，但实际显示仍为小写。

### 根本原因

CSS 中的 `.site-title` 类设置了 `text-transform: lowercase;`，会将所有文本转换为小写，即使 HTML 中是 "DEEPWHITE" 也会显示为 "deepwhite"。

### 解决方案

1. **在模板中添加条件类**：
   **文件**：`src/_includes/layouts/base.njk`
   ```njk
   <h1 class="site-title{% if isSpecialArchivePage %} site-title-uppercase{% endif %}">
   ```

2. **添加 CSS 覆盖规则**：
   **文件**：`src/css/style.css`
   ```css
   .site-title-uppercase {
       text-transform: uppercase;
   }
   ```

3. **更新资源版本号**：
   **文件**：`src/_data/assets.js`
   - 将 `ASSET_VERSION` 更新为新版本（如 `20251127-17`）

### 相关提交

- `8195f32` - 特殊归档页面品牌链接显示全大写 DEEPWHITE
- `2f14ea3` - 修复特殊归档页面品牌链接全大写显示：添加 CSS 覆盖 lowercase 样式

---

## 通用排查建议

### 当页面无法访问时

1. **检查集合是否为空**：
   - 查看 `.eleventy.js` 中的集合定义
   - 确认集合过滤条件是否过于严格
   - 考虑添加占位符机制

2. **检查分页配置**：
   - 确认分页数据源是否正确
   - 检查 `permalink` 计算是否正确
   - 验证分页配置位置（建议统一在 `.11tydata.js` 中）

3. **验证构建输出**：
   - 运行 `npm run build`
   - 检查 `_site/` 目录中是否存在目标文件
   - 查看构建日志是否有错误

4. **环境差异排查**：
   - 对比本地和远程的构建环境
   - 检查路径分隔符、文件系统差异
   - 确认所有依赖文件都已提交到 Git

### 当样式不生效时

1. **检查 CSS 优先级**：
   - 查看是否有其他样式覆盖
   - 确认 `text-transform`、`!important` 等属性

2. **检查资源版本号**：
   - 确认 `ASSET_VERSION` 已更新
   - **注意**：所有通过 `extraCss` 配置的 CSS 文件会自动获得版本号，无需手动添加。只需更新 `ASSET_VERSION`，所有 CSS 文件（包括 `extraCss` 中的）都会同步更新。
   - 清除浏览器缓存或使用硬刷新

3. **验证内联 CSS**：
   - 检查 `criticalCssInline` 是否包含相关样式
   - 确认主 CSS 文件是否正确加载

---

## GitHub Pages 部署不生效问题（2025-12-05）

### 问题描述

**症状**：
- 代码已提交并推送到 `main` 分支
- GitHub Actions 显示运行成功（绿色 ✓）
- 但线上网站没有更新，`gh-pages` 分支没有更新
- 浏览器强制刷新后仍然看到旧内容

### 根本原因分析

#### 原因 1：GitHub Pages 部署方式混用
- **问题**：GitHub Pages 有两种部署方式，如果混用会导致部署失败：
  1. **旧方式**：使用 `gh-pages` 分支 + `peaceiris/actions-gh-pages@v3`
  2. **新方式**：使用 GitHub Pages Actions (`actions/deploy-pages@v4`) + `actions/upload-pages-artifact@v3`
- **触发条件**：如果 workflow 使用新方式，但 GitHub Pages 设置指向了 `gh-pages` 分支，部署会失败
- **为什么 Actions 显示成功**：构建步骤成功了，但部署步骤可能因为配置不匹配而静默失败

#### 原因 2：GitHub Pages 设置与 Workflow 不匹配
- **问题**：GitHub Pages 的 Source 设置必须与 workflow 的部署方式匹配
- **检查位置**：`https://github.com/用户名/仓库名/settings/pages`
- **正确配置**：
  - 如果使用 `peaceiris/actions-gh-pages`：Source 选择 "Deploy from a branch"，Branch 选择 `gh-pages`
  - 如果使用 `actions/deploy-pages`：Source 选择 "GitHub Actions"

#### 原因 3：权限问题
- **问题**：`GITHUB_TOKEN` 可能没有足够的权限写入 `gh-pages` 分支
- **解决方案**：确保 workflow 中有正确的 permissions：
  ```yaml
  permissions:
    contents: write
    pages: write
    id-token: write
  ```

#### 原因 4：浏览器/CDN 缓存
- **问题**：即使部署成功，浏览器或 CDN 可能缓存了旧文件
- **解决方案**：
  1. 更新 `ASSET_VERSION`（在 `src/_data/assets.js` 中）
  2. 强制刷新浏览器（`Cmd+Shift+R` 或 `Ctrl+Shift+R`）
  3. 等待 CDN 缓存过期（通常几分钟到几小时）

### 解决方案

#### 步骤 1：确认 GitHub Pages 设置
1. 访问：`https://github.com/FXnadu/deepwhite-11ty/settings/pages`
2. 检查 "Build and deployment" 部分：
   - 如果使用 `peaceiris/actions-gh-pages`：选择 "Deploy from a branch"，Branch 选择 `gh-pages`，目录选择 `/ (root)`
   - 如果使用 `actions/deploy-pages`：选择 "GitHub Actions"

#### 步骤 2：验证 Workflow 配置
- 确保 workflow 文件 `.github/workflows/deploy.yml` 中的部署方式与 GitHub Pages 设置匹配
- 当前推荐使用 `peaceiris/actions-gh-pages@v3`（更稳定可靠）

#### 步骤 3：检查部署日志
1. 访问：`https://github.com/FXnadu/deepwhite-11ty/actions`
2. 点击最新的 workflow 运行
3. 展开 "Deploy to GitHub Pages" 步骤
4. 查看是否有错误信息（即使整体显示成功）

#### 步骤 4：验证部署结果
```bash
# 检查 gh-pages 分支是否更新
git fetch origin gh-pages
git log --oneline origin/gh-pages -5

# 检查部署的文件内容
git show origin/gh-pages:css/archive.css | grep "archive-post-date"
```

#### 步骤 5：更新资源版本号（如果样式不生效）
- 修改 `src/_data/assets.js` 中的 `ASSET_VERSION`
- 这会强制浏览器加载新的 CSS/JS 文件

### 预防措施

1. **统一部署方式**：
   - 推荐使用 `peaceiris/actions-gh-pages@v3`（更稳定）
   - 不要混用新旧两种部署方式

2. **每次修改后验证**：
   - 推送后等待 1-5 分钟
   - 检查 GitHub Actions 日志
   - 验证 `gh-pages` 分支是否更新
   - 强制刷新浏览器查看效果

3. **修改样式/脚本时**：
   - **必须**更新 `ASSET_VERSION`
   - 本地构建验证：`npm run build`
   - 检查 `_site/` 目录中的文件是否正确

4. **建立检查清单**：
   - [ ] 代码已提交并推送
   - [ ] GitHub Actions 运行成功
   - [ ] `gh-pages` 分支已更新
   - [ ] `ASSET_VERSION` 已更新（如果修改了 CSS/JS）
   - [ ] 浏览器强制刷新后验证

### 相关提交

- `5c07be2` - chore: trigger deployment to update gh-pages branch
- `813a65c` - add pages（包含归档日期样式优化）

---

*最后更新：2025-12-05*

