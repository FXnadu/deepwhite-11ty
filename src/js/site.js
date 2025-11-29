(() => {
  const ready = (cb) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", cb, { once: true });
    } else {
      cb();
    }
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


