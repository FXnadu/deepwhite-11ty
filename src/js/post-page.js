class PostPageToc {
  constructor() {
    this.postContent = document.querySelector(".post-content");
    this.tocContainer = document.getElementById("post-toc");
    this.tocList = document.getElementById("toc-list");
    this.floatingToggleBtn = document.getElementById("toc-toggle-btn-floating");
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.pinStorageKey = "toc-pinned";
    this.isPinned = false;
    this.isHovering = false;

    if (!this.postContent || !this.tocContainer || !this.tocList) return;

    this.headings = Array.from(this.postContent.querySelectorAll("h1, h2, h3"));
    if (!this.shouldDisplay()) {
      this.tocContainer.classList.add("hidden");
      if (this.floatingToggleBtn) {
        this.floatingToggleBtn.classList.remove("visible");
      }
      return;
    }

    this.activeId = null;
    this.ensureHeadingIds();
    this.renderToc();
    this.initializeVisibilityState();
    this.setupHoverInteractions();
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

  initializeVisibilityState() {
    const storedPinned = window.localStorage?.getItem(this.pinStorageKey);
    this.isPinned = storedPinned === "true";

    if (this.isPinned) {
      this.tocContainer.classList.remove("hidden");
      this.tocContainer.classList.add("visible", "pinned");
    } else {
      this.tocContainer.classList.add("hidden");
      this.tocContainer.classList.remove("visible", "pinned", "preview");
    }

    this.updateFloatingToggleVisibility();
    this.updateToggleButtonState();
    this.updatePinnedFocusState();
  }

  setupHoverInteractions() {
    const hoverTargets = [this.floatingToggleBtn, this.tocContainer].filter(Boolean);
    if (!hoverTargets.length) return;

    const handleMouseEnter = () => {
      this.isHovering = true;
      if (!this.isPinned) {
        this.showPreview();
      }
      this.updateFloatingToggleVisibility();
    };

    const handleMouseLeave = (event) => {
      const related = event.relatedTarget;
      const movingInside =
        !!related &&
        ((this.tocContainer && this.tocContainer.contains(related)) ||
          (this.floatingToggleBtn && this.floatingToggleBtn.contains(related)));
      if (movingInside) return;

      this.isHovering = false;
      if (!this.isPinned) {
        this.hidePreview();
      }
      this.updateFloatingToggleVisibility();
    };

    hoverTargets.forEach((target) => {
      target.addEventListener("mouseenter", handleMouseEnter);
      target.addEventListener("mouseleave", handleMouseLeave);
    });
  }

  showPreview() {
    this.tocContainer.classList.remove("hidden");
    this.tocContainer.classList.add("visible", "preview");
    this.tocContainer.classList.remove("pinned");
  }

  hidePreview() {
    this.tocContainer.classList.remove("visible", "preview");
    this.tocContainer.classList.add("hidden");
  }

  setFloatingToggleVisibility(visible) {
    if (!this.floatingToggleBtn) return;
    this.floatingToggleBtn.classList.toggle("visible", visible);
  }

  updateFloatingToggleVisibility() {
    const shouldShow = !this.isPinned || this.isHovering;
    this.setFloatingToggleVisibility(shouldShow);
  }

  updateToggleButtonState() {
    if (!this.floatingToggleBtn) return;
    this.floatingToggleBtn.classList.toggle("active", this.isPinned);
    this.floatingToggleBtn.setAttribute("aria-pressed", String(this.isPinned));
    const label = this.isPinned ? "点击隐藏目录" : "点击固定目录";
    this.floatingToggleBtn.setAttribute("title", label);
    this.floatingToggleBtn.setAttribute("aria-label", label);
  }

  togglePinnedState() {
    const nextPinned = !this.isPinned;
    this.isPinned = nextPinned;

    if (nextPinned) {
      this.tocContainer.classList.remove("hidden", "preview");
      this.tocContainer.classList.add("visible", "pinned");
    } else if (this.isHovering) {
      this.showPreview();
    } else {
      this.hidePreview();
    }

    window.localStorage?.setItem(this.pinStorageKey, String(nextPinned));
    this.updateToggleButtonState();
    this.updatePinnedFocusState();
    this.updateFloatingToggleVisibility();
  }

  registerEvents() {
    this.floatingToggleBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      this.togglePinnedState();
    });

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

    const nearTop = window.scrollY <= 10;
    if (!activeId) {
      if (nearTop) {
        activeId = this.headings[0]?.id || null;
      } else {
        activeId = this.activeId || this.headings[this.headings.length - 1]?.id || null;
      }
    } else if (nearTop && activeId !== this.headings[0]?.id) {
      activeId = this.headings[0]?.id || activeId;
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
    const nearTop = window.scrollY <= 10;
    if (activeId === this.activeId) {
      if (nearTop) {
        const existingActive = this.tocList.querySelector(`a[href="#${activeId}"]`);
        this.keepActiveLinkVisible(existingActive);
      }
      return;
    }
    this.activeId = activeId;

    this.tocList.querySelectorAll("a").forEach((link) => {
      const isActive = link.getAttribute("href") === `#${activeId}`;
      link.classList.toggle("active", isActive);
      if (isActive) {
        this.keepActiveLinkVisible(link);
      }
    });

    this.updatePinnedFocusState();
  }

  updatePinnedFocusState() {
    if (!this.tocContainer) return;
    const shouldFocus = this.isPinned && Boolean(this.activeId);
    this.tocContainer.classList.toggle("focus-active", shouldFocus);
  }

  keepActiveLinkVisible(link) {
    if (!link || !this.tocList) return;
    const container = this.tocList;
    const linkTop = link.offsetTop;
    const linkBottom = linkTop + link.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;
    const behavior = this.prefersReducedMotion ? "auto" : "smooth";
    const nearTop = window.scrollY <= 10;
    const isFirstHeadingActive = this.headings[0]?.id === this.activeId;
    const shouldSnapToTop = nearTop || isFirstHeadingActive;

    if (shouldSnapToTop) {
      if (typeof container.scrollTo === "function") {
        container.scrollTo({ top: 0, behavior });
      } else {
        container.scrollTop = 0;
      }
      return;
    }

    if (linkTop - 12 < viewTop) {
      const targetTop = Math.max(linkTop - 12, 0);
      if (Math.abs(targetTop - container.scrollTop) > 1) {
        if (typeof container.scrollTo === "function") {
          container.scrollTo({ top: targetTop, behavior });
        } else {
          container.scrollTop = targetTop;
        }
      }
    } else if (linkBottom + 12 > viewBottom) {
      const targetBottom = linkBottom - container.clientHeight + 12;
      if (Math.abs(targetBottom - container.scrollTop) > 1) {
        if (typeof container.scrollTo === "function") {
          container.scrollTo({ top: targetBottom, behavior });
        } else {
          container.scrollTop = targetBottom;
        }
      }
    }
  }
}

