const paginateUrl = (pageNumber = 0) =>
  pageNumber === 0
    ? "/special-archive/"
    : `/special-archive/page/${pageNumber + 1}/`;

module.exports = {
  layout: "base.njk",
  title: "特别归档",
  showFloatingActions: true,
  isSpecialArchivePage: true,
  eleventyComputed: {
    permalink: (data) => paginateUrl(data.pagination?.pageNumber || 0),
    hasSpecialEntries: (data) =>
      Array.isArray(data.collections?.specialArchivePages) &&
      data.collections.specialArchivePages.some(
        (entry) => !entry.data?.__specialArchivePlaceholder
      ),
  },
};

