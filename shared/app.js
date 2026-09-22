(() => {
  const config = window.HOW_TO_HELP_CONFIG || {};
  const storageKey = "how-to-help:v1";
  const headingNames = new Set(["house stuff", "miri help", "avi help", "sophie and tal help", "projects"]);
  const defaultSettings = {
    style: "cozy",
    openDescriptions: false,
    compact: false,
    docTextUrl: "",
    order: {}
  };
  let settings = loadSettings();
  let parsedSections = [];

  function loadSettings() {
    try {
      return { ...defaultSettings, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings() {
    localStorage.setItem(storageKey, JSON.stringify(settings));
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
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const sections = [];
    let current = null;

    for (const raw of lines) {
      const line = stripBullet(raw);
      const lower = line.toLowerCase();
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
    const root = document.body.dataset.assetRoot || "../assets";
    const imageSets = [
      ["family-2.jpg", "family-3.jpg", "family-4.jpg"],
      ["family-5.jpg", "family-6.jpg", "family-2.jpg"],
      ["family-3.jpg", "family-4.jpg", "family-5.jpg"],
      ["family-6.jpg", "family-2.jpg", "family-3.jpg"]
    ];
    const images = imageSets[index % imageSets.length];
    return `<div class="photo-break" aria-hidden="true">
      ${images.map((name) => `<img src="${root}/${name}" alt="">`).join("")}
    </div>`;
  }

  function renderSections(sections) {
    const host = document.querySelector("[data-sections]");
    if (!host) return;
    host.innerHTML = sections
      .map((section, index) => {
        const items = orderedItems(section);
        const itemHtml = items
          .map((item, itemIndex) => {
            const open = settings.openDescriptions && item.description;
            return `<article class="help-card" data-section-id="${section.id}" data-item-id="${item.id}">
              <button type="button" class="move-handle" data-move-handle aria-label="Move ${escapeHtml(item.title)}" aria-expanded="false">
                <span></span><span></span><span></span>
              </button>
              <button type="button" class="card-main" data-toggle-card aria-expanded="${open ? "true" : "false"}">
                <span class="item-title">${escapeHtml(item.title)}</span>
                <span class="expand-mark" aria-hidden="true">⌄</span>
              </button>
              <div class="move-controls" hidden>
                <button type="button" data-move-item="up" data-section-id="${section.id}" data-item-id="${item.id}" ${itemIndex === 0 ? "disabled" : ""}>Move up</button>
                <button type="button" data-move-item="down" data-section-id="${section.id}" data-item-id="${item.id}" ${itemIndex === items.length - 1 ? "disabled" : ""}>Move down</button>
              </div>
              <div class="item-details" ${open ? "" : "hidden"}>
                <p>${escapeHtml(item.description || "No extra details yet. If this sounds useful, ask Tal or Sophie what would help most.")}</p>
              </div>
            </article>`;
          })
          .join("");
        const sectionHtml = `<section class="help-section" id="${section.id}" style="--section-index:${index}">
          <header>
            <h3>${escapeHtml(section.title)}</h3>
          </header>
          <div class="help-list">${itemHtml}</div>
        </section>`;
        return `${sectionHtml}${index < sections.length - 1 ? photoBreak(index) : ""}`;
      })
      .join("");
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

  function bindInteractions() {
    document.addEventListener("click", (event) => {
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

      if (event.target.closest("[data-open-settings]")) openModal("settings");
      if (event.target.closest("[data-close-settings]") || event.target === document.querySelector("[data-settings-backdrop]")) closeModal("settings");
      if (event.target.closest("[data-open-qr]")) openModal("qr");
      if (event.target.closest("[data-close-qr]") || event.target === document.querySelector("[data-qr-backdrop]")) closeModal("qr");
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

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeModal("settings");
        closeModal("qr");
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