class CodeBlockCopy {
  constructor() {
    this.codeSelector = ".post-content pre > code, .page-content pre > code";
    this.codeBlocks = Array.from(document.querySelectorAll(this.codeSelector)).filter(
      (code) => !code.closest("pre")?.classList.contains("language-mermaid")
    );
    if (!this.codeBlocks.length) return;

    this.toastTimer = null;
    this.toast = this.createToast();
    this.injectButtons();
  }

  injectButtons() {
    this.codeBlocks.forEach((code) => {
      const pre = code.closest("pre");
      if (!pre || pre.dataset.copyBound === "true") return;

      pre.dataset.copyBound = "true";
      pre.classList.add("has-copy-btn");
      const button = this.createCopyButton(code);
      pre.appendChild(button);
    });
  }

  createCopyButton(code) {
    const languageClass =
      Array.from(code.classList).find((cls) => cls.startsWith("language-")) || "";
    const language = languageClass.replace("language-", "");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code-btn";
    const label = language ? `复制 ${language} 代码` : "复制代码";
    button.setAttribute("aria-label", label);
    button.innerHTML = `<span class="copy-code-btn__text">复制</span>`;

    button.addEventListener("click", async () => {
      const text = code.innerText;
      const textEl = button.querySelector(".copy-code-btn__text");
      this.swapButtonText(textEl, "复制中...");
      try {
        await this.copyToClipboard(text);
        this.swapButtonText(textEl, "已复制");
        this.showToast("代码已复制到剪贴板");
      } catch (error) {
        console.warn("复制失败：", error);
        this.swapButtonText(textEl, "复制失败");
        this.showToast("复制失败，请手动复制");
      } finally {
        window.setTimeout(() => {
          this.swapButtonText(textEl, "复制");
        }, 1500);
      }
    });

    return button;
  }

  swapButtonText(textEl, nextText) {
    if (!textEl || textEl.textContent === nextText) return;

    const transitionClass = "copy-code-btn__text--transition";
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      textEl.textContent = nextText;
      return;
    }

    const handleTransitionEnd = (event) => {
      if (event.propertyName !== "opacity") return;
      textEl.removeEventListener("transitionend", handleTransitionEnd);
      textEl.textContent = nextText;
      requestAnimationFrame(() => {
        textEl.classList.remove(transitionClass);
      });
    };

    textEl.removeEventListener("transitionend", textEl._copyTransitionHandler);
    textEl._copyTransitionHandler = handleTransitionEnd;
    textEl.addEventListener("transitionend", handleTransitionEnd);

    window.clearTimeout(textEl._copyTransitionFallback);
    textEl._copyTransitionFallback = window.setTimeout(() => {
      textEl.removeEventListener("transitionend", handleTransitionEnd);
      textEl.textContent = nextText;
      textEl.classList.remove(transitionClass);
    }, 250);

    requestAnimationFrame(() => {
      textEl.classList.add(transitionClass);
    });
  }

  async copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    const selection = document.getSelection();
    const selected = selection?.rangeCount ? selection.getRangeAt(0) : null;
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
      if (selected) {
        selection.removeAllRanges();
        selection.addRange(selected);
      }
    }
  }

  createToast() {
    const toast = document.createElement("div");
    toast.className = "copy-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
    return toast;
  }

  showToast(message) {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.classList.add("visible");
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove("visible");
    }, 2200);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PostPageToc();
  new CodeBlockCopy();
});


