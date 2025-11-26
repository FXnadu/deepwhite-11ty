# 11ty 结构与分页优化说明

## 目录约定
- 新增 `src/content/` 作为所有页面与文章的聚合入口，以 Eleventy 官方 starter 推荐的“内容与资产分层”方式组织。
- `src/content/pages/<feature>/`：一份功能 = 一个文件夹。删目录即可下线对应功能，不再有隐式模板。
- `src/content/posts/`：集中管理文章，配合目录级数据文件统一 permalink 规则，继续输出 `/posts/<slug>/`，与既有 URL 保持一致。

## Front Matter 开关
- 各页面的 front matter 被提炼为 `.11tydata.js` 文件（如 `home.11tydata.js`、`archive.11tydata.js`、`about.11tydata.js`），开关项清晰暴露并可复用。
- 目录级 `posts.11tydata.js` 负责给文章注入统一的 `permalink` 与默认数据，避免散落在单篇 front matter 中的幽灵配置。
- 模板本体只剩标记结构，可读性与可维护性大幅提升。

## Islands 约定
- 各页面的 `.11tydata.js` 中声明 `islands` 数组，直接驱动 `base.njk` 中的岛屿脚本注册。
- 删除页面或关闭 `islands` 开关即可同步停用对应的前端模块，做到“声明即生效，撤销即清理”。

## 分页
- `home` 页的 front matter 使用 Eleventy 内置 `pagination` 声明来拆页：声明存在即自动生成 `/`, `/page/2`, ... 的分页结构。
- pagination alias 仍为 `posts`，与模板循环变量保持一一对应，功能不受影响。

## 验证
1. `npm run build`
2. 手动打开 `_site/index.html`, `_site/archive/index.html`, `_site/about/index.html` 与部分 `_site/posts/*`，确认样式、浮动操作区、islands 交互与搜索均与改动前一致。

如需新增功能，请以 `src/content/<feature>/` 为粒度创建文件夹，再通过 `.11tydata.js` 控制 front matter 开关与 islands。



