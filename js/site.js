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

  ready(() => {
    importMermaid();
    initFloatingActions();
    initPaginationQuickjump();
  });
})();


