const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "..", "css", "style.css");

const readFileSafe = (filePath) => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
};

module.exports = () => ({
  criticalCssInline: readFileSafe(cssPath),
  mainCssHref: "/css/style.css",
  islands: {
    site: {
      src: "/js/site.js",
      module: true,
    },
    archive: {
      src: "/js/archive-page.js",
      module: true,
    },
    post: {
      src: "/js/post-page.js",
      module: true,
    },
    search: {
      src: "/js/search.js",
      module: true,
    },
  },
});

