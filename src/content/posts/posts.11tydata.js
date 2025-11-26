module.exports = {
  eleventyComputed: {
    permalink: (data) => `/posts/${data.page.fileSlug || ""}/`,
  },
};



