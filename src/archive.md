---
layout: "base.njk"
title: "文章归档"
extraCss: "/css/archive.css"
showFloatingActions: true
---
{# --- Pagefind Search Assets --- #}
<link href="/pagefind/pagefind-ui.css" rel="stylesheet">

<script src="/pagefind/pagefind-ui.js"></script>

<header class="page-header">
    <h1 class="page-title">文章归档</h1>

{# --- Click-to-Expand Search Trigger --- #}

<div id="search" class="archive-search"></div>
</header>

<div class="archive-container">
    {%- set years = collections.postsByYear | dictsort | reverse -%}

    {# --- 年份导航滚轮 --- #}
    <div class="year-navigator" id="yearNavigator">
        <div class="year-navigator-track">
            {%- for year, posts in years -%}
            <a href="#year-{{ year }}" class="year-nav-item" data-year="{{ year }}">{{ year }}</a>
            {%- endfor -%}
        </div>
    </div>
    
    {%- for year, posts in years -%}
        <div class="archive-year-group" id="year-{{ year }}">
            <h2 class="archive-year-title">{{ year }}</h2>

    <ul class="archive-post-list">
    {%- for post in posts -%}
        <li class="archive-post-item">
            <time class="archive-post-date" datetime="{{ post.date | isoDate }}">{{ post.date | readableDate('LL月dd日') }}</time>
            <div class="archive-post-title">
                <a href="{{ post.url }}">{{ post.data.title }}</a>
            </div>
        </li>
    {%- endfor -%}
    </ul>
</div>

{%- endfor -%}

</div>

{# --- Initialize Pagefind UI --- #}

<script>
    // 全局错误处理：捕获未处理的 Promise 错误（特别是 Pagefind 的 disconnected 错误）
    window.addEventListener('unhandledrejection', (event) => {
        // 如果是 Pagefind 的 disconnected 错误，静默处理
        if (event.reason && event.reason.message && event.reason.message.includes('disconnected')) {
            event.preventDefault(); // 阻止错误显示在控制台
            return;
        }
        // 其他错误正常处理
    });

    window.addEventListener('DOMContentLoaded', (event) => {
        const searchContainer = document.querySelector('#search');
        
        // 检查 Pagefind 资源是否加载
        const checkPagefindResources = () => {
            // 检查 CSS 和 JS 是否加载
            const pagefindCSS = document.querySelector('link[href*="pagefind-ui.css"]');
            const pagefindJS = document.querySelector('script[src*="pagefind-ui.js"]');
            
            if (!pagefindCSS || !pagefindJS) {
                // 资源未加载，显示错误消息
                if (searchContainer) {
                    searchContainer.innerHTML = `
                        <div style="padding: 1em; text-align: center; color: var(--color-text, #333);">
                            <p style="margin: 0.5em 0;">⚠️ 搜索功能暂时不可用</p>
                            <p style="margin: 0.5em 0; font-size: 0.9em; opacity: 0.8;">
                                请确保部署时运行了 <code>npm run build</code> 命令
                            </p>
                        </div>
                    `;
                }
                return false;
            }
            return true;
        };

        // 延迟检查，给资源加载时间
        setTimeout(() => {
            if (!checkPagefindResources()) {
                return; // 资源未加载，退出初始化
            }
        }, 100);

        // 初始化 Pagefind，但不自动绑定搜索
        try {
            // 检查 PagefindUI 是否可用
            if (typeof PagefindUI === 'undefined') {
                // PagefindUI 未定义，可能是脚本未加载
                setTimeout(() => {
                    if (typeof PagefindUI === 'undefined' && searchContainer) {
                        searchContainer.innerHTML = `
                            <div style="padding: 1em; text-align: center; color: var(--color-text, #333);">
                                <p style="margin: 0.5em 0;">⚠️ 搜索功能暂时不可用</p>
                                <p style="margin: 0.5em 0; font-size: 0.9em; opacity: 0.8;">
                                    Pagefind 脚本未加载，请检查部署配置
                                </p>
                            </div>
                        `;
                    }
                }, 1000);
                return;
            }

            const searchUI = new PagefindUI({
                element: "#search",
                showSubResults: true,
                translations: {
                    placeholder: "搜索..."
                }
            });

            // 捕获 Pagefind 初始化错误
            if (searchUI && typeof searchUI.then === 'function') {
                searchUI.catch((error) => {
                    // 静默处理 disconnected 错误
                    if (error && error.message && !error.message.includes('disconnected')) {
                        console.warn('Pagefind initialization error:', error);
                        // 显示友好的错误消息
                        if (searchContainer) {
                            const errorMsg = searchContainer.querySelector('.pagefind-ui__message') || 
                                           document.createElement('div');
                            errorMsg.className = 'pagefind-ui__message';
                            errorMsg.style.display = 'block';
                            errorMsg.style.padding = '1em';
                            errorMsg.style.textAlign = 'center';
                            errorMsg.innerHTML = `
                                <p style="margin: 0.5em 0;">⚠️ 搜索功能初始化失败</p>
                                <p style="margin: 0.5em 0; font-size: 0.9em; opacity: 0.8;">
                                    请确保部署时运行了构建命令
                                </p>
                            `;
                            if (!searchContainer.contains(errorMsg)) {
                                searchContainer.appendChild(errorMsg);
                            }
                        }
                    }
                });
            }
        } catch (error) {
            // 静默处理初始化错误
            if (error && error.message && !error.message.includes('disconnected')) {
                console.warn('Failed to initialize Pagefind:', error);
                // 显示友好的错误消息
                if (searchContainer) {
                    searchContainer.innerHTML = `
                        <div style="padding: 1em; text-align: center; color: var(--color-text, #333);">
                            <p style="margin: 0.5em 0;">⚠️ 搜索功能初始化失败</p>
                            <p style="margin: 0.5em 0; font-size: 0.9em; opacity: 0.8;">
                                错误: ${error.message}
                            </p>
                        </div>
                    `;
                }
            }
        }

        // 自定义搜索逻辑：按完整关键词匹配
        // 等待 Pagefind UI 初始化完成
        setTimeout(async () => {
            const searchContainer = document.querySelector('#search');
            const searchInput = searchContainer?.querySelector('.pagefind-ui__search-input');
            const searchForm = searchContainer?.querySelector('.pagefind-ui__form');

            if (searchInput && searchForm) {
                let searchTimeout;
                let isCustomSearch = false; // 标志是否使用自定义搜索

                // 加载 Pagefind 模块
                let pagefindModule;
                try {
                    pagefindModule = await import('/pagefind/pagefind.js');
                } catch (e) {
                    // 静默处理错误，Pagefind 模块可能不可用
                    // 这不会影响页面的其他功能
                }

                // 手动更新搜索结果的函数
                const updateSearchResultsUI = async (results, originalQuery, container) => {
                    let resultsArea = container.querySelector('.pagefind-ui__results-area');

                    // 如果结果区域不存在，创建一个
                    if (!resultsArea) {
                        resultsArea = document.createElement('div');
                        resultsArea.className = 'pagefind-ui__results-area';
                        // 将结果区域插入到表单后面
                        const searchForm = container.querySelector('.pagefind-ui__form');
                        if (searchForm && searchForm.parentNode) {
                            searchForm.parentNode.insertBefore(resultsArea, searchForm.nextSibling);
                        } else {
                            container.appendChild(resultsArea);
                        }
                        // 确保结果区域有正确的样式
                        resultsArea.style.position = 'absolute';
                        resultsArea.style.top = '100%';
                        resultsArea.style.left = '0';
                        resultsArea.style.right = '0';
                        resultsArea.style.zIndex = '1000';
                    }

                    // 清空现有结果
                    resultsArea.innerHTML = '';
                    resultsArea.style.display = 'block';

                    if (!results || results.results.length === 0) {
                        // 没有结果
                        const messageEl = document.createElement('div');
                        messageEl.className = 'pagefind-ui__message';
                        messageEl.textContent = `未找到 ${originalQuery} 的相关结果`;
                        resultsArea.appendChild(messageEl);
                        return;
                    }

                    // 需要过滤的页面 URL
                    const excludedUrls = ['/', '/index.html', '/archive/', '/about/'];

                    // 先过滤结果，只保留需要显示的
                    const filteredResults = [];
                    for (const result of results.results) {
                        const resultData = await result.data();
                        const url = resultData.url || '';
                        // 检查是否需要过滤
                        if (!excludedUrls.includes(url) && !excludedUrls.includes(url + '/')) {
                            filteredResults.push({ result, resultData });
                        }
                    }

                    // 显示结果数量（使用过滤后的数量）
                    const messageEl = document.createElement('div');
                    messageEl.className = 'pagefind-ui__message';
                    if (filteredResults.length === 0) {
                        messageEl.textContent = `未找到 ${originalQuery} 的相关结果`;
                    } else {
                        messageEl.textContent = `找到 ${filteredResults.length} 个 ${originalQuery} 的相关结果`;
                    }
                    resultsArea.appendChild(messageEl);

                    // 渲染过滤后的结果
                    for (const { result, resultData } of filteredResults) {
                        const resultEl = document.createElement('div');
                        resultEl.className = 'pagefind-ui__result';

                        const titleEl = document.createElement('div');
                        titleEl.className = 'pagefind-ui__result-title';
                        const titleLink = document.createElement('a');
                        titleLink.href = resultData.url;
                        // 处理标题，保留 mark 标签用于高亮
                        const titleText = resultData.meta?.title || resultData.url || '';
                        titleLink.innerHTML = titleText; // 使用 innerHTML 以保留 mark 标签
                        titleEl.appendChild(titleLink);

                        const excerptEl = document.createElement('div');
                        excerptEl.className = 'pagefind-ui__result-excerpt';
                        // 处理摘要，保留 mark 标签用于高亮
                        const excerptText = resultData.excerpt || '';
                        excerptEl.innerHTML = excerptText; // 使用 innerHTML 以保留 mark 标签

                        resultEl.appendChild(titleEl);
                        resultEl.appendChild(excerptEl);
                        resultsArea.appendChild(resultEl);
                    }

                    // 触发现有的结果处理逻辑（过滤、标题修改等）
                    setTimeout(() => {
                        const updateResultTitles = container.querySelectorAll ? () => {
                            // 这里会触发现有的 updateResultTitles 函数
                            const event = new Event('resultsUpdated');
                            container.dispatchEvent(event);
                        } : null;
                        if (updateResultTitles) updateResultTitles();
                    }, 50);
                };

                // 拦截输入事件，使用自定义搜索逻辑
                searchInput.addEventListener('input', (e) => {
                    // 始终阻止默认的 Pagefind UI 搜索，使用自定义搜索
                    e.stopImmediatePropagation();
                    e.preventDefault();

                    clearTimeout(searchTimeout);
                    const userInput = e.target.value;
                    const trimmedInput = userInput.trim();

                    // 如果查询为空，清空结果
                    if (trimmedInput.length === 0) {
                        const resultsArea = searchContainer.querySelector('.pagefind-ui__results-area');
                        if (resultsArea) {
                            resultsArea.innerHTML = '';
                            resultsArea.style.display = 'none';
                        }
                        isCustomSearch = false;
                        return;
                    }

                    // 所有查询都使用自定义搜索（包括单字符）
                    if (pagefindModule) {
                        isCustomSearch = true;
                        searchTimeout = setTimeout(async () => {
                            try {
                                // 先尝试普通搜索（Pagefind 默认会进行完整关键词匹配）
                                let results = await pagefindModule.search(trimmedInput);

                                // 如果普通搜索没有结果，且查询长度大于1，再尝试短语搜索（带引号，更严格）
                                if ((!results || results.results.length === 0) && trimmedInput.length > 1) {
                                    const phraseQuery = `"${trimmedInput}"`;
                                    results = await pagefindModule.search(phraseQuery);
                                }

                                // 手动更新搜索结果
                                await updateSearchResultsUI(results, trimmedInput, searchContainer);
                            } catch (error) {
                                // 静默处理搜索错误
                                // 如果错误是 "disconnected"，这是 Pagefind 的内部错误，可以忽略
                                if (error && error.message && !error.message.includes('disconnected')) {
                                    console.warn('Search error:', error);
                                }
                                isCustomSearch = false;
                            }
                        }, 300);
                    } else {
                        // 如果 Pagefind 模块不可用，清空结果
                        const resultsArea = searchContainer.querySelector('.pagefind-ui__results-area');
                        if (resultsArea) {
                            resultsArea.innerHTML = '';
                            resultsArea.style.display = 'none';
                        }
                        isCustomSearch = false;
                    }
                }, true); // 使用捕获阶段，优先执行

                // 拦截表单提交
                searchForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const query = searchInput.value.trim();
                    if (query.length > 1 && pagefindModule) {
                        isCustomSearch = true;
                        const searchQuery = `"${query}"`;
                        pagefindModule.search(searchQuery).then(results => {
                            updateSearchResultsUI(results, query, searchContainer);
                        }).catch(err => {
                            // 静默处理搜索错误
                            // 如果错误是 "disconnected"，这是 Pagefind 的内部错误，可以忽略
                            if (err && err.message && !err.message.includes('disconnected')) {
                                console.warn('Search error:', err);
                            }
                            isCustomSearch = false;
                        });
                    }
                });
            }
        }, 500);

        // 删除放大镜图标按钮
        setTimeout(() => {
            const searchContainer = document.querySelector('#search');
            if (searchContainer) {
                // 尝试多种方式找到搜索按钮并删除
                const searchButton = searchContainer.querySelector('.pagefind-ui__search-button') ||
                                    searchContainer.querySelector('button[type="submit"]') ||
                                    searchContainer.querySelector('.pagefind-ui__form button:not(.pagefind-ui__search-clear)') ||
                                    searchContainer.querySelector('button:not(.pagefind-ui__search-clear)');
                if (searchButton) {
                    searchButton.remove();
                }
            }
        }, 200);

        // 监听搜索结果，修改标题显示并过滤不需要的页面
        const searchContainer = document.querySelector('#search');
        if (searchContainer) {
            // 需要过滤的页面 URL
            const excludedUrls = ['/', '/index.html', '/archive/', '/about/'];

            const updateResultTitles = () => {
                // 查找所有搜索结果
                const results = searchContainer.querySelectorAll('.pagefind-ui__result');
                results.forEach((result) => {
                    const titleLink = result.querySelector('.pagefind-ui__result-title a');
                    if (!titleLink) return;

                    const titleText = titleLink.textContent.trim();
                    const href = titleLink.getAttribute('href');

                    // 过滤掉首页、归档、关于我页面
                    if (excludedUrls.includes(href) || excludedUrls.includes(href + '/')) {
                        result.style.display = 'none';
                        return;
                    }

                    const excerpt = result.querySelector('.pagefind-ui__result-excerpt');
                    const excerptText = excerpt ? excerpt.textContent.trim() : '';

                    let newTitle = titleText;

                    // 方法1: 如果标题包含 " - "，只保留前面的部分（文章标题）
                    const separatorIndex = titleText.indexOf(' - ');
                    if (separatorIndex > 0) {
                        newTitle = titleText.substring(0, separatorIndex);
                    }

                    // 方法2: 如果标题是 "deepwhite blog" 或类似，尝试从其他地方获取标题
                    if (newTitle.toLowerCase().includes('deepwhite') ||
                        newTitle.toLowerCase().includes('blog') ||
                        newTitle === '[你的名字]' ||
                        newTitle.includes('[你的名字]')) {

                        // 对于文章页面，尝试从 excerpt 的第一行或 URL 推断
                        const urlPath = href.replace(/\/$/, '').split('/').pop();
                        if (urlPath && urlPath !== 'index.html') {
                            // 如果 excerpt 开头看起来像标题，使用它
                            const firstSentence = excerptText.split[/[。！？\n]/](0);
                            if (firstSentence && firstSentence.length < 50 && !firstSentence.includes('...')) {
                                newTitle = firstSentence.trim();
                            } else {
                                // 否则保持原样或使用 URL 路径名
                                newTitle = urlPath;
                            }
                        }
                    }

                    // 更新标题文本
                    if (newTitle !== titleText && newTitle) {
                        titleLink.textContent = newTitle;
                    }
                });
            };

            const observer = new MutationObserver((mutations) => {
                // 延迟执行，确保 DOM 完全更新
                setTimeout(updateResultTitles, 50);
            });

            // 开始观察搜索容器的变化
            observer.observe(searchContainer, {
                childList: true,
                subtree: true
            });

            // 立即执行一次，以防搜索结果已经渲染
            setTimeout(updateResultTitles, 200);

            // 处理搜索消息文本溢出问题 - 限制关键字显示长度
            const truncateSearchMessage = () => {
                const messageEl = searchContainer.querySelector('.pagefind-ui__message');
                if (messageEl) {
                    const text = messageEl.textContent;
                    // 匹配 "找到 X 个 Y 的相关结果" 格式
                    const match = text.match(/找到\s+(\d+)\s+个\s+(.+?)\s+的相关结果/);
                    if (match) {
                        const keyword = match[2];
                        const maxLength = 15; // 最大显示长度
                        if (keyword.length > maxLength) {
                            const truncatedKeyword = keyword.substring(0, maxLength) + '...';
                            messageEl.textContent = text.replace(keyword, truncatedKeyword);
                        }
                    }
                }
            };

            // 监听搜索消息的变化
            const messageObserver = new MutationObserver(() => {
                setTimeout(truncateSearchMessage, 50);
            });
            messageObserver.observe(searchContainer, {
                childList: true,
                subtree: true,
                characterData: true
            });

            // 实现鼠标离开搜索区域时自动隐藏搜索结果
            let hideTimeout = null;
            let isMouseInSearchArea = false;

            const getSearchInput = () => {
                return searchContainer.querySelector('.pagefind-ui__search-input');
            };

            const getResultsArea = () => {
                return searchContainer.querySelector('.pagefind-ui__results-area');
            };

            const hideResults = () => {
                const resultsArea = getResultsArea();
                if (resultsArea && resultsArea.style.display !== 'none') {
                    resultsArea.style.opacity = '0';
                    resultsArea.style.transform = 'translateY(-8px)';
                    setTimeout(() => {
                        const area = getResultsArea();
                        if (area && !isMouseInSearchArea) {
                            area.style.display = 'none';
                        }
                    }, 200);
                }
            };

            const showResults = () => {
                const resultsArea = getResultsArea();
                if (resultsArea) {
                    resultsArea.style.display = '';
                    // 强制重排以触发动画
                    resultsArea.offsetHeight;
                    resultsArea.style.opacity = '1';
                    resultsArea.style.transform = 'translateY(0)';
                }
            };

            // 检查是否应该隐藏结果
            const checkShouldHide = () => {
                const searchInput = getSearchInput();
                const resultsArea = getResultsArea();

                if (!resultsArea) return;

                // 如果输入框为空，隐藏结果
                if (searchInput && !searchInput.value.trim()) {
                    hideResults();
                    return;
                }

                // 如果鼠标不在搜索区域且输入框未聚焦，隐藏结果
                if (!isMouseInSearchArea &&
                    document.activeElement !== searchInput &&
                    !searchContainer.contains(document.activeElement)) {
                    hideResults();
                }
            };

            // 监听搜索容器的鼠标进入
            searchContainer.addEventListener('mouseenter', () => {
                isMouseInSearchArea = true;
                if (hideTimeout) {
                    clearTimeout(hideTimeout);
                    hideTimeout = null;
                }
                const searchInput = getSearchInput();
                if (searchInput && searchInput.value.trim()) {
                    showResults();
                }
            });

            // 监听搜索容器的鼠标离开
            searchContainer.addEventListener('mouseleave', (e) => {
                // 检查鼠标是否移动到搜索结果区域
                const relatedTarget = e.relatedTarget;
                if (relatedTarget && searchContainer.contains(relatedTarget)) {
                    return; // 鼠标还在搜索区域内
                }

                isMouseInSearchArea = false;
                const searchInput = getSearchInput();

                // 延迟隐藏，给用户时间移动到搜索结果
                hideTimeout = setTimeout(() => {
                    checkShouldHide();
                }, 300);
            });

            // 使用 MutationObserver 监听搜索结果区域的创建
            let resultsAreaBound = false;
            const resultsObserver = new MutationObserver(() => {
                const resultsArea = getResultsArea();

                if (resultsArea && !resultsAreaBound) {
                    resultsAreaBound = true;

                    // 确保搜索结果区域有鼠标事件监听
                    resultsArea.addEventListener('mouseenter', () => {
                        isMouseInSearchArea = true;
                        if (hideTimeout) {
                            clearTimeout(hideTimeout);
                            hideTimeout = null;
                        }
                    });

                    resultsArea.addEventListener('mouseleave', (e) => {
                        const relatedTarget = e.relatedTarget;
                        const searchInput = getSearchInput();
                        // 如果鼠标移动到搜索输入框，不算离开
                        if (relatedTarget === searchInput ||
                            (relatedTarget && searchContainer.contains(relatedTarget))) {
                            return;
                        }
                        isMouseInSearchArea = false;
                        hideTimeout = setTimeout(() => {
                            checkShouldHide();
                        }, 200);
                    });
                } else if (!resultsArea) {
                    resultsAreaBound = false;
                }
            });

            resultsObserver.observe(searchContainer, {
                childList: true,
                subtree: true
            });

            // 监听搜索输入框
            const setupInputListeners = () => {
                const searchInput = getSearchInput();
                if (!searchInput) {
                    // 如果输入框还没创建，稍后重试
                    setTimeout(setupInputListeners, 100);
                    return;
                }

                searchInput.addEventListener('input', () => {
                    if (searchInput.value.trim()) {
                        showResults();
                    } else {
                        hideResults();
                    }
                });

                searchInput.addEventListener('focus', () => {
                    const resultsArea = getResultsArea();
                    if (resultsArea && searchInput.value.trim()) {
                        showResults();
                    }
                });

                searchInput.addEventListener('blur', () => {
                    // 延迟检查，允许点击搜索结果
                    setTimeout(() => {
                        checkShouldHide();
                    }, 200);
                });
            };

            // 初始化输入框监听
            setupInputListeners();

            // 聚焦时隐藏 placeholder
            const searchInput = getSearchInput();
            if (searchInput) {
                searchInput.addEventListener('focus', () => {
                    searchInput.placeholder = '';
                });
                searchInput.addEventListener('blur', () => {
                    if (!searchInput.value) {
                        searchInput.placeholder = '搜索...';
                    }
                });
            }

            // 监听文档点击，点击搜索区域外时隐藏结果
            document.addEventListener('click', (e) => {
                if (!searchContainer.contains(e.target)) {
                    isMouseInSearchArea = false;
                    hideResults();
                }
            });

            // 改进搜索高亮 - 确保整个搜索词都被高亮
            // 使用 mark 标签配合 CSS 实现高亮效果
            const improveHighlighting = () => {
                const searchInput = getSearchInput();
                if (!searchInput) return;

                const searchTerm = searchInput.value.trim();
                if (!searchTerm || searchTerm.length < 2) return;

                // 目标元素：结果标题和摘要
                const elementsToHighlight = searchContainer.querySelectorAll(
                    '.pagefind-ui__result-title, .pagefind-ui__result-excerpt'
                );

                elementsToHighlight.forEach((element) => {
                    const fullText = element.textContent;
                    // 只有当文本包含完整的搜索词时才执行
                    if (fullText.includes(searchTerm)) {
                        // 步骤 1：移除所有现有的高亮标记
                        const existingHighlights = element.querySelectorAll('.pagefind-highlight, mark');
                        existingHighlights.forEach((mark) => {
                            const parent = mark.parentNode;
                            if (parent) {
                                parent.replaceChild(document.createTextNode(mark.textContent), mark);
                                parent.normalize(); // 合并相邻的文本节点
                            }
                        });

                        // 步骤 2：使用 TreeWalker 重新高亮完整的搜索词
                        const walker = document.createTreeWalker(
                            element,
                            NodeFilter.SHOW_TEXT,
                            null
                        );

                        const textNodes = [];
                        let node;
                        while (node = walker.nextNode()) {
                            if (node.textContent.includes(searchTerm)) {
                                textNodes.push(node);
                            }
                        }

                        textNodes.forEach((textNode) => {
                            const parent = textNode.parentNode;
                            if (!parent || parent.classList.contains('pagefind-highlight')) return;

                            const fullText = textNode.textContent;
                            const index = fullText.indexOf(searchTerm);

                            if (index >= 0) {
                                // 分割文本节点并插入 <mark>
                                const beforeText = fullText.substring(0, index);
                                const highlightText = fullText.substring(index, index + searchTerm.length);
                                const afterText = fullText.substring(index + searchTerm.length);

                                const fragment = document.createDocumentFragment();
                                if (beforeText) {
                                    fragment.appendChild(document.createTextNode(beforeText));
                                }
                                const mark = document.createElement('mark');
                                mark.className = 'pagefind-highlight';
                                mark.textContent = highlightText;
                                fragment.appendChild(mark);
                                if (afterText) {
                                    fragment.appendChild(document.createTextNode(afterText));
                                }

                                parent.replaceChild(fragment, textNode);
                            }
                        });
                    }
                });
            };

            // 原来的高亮函数（已禁用，不再添加 mark 标签）
            const improveHighlightingOld = () => {
    const searchInput = getSearchInput();
    if (!searchInput) return;

    const searchTerm = searchInput.value.trim();
    if (!searchTerm || searchTerm.length < 2) return;

    // 目标元素：结果标题和摘要 (确保这里移除了 .pagefind-ui__message)
    const elementsToHighlight = searchContainer.querySelectorAll(
        '.pagefind-ui__result-title, .pagefind-ui__result-excerpt'
    );

    elementsToHighlight.forEach((element) => {
        const fullText = element.textContent;
        // 只有当文本包含完整的搜索词时才执行
        if (fullText.includes(searchTerm)) {

            // 步骤 1：强制移除所有现有的高亮标记 (Pagefind 和上一次的自定义高亮)
            const existingHighlights = element.querySelectorAll('.pagefind-highlight, mark');
            existingHighlights.forEach((mark) => {
                const parent = mark.parentNode;
                if (parent) {
                    parent.replaceChild(document.createTextNode(mark.textContent), mark);
                    parent.normalize(); // 合并相邻的文本节点
                }
            });

            // 步骤 2：使用 TreeWalker 重新高亮完整的搜索词
            const walker = document.createTreeWalker(
                element,
                NodeFilter.SHOW_TEXT,
                null
            );

            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
                if (node.textContent.includes(searchTerm)) {
                    textNodes.push(node);
                }
            }

            textNodes.forEach((textNode) => {
                const parent = textNode.parentNode;
                if (!parent || parent.classList.contains('pagefind-highlight')) return;

                const fullText = textNode.textContent;
                const index = fullText.indexOf(searchTerm);

                if (index >= 0) {
                    // 分割文本节点并插入 <mark>
                    const beforeText = fullText.substring(0, index);
                    const highlightText = fullText.substring(index, index + searchTerm.length);
                    const afterText = fullText.substring(index + searchTerm.length);

                    const fragment = document.createDocumentFragment();
                    if (beforeText) {
                        fragment.appendChild(document.createTextNode(beforeText));
                    }
                    const mark = document.createElement('mark');
                    mark.className = 'pagefind-highlight';
                    mark.textContent = highlightText;
                    fragment.appendChild(mark);
                    if (afterText) {
                        fragment.appendChild(document.createTextNode(afterText));
                    }

                    parent.replaceChild(fragment, textNode);
                }
            });
            // 注意：这里没有 data-highlight-fixed = 'true' 了
        }
    });
};

            // 监听搜索结果更新，改进高亮
            const highlightObserver = new MutationObserver(() => {

                setTimeout(improveHighlighting, 400);
            });

            highlightObserver.observe(searchContainer, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
    });

    // --- 年份导航滚轮功能 ---
    (function() {
        const yearNavigator = document.getElementById('yearNavigator');
        const yearNavItems = document.querySelectorAll('.year-nav-item');
        const yearGroups = document.querySelectorAll('.archive-year-group');

        if (!yearNavigator || yearNavItems.length === 0) return;

        let scrollTimeout;
        let isMouseOver = false;
        let isClickScrolling = false; // 标记是否是点击触发的滚动

        // 显示导航
        function showNavigator() {
            yearNavigator.classList.add('visible');
        }

        // 隐藏导航（仅在鼠标不在导航区域时）
        function hideNavigator() {
            if (!isMouseOver) {
                yearNavigator.classList.remove('visible');
            }
        }

        // 鼠标进入导航区域
        yearNavigator.addEventListener('mouseenter', () => {
            isMouseOver = true;
            showNavigator();
            clearTimeout(scrollTimeout);
        });

        // 鼠标离开导航区域
        yearNavigator.addEventListener('mouseleave', () => {
            isMouseOver = false;
            // 延迟隐藏，给用户时间移回鼠标
            scrollTimeout = setTimeout(() => {
                hideNavigator();
            }, 1000);
        });

        // 高亮当前年份
        function updateActiveYear() {
            const scrollPosition = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // 检查是否滚动到底部
            const isAtBottom = scrollPosition + windowHeight >= documentHeight - 10; // 10px 容差
            // 检查是否滚动到顶部
            const isAtTop = scrollPosition <= 10; // 10px 容差

            let activeYear = null;

            if (isAtBottom && yearGroups.length > 0) {
                // 滚动到底部时，高亮最后一个年份
                const lastGroup = yearGroups[yearGroups.length - 1];
                activeYear = lastGroup.id.replace('year-', '');
            } else if (isAtTop && yearGroups.length > 0) {
                // 滚动到顶部时，高亮第一个年份
                const firstGroup = yearGroups[0];
                activeYear = firstGroup.id.replace('year-', '');
            } else {
                // 正常滚动时，检测当前视口中心位置的年份
                const viewportCenter = scrollPosition + windowHeight / 2;

                yearGroups.forEach((group) => {
                    const rect = group.getBoundingClientRect();
                    const groupTop = rect.top + window.scrollY;
                    const groupBottom = groupTop + rect.height;

                    if (viewportCenter >= groupTop && viewportCenter <= groupBottom) {
                        activeYear = group.id.replace('year-', '');
                    }
                });

                // 如果没有找到匹配的年份，找最接近的
                if (!activeYear && yearGroups.length > 0) {
                    let closestGroup = null;
                    let closestDistance = Infinity;

                    yearGroups.forEach((group) => {
                        const rect = group.getBoundingClientRect();
                        const groupCenter = rect.top + window.scrollY + rect.height / 2;
                        const distance = Math.abs(viewportCenter - groupCenter);

                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestGroup = group;
                        }
                    });

                    if (closestGroup) {
                        activeYear = closestGroup.id.replace('year-', '');
                    }
                }
            }

            yearNavItems.forEach((item) => {
                if (item.dataset.year === activeYear) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }

        // 点击年份跳转
        yearNavItems.forEach((item) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = item.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    const offset = 100; // 距离顶部的偏移
                    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset;

                    // 立即高亮点击的年份
                    yearNavItems.forEach(i => i.classList.remove('active'));
                    item.classList.add('active');

                    // 标记这是点击触发的滚动
                    isClickScrolling = true;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // 滚动完成后，取消标记，允许后续手动滚动时更新高亮
                    setTimeout(() => {
                        isClickScrolling = false;
                    }, 800); // 平滑滚动通常需要 500-800ms
                }
            });
        });

        // 监听滚动（仅当用户手动滚动时更新高亮）
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    showNavigator();

                    // 只有用户手动滚动时才更新高亮（不是点击触发的滚动）
                    if (!isClickScrolling) {
                        updateActiveYear();
                    }

                    // 如果鼠标不在导航区域，延迟隐藏
                    if (!isMouseOver) {
                        clearTimeout(scrollTimeout);
                        scrollTimeout = setTimeout(() => {
                            hideNavigator();
                        }, 2000);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });

        // 初始显示导航
        setTimeout(() => {
            yearNavigator.classList.add('visible');
            updateActiveYear();
        }, 500);
    })();
</script>
