window.TT = window.TT || {};

document.addEventListener("DOMContentLoaded", function() {
  // ===== ダークモード切替 =====
  var LS_THEME = "timmerman_theme";
  var themeToggle = document.getElementById("theme-toggle");

  function applyTheme(dark) {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    if (themeToggle) {
      themeToggle.textContent = dark ? "🌙" : "☀️";
      themeToggle.title = dark ? "ライトモードに切替" : "ダークモードに切替";
    }
  }

  // 初期テーマ: localStorage 優先、なければライトモード
  applyTheme(localStorage.getItem(LS_THEME) === "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", function() {
      var isDark = document.documentElement.getAttribute("data-theme") === "dark";
      applyTheme(!isDark);
      localStorage.setItem(LS_THEME, !isDark ? "dark" : "light");
    });
  }

  // データ読み込み
  TT.loadEdits();

  // フッタ: meta.notes と pointDef を表示
  var footerNotes = document.getElementById("footer-notes");
  if (footerNotes) {
    var notes = TT.getNotes();
    var pd = TT.getPointDef();
    if (pd) {
      footerNotes.appendChild(TT.el("p", { textContent: "● " + pd }));
    }
    notes.forEach(function(note) {
      footerNotes.appendChild(TT.el("p", { textContent: "● " + note }));
    });
  }

  // タブ切替
  var tabBtns   = document.querySelectorAll(".tab-btn");
  var tabPanels = document.querySelectorAll(".tab-panel");

  // 各タブの初期化フラグ（遅延レンダリング）
  var rendered = {};

  function activateTab(tabId) {
    tabBtns.forEach(function(btn) {
      var active = btn.getAttribute("data-tab") === tabId;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    tabPanels.forEach(function(panel) {
      var active = panel.id === "tab-" + tabId;
      panel.classList.toggle("active", active);
    });
    // 初回表示時にのみレンダリング
    if (!rendered[tabId]) {
      rendered[tabId] = true;
      var panel = document.getElementById("tab-" + tabId);
      if (tabId === "matrix")   TT.renderMatrix(panel);
      if (tabId === "glossary") TT.renderGlossary(panel);
    }
  }

  tabBtns.forEach(function(btn) {
    btn.addEventListener("click", function() {
      activateTab(this.getAttribute("data-tab"));
    });
  });

  // 初期表示: マトリクスタブ
  activateTab("matrix");
});
