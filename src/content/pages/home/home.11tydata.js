module.exports = {
  layout: "base.njk",
  title: "首页",
  pagination: {
    data: "collections.featured",
    size: 6,
    alias: "posts",
  },
  eleventyComputed: {
    permalink: (data) =>
      data.pagination?.pageNumber === 0
        ? "/"
        : `/page/${(data.pagination?.pageNumber || 0) + 1}/`,
  },
  islands: ["site"],
};



