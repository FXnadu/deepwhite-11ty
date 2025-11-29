class SimpleSearch {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      indexUrl: options.indexUrl || "/search-index.json",
      minQueryLength: options.minQueryLength || 1,
      debounceTime: options.debounceTime || 300,
      maxResults: options.maxResults || 20,
      ...options,
    };
    this.index = [];
    this.isLoading = false;
    this.indexPromise = null;
    this.searchTimeout = null;

    this.init();
  }

  async init() {
    if (!this.container) {
      console.error("Search container not found");
      return;
    }

    this.createUI();
    this.bindEvents();
  }

  createUI() {
    this.container.innerHTML = `
      <div class="simple-search-form">
        <input 
          type="text" 
          class="simple-search-input" 
          placeholder="搜索..." 
          autocomplete="off"
        />
        <div class="simple-search-results"></div>
      </div>
    `;

    this.input = this.container.querySelector(".simple-search-input");
    this.resultsContainer = this.container.querySelector(".simple-search-results");
  }

  async loadIndex() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.showLoading();

    try {
      const response = await fetch(this.options.indexUrl, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load search index: ${response.status}`);
      }
      const data = await response.json();
      this.index = data.map((item) => ({
        ...item,
        _titleLower: (item.title || "").toLowerCase(),
        _excerptLower: (item.excerpt || "").toLowerCase(),
        _contentLower: (item.content || "").toLowerCase(),
      }));
    } catch (error) {
      console.error("Failed to load search index:", error);
      this.showError("搜索索引加载失败，请刷新页面重试。");
    } finally {
      this.isLoading = false;
    }
  }

  async ensureIndexLoaded() {
    if (this.index.length) return;
    if (!this.indexPromise) {
      this.indexPromise = this.loadIndex();
    }
    await this.indexPromise;
    if (!this.index.length) {
      this.indexPromise = null;
    }
  }

  bindEvents() {
    if (!this.input) return;

    this.input.addEventListener("input", (e) => {
      this.handleInput(e.target.value);
    });
    this.input.addEventListener("focus", async () => {
      await this.ensureIndexLoaded();
      if (this.input.value.trim()) {
        this.showResults();
      }
    });

    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) {
        this.hideResults();
      }
    });
  }

  async handleInput(query) {
    clearTimeout(this.searchTimeout);

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < this.options.minQueryLength) {
      this.hideResults();
      return;
    }

    this.searchTimeout = setTimeout(async () => {
      await this.search(trimmedQuery);
    }, this.options.debounceTime);
  }

  async search(query) {
    await this.ensureIndexLoaded();
    if (!this.index.length) return;

    const results = this.performSearch(query);
    this.displayResults(results, query);
  }

  performSearch(query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 0);

    const scoredResults = this.index
      .map((post) => {
        const title = post._titleLower || "";
        const excerpt = post._excerptLower || "";
        const content = post._contentLower || "";

        let score = 0;

        if (title.includes(queryLower)) {
          score += 100;
        }

        if (queryWords.every((word) => title.includes(word))) {
          score += 50;
        }

        queryWords.forEach((word) => {
          if (title.includes(word)) {
            score += 20;
          }
        });

        if (excerpt.includes(queryLower)) {
          score += 30;
        }

        queryWords.forEach((word) => {
          if (excerpt.includes(word)) {
            score += 10;
          }
        });

        queryWords.forEach((word) => {
          const matches = (content.match(new RegExp(word, "g")) || []).length;
          score += matches * 2;
        });

        if (content.includes(queryLower)) {
          score += 15;
        }

        return { post, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.options.maxResults)
      .map((item) => item.post);

    return scoredResults;
  }

  displayResults(results, query) {
    if (!this.resultsContainer) return;

    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="simple-search-message">
          未找到 "${query}" 的相关结果
        </div>
      `;
      this.showResults();
      return;
    }

    const resultsHTML = results
      .map((post) => {
        const title = this.highlightText(post.title, query);
        const excerpt = this.highlightText(post.excerpt || "", query);
        const date = post.date ? new Date(post.date).toLocaleDateString("zh-CN") : "";

        return `
        <div class="simple-search-result">
          <div class="simple-search-result-title">
            <a href="${post.url}">${title}</a>
          </div>
          ${excerpt ? `<div class="simple-search-result-excerpt">${excerpt}</div>` : ""}
          ${date ? `<div class="simple-search-result-date">${date}</div>` : ""}
        </div>
      `;
      })
      .join("");

    this.resultsContainer.innerHTML = `
      <div class="simple-search-message">
        找到 ${results.length} 个 "${query}" 的相关结果
      </div>
      ${resultsHTML}
    `;

    this.showResults();
  }

  highlightText(text, query) {
    if (!text || !query) return text;

    const queryWords = query.split(/\s+/).filter((w) => w.length > 0);
    let highlighted = text;

    queryWords.forEach((word) => {
      const regex = new RegExp(`(${this.escapeRegExp(word)})`, "gi");
      highlighted = highlighted.replace(regex, "<mark>$1</mark>");
    });

    return highlighted;
  }

  escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  showResults() {
    if (this.resultsContainer) {
      this.resultsContainer.style.display = "block";
    }
  }

  hideResults() {
    if (this.resultsContainer) {
      this.resultsContainer.style.display = "none";
    }
  }

  showError(message) {
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = `
        <div class="simple-search-error">
          ${message}
        </div>
      `;
      this.showResults();
    }
  }

  showLoading() {
    if (this.resultsContainer) {
      this.resultsContainer.innerHTML = `
        <div class="simple-search-message">
          正在加载搜索索引…
        </div>
      `;
      this.showResults();
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("search");
    if (container) {
      window.simpleSearch = new SimpleSearch("search");
    }
  });
} else {
  const container = document.getElementById("search");
  if (container) {
    window.simpleSearch = new SimpleSearch("search");
  }
}








