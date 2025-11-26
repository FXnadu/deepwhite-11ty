const { DateTime } = require("luxon");
const path = require("path");
const fs = require("fs");
const matter = require("gray-matter");
const markdownIt = require("markdown-it");
const markdownItMark = require("markdown-it-mark");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

const toPlainText = (markdown = "") =>
  markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\(([^)]*)\)/g, "$1")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .trim();

module.exports = (eleventyConfig) => {
  const markdownLib = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  }).use(markdownItMark);

  eleventyConfig.setLibrary("md", markdownLib);
  eleventyConfig.addPlugin(syntaxHighlight, {
    templateFormats: ["md", "njk"],
    preAttributes: { tabindex: 0 },
  });

  const stripHtmlTags = (value = "") =>
    value.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ");

  const cjkCharRegex =
    /[\u2E80-\u2FD5\u3040-\u30FF\u31F0-\u31FF\u3400-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]/g;

  const countReadingTokens = (text = "") => {
    const cjkChars = (text.match(cjkCharRegex) || []).length;
    const latinWords = text
      .replace(cjkCharRegex, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    return { cjkChars, latinWords };
  };

  eleventyConfig.addFilter("readingMinutes", (content = "", opts = {}) => {
    const plainText = toPlainText(stripHtmlTags(content));
    if (!plainText) return 1;
    const { cjkChars, latinWords } = countReadingTokens(plainText);
    const {
      wordsPerMinute,
      cjkCharsPerMinute = 450,
      latinWordsPerMinute = 250,
    } = opts;

    if (wordsPerMinute) {
      const totalTokens = cjkChars + latinWords;
      return Math.max(1, Math.round(totalTokens / wordsPerMinute));
    }

    const minutes =
      cjkChars / cjkCharsPerMinute + latinWords / latinWordsPerMinute;
    return Math.max(1, Math.round(minutes));
  });

  eleventyConfig.addPassthroughCopy("./src/img/");
  eleventyConfig.addPassthroughCopy("./src/css/");
  eleventyConfig.addPassthroughCopy("./src/js/");
  eleventyConfig.addPassthroughCopy("./src/.htaccess");
  eleventyConfig.addPassthroughCopy("./src/_redirects");
  eleventyConfig.addPassthroughCopy("./src/.nojekyll");
  eleventyConfig.addPassthroughCopy("./src/_headers");

  eleventyConfig.addFilter("toArray", (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  });

  eleventyConfig.addFilter("readableDate", (dateObj, format, zone) =>
    DateTime.fromJSDate(dateObj, { zone: zone || "Asia/Shanghai" })
      .setLocale("zh-CN")
      .toFormat(format || "yyyy年LL月dd日")
  );

  eleventyConfig.addFilter("isoDate", (dateObj) =>
    DateTime.fromJSDate(dateObj, { zone: "Asia/Shanghai" }).toISODate()
  );

  eleventyConfig.addCollection("postsByYear", (collectionApi) => {
    const posts = collectionApi.getFilteredByTag("post").reverse();
    const postsByYear = {};
    posts.forEach((post) => {
      const year = post.date.getFullYear();
      if (!postsByYear[year]) postsByYear[year] = [];
      postsByYear[year].push(post);
    });
    return postsByYear;
  });

  eleventyConfig.addCollection("featured", (collectionApi) =>
    collectionApi.getFilteredByTags("post", "featured").reverse()
  );

  let postsData = [];
  eleventyConfig.addCollection("allPostsForSearch", (collectionApi) => {
    const posts = collectionApi.getFilteredByTag("post").reverse();
    postsData = posts.map((post) => {
      try {
        const absolutePath = path.resolve(post.inputPath);
        const fileContent = fs.readFileSync(absolutePath, "utf8");
        const { content } = matter(fileContent);
        const plainText = toPlainText(content);
        const excerpt = post.data.excerpt || plainText.substring(0, 200);
        return {
          title: post.data.title || "",
          url: post.url || "",
          date: post.date ? post.date.toISOString() : "",
          excerpt,
          content: plainText.substring(0, 2000),
        };
      } catch (error) {
        console.warn(`处理 ${post.inputPath} 时出错:`, error.message);
        return {
          title: post.data.title || "",
          url: post.url || "",
          date: post.date ? post.date.toISOString() : "",
          excerpt: post.data.excerpt || "",
          content: "",
        };
      }
    });
    return postsData;
  });

  eleventyConfig.on("eleventy.after", async () => {
    const outputDir = path.join(__dirname, "_site");
    const searchIndex = postsData.map((post) => ({
      title: post.title,
      url: post.url,
      date: post.date,
      excerpt: post.excerpt,
      content: post.content,
    }));
    const indexPath = path.join(outputDir, "search-index.json");
    fs.writeFileSync(indexPath, JSON.stringify(searchIndex, null, 2), "utf8");
  });

  eleventyConfig.addWatchTarget("./src/css/");

  return {
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_includes/layouts",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.BASE_URL || "/",
  };
};