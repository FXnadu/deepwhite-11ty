class PostPageToc {
  constructor() {
    this.postContent = document.querySelector(".post-content");
    this.tocContainer = document.getElementById("post-toc");
    this.tocList = document.getElementById("toc-list");
    this.toggleBtn = document.getElementById("toc-toggle-btn");
    this.floatingToggleBtn = document.getElementById("toc-toggle-btn-floating");
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.visibilityKey = "toc-visible";

    if (!this.postContent || !this.tocContainer || !this.tocList) return;

    this.headings = Array.from(this.postContent.querySelectorAll("h1, h2, h3"));
    if (!this.shouldDisplay()) {
      this.tocContainer.classList.add("hidden");
      if (this.floatingToggleBtn) {
        this.floatingToggleBtn.classList.remove("visible");
      }
      return;
    }

    this.ensureHeadingIds();
    this.renderToc();
    this.restoreVisibility();
    this.registerEvents();
    this.observeHeadings();
  }

  shouldDisplay() {
    const h1Count = this.headings.filter((heading) => heading.tagName === "H1").length;
    const h2Count = this.headings.filter((heading) => heading.tagName === "H2").length;
    return h1Count >= 3 || h2Count >= 3;
  }

  slugify(text, index) {
    const slug = text
      .trim()
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || `heading-${index}`;
  }

  ensureHeadingIds() {
    const existingIds = new Set();
    this.headings.forEach((heading, index) => {
      if (!heading.id) {
        let candidate = this.slugify(heading.textContent, index);
        while (existingIds.has(candidate)) {
          candidate = `${candidate}-${index}`;
        }
        heading.id = candidate;
      }
      existingIds.add(heading.id);
    });
  }

  renderToc() {
    const fragment = document.createDocumentFragment();
    let currentH2Item = null;

    this.headings.forEach((heading) => {
      const level = parseInt(heading.tagName.slice(1), 10);
      const listItem = document.createElement("li");
      if (level === 1) listItem.classList.add("toc-h1");

      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent.trim();
      listItem.appendChild(link);

      if (level === 3 && currentH2Item) {
        let subList = currentH2Item.querySelector("ul");
        if (!subList) {
          subList = document.createElement("ul");
          currentH2Item.appendChild(subList);
        }
        subList.appendChild(listItem);
        return;
      }

      if (level === 2) {
        currentH2Item = listItem;
      } else if (level === 1) {
        currentH2Item = null;
      }

      fragment.appendChild(listItem);
    });

    this.tocList.innerHTML = "";
    this.tocList.appendChild(fragment);
    this.tocContainer.classList.add("visible");
  }

  restoreVisibility() {
    const stored = window.localStorage?.getItem(this.visibilityKey);
    const shouldShow = stored === null ? true : stored === "true";
    this.applyVisibility(shouldShow);
  }

  applyVisibility(visible) {
    if (visible) {
      this.tocContainer.classList.remove("hidden");
      if (this.floatingToggleBtn) {
        this.floatingToggleBtn.classList.remove("visible");
      }
    } else {
      this.tocContainer.classList.add("hidden");
      if (this.floatingToggleBtn) {
        this.floatingToggleBtn.classList.add("visible");
      }
    }
    window.localStorage?.setItem(this.visibilityKey, String(visible));
  }

  registerEvents() {
    const toggleHandler = () => {
      const isHidden = this.tocContainer.classList.contains("hidden");
      this.applyVisibility(isHidden);
    };

    this.toggleBtn?.addEventListener("click", toggleHandler);
    this.floatingToggleBtn?.addEventListener("click", toggleHandler);

    this.tocList.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const targetId = link.getAttribute("href")?.slice(1);
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (!target) return;

        const offset = target.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({
          top: offset,
          behavior: this.prefersReducedMotion ? "auto" : "smooth",
        });
      });
    });
  }

  observeHeadings() {
    if (!("IntersectionObserver" in window)) {
      window.addEventListener("scroll", this.updateActiveHeadingFallback.bind(this), {
        passive: true,
      });
      this.updateActiveHeadingFallback();
      return;
    }

    this.visibleMap = new Map();
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          if (!id) return;
          if (entry.isIntersecting) {
            this.visibleMap.set(id, entry.intersectionRatio);
          } else {
            this.visibleMap.delete(id);
          }
        });
        this.updateActiveHeading();
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.3, 0.6, 1] }
    );

    this.headings.forEach((heading) => this.observer.observe(heading));
  }

  updateActiveHeading() {
    if (!this.visibleMap) return;
    let activeId = null;
    let bestRatio = 0;

    this.visibleMap.forEach((ratio, id) => {
      if (ratio >= bestRatio) {
        bestRatio = ratio;
        activeId = id;
      }
    });

    if (!activeId) {
      const firstHeading = this.headings[0];
      activeId = firstHeading?.id || null;
    }

    this.setActiveLink(activeId);
  }

  updateActiveHeadingFallback() {
    const scrollPosition = window.scrollY + window.innerHeight * 0.3;
    let activeId = null;

    for (let i = this.headings.length - 1; i >= 0; i -= 1) {
      const heading = this.headings[i];
      if (heading.offsetTop <= scrollPosition) {
        activeId = heading.id;
        break;
      }
    }

    this.setActiveLink(activeId);
  }

  setActiveLink(activeId) {
    if (!activeId) return;
    this.tocList.querySelectorAll("a").forEach((link) => {
      if (link.getAttribute("href") === `#${activeId}`) {
        link.classList.add("active");
        const parent = link.closest("li");
        if (parent) {
          parent.scrollIntoView({ block: "nearest" });
        }
      } else {
        link.classList.remove("active");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PostPageToc();
});


