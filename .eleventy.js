const { DateTime } = require("luxon");
const path = require("path");
const fs = require("fs");
const matter = require("gray-matter");
const markdownIt = require("markdown-it");
const markdownItMark = require("markdown-it-mark");
const markdownItSub = require("markdown-it-sub");
const markdownItSup = require("markdown-it-sup");
const markdownItFootnote = require("markdown-it-footnote");
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

module.exports = async (eleventyConfig) => {
  // 动态导入 ESM 模块
  const { default: markdownItGitHubAlerts } = await import('markdown-it-github-alerts');
  
  const markdownLib = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  })
    .use(markdownItMark)
    .use(markdownItSub)
    .use(markdownItSup)
    .use(markdownItFootnote)
    .use(markdownItGitHubAlerts);

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

  eleventyConfig.setServerOptions({
    pathPrefix: process.env.BASE_URL || "/",
  });

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

  const SPECIAL_ARCHIVE_TAG = "special-archive";
  const resolveSpecialOrder = (item = {}) => {
    if (typeof item.data?.specialOrder === "number") {
      return item.data.specialOrder;
    }
    return item.date instanceof Date ? item.date.getTime() : 0;
  };
  const isSpecialArchiveEntry = (item = {}) => {
    const tags = item.data?.tags;
    return Array.isArray(tags) && tags.includes(SPECIAL_ARCHIVE_TAG);
  };
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

  eleventyConfig.addCollection("specialArchivePages", (collectionApi) =>
    (() => {
      const entries = collectionApi
        .getAll()
        .filter(isSpecialArchiveEntry)
        .sort((a, b) => resolveSpecialOrder(b) - resolveSpecialOrder(a));

      return entries.length ? entries : [createSpecialArchivePlaceholder()];
    })()
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

    // 1. 写出搜索索引（供前端搜索使用）
    const searchIndex = postsData.map((post) => ({
      title: post.title,
      url: post.url,
      date: post.date,
      excerpt: post.excerpt,
      content: post.content,
    }));
    const indexPath = path.join(outputDir, "search-index.json");
    fs.writeFileSync(indexPath, JSON.stringify(searchIndex, null, 2), "utf8");

    // 2. 构建后自检：确保搜索相关静态资源存在，防止部署后才发现搜索缺失
    const searchJsPath = path.join(outputDir, "js", "search.js");
    if (!fs.existsSync(searchJsPath)) {
      // 使用 console.warn，而不是抛错中断构建，避免意外阻塞部署；
      // 但在本地构建日志中能明显看到提示。
      // eslint-disable-next-line no-console
      console.warn(
        "[deepwhite-11ty] Warning: _site/js/search.js 不存在，归档搜索将无法工作，请检查 src/js/search.js 与静态资源复制配置。"
      );
    }
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