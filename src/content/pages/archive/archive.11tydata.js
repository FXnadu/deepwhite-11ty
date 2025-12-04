const paginateUrl = (pageNumber = 0) =>
  pageNumber === 0 ? "/archive/" : `/archive/page/${pageNumber + 1}/`;

module.exports = {
  layout: "base.njk",
  title: "文章归档",
  extraCss: "/css/archive.css",
  showFloatingActions: true,
  islands: ["site", "archive", "search"],
  pagination: {
    data: "collections.post",
    size: 20,
    alias: "archivePosts",
    before: (posts = []) => [...posts].reverse(),
  },
  eleventyComputed: {
    permalink: (data) => paginateUrl(data.pagination?.pageNumber || 0),
    archiveYearGroups: (data) => {
      const posts = Array.isArray(data.archivePosts)
        ? data.archivePosts
        : data.archivePosts
          ? [data.archivePosts]
          : [];

      const groups = {};
      posts.forEach((post) => {
        const year = post.date.getFullYear();
        if (!groups[year]) groups[year] = [];
        groups[year].push(post);
      });
      return Object.entries(groups).sort(
        (a, b) => Number(b[0]) - Number(a[0])
      );
    },
  },
};


