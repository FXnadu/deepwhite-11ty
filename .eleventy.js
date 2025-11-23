const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {

  // 将图片文件复制到输出目录
  eleventyConfig.addPassthroughCopy("./src/img/");

  // --- 新增：定义 readableDate 过滤器 ---
  eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
    // 默认时区为 Asia/Shanghai
    return DateTime.fromJSDate(dateObj, { zone: zone || "Asia/Shanghai" })
      .setLocale('zh-CN') // 设置为中文
      .toFormat(format || "yyyy年LL月dd日"); // 默认格式：2025年11月05日
  });

  // --- 新增：定义 isoDate 过滤器，用于 <time> 标签 ---
  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "Asia/Shanghai" }).toISODate();
  });

  // --- 2. 新增：创建按年份分组的自定义集合 ---
  eleventyConfig.addCollection("postsByYear", (collectionApi) => {
    const posts = collectionApi.getFilteredByTag("post").reverse();
    const postsByYear = {};

    posts.forEach((post) => {
      const year = post.date.getFullYear();
      if (!postsByYear[year]) {
        postsByYear[year] = [];
      }
      postsByYear[year].push(post);
    });

    return postsByYear;
  });

  // --- 3. 新增：创建首页推荐文章集合 ---
  eleventyConfig.addCollection("featured", (collectionApi) => {
    // 获取所有带有 "featured" 标签的文章，按日期倒序排列
    return collectionApi.getFilteredByTags("post", "featured").reverse();
  });

  // --- 4. 新增：生成搜索索引 JSON 文件 ---
  // 存储文章数据用于生成搜索索引
  let postsData = [];
  
  // 在构建时收集文章数据
  eleventyConfig.addCollection("allPostsForSearch", (collectionApi) => {
    const posts = collectionApi.getFilteredByTag("post").reverse();
    postsData = posts.map((post) => {
      return {
        title: post.data.title || "",
        url: post.url || "",
        date: post.date ? post.date.toISOString() : "",
        excerpt: post.data.excerpt || "",
        // 注意：这里不能访问 templateContent，需要在 after 钩子中处理
      };
    });
    return postsData;
  });
  
  // 在构建完成后生成 JSON 文件
  eleventyConfig.on("eleventy.after", async ({ runMode, outputMode }) => {
    const fs = require("fs");
    const path = require("path");
    
    const outputDir = path.join(__dirname, "_site");
    const searchIndex = [];
    
    // 遍历所有文章，从生成的 HTML 中提取内容
    for (const post of postsData) {
      if (!post.url) continue;
      
      // 构建 HTML 文件路径
      let htmlPath = path.join(outputDir, post.url, "index.html");
      if (!fs.existsSync(htmlPath)) {
        // 尝试直接作为 HTML 文件
        htmlPath = path.join(outputDir, post.url.replace(/\/$/, "") + ".html");
        if (!fs.existsSync(htmlPath)) {
          continue;
        }
      }
      
      try {
        const html = fs.readFileSync(htmlPath, "utf8");
        
        // 提取内容区域
        const contentMatch = html.match(/<section[^>]*class="post-content"[^>]*>([\s\S]*?)<\/section>/);
        let content = '';
        if (contentMatch) {
          // 移除 HTML 标签
          content = contentMatch[1].replace(/<[^>]*>/g, " ");
          // 移除多余的空白字符
          content = content.replace(/\s+/g, " ").trim();
        }
        
        // 如果没有内容，使用摘要
        if (!content && post.excerpt) {
          content = post.excerpt;
        }
        
        searchIndex.push({
          title: post.title,
          url: post.url,
          date: post.date,
          excerpt: post.excerpt || content.substring(0, 200),
          content: content.substring(0, 1000),
        });
      } catch (error) {
        // 如果无法读取 HTML，至少保存基本信息
        searchIndex.push({
          title: post.title,
          url: post.url,
          date: post.date,
          excerpt: post.excerpt || "",
          content: post.excerpt || "",
        });
      }
    }
    
    // 写入 JSON 文件
    const indexPath = path.join(outputDir, "search-index.json");
    fs.writeFileSync(indexPath, JSON.stringify(searchIndex, null, 2), "utf8");
    console.log(`✓ 搜索索引已生成: ${indexPath} (${searchIndex.length} 篇文章)`);
  });

  // 告诉 Eleventy 监听 CSS 文件的变化
  eleventyConfig.addWatchTarget("./src/css/");

  // 将 CSS 文件直接复制到输出目录
  eleventyConfig.addPassthroughCopy("./src/css/");
  
  // 将 JS 文件复制到输出目录
  eleventyConfig.addPassthroughCopy("./src/js/");
  
  // 复制 .htaccess 文件到输出目录（用于 Apache 服务器配置）
  eleventyConfig.addPassthroughCopy("./src/.htaccess");
  
  // 复制 _redirects 文件到输出目录（用于 Netlify 部署）
  eleventyConfig.addPassthroughCopy("./src/_redirects");
  
  // 复制 .nojekyll 文件到输出目录（禁用 GitHub Pages 的 Jekyll 处理）
  eleventyConfig.addPassthroughCopy("./src/.nojekyll");
  
  // 复制 _headers 文件到输出目录（用于 Cloudflare Pages 部署）
  eleventyConfig.addPassthroughCopy("./src/_headers");

  // Eleventy 的目录配置
  return {
    dir: {
      input: "src",         // 源文件目录
      includes: "_includes",// 组件目录
      output: "_site",      // 最终生成的网站目录
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    // 配置路径前缀，支持 GitHub Pages 子路径
    // 如果仓库名是 deepwhite-11ty，GitHub Pages URL 会是 https://username.github.io/deepwhite-11ty/
    pathPrefix: process.env.BASE_URL || "/",
  };


};