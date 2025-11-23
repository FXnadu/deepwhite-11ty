/**
 * 简单的客户端搜索功能
 * 不依赖任何外部库，直接搜索文章数据
 */

class SimpleSearch {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      indexUrl: options.indexUrl || '/search-index.json',
      minQueryLength: options.minQueryLength || 1,
      debounceTime: options.debounceTime || 300,
      maxResults: options.maxResults || 20,
      ...options
    };
    this.index = [];
    this.isLoading = false;
    this.searchTimeout = null;
    
    this.init();
  }
  
  async init() {
    if (!this.container) {
      console.error('Search container not found');
      return;
    }
    
    // 创建搜索 UI
    this.createUI();
    
    // 加载搜索索引
    await this.loadIndex();
    
    // 绑定事件
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
    
    this.input = this.container.querySelector('.simple-search-input');
    this.resultsContainer = this.container.querySelector('.simple-search-results');
  }
  
  async loadIndex() {
    try {
      this.isLoading = true;
      const response = await fetch(this.options.indexUrl);
      if (!response.ok) {
        throw new Error(`Failed to load search index: ${response.status}`);
      }
      this.index = await response.json();
      this.isLoading = false;
    } catch (error) {
      console.error('Failed to load search index:', error);
      this.isLoading = false;
      this.showError('搜索索引加载失败，请刷新页面重试。');
    }
  }
  
  bindEvents() {
    if (!this.input) return;
    
    // 输入事件
    this.input.addEventListener('input', (e) => {
      this.handleInput(e.target.value);
    });
    
    // 聚焦事件
    this.input.addEventListener('focus', () => {
      if (this.input.value.trim()) {
        this.showResults();
      }
    });
    
    // 点击外部关闭结果
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideResults();
      }
    });
  }
  
  handleInput(query) {
    clearTimeout(this.searchTimeout);
    
    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length < this.options.minQueryLength) {
      this.hideResults();
      return;
    }
    
    this.searchTimeout = setTimeout(() => {
      this.search(trimmedQuery);
    }, this.options.debounceTime);
  }
  
  search(query) {
    if (this.isLoading || !this.index.length) {
      return;
    }
    
    const results = this.performSearch(query);
    this.displayResults(results, query);
  }
  
  performSearch(query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    
    // 计算每个文章的匹配分数
    const scoredResults = this.index.map((post) => {
      const title = (post.title || '').toLowerCase();
      const excerpt = (post.excerpt || '').toLowerCase();
      const content = (post.content || '').toLowerCase();
      
      let score = 0;
      
      // 标题完全匹配
      if (title.includes(queryLower)) {
        score += 100;
      }
      
      // 标题包含所有查询词
      if (queryWords.every(word => title.includes(word))) {
        score += 50;
      }
      
      // 标题包含部分查询词
      queryWords.forEach(word => {
        if (title.includes(word)) {
          score += 20;
        }
      });
      
      // 摘要匹配
      if (excerpt.includes(queryLower)) {
        score += 30;
      }
      
      queryWords.forEach(word => {
        if (excerpt.includes(word)) {
          score += 10;
        }
      });
      
      // 内容匹配
      queryWords.forEach(word => {
        const matches = (content.match(new RegExp(word, 'g')) || []).length;
        score += matches * 2;
      });
      
      // 完整短语匹配（额外加分）
      if (content.includes(queryLower)) {
        score += 15;
      }
      
      return { post, score };
    })
    .filter(item => item.score > 0) // 只保留有匹配的结果
    .sort((a, b) => b.score - a.score) // 按分数降序排列
    .slice(0, this.options.maxResults) // 限制结果数量
    .map(item => item.post);
    
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
    
    const resultsHTML = results.map(post => {
      const title = this.highlightText(post.title, query);
      const excerpt = this.highlightText(post.excerpt || '', query);
      const date = post.date ? new Date(post.date).toLocaleDateString('zh-CN') : '';
      
      return `
        <div class="simple-search-result">
          <div class="simple-search-result-title">
            <a href="${post.url}">${title}</a>
          </div>
          ${excerpt ? `<div class="simple-search-result-excerpt">${excerpt}</div>` : ''}
          ${date ? `<div class="simple-search-result-date">${date}</div>` : ''}
        </div>
      `;
    }).join('');
    
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
    
    const queryWords = query.split(/\s+/).filter(w => w.length > 0);
    let highlighted = text;
    
    queryWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
  }
  
  showResults() {
    if (this.resultsContainer) {
      this.resultsContainer.style.display = 'block';
    }
  }
  
  hideResults() {
    if (this.resultsContainer) {
      this.resultsContainer.style.display = 'none';
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
}

// 自动初始化（如果容器存在）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('search');
    if (container) {
      window.simpleSearch = new SimpleSearch('search');
    }
  });
} else {
  const container = document.getElementById('search');
  if (container) {
    window.simpleSearch = new SimpleSearch('search');
  }
}

