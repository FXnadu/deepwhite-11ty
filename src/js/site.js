(() => {
  const ready = (cb) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb, { once: true });
    } else {
      cb();
    }
  };

  const initMermaidZoomOverlay = () => {
    // 单例浮层，避免重复创建节点
    let overlay = document.getElementById("mermaid-zoom-overlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "mermaid-zoom-overlay";
    overlay.className = "mermaid-zoom-overlay";
    overlay.setAttribute("aria-hidden", "true");

    overlay.innerHTML = `
      <div class="mermaid-zoom-backdrop" data-mermaid-zoom-close></div>
      <div class="mermaid-zoom-dialog" role="dialog" aria-modal="true" aria-label="Mermaid 图放大预览">
        <button type="button" class="mermaid-zoom-close" data-mermaid-zoom-close aria-label="关闭放大视图">
          ✕
        </button>
        <div class="mermaid-zoom-content" id="mermaid-zoom-content"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // 缩放 / 平移状态，仅在浮层打开时启用
    let activeTarget = null;
    let currentScale = 1;
    let translateX = 0;
    let translateY = 0;
    let isPanning = false;
    let lastClientX = 0;
    let lastClientY = 0;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const applyTransform = () => {
      if (!activeTarget) return;
      activeTarget.style.transformOrigin = "center center";
      activeTarget.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    };

    const resetTransform = () => {
      currentScale = 1;
      translateX = 0;
      translateY = 0;
      applyTransform();
    };

    const content = overlay.querySelector("#mermaid-zoom-content");
    if (content) {
      // 鼠标滚轮缩放（桌面端）
      content.addEventListener(
        "wheel",
        (event) => {
          if (!activeTarget) return;
          event.preventDefault();
          const delta = event.deltaY || 0;
          if (!delta) return;

          const zoomFactor = delta < 0 ? 1.12 : 1 / 1.12;
          const nextScale = clamp(currentScale * zoomFactor, 0.6, 4);
          if (Math.abs(nextScale - currentScale) < 0.01) return;
          currentScale = nextScale;
          applyTransform();
        },
        { passive: false }
      );

      // 拖拽平移查看不同区域
      const handlePointerDown = (event) => {
        if (!activeTarget) return;
        if (event.button !== 0) return; // 仅响应左键
        isPanning = true;
        lastClientX = event.clientX;
        lastClientY = event.clientY;
        content.classList.add("is-panning");
        event.preventDefault();
      };

      const handlePointerMove = (event) => {
        if (!isPanning || !activeTarget) return;
        const dx = event.clientX - lastClientX;
        const dy = event.clientY - lastClientY;
        if (!dx && !dy) return;
        lastClientX = event.clientX;
        lastClientY = event.clientY;
        translateX += dx;
        translateY += dy;
        applyTransform();
        event.preventDefault();
      };

      const endPan = () => {
        if (!isPanning) return;
        isPanning = false;
        content.classList.remove("is-panning");
      };

      content.addEventListener("mousedown", handlePointerDown);
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", endPan);
      content.addEventListener("mouseleave", endPan);
    }

    const close = () => {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      const content = overlay.querySelector("#mermaid-zoom-content");
      if (content) {
        content.innerHTML = "";
      }
      document.documentElement.classList.remove("mermaid-zoom-open");
      activeTarget = null;
      resetTransform();
    };

    overlay.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.hasAttribute("data-mermaid-zoom-close")) {
        close();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) {
        close();
      }
    });

    overlay._mermaidClose = close;
    overlay._mermaidZoomApi = {
      setActiveTarget(target) {
        activeTarget = target || null;
        resetTransform();
      },
    };
    return overlay;
  };

  const bindMermaidZoom = () => {
    const mermaidBlocks = document.querySelectorAll(
      ".post-content .mermaid, .page-content .mermaid"
    );
    if (!mermaidBlocks.length) return;

    const overlay = initMermaidZoomOverlay();
    const content = overlay.querySelector("#mermaid-zoom-content");
    if (!content) return;

    const zoomApi = overlay._mermaidZoomApi;

    const openWithSource = (sourceEl) => {
      if (!sourceEl) return;
      const svg = sourceEl.querySelector("svg");
      const target = svg ? svg.cloneNode(true) : sourceEl.cloneNode(true);
      content.innerHTML = "";
      content.appendChild(target);
      if (zoomApi && typeof zoomApi.setActiveTarget === "function") {
        zoomApi.setActiveTarget(target);
      }
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("mermaid-zoom-open");
    };

    mermaidBlocks.forEach((block) => {
      const el = block;
      el.classList.add("mermaid-zoomable");
      if (!el.hasAttribute("tabindex")) {
        el.setAttribute("tabindex", "0");
      }
      if (!el.hasAttribute("role")) {
        el.setAttribute("role", "button");
      }
      if (!el.hasAttribute("aria-label")) {
        el.setAttribute("aria-label", "点击放大查看 Mermaid 图");
      }

      const handleActivate = (event) => {
        if (event.type === "keydown") {
          const keyboardEvent = event;
          if (keyboardEvent.key !== "Enter" && keyboardEvent.key !== " ") return;
          keyboardEvent.preventDefault();
        }
        openWithSource(el);
      };

      el.addEventListener("click", handleActivate);
      el.addEventListener("keydown", handleActivate);
    });
  };

  const importMermaid = async () => {
    const mermaidBlocks = document.querySelectorAll("pre code.language-mermaid");
    if (!mermaidBlocks.length) return;

    try {
      const { default: mermaid } = await import(
        "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs"
      );
      mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
      });

      mermaidBlocks.forEach((code) => {
        const pre = code.parentElement;
        const wrapper = document.createElement("div");
        wrapper.className = "mermaid";
        wrapper.textContent = code.textContent;
        pre.replaceWith(wrapper);
      });

      mermaid.run();
      bindMermaidZoom();
    } catch (error) {
      console.warn("Mermaid 加载失败，已跳过渲染。", error);
    }
  };

  const initFloatingActions = () => {
    const shouldEnable = document.body.dataset.showFloating === "true";
    if (!shouldEnable) return;

    const container = document.getElementById("floating-actions");
    const scrollTopBtn = document.getElementById("action-btn-top");
    if (!container) return;

    let ticking = false;
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        container.classList.add("visible");
      } else {
        container.classList.remove("visible");
      }
    };

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        window.requestAnimationFrame(() => {
          toggleVisibility();
          ticking = false;
        });
        ticking = true;
      },
      { passive: true }
    );

    if (scrollTopBtn) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollTopBtn.addEventListener("click", (event) => {
        event.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      });
    }
  };

  const initPaginationQuickjump = () => {
    const triggers = document.querySelectorAll(".pagination-status");
    if (!triggers.length) return;

    triggers.forEach((trigger) => {
      const panel = trigger.querySelector(".pagination-quickjump");
      if (!panel) return;

      let closeTimer;

      const open = () => {
        window.clearTimeout(closeTimer);
        trigger.classList.add("is-open");
      };

      const scheduleClose = () => {
        window.clearTimeout(closeTimer);
        closeTimer = window.setTimeout(() => {
          trigger.classList.remove("is-open");
        }, 120);
      };

      trigger.addEventListener("mouseenter", open);
      trigger.addEventListener("focusin", open);
      trigger.addEventListener("mouseleave", scheduleClose);
      trigger.addEventListener("focusout", (event) => {
        if (!event.relatedTarget || !trigger.contains(event.relatedTarget)) {
          scheduleClose();
        }
      });

      panel.addEventListener("mouseenter", open);
      panel.addEventListener("mouseleave", scheduleClose);

      trigger.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          trigger.classList.remove("is-open");
        }
      });
    });
  };

  const hydrateContactTemplates = () => {
    const templates = document.querySelectorAll("template[data-contact]");
    if (!templates.length) return;

    const readValue = (template, key) => {
      const partsKey = `${key}Parts`;
      const parts = template.dataset[partsKey];
      if (parts) {
        const separator =
          template.dataset[`${partsKey}Separator`] ||
          template.dataset[`${key}Separator`] ||
          template.dataset[`${key}Sep`] ||
          "|";
        return parts
          .split(separator)
          .map((fragment) => fragment.trim())
          .join("");
      }
      return template.dataset[key] || "";
    };

    const applyClasses = (target, value) => {
      if (!value) return;
      value
        .split(/\s+/)
        .filter(Boolean)
        .forEach((cls) => target.classList.add(cls));
    };

    const buildFallback = (template) => {
      const fallback = readValue(template, "fallback");
      return fallback ? document.createTextNode(fallback) : null;
    };

    templates.forEach((template) => {
      const type = template.dataset.contactType || "email";
      let node = null;

      if (type === "email") {
        const user = readValue(template, "user");
        const domain = readValue(template, "domain");
        const tld = readValue(template, "tld");
        if (!user || !domain) {
          node = buildFallback(template);
        } else {
          const domainSuffix = tld ? `${domain}.${tld}` : domain;
          const email = `${user}@${domainSuffix}`;
          const label = readValue(template, "label") || email;
          const anchor = document.createElement("a");
          anchor.href = `mailto:${email}`;
          anchor.textContent = label;
          const rel = template.dataset.rel;
          if (rel) {
            anchor.rel = rel;
          }
          node = anchor;
        }
      } else if (type === "link") {
        const url = readValue(template, "url");
        if (!url) {
          node = buildFallback(template);
        } else {
          const label = readValue(template, "label") || url;
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.textContent = label;
          const target = template.dataset.target;
          if (target) {
            anchor.target = target;
            if (!template.dataset.rel) {
              anchor.rel = "noopener";
            }
          }
          if (template.dataset.rel) {
            anchor.rel = template.dataset.rel;
          }
          node = anchor;
        }
      } else {
        const text = readValue(template, "label") || readValue(template, "value");
        node = text ? document.createTextNode(text) : buildFallback(template);
      }

      if (!node) return;

      applyClasses(node, template.dataset.contactClass);
      template.replaceWith(node);
    });
  };

  const initFootnotePreview = () => {
    const footnoteItems = document.querySelectorAll(".footnotes li[id]");
    if (!footnoteItems.length) return;

    const footnoteMap = new Map();
    footnoteItems.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.querySelectorAll(".footnote-backref").forEach((backref) => backref.remove());
      const html = clone.innerHTML.trim();
      if (html) {
        footnoteMap.set(item.id, html);
      }
    });

    if (!footnoteMap.size) return;

    const tooltip = document.createElement("div");
    tooltip.id = "footnote-preview-popover";
    tooltip.className = "footnote-preview";
    tooltip.setAttribute("role", "tooltip");
    tooltip.hidden = true;
    document.body.appendChild(tooltip);

    let activeTrigger = null;
    let hideTimer = null;

    const hideTooltip = () => {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (tooltip.hidden) return;
        tooltip.hidden = true;
        tooltip.classList.remove("is-visible");
        tooltip.style.left = "";
        tooltip.style.top = "";
        tooltip.removeAttribute("data-placement");
        if (activeTrigger) {
          activeTrigger.removeAttribute("aria-describedby");
          activeTrigger = null;
        }
      }, 80);
    };

    const positionTooltip = (trigger) => {
      const spacing = 14;
      const rect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
      const minLeft = 16;
      const maxLeft = viewportWidth - tooltipRect.width - 16;
      left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));

      let top = rect.top + scrollY - tooltipRect.height - spacing;
      let placement = "top";

      if (top < scrollY + spacing) {
        top = rect.bottom + scrollY + spacing;
        placement = "bottom";
      }

      tooltip.dataset.placement = placement;
      tooltip.style.left = `${left + scrollX}px`;
      tooltip.style.top = `${Math.max(16, top)}px`;
    };

    const showTooltip = (trigger, content) => {
      window.clearTimeout(hideTimer);
      activeTrigger = trigger;
      trigger.setAttribute("aria-describedby", tooltip.id);
      tooltip.innerHTML = content;
      tooltip.hidden = false;
      tooltip.classList.add("is-visible");
      window.requestAnimationFrame(() => positionTooltip(trigger));
    };

    const attachPreview = (anchor) => {
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const targetId = decodeURIComponent(href.slice(1));
      if (!footnoteMap.has(targetId)) return;
      const content = footnoteMap.get(targetId);

      const handleEnter = () => showTooltip(anchor, content);

      anchor.addEventListener("mouseenter", handleEnter);
      anchor.addEventListener("focus", handleEnter);
      anchor.addEventListener("mouseleave", hideTooltip);
      anchor.addEventListener("blur", hideTooltip);
      anchor.addEventListener("touchstart", handleEnter, { passive: true });
      anchor.addEventListener("touchend", hideTooltip, { passive: true });
      anchor.addEventListener("touchcancel", hideTooltip, { passive: true });
    };

    document
      .querySelectorAll(".footnote-ref a, a.footnote-ref")
      .forEach(attachPreview);

    window.addEventListener("scroll", hideTooltip, { passive: true });
    window.addEventListener("resize", hideTooltip);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideTooltip();
      }
    });
  };

  const initFootnoteNavigation = () => {
    const links = document.querySelectorAll(
      ".footnote-ref a, a.footnote-ref, .footnote-backref"
    );
    if (!links.length) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const highlightClass = "footnote-target-highlight";

    const scrollToTarget = (target) => {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    };

    const highlightTarget = (target) => {
      target.classList.add(highlightClass);
      window.setTimeout(() => {
        target.classList.remove(highlightClass);
      }, 1600);
    };

    const focusTarget = (target) => {
      const hadTabIndex = target.hasAttribute("tabindex");
      if (!hadTabIndex) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus({ preventScroll: true });
      if (!hadTabIndex) {
        const cleanup = () => {
          target.removeAttribute("tabindex");
          target.removeEventListener("blur", cleanup);
        };
        target.addEventListener("blur", cleanup);
      }
    };

    const handleLink = (event) => {
      const anchor = event.currentTarget;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;
      event.preventDefault();
      focusTarget(target);
      scrollToTarget(target);
      highlightTarget(target);
      if (history.replaceState) {
        history.replaceState(null, "", href);
      }
    };

    links.forEach((link) => {
      link.addEventListener("click", handleLink);
    });
  };

  const initAboutContact = () => {
    // 仅在 about 联系区域内初始化，支持多个网格容器
    const contactSection = document.querySelector(".about-section--contact");
    if (!contactSection) return;

    const drawers = contactSection.querySelectorAll("[data-contact-drawer]");
    const triggers = contactSection.querySelectorAll("[data-contact-trigger]");
    let activeType = null;
    let toastTimer = null;

    const closeAll = () => {
      drawers.forEach((drawer) => drawer.classList.remove("is-open"));
      triggers.forEach((trigger) => trigger.classList.remove("is-active"));
    };

    const openDrawer = (type) => {
      const drawer = contactSection.querySelector(
        `[data-contact-drawer=\"${type}\"]`
      );
      const trigger = contactSection.querySelector(
        `[data-contact-trigger=\"${type}\"]`
      );
      if (!drawer || !trigger) return;

      if (activeType === type) {
        closeAll();
        activeType = null;
        return;
      }

      closeAll();
      drawer.classList.add("is-open");
      trigger.classList.add("is-active");
      activeType = type;
    };

    triggers.forEach((trigger) => {
      const type = trigger.dataset.contactTrigger;
      if (!type) return;
      trigger.addEventListener("click", () => openDrawer(type));
    });

    const showToast = (message) => {
      const toast = document.getElementById("about-contact-toast");
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("is-visible");
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 2000);
    };

    const wechatButton = document.querySelector("[data-wechat-id]");
    if (wechatButton) {
      wechatButton.addEventListener("click", async () => {
        const id =
          wechatButton.dataset.wechatId ||
          wechatButton.textContent.trim();
        if (!id) return;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(id);
            showToast("已复制到剪贴板");
          }
        } catch {
          // ignore clipboard errors
        }
      });
    }

    const emailButton = document.querySelector("[data-email-send]");
    if (emailButton) {
      const textarea = document.querySelector("[data-email-body]");
      const baseHref = "mailto:deepwhite86@outlook.com?subject=Contact";

      emailButton.addEventListener("click", () => {
        const body = textarea ? textarea.value.trim() : "";
        const bodyParam = body ? `&body=${encodeURIComponent(body)}` : "";
        const href = `${baseHref}${bodyParam}`;
        window.location.href = href;
      });
    }
  };

  ready(() => {
    importMermaid();
    initFloatingActions();
    initPaginationQuickjump();
    hydrateContactTemplates();
    initFootnotePreview();
    initFootnoteNavigation();
    initAboutContact();
  });
})();


