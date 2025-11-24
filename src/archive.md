---
layout: "base.njk"
title: "文章归档"
extraCss: "/css/archive.css"
extraJs:
  - "/js/search.js"
  - "/js/archive-page.js"
showFloatingActions: true
---

<header class="page-header">
    <h1 class="page-title">文章归档</h1>

<div id="search" class="archive-search"></div>
</header>

<div class="archive-container">
    {%- set years = collections.postsByYear | dictsort | reverse -%}

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
