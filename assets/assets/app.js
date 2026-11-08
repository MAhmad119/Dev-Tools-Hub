/* =====================================================
   DEVTOOLSHUB - SHARED SITE CONTROLLER

   Responsibilities:
   - Common navigation and footer
   - Theme preference
   - Mobile menu
   - Home page search
   - Shared UI initialization
===================================================== */

"use strict";

const DevToolsHub = (() => {

  const STORAGE_KEY = "devtoolshub-theme";

  const navigation = [
    ["Home", "index.html"],
    ["About", "about.html"],
    ["Contact", "contact.html"],
    ["Privacy", "privacy-policy.html"],
    ["Terms", "terms-of-use.html"]
  ];

  function getPageName() {
    const file = location.pathname.split("/").pop();
    return file || "index.html";
  }

  function createHeader() {

    const container = document.getElementById("site-header");

    if (!container) return;

    const current = getPageName();

    container.innerHTML = `
      <header class="topbar">
        <div class="shell nav">

          <a class="brand" href="index.html">
            <span class="brand-mark">D</span>
            <span>DevTools<span>Hub</span></span>
          </a>

          <div class="nav-right">

            <nav class="navlinks" id="primary-navigation">
              ${navigation.map(([label,url]) => `
                <a
                  href="${url}"
                  class="${current === url ? "active" : ""}"
                  ${current === url ? 'aria-current="page"' : ""}
                >${label}</a>
              `).join("")}
            </nav>

            <button
              class="theme-toggle"
              id="theme-toggle"
              type="button"
              aria-label="Change color theme"
            >◐ <span id="theme-label">Dark</span></button>

            <button
              class="menu-toggle"
              id="menu-toggle"
              type="button"
              aria-expanded="false"
              aria-controls="primary-navigation"
              aria-label="Toggle navigation"
            >☰</button>

          </div>
        </div>
      </header>
    `;

  }

  function createFooter() {

    const container = document.getElementById("site-footer");

    if (!container) return;

    const year = new Date().getFullYear();

    container.innerHTML = `
      <footer class="footer">

        <div class="shell footer-grid">

          <div class="footer-brand">
            <a class="brand" href="index.html">
              <span class="brand-mark">D</span>
              <span>DevTools<span>Hub</span></span>
            </a>

            <p>
              Practical browser-based tools for developers
              and digital creators.
            </p>
          </div>

          <div>
            <h4>EXPLORE</h4>
            <div class="footer-links">
              <a href="index.html">Home</a>
              <a href="json-to-csv.html">JSON Converter</a>
              <a href="image-compressor.html">Image Compressor</a>
              <a href="css-glassmorphism.html">CSS Generator</a>
              <a href="qr-generator.html">QR Generator</a>
            </div>
          </div>

          <div>
            <h4>INFORMATION</h4>
            <div class="footer-links">
              <a href="about.html">About Us</a>
              <a href="contact.html">Contact</a>
              <a href="privacy-policy.html">Privacy Policy</a>
              <a href="terms-of-use.html">Terms of Use</a>
            </div>
          </div>

        </div>

        <div class="shell footer-bottom">
          <span>© ${year} DevToolsHub. All rights reserved.</span>
          <span>Built for practical productivity.</span>
        </div>

      </footer>
    `;

  }

  function applyTheme(theme) {

    const selected = theme === "light" ? "light" : "dark";

    document.documentElement.dataset.theme = selected;

    const label = document.getElementById("theme-label");

    if (label) {
      label.textContent = selected === "dark" ? "Dark" : "Light";
    }

    const toggle = document.getElementById("theme-toggle");

    if (toggle) {
      toggle.setAttribute(
        "aria-label",
        `Switch to ${selected === "dark" ? "light" : "dark"} theme`
      );
    }

  }

  function initializeTheme() {

    let savedTheme = "dark";

    try {
      savedTheme = localStorage.getItem(STORAGE_KEY) || "dark";
    } catch {
      // Theme remains usable even if browser storage is disabled.
    }

    applyTheme(savedTheme);

    document.getElementById("theme-toggle")?.addEventListener(
      "click",
      () => {

        const next =
          document.documentElement.dataset.theme === "dark"
            ? "light"
            : "dark";

        applyTheme(next);

        try {
          localStorage.setItem(STORAGE_KEY,next);
        } catch {
          // Theme changes still apply for the current page.
        }

      }
    );

  }

  function initializeMenu() {

    const button = document.getElementById("menu-toggle");
    const nav = document.getElementById("primary-navigation");

    if (!button || !nav) return;

    button.addEventListener("click",() => {

      const open = nav.classList.toggle("open");

      button.setAttribute("aria-expanded",String(open));

    });

  }

  function initializeSearch() {

    const search = document.getElementById("tool-search");
    const cards = document.querySelectorAll("[data-tool-card]");
    const empty = document.getElementById("search-empty");

    if (!search) return;

    search.addEventListener("input",() => {

      const query = search.value.trim().toLowerCase();

      let visible = 0;

      cards.forEach(card => {

        const text = card.textContent.toLowerCase();

        const match = text.includes(query);

        card.hidden = !match;

        if (match) visible++;

      });

      if (empty) {
        empty.hidden = visible !== 0;
      }

    });

  }

  function initialize() {

    createHeader();
    createFooter();
    initializeTheme();
    initializeMenu();
    initializeSearch();

  }

  return {
    initialize
  };

})();

document.addEventListener("DOMContentLoaded",DevToolsHub.initialize);
