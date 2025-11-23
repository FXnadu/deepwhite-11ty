---
layout: "base.njk"
title: "文章归档"
extraCss: "/css/archive.css"
extraJs: "/js/search.js"
showFloatingActions: true
---

<header class="page-header">
    <h1 class="page-title">文章归档</h1>

{# --- Simple Search --- #}
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

{# --- 年份导航滚轮功能 --- #}
<script>
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
