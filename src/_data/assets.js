const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "css", "style.css");

// 统一的静态资源版本号。
// 说明：
// - 每次你对 CSS / JS 做了“希望线上立刻生效”的改动，只需要在这里改一次版本号即可；
// - 我们通过在 URL 上追加 `?v=` 查询参数来绕过 Cloudflare 等 CDN 的长期缓存（max-age=31536000, immutable）。
const ASSET_VERSION = "20251128-4";

const readFileSafe = (filePath) => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
};

module.exports = () => {
  const v = ASSET_VERSION ? `?v=${ASSET_VERSION}` : "";

  return {
    criticalCssInline: readFileSafe(cssPath),
    mainCssHref: `/css/style.css${v}`,
    islands: {
      site: {
        src: `/js/site.js${v}`,
        module: true,
      },
      archive: {
        src: `/js/archive-page.js${v}`,
        module: true,
      },
      post: {
        src: `/js/post-page.js${v}`,
        module: true,
      },
      // 注意：search.js 在当前托管环境下对带查询参数的 URL 返回 404，
      // 因此暂不追加版本号，避免搜索功能失效。
      search: {
        src: `/js/search.js`,
        module: true,
      },
    },
  };
};

