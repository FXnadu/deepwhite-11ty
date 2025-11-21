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

  // 告诉 Eleventy 监听 CSS 文件的变化
  eleventyConfig.addWatchTarget("./src/css/");

  // 将 CSS 文件直接复制到输出目录
  eleventyConfig.addPassthroughCopy("./src/css/");

  // Eleventy 的目录配置
  return {
    dir: {
      input: "src",         // 源文件目录
      includes: "_includes",// 组件目录
      output: "_site",      // 最终生成的网站目录
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };


};