// 读取 assets.js 中的版本号
const assets = require("../../../_data/assets.js")();
const versionMatch = assets.mainCssHref.match(/\?v=([^&]+)/);
const versionSuffix = versionMatch ? versionMatch[1] : "";

module.exports = {
  layout: "base.njk",
  title: "关于我",
  permalink: "/about/",
  islands: ["site"],
  extraCss: [`/css/about.css${versionSuffix ? `?v=${versionSuffix}` : ""}`],
};



