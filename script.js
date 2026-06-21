(function () {
  const projects = window.PORTFOLIO_PROJECTS || [];
  const state = {
    project: projects[0],
    page: 0,
    startX: 0,
    currentX: 0,
    dragging: false,
  };

  const views = {
    home: document.querySelector(".view--home"),
    reader: document.querySelector(".view--reader"),
  };
  const ambient = document.querySelector(".ambient__image");
  const projectShelf = document.getElementById("project-shelf");
  const spread = document.getElementById("spread");
  const stage = document.getElementById("book-stage");
  const pageCurrent = document.getElementById("page-current");
  const pageTotal = document.getElementById("page-total");
  const navPage = document.getElementById("nav-page");
  const navHome = document.getElementById("nav-home");
  const readerTitle = document.getElementById("reader-title");
  const readerDesc = document.getElementById("reader-desc");
  const orientationTitle = document.getElementById("orientation-title");
  const orientationDesc = document.getElementById("orientation-desc");

  function padPage(value) {
    return String(value).padStart(2, "0");
  }

  function pageSrc(index) {
    return `${state.project.assetBase}/page-${padPage(index + 1)}.webp`;
  }

  function isSpreadMode() {
    return state.project.viewMode === "spread";
  }

  function pageStep() {
    return isSpreadMode() ? 2 : 1;
  }

  function normalizePage(index) {
    const maxPage = Math.max(0, state.project.pageCount - 1);
    const bounded = Math.max(0, Math.min(index, maxPage));
    return isSpreadMode() ? bounded - (bounded % 2) : bounded;
  }

  function setAmbient(src) {
    ambient.style.backgroundImage = `url("${src}")`;
  }

  function renderProjectCards() {
    if (!projectShelf) return;

    projectShelf.replaceChildren(
      ...projects.map((project, index) => {
        const article = document.createElement("article");
        article.className = `book-card book-card--${project.orientation || "landscape"}`;
        article.dataset.openProject = project.id;
        article.style.setProperty("--card-index", index);

        const button = document.createElement("button");
        button.className = "book-card__hit";
        button.type = "button";
        button.setAttribute("aria-label", `打开${project.title}`);
        button.addEventListener("click", () => openProject(project.id));
        button.addEventListener("mouseenter", () => setAmbient(project.cover));

        const stack = document.createElement("span");
        stack.className = "book-stack";
        stack.setAttribute("aria-hidden", "true");

        const back = document.createElement("span");
        back.className = "book-stack__sheet book-stack__sheet--back";
        const middle = document.createElement("span");
        middle.className = "book-stack__sheet book-stack__sheet--middle";
        const cover = document.createElement("img");
        cover.className = "book-stack__cover";
        cover.src = project.cover;
        cover.alt = "";
        cover.loading = index === 0 ? "eager" : "lazy";
        cover.decoding = "async";

        stack.append(back, middle, cover);

        const meta = document.createElement("span");
        meta.className = "book-card__meta";
        meta.innerHTML = `
          <span class="book-card__kicker">${project.kicker || project.type}</span>
          <span class="book-card__title">${project.title}</span>
          <span class="book-card__line">${project.line || `${project.year} · ${project.type} · ${project.pageCount} 页`}</span>
        `;

        button.append(stack, meta);
        article.appendChild(button);
        return article;
      })
    );
  }

  function showView(name, hashValue) {
    Object.entries(views).forEach(([key, view]) => {
      view.classList.toggle("is-active", key === name);
    });
    document.body.dataset.view = name;
    if (navPage && name === "home") {
      navPage.textContent = "作品目录";
    }
    if (navHome) {
      navHome.textContent = name === "home" ? "首页" : "返回目录";
    }
    const nextHash = hashValue || name;
    if (window.location.hash !== `#${nextHash}`) {
      window.location.hash = nextHash;
    }
  }

  function renderPage(direction) {
    const src = pageSrc(state.page);
    const next = document.createElement("figure");
    next.className = "page-frame";
    if (isSpreadMode()) {
      next.classList.add("page-frame--spread");
    }
    if (direction) {
      next.classList.add(direction > 0 ? "page-frame--from-right" : "page-frame--from-left");
    }

    if (isSpreadMode()) {
      [state.page, state.page + 1].forEach((pageIndex) => {
        if (pageIndex >= state.project.pageCount) return;
        const page = document.createElement("span");
        page.className = "spread-page";

        const img = document.createElement("img");
        img.src = pageSrc(pageIndex);
        img.alt = `${state.project.title} 第 ${pageIndex + 1} 页`;
        img.loading = pageIndex < 2 ? "eager" : "lazy";
        img.decoding = "async";

        page.appendChild(img);
        next.appendChild(page);
      });
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${state.project.title} 第 ${state.page + 1} 页`;
      img.loading = state.page < 2 ? "eager" : "lazy";
      img.decoding = "async";
      next.appendChild(img);
    }

    spread.replaceChildren(next);
    const currentLabel = isSpreadMode()
      ? `${padPage(state.page + 1)}-${padPage(Math.min(state.page + 2, state.project.pageCount))}`
      : padPage(state.page + 1);
    pageCurrent.textContent = currentLabel;
    pageTotal.textContent = padPage(state.project.pageCount);
    if (navPage) {
      navPage.textContent = `${currentLabel} / ${padPage(state.project.pageCount)}`;
    }
    readerTitle.textContent = state.project.title;
    readerDesc.textContent = state.project.readerDescription || state.project.description || "";
    orientationTitle.textContent = state.project.orientationTitle || "";
    orientationDesc.textContent = state.project.orientationDescription || "";
    views.reader.dataset.orientation = state.project.orientation || "landscape";
    views.reader.dataset.viewMode = state.project.viewMode || "single";
    setAmbient(src);
    preloadNeighbors();
  }

  function preloadNeighbors() {
    const step = pageStep();
    [state.page - step, state.page + step, state.page + 1].forEach((index) => {
      if (index < 0 || index >= state.project.pageCount) return;
      const image = new Image();
      image.src = pageSrc(index);
    });
  }

  function goToPage(index) {
    const next = normalizePage(index);
    if (next === state.page) return;
    const direction = next > state.page ? 1 : -1;
    state.page = next;
    renderPage(direction);
  }

  function openProject(projectId, updateHash = true) {
    const project = projects.find((item) => item.id === projectId) || projects[0];
    if (!project) return;
    state.project = project;
    state.page = 0;
    renderPage(1);
    showView("reader", updateHash ? `reader/${project.id}` : window.location.hash.slice(1));
    stage.focus({ preventScroll: true });
  }

  function handleHash() {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash.startsWith("reader")) {
      const projectId = hash.split(/[=/]/)[1] || state.project.id;
      openProject(projectId, false);
    } else {
      showView("home");
      setAmbient(state.project.cover);
    }
  }

  window.addEventListener("hashchange", handleHash);

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
    if (action === "home") showView("home");
      if (action === "prev") goToPage(state.page - pageStep());
      if (action === "next") goToPage(state.page + pageStep());
    });
  });

  window.addEventListener("keydown", (event) => {
    if (!views.reader.classList.contains("is-active")) return;
    if (event.key === "ArrowLeft") goToPage(state.page - pageStep());
    if (event.key === "ArrowRight") goToPage(state.page + pageStep());
    if (event.key === "Escape") showView("home");
  });

  stage.addEventListener("pointerdown", (event) => {
    state.dragging = true;
    state.startX = event.clientX;
    state.currentX = event.clientX;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-dragging");
  });

  stage.addEventListener("pointermove", (event) => {
    if (!state.dragging) return;
    state.currentX = event.clientX;
    const delta = Math.max(-72, Math.min(72, state.currentX - state.startX));
    spread.style.transform = `translateX(${delta}px) rotateY(${delta / -28}deg)`;
  });

  function endDrag(event) {
    if (!state.dragging) return;
    state.dragging = false;
    stage.releasePointerCapture(event.pointerId);
    stage.classList.remove("is-dragging");
    spread.style.transform = "";
    const delta = state.currentX - state.startX;
    if (Math.abs(delta) > 60) {
      goToPage(delta < 0 ? state.page + pageStep() : state.page - pageStep());
    }
  }

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  if (state.project) {
    renderProjectCards();
    setAmbient(state.project.cover);
    handleHash();
  }
})();
