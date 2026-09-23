(() => {
  const config = window.HOW_TO_HELP_CONFIG || {};
  const storageKey = "how-to-help:v1";
  const headingNames = new Set(["house stuff", "miri help", "avi help", "sophie and tal help", "projects"]);
  const stopMarkerNames = new Set(["end", "website end", "end website", "[[end]]", "[[website end]]"]);
  const defaultSettings = {
    style: "cozy",
    openDescriptions: false,
    showProjects: false,
    compact: false,
    docTextUrl: "",
    order: {}
  };
  let settings = loadSettings();
  let parsedSections = [];
  let activePhotoIndex = 0;
  let photoCloseTimer = null;
  let photoReturnFocus = null;
  let shareCopyTimer = null;
  const galleryImages = [
    { name: "hospital-family-bed.jpg", alt: "Tal, Sophie, Miri, and Avi in the hospital room", position: "50% 42%" },
    { name: "miri-meets-avi.jpg", alt: "Miri meeting Avi in the hospital", position: "50% 34%" },
    { name: "sophie-and-avi-hospital.jpg", alt: "Sophie holding Avi in the hospital", position: "58% 42%" },
    { name: "avi-newborn-portrait.jpg", alt: "Avi sleeping as a newborn", position: "50% 36%" },
    { name: "sophie-wearing-avi.jpg", alt: "Sophie wearing Avi in a wrap", position: "58% 45%" },
    { name: "ride-home-with-avi.jpg", alt: "Tal, Sophie, and Avi riding home", position: "52% 50%" },
    { name: "miri-checking-on-avi.jpg", alt: "Miri checking on Avi at home", position: "45% 44%" },
    { name: "sophie-holding-avi-window.jpg", alt: "Sophie holding Avi by the window", position: "58% 42%" },
    { name: "miri-and-avi-with-grandma.jpg", alt: "Miri and Avi sitting with grandma", position: "55% 45%" },
    { name: "miri-playground-piggyback.jpg", alt: "Miri getting a playground piggyback ride", position: "50% 30%" },
    { name: "siblings-car-seats.jpg", alt: "Miri and Avi in their car seats", position: "54% 50%" },
    { name: "family-meets-avi.jpg", alt: "Family meeting Avi at home", position: "62% 45%" },
    { name: "miri-and-avi.jpg", alt: "Miri holding Avi at home", position: "52% 38%" },
    { name: "grandpa-miri-avi-car.jpg", alt: "Miri, Avi, and grandpa in the car", position: "48% 42%" },
    { name: "grandma-reading-with-kids.jpg", alt: "Grandma reading with kids", position: "58% 44%" }
  ];

  function loadSettings() {
    try {
      const loaded = { ...defaultSettings, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
      if (loaded.style === "bright") loaded.style = "bloom";
      return loaded;
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings() {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }

  function cleanShareUrl() {
    if (config.liveSiteUrl) return config.liveSiteUrl;
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    return url.href;
  }

  function stripBullet(line) {
    return line.replace(/^[\s\t]*([•*\\-]|◦|‣)\s*/u, "").replace(/^\t+/, "").trim();
  }

  function slug(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function parseTitleDescription(text) {
    const clean = text.trim();
    const idx = clean.indexOf(" - ");
    if (idx > 0) {
      return {
        title: clean.slice(0, idx).trim(),
        description: clean.slice(idx + 3).trim()
      };
    }
    return { title: clean, description: "" };
  }

  function parseDocText(text) {
    const lines = String(text || "")
      .replace(/\\n/g, "\n")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const sections = [];
    let current = null;

    for (const raw of lines) {
      const line = stripBullet(raw);
      const lower = line.toLowerCase();
      if (stopMarkerNames.has(lower)) break;
      if (lower === "things to help with") continue;
      if (headingNames.has(lower)) {
        current = { id: slug(line), title: line, items: [] };
        sections.push(current);
        continue;
      }
      if (!current) continue;
      const item = parseTitleDescription(line);
      if (!item.title) continue;
      current.items.push({
        id: `${current.id}-${slug(item.title).slice(0, 48)}`,
        title: item.title,
        description: item.description
      });
    }
    return sections.filter((section) => section.items.length);
  }

  async function getLiveText() {
    const customUrl = settings.docTextUrl || "";
    const exportUrl = `https://docs.google.com/document/d/${config.docId}/export?format=txt`;
    const candidates = [
      customUrl,
      config.publishedTextUrl,
      toTextExportUrl(config.publishedDocUrl),
      config.publishedDocUrl,
      exportUrl
    ].filter(Boolean);
    for (const url of candidates) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) continue;
        const text = normalizeFetchedDocText(await response.text());
        const sections = parseDocText(text);
        if (sections.length) return { text, source: "Published Google Doc" };
      } catch {
        // Browser CORS commonly blocks Google Docs exports. The bundled snapshot keeps the page useful.
      }
    }
    return { text: config.fallbackText || "", source: "Snapshot from Google Doc" };
  }

  function toTextExportUrl(url) {
    if (!url) return "";
    if (url.includes("output=txt")) return url;
    return `${url}${url.includes("?") ? "&" : "?"}output=txt`;
  }

  function normalizeFetchedDocText(text) {
    const raw = String(text || "");
    if (!/^\s*</.test(raw) || typeof DOMParser === "undefined") return raw;
    const doc = new DOMParser().parseFromString(raw, "text/html");
    doc.querySelectorAll("script, style, noscript").forEach((node) => node.remove());
    const content = doc.querySelector(".doc-content, #contents, #content, main, body");
    return (content?.innerText || content?.textContent || raw).replace(/\u00a0/g, " ");
  }

  function applySettingsToPage() {
    document.body.dataset.style = settings.style;
    document.body.classList.toggle("is-compact", Boolean(settings.compact));
    document.querySelectorAll("[data-style-option]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.styleOption === settings.style);
    });
    document.querySelectorAll("[data-setting]").forEach((input) => {
      input.checked = Boolean(settings[input.dataset.setting]);
    });
    const docInput = document.querySelector("[data-doc-url]");
    if (docInput) docInput.value = settings.docTextUrl || "";
  }

  function renderTabs(sections) {
    const tabs = document.querySelector("[data-section-tabs]");
    if (!tabs) return;
    tabs.innerHTML = sections
      .map((section) => `<a href="#${section.id}">${section.title}</a>`)
      .join("");
  }

  function orderedItems(section) {
    const savedOrder = Array.isArray(settings.order?.[section.id]) ? settings.order[section.id] : [];
    const byId = new Map(section.items.map((item) => [item.id, item]));
    const ordered = savedOrder.map((id) => byId.get(id)).filter(Boolean);
    const remaining = section.items.filter((item) => !savedOrder.includes(item.id));
    return [...ordered, ...remaining];
  }

  function saveOrder(sectionId, items) {
    settings.order = settings.order || {};
    settings.order[sectionId] = items.map((item) => item.id);
    saveSettings();
  }

  function moveItem(sectionId, itemId, direction) {
    const section = parsedSections.find((candidate) => candidate.id === sectionId);
    if (!section) return;
    const items = orderedItems(section);
    const index = items.findIndex((item) => item.id === itemId);
    if (index < 0) return;
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const [item] = items.splice(index, 1);
    items.splice(nextIndex, 0, item);
    saveOrder(sectionId, items);
    renderSections(parsedSections);
  }

  function photoBreak(index) {
    const imageSets = [
      [9, 1, 14],
      [2, 3, 4],
      [5, 7, 11],
      [6, 13, 10]
    ];
    const images = imageSets[index % imageSets.length];
    return `<div class="photo-break" style="--photo-count:${images.length}">
      ${images.map((galleryIndex) => {
        const image = galleryImages[galleryIndex];
        return `<button type="button" class="photo-thumb" data-gallery-index="${galleryIndex}" aria-label="Open photo: ${escapeHtml(image.alt)}">
          <img src="${photoSrc(image)}" style="object-position:${image.position}" alt="">
        </button>`;
      }).join("")}
    </div>`;
  }

  function photoSrc(image) {
    const root = document.body.dataset.assetRoot || "../assets";
    return `${root}/${image.name}`;
  }

  function renderSections(sections) {
    const host = document.querySelector("[data-sections]");
    if (!host) return;
    host.innerHTML = sections
      .map((section, index) => {
        const items = orderedItems(section);
        const isProjects = section.id === "projects";
        const projectsVisible = !isProjects || Boolean(settings.showProjects);
        const previewProjectCount = 2;
        const visibleItems = isProjects && !projectsVisible ? items.slice(0, previewProjectCount) : items;
        const hasProjectPreview = isProjects && !projectsVisible && items.length > 0;
        const itemHtml = visibleItems
          .map((item, itemIndex) => {
            const hasDescription = Boolean(item.description);
            const isPreview = hasProjectPreview;
            const open = settings.openDescriptions && hasDescription && !isPreview;
            const main = hasDescription
              ? `<button type="button" class="card-main" ${isPreview ? "tabindex=\"-1\"" : "data-toggle-card"} aria-expanded="${open ? "true" : "false"}">
                  <span class="item-title">${escapeHtml(item.title)}</span>
                  <span class="expand-mark" aria-hidden="true">⌄</span>
                </button>`
              : `<div class="card-main card-static">
                  <span class="item-title">${escapeHtml(item.title)}</span>
                </div>`;
            const details = hasDescription
              ? `<div class="item-details" ${open ? "" : "hidden"}>
                  <p>${escapeHtml(item.description)}</p>
                </div>`
              : "";
            return `<article class="help-card ${hasDescription ? "has-description" : "is-static"} ${isPreview ? "is-project-preview" : ""}" data-section-id="${section.id}" data-item-id="${item.id}">
              ${main}
              ${details}
            </article>`;
          })
          .join("");
        const sectionPhotos = index > 0 && projectsVisible ? photoBreak(index - 1) : "";
        const projectOverlay = hasProjectPreview
          ? `<div class="projects-preview-fade">
              <button type="button" class="projects-toggle projects-overlay-button" data-toggle-projects aria-expanded="false">Show all projects</button>
            </div>`
          : "";
        const projectFooter = isProjects && projectsVisible
          ? `<button type="button" class="projects-hide-link" data-toggle-projects aria-expanded="true">Hide projects</button>`
          : "";
        const sectionHtml = `<section class="help-section" id="${section.id}" style="--section-index:${index}">
          <header>
            <h3>${escapeHtml(section.title)}</h3>
          </header>
          ${sectionPhotos}
          <div class="help-list ${hasProjectPreview ? "has-project-preview" : ""}">${itemHtml}${projectOverlay}</div>
          ${projectFooter}
        </section>`;
        return sectionHtml;
      })
      .join("");
  }

  function setDescriptionCards(open) {
    document.querySelectorAll(".help-card.has-description").forEach((card) => {
      const toggle = card.querySelector("[data-toggle-card]");
      const details = card.querySelector(".item-details");
      if (!toggle || !details) return;
      toggle.setAttribute("aria-expanded", String(open));
      details.hidden = !open;
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function updatePhoto(index) {
    const modal = document.querySelector("[data-photo-lightbox]");
    const image = modal?.querySelector("[data-photo-full]");
    const caption = modal?.querySelector("[data-photo-caption]");
    if (!modal || !image || !caption) return;
    activePhotoIndex = (index + galleryImages.length) % galleryImages.length;
    const current = galleryImages[activePhotoIndex];
    image.src = photoSrc(current);
    image.alt = current.alt;
    caption.textContent = `${activePhotoIndex + 1} / ${galleryImages.length}`;
  }

  function openPhoto(index) {
    const modal = document.querySelector("[data-photo-lightbox]");
    if (!modal) return;
    clearTimeout(photoCloseTimer);
    photoReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    updatePhoto(Number(index) || 0);
    modal.hidden = false;
    modal.classList.remove("is-closing");
    document.body.classList.add("photo-modal-open");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    modal.querySelector(".photo-frame")?.focus({ preventScroll: true });
  }

  function closePhoto() {
    const modal = document.querySelector("[data-photo-lightbox]");
    if (!modal || modal.hidden) return;
    clearTimeout(photoCloseTimer);
    modal.classList.remove("is-open");
    modal.classList.add("is-closing");
    document.body.classList.remove("photo-modal-open");
    photoCloseTimer = setTimeout(() => {
      modal.hidden = true;
      modal.classList.remove("is-closing");
      photoReturnFocus?.focus?.({ preventScroll: true });
      photoReturnFocus = null;
    }, 240);
  }

  function shiftPhoto(direction) {
    updatePhoto(activePhotoIndex + direction);
  }

  function updateShareUi(copied = false) {
    const url = cleanShareUrl();
    const input = document.querySelector("[data-share-url]");
    const copyButton = document.querySelector("[data-copy-share]");
    const status = document.querySelector("[data-copy-status]");
    if (input) input.value = url;
    if (copyButton) copyButton.textContent = copied ? "Copied" : "Copy";
    if (status) status.textContent = copied ? "Copied to clipboard." : "";
  }

  function markShareCopied() {
    window.clearTimeout(shareCopyTimer);
    updateShareUi(true);
    shareCopyTimer = window.setTimeout(() => updateShareUi(false), 1800);
  }

  function fallbackCopy(text) {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.top = "-9999px";
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      markShareCopied();
    } finally {
      input.remove();
    }
  }

  function copyShareUrl() {
    const url = cleanShareUrl();
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard.writeText(url).then(markShareCopied).catch(() => fallbackCopy(url));
      return;
    }
    fallbackCopy(url);
  }

  function openShare() {
    window.clearTimeout(shareCopyTimer);
    updateShareUi(false);
    document.querySelector("[data-share-modal]")?.removeAttribute("hidden");
  }

  function closeShare() {
    window.clearTimeout(shareCopyTimer);
    updateShareUi(false);
    document.querySelector("[data-share-modal]")?.setAttribute("hidden", "");
  }

  function openInstall() {
    document.querySelector("[data-install-modal]")?.removeAttribute("hidden");
  }

  function closeInstall() {
    document.querySelector("[data-install-modal]")?.setAttribute("hidden", "");
  }

  function bindInteractions() {
    document.addEventListener("click", (event) => {
      const galleryButton = event.target.closest("[data-gallery-index]");
      if (galleryButton) {
        openPhoto(galleryButton.dataset.galleryIndex);
        return;
      }

      const toggle = event.target.closest("[data-toggle-card]");
      if (toggle) {
        const card = toggle.closest(".help-card");
        const details = card.querySelector(".item-details");
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        details.hidden = expanded;
        return;
      }

      const moveHandle = event.target.closest("[data-move-handle]");
      if (moveHandle) {
        const card = moveHandle.closest(".help-card");
        const controls = card.querySelector(".move-controls");
        const expanded = moveHandle.getAttribute("aria-expanded") === "true";
        document.querySelectorAll(".help-card.is-moving").forEach((openCard) => {
          if (openCard !== card) {
            openCard.classList.remove("is-moving");
            openCard.querySelector("[data-move-handle]")?.setAttribute("aria-expanded", "false");
            openCard.querySelector(".move-controls")?.setAttribute("hidden", "");
          }
        });
        moveHandle.setAttribute("aria-expanded", String(!expanded));
        card.classList.toggle("is-moving", !expanded);
        controls.hidden = expanded;
        return;
      }

      const moveButton = event.target.closest("[data-move-item]");
      if (moveButton) {
        moveItem(moveButton.dataset.sectionId, moveButton.dataset.itemId, moveButton.dataset.moveItem);
        return;
      }

      if (event.target.closest("[data-toggle-projects]")) {
        settings.showProjects = !settings.showProjects;
        saveSettings();
        applySettingsToPage();
        renderSections(parsedSections);
        return;
      }

      if (event.target.closest("[data-open-settings]")) openModal("settings");
      if (
        event.target.closest("[data-close-settings]") ||
        event.target === document.querySelector("[data-settings-backdrop]") ||
        event.target === document.querySelector("[data-settings-modal]")
      ) closeModal("settings");
      if (event.target.closest("[data-open-share]")) openShare();
      if (
        event.target.closest("[data-close-share]") ||
        event.target === document.querySelector("[data-share-modal]")
      ) closeShare();
      if (event.target.closest("[data-copy-share]")) copyShareUrl();
      if (event.target.closest("[data-open-install-from-share]")) {
        closeShare();
        openInstall();
      }
      if (event.target.closest("[data-close-install]") || event.target === document.querySelector("[data-install-modal]")) closeInstall();
      if (event.target.closest("[data-close-photo]") || event.target === document.querySelector("[data-photo-lightbox]")) closePhoto();
      if (event.target.closest("[data-photo-prev]")) shiftPhoto(-1);
      if (event.target.closest("[data-photo-next]")) shiftPhoto(1);
      if (event.target.closest("[data-scroll-to-list]")) document.querySelector("[data-sections]")?.scrollIntoView({ behavior: "smooth" });

      const styleButton = event.target.closest("[data-style-option]");
      if (styleButton) {
        settings.style = styleButton.dataset.styleOption;
        saveSettings();
        applySettingsToPage();
      }

      if (event.target.closest("[data-save-settings]")) {
        document.querySelectorAll("[data-setting]").forEach((input) => {
          settings[input.dataset.setting] = input.checked;
        });
        const docInput = document.querySelector("[data-doc-url]");
        settings.docTextUrl = docInput ? docInput.value.trim() : "";
        saveSettings();
        applySettingsToPage();
        renderSections(parsedSections);
        closeModal("settings");
        refreshContent();
      }

      if (event.target.closest("[data-reset-device]")) {
        localStorage.removeItem(storageKey);
        settings = loadSettings();
        applySettingsToPage();
        renderSections(parsedSections);
      }
    });

    document.addEventListener("change", (event) => {
      const input = event.target.closest("[data-setting]");
      if (!input) return;
      settings[input.dataset.setting] = input.checked;
      saveSettings();
      applySettingsToPage();
      if (input.dataset.setting === "openDescriptions") {
        setDescriptionCards(input.checked);
      }
      if (input.dataset.setting === "showProjects") {
        renderSections(parsedSections);
      }
    });

    document.addEventListener("keydown", (event) => {
      const photoModal = document.querySelector("[data-photo-lightbox]");
      const photoIsOpen = photoModal && !photoModal.hidden;
      if (photoIsOpen && event.key === "ArrowLeft") {
        shiftPhoto(-1);
        return;
      }
      if (photoIsOpen && event.key === "ArrowRight") {
        shiftPhoto(1);
        return;
      }
      if (event.key === "Escape") {
        closePhoto();
        closeModal("settings");
        closeShare();
        closeInstall();
      }
    });
  }

  function openModal(name) {
    document.querySelector(`[data-${name}-modal]`)?.removeAttribute("hidden");
    document.querySelector(`[data-${name}-backdrop]`)?.removeAttribute("hidden");
  }

  function closeModal(name) {
    document.querySelector(`[data-${name}-modal]`)?.setAttribute("hidden", "");
    document.querySelector(`[data-${name}-backdrop]`)?.setAttribute("hidden", "");
  }

  async function refreshContent() {
    const status = document.querySelector("[data-source-status]");
    if (status) status.textContent = "Refreshing list";
    const result = await getLiveText();
    parsedSections = parseDocText(result.text);
    renderTabs(parsedSections);
    renderSections(parsedSections);
    if (status) status.textContent = result.source;
  }

  async function init() {
    applySettingsToPage();
    bindInteractions();
    await refreshContent();
  }

  init();
})();
