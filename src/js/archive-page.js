class ArchiveNavigator {
  constructor() {
    this.navigator = document.getElementById("yearNavigator");
    this.navItems = Array.from(document.querySelectorAll(".year-nav-item"));
    this.yearGroups = Array.from(document.querySelectorAll(".archive-year-group"));
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.isHovering = false;
    this.hideTimer = null;
    this.isScrollingToYear = false;

    if (!this.navigator || !this.navItems.length || !this.yearGroups.length) return;

    this.observeYears();
    this.bindEvents();
    this.showNavigator();
  }

  observeYears() {
    if (!("IntersectionObserver" in window)) {
      window.addEventListener("scroll", this.updateActiveByScroll.bind(this), {
        passive: true,
      });
      this.updateActiveByScroll();
      return;
    }

    this.visibleYears = new Map();
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const year = entry.target.dataset.year;
          if (!year) return;
          if (entry.isIntersecting) {
            this.visibleYears.set(year, entry.intersectionRatio);
          } else {
            this.visibleYears.delete(year);
          }
        });
        this.refreshActiveYear();
      },
      { rootMargin: "-35% 0px -35% 0px", threshold: [0, 0.2, 0.5, 0.8, 1] }
    );

    this.yearGroups.forEach((group) => {
      const year = group.id.replace("year-", "");
      group.dataset.year = year;
      this.observer.observe(group);
    });
  }

  bindEvents() {
    this.navItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        event.preventDefault();
        const targetId = item.getAttribute("href");
        const target = document.querySelector(targetId);
        if (!target) return;

        const offset = target.getBoundingClientRect().top + window.scrollY - 100;
        this.isScrollingToYear = true;
        this.setActiveItem(item.dataset.year);

        window.scrollTo({
          top: offset,
          behavior: this.prefersReducedMotion ? "auto" : "smooth",
        });

        window.setTimeout(() => {
          this.isScrollingToYear = false;
        }, 700);
      });
    });

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        window.requestAnimationFrame(() => {
          this.showNavigator();
          this.scheduleHide();
          ticking = false;
        });
        ticking = true;
      },
      { passive: true }
    );

    this.navigator.addEventListener("mouseenter", () => {
      this.isHovering = true;
      this.showNavigator();
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    });

    this.navigator.addEventListener("mouseleave", () => {
      this.isHovering = false;
      this.scheduleHide(1000);
    });
  }

  showNavigator() {
    this.navigator.classList.add("visible");
  }

  scheduleHide(delay = 2000) {
    if (this.isHovering) return;
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    this.hideTimer = window.setTimeout(() => {
      if (!this.isHovering) {
        this.navigator.classList.remove("visible");
      }
    }, delay);
  }

  refreshActiveYear() {
    if (this.isScrollingToYear) return;
    let activeYear = null;
    let bestRatio = 0;

    this.visibleYears.forEach((ratio, year) => {
      if (ratio >= bestRatio) {
        bestRatio = ratio;
        activeYear = year;
      }
    });

    if (!activeYear && this.yearGroups.length) {
      const first = this.yearGroups[0];
      activeYear = first.dataset.year;
    }

    this.setActiveItem(activeYear);
  }

  updateActiveByScroll() {
    if (this.isScrollingToYear) return;
    const viewportCenter = window.scrollY + window.innerHeight / 2;
    let closestYear = null;
    let closestDistance = Infinity;

    this.yearGroups.forEach((group) => {
      const top = group.offsetTop;
      const bottom = top + group.offsetHeight;
      const distance = Math.abs(viewportCenter - (top + bottom) / 2);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestYear = group.dataset.year;
      }
    });

    this.setActiveItem(closestYear);
  }

  setActiveItem(year) {
    if (!year) return;
    this.navItems.forEach((item) => {
      if (item.dataset.year === year) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ArchiveNavigator();
});


