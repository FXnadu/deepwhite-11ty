const paginateUrl = (pageNumber = 0) =>
  pageNumber === 0
    ? "/special-archive/"
    : `/special-archive/page/${pageNumber + 1}/`;

module.exports = {
  layout: "base.njk",
  title: "特别归档",
  showFloatingActions: true,
  isSpecialArchivePage: true,
  pagination: {
    data: "collections.specialArchivePages",
    size: 6,
    alias: "pageEntries",
  },
  eleventyComputed: {
    permalink: (data) => paginateUrl(data.pagination?.pageNumber || 0),
    hasSpecialEntries: (data) => {
      const entries = data.pageEntries || data.pagination?.items || [];
      return Array.isArray(entries) && entries.some(
        (entry) => entry && !entry.data?.__specialArchivePlaceholder
      );
    },
  },
};

