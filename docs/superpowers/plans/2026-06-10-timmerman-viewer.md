# Timmerman Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Timmerman 2021制約表をローカルHTMLで横断ビューできるSingle-page viewer（3タブ）を作成する。ライトモード基本・ダークモード切替対応。

**Architecture:** `file://` 直アクセス対応の素HTML/CSS/JS。ESモジュール不可のため `window.TT` 名前空間で複数 `<script>` を順に読み込む。データは既存の `docs/data.js`（`window.TIMMERMAN_DATA`）を参照。編集状態・テーマ設定は localStorage に退避し、data.js 再生成ダウンロードで共有。ダークモードは `<html data-theme="dark">` + CSS変数オーバーライドで実現。

**Tech Stack:** HTML5, CSS3, Vanilla JS (ES2015+), localStorage, Blob Download。ビルドツール・CDN・サーバー不要。

---

## ファイルマップ

| ファイル | 役割 |
|---|---|
| `index.html` | HTML骨格・タブ枠・script読み込み順定義 |
| `docs/data.js` | マスタデータ（触らない） |
| `css/styles.css` | 全スタイル（system font, print対応） |
| `js/util.js` | DOM生成ヘルパ、検索正規化、定数 |
| `js/store.js` | データ取得・localStorage退避・編集状態管理 |
| `js/view-matrix.js` | 機能①: 臓器×回数マトリクス一覧 |
| `js/view-contouring.js` | 機能②: Contouring instructions ビュー |
| `js/view-glossary.js` | 機能③: 用語集約ビュー |
| `js/editor.js` | 編集UI（organJa/endpointJa/contouringJa） |
| `js/export.js` | data.js 再生成＆ダウンロード |
| `js/app.js` | 初期化・タブ切替・各viewの配線（最後に読み込む） |

script読み込み順: `docs/data.js` → `js/util.js` → `js/store.js` → `js/view-matrix.js` → `js/view-contouring.js` → `js/view-glossary.js` → `js/editor.js` → `js/export.js` → `js/app.js`

---

## Task 1: index.html — HTML骨格

**Files:**
- Create: `index.html`

- [ ] **Step 1: index.html を作成する**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timmerman Tables Viewer</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%232563eb'/%3E%3Ctext x='16' y='22' font-size='18' text-anchor='middle' fill='white' font-family='monospace'%3ET%3C/text%3E%3C/svg%3E">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <header class="app-header">
    <div class="header-top">
      <div>
        <h1 class="app-title">Timmerman Tables Viewer</h1>
        <p class="app-subtitle">Timmerman R. IJROBP 2022;112(1):4-21（ver 8-2021）</p>
      </div>
      <button id="theme-toggle" class="theme-toggle-btn" aria-label="ダークモード切替" title="ダークモード切替">☀️</button>
    </div>
  </header>

  <nav class="tab-nav" role="tablist">
    <button class="tab-btn active" role="tab" data-tab="matrix" aria-selected="true">マトリクス</button>
    <button class="tab-btn" role="tab" data-tab="contouring" aria-selected="false">Contouring</button>
    <button class="tab-btn" role="tab" data-tab="glossary" aria-selected="false">用語集約</button>
  </nav>

  <main class="tab-content">
    <section id="tab-matrix" class="tab-panel active" role="tabpanel"></section>
    <section id="tab-contouring" class="tab-panel" role="tabpanel"></section>
    <section id="tab-glossary" class="tab-panel" role="tabpanel"></section>
  </main>

  <footer class="app-footer">
    <div id="footer-notes"></div>
    <p class="footer-warning">
      ⚠️ 制約値は技術・手法に依存し将来変わりうる（著者自身が論文中で言及）。
      和訳・Endpoint訳は参考。臨床判断は原論文・施設プロトコルに従うこと。
    </p>
    <p class="footer-ls-note">
      ※ ローカル編集はこのブラウザの localStorage に保存されます。
      他のPCへの共有は「data.js を生成」ボタンでファイルを差し替えてください。
    </p>
  </footer>

  <!-- 編集モーダル（editor.js が生成） -->
  <div id="editor-modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title"></div>
  <div id="modal-overlay" class="modal-overlay hidden"></div>

  <!-- script読み込み順: 依存順 -->
  <script src="docs/data.js"></script>
  <script src="js/util.js"></script>
  <script src="js/store.js"></script>
  <script src="js/view-matrix.js"></script>
  <script src="js/view-contouring.js"></script>
  <script src="js/view-glossary.js"></script>
  <script src="js/editor.js"></script>
  <script src="js/export.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: ブラウザで確認**

`index.html` を直接ブラウザで開く（`file://` でも可）。  
期待値: 白いページ、タイトルとタブボタン3つが表示される（エラーなし）。

- [ ] **Step 3: コミット**

```bash
git add index.html
git commit -m "feat: add index.html skeleton with tab structure"
```

---

## Task 2: css/styles.css — 全スタイル

**Files:**
- Create: `css/styles.css`

- [ ] **Step 1: `css/` ディレクトリを作成し `styles.css` を作成する**

```css
/* ===== Reset & Base ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, "Cascadia Code", "Consolas", monospace;
  --blue: #2563eb;
  --blue-light: #dbeafe;
  --blue-pale: #eff6ff;
  /* ライトモード（デフォルト）のセマンティック変数 */
  --bg:          #f9fafb;
  --surface:     #ffffff;
  --surface-2:   #f3f4f6;
  --border:      #e5e7eb;
  --border-2:    #d1d5db;
  --text:        #1f2937;
  --text-muted:  #4b5563;
  --text-faint:  #9ca3af;
  --red:         #dc2626;
  --amber:       #d97706;
  --short-bg:    #fefce8;
  --long-bg:     #eff6ff;
  --short-border:#fde68a;
  --long-border: #bfdbfe;
  --radius: 6px;
  --shadow: 0 1px 3px rgba(0,0,0,.12);
}

/* ===== ダークモード ===== */
[data-theme="dark"] {
  --blue:        #60a5fa;
  --blue-light:  #1e3a5f;
  --blue-pale:   #172032;
  --bg:          #111827;
  --surface:     #1f2937;
  --surface-2:   #374151;
  --border:      #374151;
  --border-2:    #4b5563;
  --text:        #f9fafb;
  --text-muted:  #d1d5db;
  --text-faint:  #6b7280;
  --red:         #f87171;
  --amber:       #fbbf24;
  --short-bg:    #2d2a1a;
  --long-bg:     #1a2235;
  --short-border:#78600a;
  --long-border: #1e40af;
}

body {
  font-family: var(--font);
  font-size: 14px;
  color: var(--text);
  background: var(--bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background .2s, color .2s;
}

/* ===== Header ===== */
.app-header {
  background: var(--blue);
  color: white;
  padding: 14px 20px 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,.15);
}
.header-top { display: flex; align-items: flex-start; justify-content: space-between; }
.app-title { font-size: 1.2rem; font-weight: 700; }
.app-subtitle { font-size: 0.78rem; opacity: .85; margin-top: 2px; }
.theme-toggle-btn {
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.3);
  border-radius: var(--radius);
  padding: 5px 10px;
  font-size: 1rem;
  cursor: pointer;
  color: white;
  margin-left: 16px;
  flex-shrink: 0;
  transition: background .15s;
}
.theme-toggle-btn:hover { background: rgba(255,255,255,.28); }

/* ===== Tab Nav ===== */
.tab-nav {
  display: flex;
  gap: 2px;
  padding: 8px 16px 0;
  background: var(--surface);
  border-bottom: 2px solid var(--border);
}
.tab-btn {
  padding: 8px 20px;
  border: none;
  background: none;
  font-size: 0.9rem;
  font-family: var(--font);
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  border-radius: var(--radius) var(--radius) 0 0;
  transition: color .15s, border-color .15s;
}
.tab-btn:hover { color: var(--blue); background: var(--blue-pale); }
.tab-btn.active { color: var(--blue); border-bottom-color: var(--blue); font-weight: 600; }

/* ===== Tab Panels ===== */
.tab-content { flex: 1; overflow: auto; }
.tab-panel { display: none; padding: 16px; }
.tab-panel.active { display: block; }

/* ===== Toolbar (search, filter, toggle) ===== */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.search-input {
  flex: 1 1 200px;
  padding: 6px 10px;
  border: 1px solid var(--border-2);
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: 0.875rem;
  background: var(--bg);
  color: var(--text);
}
.search-input:focus { outline: 2px solid var(--blue); border-color: transparent; }

.filter-btns { display: flex; gap: 4px; }
.filter-btn {
  padding: 5px 12px;
  border: 1px solid var(--border-2);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background .15s, color .15s;
}
.filter-btn.active { background: var(--blue); color: white; border-color: var(--blue); }

.toggle-group { display: flex; gap: 4px; margin-left: auto; }
.toggle-btn {
  padding: 5px 10px;
  border: 1px solid var(--border-2);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
}
.toggle-btn.active { background: var(--blue-light); border-color: var(--blue); color: var(--blue); }

/* ===== Matrix Table ===== */
.matrix-wrap { overflow-x: auto; }
.matrix-table {
  border-collapse: collapse;
  width: 100%;
  min-width: 900px;
  font-size: 0.8rem;
  background: var(--surface);
  box-shadow: var(--shadow);
  border-radius: var(--radius);
  overflow: hidden;
}
.matrix-table th, .matrix-table td {
  border: 1px solid var(--border);
  padding: 5px 7px;
  text-align: center;
  white-space: nowrap;
}
.matrix-table thead th {
  background: var(--surface-2);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 2;
}
/* 短分割(1-8fr)列ヘッダ */
.col-short { background: var(--short-bg) !important; border-bottom: 3px solid var(--short-border) !important; }
/* 長分割(10-30fr)列ヘッダ */
.col-long  { background: var(--long-bg)  !important; border-bottom: 3px solid var(--long-border)  !important; }
/* 区切り列 */
.col-divider { border-left: 3px solid var(--border-2) !important; }

.matrix-table tbody tr:hover > td { background: var(--blue-pale); }
.matrix-table .organ-cell {
  text-align: left;
  min-width: 140px;
  position: sticky;
  left: 0;
  background: var(--surface);
  z-index: 1;
  font-weight: 500;
}
.matrix-table tr:hover .organ-cell { background: var(--blue-pale); }
.organ-en { font-size: 0.75rem; color: var(--text-muted); display: block; }
.organ-ja { font-weight: 600; }

/* セクション行（Serial / Parallel） */
.section-row td {
  background: var(--surface-2);
  font-weight: 700;
  font-size: 0.85rem;
  text-align: left;
  color: var(--text);
  padding: 8px 10px;
  border-top: 2px solid var(--border-2);
}

/* データ欠損セル */
.cell-empty { color: var(--text-faint); }

/* 複数段階のセル */
.cell-multi { font-size: 0.72rem; line-height: 1.4; }

/* 詳細展開行 */
.detail-row td {
  background: var(--blue-pale);
  padding: 0;
  border-top: none;
}
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}
.detail-table th {
  background: var(--blue-light);
  padding: 4px 8px;
  text-align: center;
  font-weight: 600;
}
.detail-table td { padding: 4px 8px; text-align: center; }
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.72rem;
  color: var(--blue);
  padding: 1px 4px;
  margin-left: 4px;
}
.expand-btn:hover { text-decoration: underline; }

/* ===== Contouring View ===== */
.organ-select-wrap { margin-bottom: 14px; }
.organ-select {
  padding: 7px 12px;
  border: 1px solid var(--border-2);
  border-radius: var(--radius);
  font-size: 0.9rem;
  min-width: 260px;
  font-family: var(--font);
}
.contouring-cards { display: flex; flex-direction: column; gap: 12px; }
.contouring-card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 14px 16px;
}
.contouring-card h3 { font-size: 0.85rem; color: var(--blue); margin-bottom: 8px; }
.contouring-en { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 6px; line-height: 1.5; }
.contouring-ja { font-size: 0.88rem; line-height: 1.6; }
.no-contouring { color: var(--text-faint); font-style: italic; padding: 20px 0; }

/* ===== Glossary View ===== */
.glossary-table {
  border-collapse: collapse;
  width: 100%;
  background: var(--surface);
  box-shadow: var(--shadow);
  border-radius: var(--radius);
  overflow: hidden;
}
.glossary-table th, .glossary-table td {
  border: 1px solid var(--border);
  padding: 7px 10px;
  text-align: left;
  font-size: 0.82rem;
}
.glossary-table thead th {
  background: var(--surface-2);
  font-weight: 700;
  cursor: pointer;
  user-select: none;
}
.glossary-table thead th:hover { background: var(--blue-pale); }
.glossary-table tbody tr:hover td { background: var(--blue-pale); }
.sort-indicator { margin-left: 4px; color: var(--text-faint); }
.sort-indicator.asc::after { content: '↑'; }
.sort-indicator.desc::after { content: '↓'; }

/* ===== Edit Button ===== */
.edit-btn {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 7px;
  font-size: 0.7rem;
  background: var(--surface-2);
  border: 1px solid var(--border-2);
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--text-muted);
  vertical-align: middle;
}
.edit-btn:hover { background: var(--blue-light); border-color: var(--blue); color: var(--blue); }
.edited-marker { color: var(--amber); font-size: 0.7rem; margin-left: 3px; }

/* ===== Export Bar ===== */
.export-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.export-btn {
  padding: 7px 16px;
  background: var(--blue);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 0.85rem;
  font-family: var(--font);
  cursor: pointer;
  font-weight: 600;
}
.export-btn:hover { background: #1d4ed8; }
.reset-btn {
  padding: 7px 12px;
  background: var(--surface);
  color: var(--red);
  border: 1px solid var(--red);
  border-radius: var(--radius);
  font-size: 0.82rem;
  font-family: var(--font);
  cursor: pointer;
}
.reset-btn:hover { background: var(--red-pale, #fef2f2); }
.export-info { font-size: 0.78rem; color: var(--text-faint); }

/* ===== Modal ===== */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.4);
  z-index: 100;
}
.modal {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: 0 8px 32px rgba(0,0,0,.18);
  padding: 24px;
  min-width: 360px;
  max-width: 560px;
  width: 90%;
  z-index: 101;
}
.modal h2 { font-size: 1rem; margin-bottom: 16px; }
.modal label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 4px; color: var(--text-muted); }
.modal textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-2);
  border-radius: var(--radius);
  font-family: var(--font);
  font-size: 0.875rem;
  resize: vertical;
  min-height: 64px;
  margin-bottom: 12px;
}
.modal textarea:focus { outline: 2px solid var(--blue); border-color: transparent; }
.modal-note { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 16px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-save {
  padding: 7px 18px;
  background: var(--blue); color: white;
  border: none; border-radius: var(--radius);
  font-family: var(--font); font-size: 0.875rem; cursor: pointer; font-weight: 600;
}
.btn-cancel {
  padding: 7px 14px;
  background: var(--surface); color: var(--text-muted);
  border: 1px solid var(--border-2); border-radius: var(--radius);
  font-family: var(--font); font-size: 0.875rem; cursor: pointer;
}
.hidden { display: none !important; }

/* ===== Footer ===== */
.app-footer {
  margin-top: auto;
  padding: 12px 16px;
  background: var(--surface-2);
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--text-muted);
}
.footer-warning { color: var(--amber); margin-bottom: 4px; font-weight: 600; }
.footer-ls-note { color: var(--text-faint); }
#footer-notes { margin-bottom: 8px; line-height: 1.6; }

/* ===== Print ===== */
@media print {
  .tab-nav, .toolbar, .export-bar, .app-footer,
  .edit-btn, .expand-btn, .modal, .modal-overlay { display: none !important; }
  .tab-panel { display: block !important; }
  .matrix-table { box-shadow: none; font-size: 9pt; }
  .matrix-table th, .matrix-table td { padding: 3px 5px; }
}
```

- [ ] **Step 2: ブラウザで確認**

`index.html` をリロード。  
期待値: ヘッダが青色、タブ3つが表示。スタイルが適用されている。

- [ ] **Step 3: コミット**

```bash
git add css/styles.css
git commit -m "feat: add styles.css with layout, table, modal styles"
```

---

## Task 3: js/util.js — 共通ヘルパ

**Files:**
- Create: `js/util.js`

- [ ] **Step 1: `js/` ディレクトリを作成し `util.js` を作成する**

```js
window.TT = window.TT || {};

TT.FRACTIONS = ["1","2","3","4","5","8","10","15","20","30"];
TT.SHORT_FRS  = ["1","2","3","4","5","8"];   // 短分割
TT.LONG_FRS   = ["10","15","20","30"];       // 長分割

/**
 * 文字列を検索用に正規化（全角→半角、大文字→小文字、空白削除）
 */
TT.normalizeQuery = function(str) {
  if (!str) return "";
  return str
    .normalize("NFKC")          // 全角英数→半角
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * 臓器が検索クエリにマッチするか
 * organEn, rawName(全fr), organJa を対象にする
 */
TT.organMatchesQuery = function(organ, query) {
  if (!query) return true;
  const q = TT.normalizeQuery(query);
  const targets = [
    organ.organEn,
    organ.organJa,
  ];
  // rawName を全回数から収集
  Object.values(organ.fr || {}).forEach(function(frData) {
    if (frData && frData.rawName) targets.push(frData.rawName);
  });
  return targets.some(function(t) {
    return TT.normalizeQuery(t || "").includes(q);
  });
};

/**
 * DOM要素を作成するヘルパ
 * @param {string} tag
 * @param {object} [attrs]
 * @param {...(Node|string)} children
 */
TT.el = function(tag, attrs) {
  var children = Array.prototype.slice.call(arguments, 2);
  var elem = document.createElement(tag);
  if (attrs) {
    Object.keys(attrs).forEach(function(k) {
      if (k === "className") { elem.className = attrs[k]; }
      else if (k === "textContent") { elem.textContent = attrs[k]; }
      else if (k === "innerHTML") { elem.innerHTML = attrs[k]; }
      else if (k.startsWith("on")) { elem.addEventListener(k.slice(2), attrs[k]); }
      else { elem.setAttribute(k, attrs[k]); }
    });
  }
  children.forEach(function(c) {
    if (c == null) return;
    elem.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return elem;
};

/**
 * セル値を表示用文字列に変換
 * volMax, maxPoint 等の数値列用
 * null/undefined → "—"
 */
TT.cellText = function(val) {
  if (val == null || val === "") return "—";
  return String(val);
};

/**
 * 複数段階のセルかどうか判定（" / " 区切りが含まれるか）
 */
TT.isMultiStage = function(val) {
  return typeof val === "string" && val.includes(" / ");
};
```

- [ ] **Step 2: ブラウザコンソールで確認**

`index.html` をリロードし、DevToolsコンソールで:
```js
TT.normalizeQuery("Ｓｐｉｎａｌ Cord") // => "spinal cord"
TT.cellText(null) // => "—"
TT.isMultiStage("52 / 49 / 46") // => true
```
期待値: 上記の通り。

- [ ] **Step 3: コミット**

```bash
git add js/util.js
git commit -m "feat: add util.js with helpers and constants"
```

---

## Task 4: js/store.js — データ管理・編集状態

**Files:**
- Create: `js/store.js`

- [ ] **Step 1: `store.js` を作成する**

```js
window.TT = window.TT || {};

// localStorage キー
var LS_KEY = "timmerman_edits_v1";

// 編集オーバーライド: { [organId]: { organJa, endpointJa, contouringJa } }
var _edits = {};

/**
 * localStorage から編集データを読み込む
 */
TT.loadEdits = function() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    _edits = raw ? JSON.parse(raw) : {};
  } catch(e) {
    _edits = {};
  }
};

/**
 * 編集データを localStorage に保存
 */
TT.saveEdits = function() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(_edits));
  } catch(e) {
    console.warn("localStorage への保存に失敗:", e);
  }
};

/**
 * 全臓器データを取得（編集オーバーライドをマージ済み）
 * @returns {Array} organs
 */
TT.getOrgans = function() {
  var base = window.TIMMERMAN_DATA.organs;
  return base.map(function(organ) {
    var ov = _edits[organ.organId];
    if (!ov) return organ;
    return Object.assign({}, organ, {
      organJa:      ov.organJa      != null ? ov.organJa      : organ.organJa,
      endpointJa:   ov.endpointJa   != null ? ov.endpointJa   : organ.endpointJa,
      contouringJa: ov.contouringJa != null ? ov.contouringJa : organ.contouringJa,
    });
  });
};

/**
 * 1臓器の編集可能3フィールドを更新
 * @param {string} organId
 * @param {object} fields — { organJa?, endpointJa?, contouringJa? }
 */
TT.updateOrgan = function(organId, fields) {
  if (!_edits[organId]) _edits[organId] = {};
  Object.assign(_edits[organId], fields);
  TT.saveEdits();
};

/**
 * 特定臓器が編集済みかどうか
 */
TT.isEdited = function(organId) {
  return !!_edits[organId] && Object.keys(_edits[organId]).length > 0;
};

/**
 * 全編集をリセット
 */
TT.resetEdits = function() {
  _edits = {};
  TT.saveEdits();
};

/**
 * 現在の全データ（編集込み）を window.TIMMERMAN_DATA 形式で返す
 * export.js が使用する
 */
TT.getMergedData = function() {
  var merged = JSON.parse(JSON.stringify(window.TIMMERMAN_DATA));
  merged.organs = TT.getOrgans();
  return merged;
};

/**
 * meta.notes を返す
 */
TT.getNotes = function() {
  return window.TIMMERMAN_DATA.meta.notes || [];
};

/**
 * meta.pointDef を返す
 */
TT.getPointDef = function() {
  return window.TIMMERMAN_DATA.meta.pointDef || "";
};
```

- [ ] **Step 2: ブラウザコンソールで確認**

```js
TT.loadEdits();
TT.getOrgans().length; // => 38（全臓器数）
TT.updateOrgan("optic_pathway", { organJa: "テスト" });
TT.getOrgans().find(o => o.organId === "optic_pathway").organJa; // => "テスト"
TT.resetEdits();
TT.getOrgans().find(o => o.organId === "optic_pathway").organJa; // => 元の値
```

- [ ] **Step 3: コミット**

```bash
git add js/store.js
git commit -m "feat: add store.js with localStorage edit management"
```

---

## Task 5: js/view-matrix.js — マトリクス一覧

**Files:**
- Create: `js/view-matrix.js`

- [ ] **Step 1: `view-matrix.js` を作成する**

```js
window.TT = window.TT || {};

/**
 * マトリクスビューを描画する
 * @param {HTMLElement} container — #tab-matrix
 */
TT.renderMatrix = function(container) {
  container.innerHTML = "";

  // --- ツールバー ---
  var searchInput = TT.el("input", {
    className: "search-input",
    type: "search",
    placeholder: "臓器名で検索（英語・日本語）",
    "aria-label": "臓器名検索"
  });
  var filterAll    = TT.el("button", { className: "filter-btn active", "data-filter": "all",      textContent: "全て" });
  var filterSerial = TT.el("button", { className: "filter-btn",        "data-filter": "serial",   textContent: "Serial" });
  var filterPar    = TT.el("button", { className: "filter-btn",        "data-filter": "parallel", textContent: "Parallel" });
  var filterBtns   = TT.el("div", { className: "filter-btns" }, filterAll, filterSerial, filterPar);

  var toggleVol  = TT.el("button", { className: "toggle-btn active", "data-mode": "volMax",    textContent: "Vol Max" });
  var togglePt   = TT.el("button", { className: "toggle-btn",        "data-mode": "maxPoint",  textContent: "Max Point" });
  var toggleBoth = TT.el("button", { className: "toggle-btn",        "data-mode": "both",      textContent: "両方" });
  var toggleGroup= TT.el("div", { className: "toggle-group" }, toggleVol, togglePt, toggleBoth);

  var exportBtn = TT.el("button", {
    className: "export-btn",
    textContent: "data.js を生成",
    style: "margin-left:auto"
  });

  var toolbar = TT.el("div", { className: "toolbar" },
    searchInput, filterBtns, toggleGroup, exportBtn
  );
  container.appendChild(toolbar);

  // --- テーブルラッパ ---
  var wrap = TT.el("div", { className: "matrix-wrap" });
  container.appendChild(wrap);

  // 状態
  var state = { query: "", filter: "all", mode: "volMax", expanded: {} };

  // --- イベント ---
  searchInput.addEventListener("input", function() {
    state.query = this.value;
    updateTable();
  });
  [filterAll, filterSerial, filterPar].forEach(function(btn) {
    btn.addEventListener("click", function() {
      state.filter = this.getAttribute("data-filter");
      filterBtns.querySelectorAll(".filter-btn").forEach(function(b) {
        b.classList.toggle("active", b === btn);
      });
      updateTable();
    });
  });
  [toggleVol, togglePt, toggleBoth].forEach(function(btn) {
    btn.addEventListener("click", function() {
      state.mode = this.getAttribute("data-mode");
      toggleGroup.querySelectorAll(".toggle-btn").forEach(function(b) {
        b.classList.toggle("active", b === btn);
      });
      updateTable();
    });
  });
  exportBtn.addEventListener("click", function() {
    TT.exportDataJs();
  });

  function updateTable() {
    wrap.innerHTML = "";
    wrap.appendChild(buildTable());
  }

  function buildTable() {
    var organs = TT.getOrgans();
    var frs = TT.FRACTIONS;

    // フィルタ
    if (state.filter !== "all") {
      organs = organs.filter(function(o) { return o.type === state.filter; });
    }
    // 検索
    organs = organs.filter(function(o) { return TT.organMatchesQuery(o, state.query); });

    var table = TT.el("table", { className: "matrix-table" });

    // --- thead ---
    var thead = TT.el("thead");
    table.appendChild(thead);

    // 分割区分ラベル行
    var trGroup = TT.el("tr");
    trGroup.appendChild(TT.el("th", { rowspan: "2", style: "min-width:140px" }, "臓器"));
    var shortTh = TT.el("th", {
      colspan: "6",
      className: "col-short",
      textContent: "短分割 (1–8 fr)"
    });
    var longTh = TT.el("th", {
      colspan: "4",
      className: "col-long col-divider",
      textContent: "長分割 (10–30 fr)"
    });
    trGroup.appendChild(shortTh);
    trGroup.appendChild(longTh);
    thead.appendChild(trGroup);

    // 回数ラベル行
    var trFr = TT.el("tr");
    frs.forEach(function(fr, i) {
      var isLong = TT.LONG_FRS.includes(fr);
      var th = TT.el("th", {
        className: isLong ? "col-long" + (i === 6 ? " col-divider" : "") : "col-short",
        textContent: fr + " fr"
      });
      trFr.appendChild(th);
    });
    thead.appendChild(trFr);

    // --- tbody ---
    var tbody = TT.el("tbody");
    table.appendChild(tbody);

    // Serial / Parallel セクション
    var sections = [
      { type: "serial",   label: "Serial OARs（最大点線量依存）" },
      { type: "parallel", label: "Parallel OARs（体積線量依存）" },
    ];

    sections.forEach(function(sec) {
      var secOrgans = organs.filter(function(o) { return o.type === sec.type; });
      if (secOrgans.length === 0) return;

      // セクション見出し行
      var secRow = TT.el("tr", { className: "section-row" });
      secRow.appendChild(TT.el("td", { colspan: String(frs.length + 1), textContent: sec.label }));
      tbody.appendChild(secRow);

      secOrgans.forEach(function(organ) {
        // 本体行
        var tr = TT.el("tr", { "data-organ-id": organ.organId });

        // 臓器名セル
        var nameCell = TT.el("td", { className: "organ-cell" });
        nameCell.appendChild(TT.el("span", { className: "organ-ja", textContent: organ.organJa }));
        nameCell.appendChild(TT.el("span", { className: "organ-en", textContent: organ.organEn }));

        // 編集済みマーカー
        if (TT.isEdited(organ.organId)) {
          nameCell.appendChild(TT.el("span", { className: "edited-marker", title: "編集済み", textContent: "●" }));
        }

        // 展開ボタン
        var expandBtn = TT.el("button", {
          className: "expand-btn",
          textContent: state.expanded[organ.organId] ? "▲" : "▼",
          title: "詳細を展開"
        });
        expandBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          state.expanded[organ.organId] = !state.expanded[organ.organId];
          updateTable();
        });
        nameCell.appendChild(expandBtn);

        tr.appendChild(nameCell);

        // データセル
        frs.forEach(function(fr, i) {
          var isLong = TT.LONG_FRS.includes(fr);
          var cls = isLong ? (i === 6 ? "col-divider" : "") : "";
          var frData = organ.fr && organ.fr[fr];
          var td = TT.el("td", { className: cls });

          if (!frData) {
            td.textContent = "—";
            td.className = (cls + " cell-empty").trim();
          } else {
            var text = getCellText(frData, state.mode, organ.type);
            var isMulti = TT.isMultiStage(text);
            if (isMulti) {
              td.className = (cls + " cell-multi").trim();
              // 複数段階は "/" で改行表示
              text.split(" / ").forEach(function(part, idx, arr) {
                td.appendChild(document.createTextNode(part));
                if (idx < arr.length - 1) td.appendChild(TT.el("br"));
              });
            } else {
              td.textContent = text || "—";
              if (!text) td.className = (cls + " cell-empty").trim();
            }
          }
          tr.appendChild(td);
        });

        tbody.appendChild(tr);

        // 展開詳細行
        if (state.expanded[organ.organId]) {
          var detailRow = TT.el("tr", { className: "detail-row" });
          var detailTd = TT.el("td", { colspan: String(frs.length + 1) });
          detailTd.appendChild(buildDetailTable(organ));
          detailRow.appendChild(detailTd);
          tbody.appendChild(detailRow);
        }
      });
    });

    return table;
  }

  function getCellText(frData, mode, organType) {
    if (mode === "volMax") {
      // parallel で volMax が null なら other を使う
      if (frData.volMax == null && frData.other) return frData.other;
      return TT.cellText(frData.volMax);
    }
    if (mode === "maxPoint") {
      return TT.cellText(frData.maxPoint);
    }
    // both
    var v = frData.volMax != null ? frData.volMax : (frData.other || null);
    var p = frData.maxPoint;
    if (v == null && p == null) return "—";
    if (v == null) return "Pt: " + p;
    if (p == null) return TT.cellText(v);
    return TT.cellText(v) + " / Pt:" + p;
  }

  function buildDetailTable(organ) {
    var frs = TT.FRACTIONS;
    var tbl = TT.el("table", { className: "detail-table" });

    // ヘッダ
    var thead = TT.el("thead");
    var trh = TT.el("tr");
    ["fr", "Volume条件", "Vol Max (Gy)", "Max Point (Gy)", "Endpoint", "rawName"].forEach(function(h) {
      trh.appendChild(TT.el("th", { textContent: h }));
    });
    thead.appendChild(trh);
    tbl.appendChild(thead);

    var tbody = TT.el("tbody");
    frs.forEach(function(fr) {
      var d = organ.fr && organ.fr[fr];
      if (!d) return;
      var tr = TT.el("tr");
      [
        fr + " fr",
        d.volume || "—",
        TT.cellText(d.volMax) + (d.other ? " / " + d.other : ""),
        TT.cellText(d.maxPoint),
        d.endpointEn || "—",
        d.rawName || "—",
      ].forEach(function(val) {
        tr.appendChild(TT.el("td", { textContent: val }));
      });
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);

    // 編集ボタン
    var editWrap = TT.el("div", { style: "padding:8px 10px;" });
    var editBtn = TT.el("button", {
      className: "edit-btn",
      textContent: "和訳を編集…"
    });
    editBtn.addEventListener("click", function() {
      TT.openEditor(organ.organId, function() { updateTable(); });
    });
    editWrap.appendChild(editBtn);
    tbl.appendChild(editWrap);

    return tbl;
  }

  // 初期描画
  updateTable();
};
```

- [ ] **Step 2: ブラウザで確認**

マトリクスタブを開く。  
期待値:
- 短分割（黄色帯）と長分割（青帯）の列ヘッダが分かれて表示
- Serial / Parallel セクション見出しがある
- Vol Max / Max Point / 両方の切替ボタンが動作
- 検索ボックスに "spinal" と入力すると脊髄だけが表示される
- ▼ ボタンで詳細行が展開される

- [ ] **Step 3: コミット**

```bash
git add js/view-matrix.js
git commit -m "feat: add view-matrix.js with search, filter, expand"
```

---

## Task 6: js/view-contouring.js — Contouring ビュー

**Files:**
- Create: `js/view-contouring.js`

- [ ] **Step 1: `view-contouring.js` を作成する**

```js
window.TT = window.TT || {};

TT.renderContouring = function(container) {
  container.innerHTML = "";

  var organs = TT.getOrgans();
  var longFrs = TT.LONG_FRS; // ["10","15","20","30"]

  // 臓器選択セレクト
  var selectWrap = TT.el("div", { className: "organ-select-wrap" });
  var label = TT.el("label", { textContent: "臓器を選択: ", style: "font-weight:600;margin-right:8px;" });
  var select = TT.el("select", { className: "organ-select", "aria-label": "臓器選択" });

  // 全臓器をセレクトに追加
  var placeholder = TT.el("option", { value: "", textContent: "— 臓器を選んでください —" });
  select.appendChild(placeholder);
  organs.forEach(function(organ) {
    var opt = TT.el("option", {
      value: organ.organId,
      textContent: organ.organJa + "  /  " + organ.organEn
    });
    select.appendChild(opt);
  });

  label.appendChild(select);
  selectWrap.appendChild(label);
  container.appendChild(selectWrap);

  var cardsArea = TT.el("div", { className: "contouring-cards" });
  container.appendChild(cardsArea);

  select.addEventListener("change", function() {
    renderCards(this.value);
  });

  function renderCards(organId) {
    cardsArea.innerHTML = "";
    if (!organId) return;

    var organ = organs.find(function(o) { return o.organId === organId; });
    if (!organ) return;

    // その臓器が長分割データを持つか確認
    var hasLong = longFrs.some(function(fr) { return organ.fr && organ.fr[fr]; });
    if (!hasLong) {
      cardsArea.appendChild(TT.el("p", {
        className: "no-contouring",
        textContent: "この臓器は長分割テーブル（10fr以降）のデータがありません。Contouring instructionsは長分割テーブルのみ原論文に記載されています。"
      }));
      return;
    }

    // 編集ボタン（contouringJa）
    var editBtn = TT.el("button", {
      className: "edit-btn",
      textContent: "Contouring日本語訳を編集…"
    });
    editBtn.addEventListener("click", function() {
      TT.openEditor(organId, function() {
        renderCards(organId);
      }, ["contouringJa"]);
    });
    cardsArea.appendChild(editBtn);
    if (TT.isEdited(organId)) {
      cardsArea.appendChild(TT.el("span", { className: "edited-marker", textContent: " ●編集済み" }));
    }

    // 各回数のカード
    longFrs.forEach(function(fr) {
      var frData = organ.fr && organ.fr[fr];
      if (!frData) return;

      var card = TT.el("div", { className: "contouring-card" });
      card.appendChild(TT.el("h3", { textContent: fr + " fr" }));

      if (frData.contouringEn) {
        card.appendChild(TT.el("div", {
          className: "contouring-en",
          textContent: "【原文】" + frData.contouringEn
        }));
      } else {
        card.appendChild(TT.el("div", {
          className: "contouring-en",
          textContent: "（原文なし）"
        }));
      }

      // contouringJa: organ全体で共通（frごとではない）
      var jaText = organ.contouringJa || "（和訳なし）";
      card.appendChild(TT.el("div", {
        className: "contouring-ja",
        textContent: "【和訳】" + jaText
      }));

      cardsArea.appendChild(card);
    });
  }
};
```

- [ ] **Step 2: ブラウザで確認**

「Contouring」タブを開く。  
期待値:
- 臓器セレクトで "視神経・視交叉路" を選ぶと 10/15/20/30fr のカードが表示
- 短分割のみの臓器（例：視交叉がない場合）は「長分割のみ」メッセージが表示

- [ ] **Step 3: コミット**

```bash
git add js/view-contouring.js
git commit -m "feat: add view-contouring.js"
```

---

## Task 7: js/view-glossary.js — 用語集約ビュー

**Files:**
- Create: `js/view-glossary.js`

- [ ] **Step 1: `view-glossary.js` を作成する**

```js
window.TT = window.TT || {};

TT.renderGlossary = function(container) {
  container.innerHTML = "";

  var state = { query: "", sortKey: "organEn", sortDir: "asc" };

  // ツールバー
  var searchInput = TT.el("input", {
    className: "search-input",
    type: "search",
    placeholder: "臓器名・Endpoint を検索",
    style: "max-width:280px"
  });
  searchInput.addEventListener("input", function() {
    state.query = this.value;
    updateTable();
  });

  var toolbar = TT.el("div", { className: "toolbar" }, searchInput);
  container.appendChild(toolbar);

  var tableWrap = TT.el("div");
  container.appendChild(tableWrap);

  var COLS = [
    { key: "organEn",      label: "臓器名（英語）" },
    { key: "organJa",      label: "臓器名（和訳）" },
    { key: "endpointJa",   label: "Endpoint（日本語）" },
    { key: "contouringJa", label: "Contouring和訳" },
  ];

  function updateTable() {
    tableWrap.innerHTML = "";
    tableWrap.appendChild(buildTable());
  }

  function buildTable() {
    var organs = TT.getOrgans();

    // 検索
    if (state.query) {
      var q = TT.normalizeQuery(state.query);
      organs = organs.filter(function(o) {
        return [o.organEn, o.organJa, o.endpointJa, o.contouringJa].some(function(v) {
          return TT.normalizeQuery(v || "").includes(q);
        });
      });
    }

    // ソート
    organs = organs.slice().sort(function(a, b) {
      var va = TT.normalizeQuery(a[state.sortKey] || "");
      var vb = TT.normalizeQuery(b[state.sortKey] || "");
      var cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return state.sortDir === "asc" ? cmp : -cmp;
    });

    var table = TT.el("table", { className: "glossary-table" });
    var thead = TT.el("thead");
    var trh = TT.el("tr");

    COLS.forEach(function(col) {
      var indicator = TT.el("span", { className: "sort-indicator" });
      if (state.sortKey === col.key) {
        indicator.className = "sort-indicator " + state.sortDir;
      }
      var th = TT.el("th", {}, col.label, indicator);
      th.addEventListener("click", function() {
        if (state.sortKey === col.key) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = col.key;
          state.sortDir = "asc";
        }
        updateTable();
      });
      trh.appendChild(th);
    });
    // 操作列
    trh.appendChild(TT.el("th", { textContent: "操作" }));
    thead.appendChild(trh);
    table.appendChild(thead);

    var tbody = TT.el("tbody");
    organs.forEach(function(organ) {
      var tr = TT.el("tr");
      COLS.forEach(function(col) {
        var val = organ[col.key] || "—";
        var td = TT.el("td", { textContent: val });
        if (TT.isEdited(organ.organId) && (col.key === "organJa" || col.key === "endpointJa" || col.key === "contouringJa")) {
          td.appendChild(TT.el("span", { className: "edited-marker", textContent: " ●" }));
        }
        tr.appendChild(td);
      });
      // 編集ボタン
      var editTd = TT.el("td");
      var editBtn = TT.el("button", {
        className: "edit-btn",
        textContent: "編集"
      });
      editBtn.addEventListener("click", function() {
        TT.openEditor(organ.organId, function() { updateTable(); });
      });
      editTd.appendChild(editBtn);
      tr.appendChild(editTd);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  updateTable();
};
```

- [ ] **Step 2: ブラウザで確認**

「用語集約」タブを開く。  
期待値:
- 38行（全臓器）が4列で表示
- 列ヘッダクリックでソート（↑↓表示）
- 検索ボックスで絞り込みが動作

- [ ] **Step 3: コミット**

```bash
git add js/view-glossary.js
git commit -m "feat: add view-glossary.js with sort and search"
```

---

## Task 8: js/editor.js — 編集モーダル

**Files:**
- Create: `js/editor.js`

- [ ] **Step 1: `editor.js` を作成する**

```js
window.TT = window.TT || {};

/**
 * 編集モーダルを開く
 * @param {string} organId
 * @param {function} onSave — 保存後に呼ばれるコールバック
 * @param {string[]} [fields] — 表示するフィールド（省略時: 全3フィールド）
 */
TT.openEditor = function(organId, onSave, fields) {
  var organ = TT.getOrgans().find(function(o) { return o.organId === organId; });
  if (!organ) return;

  var showFields = fields || ["organJa", "endpointJa", "contouringJa"];

  var modal   = document.getElementById("editor-modal");
  var overlay = document.getElementById("modal-overlay");

  var FIELD_LABELS = {
    organJa:      "臓器名（和訳）",
    endpointJa:   "Endpoint（日本語）",
    contouringJa: "Contouring和訳",
  };
  var FIELD_NOTES = {
    organJa:      "臓器の日本語名称",
    endpointJa:   "有害事象 Endpoint の日本語名称",
    contouringJa: "Contouring instruction の日本語訳（長分割のみ）",
  };

  // モーダル内容を構築
  modal.innerHTML = "";
  modal.appendChild(TT.el("h2", {
    id: "modal-title",
    textContent: "和訳編集: " + organ.organEn
  }));

  modal.appendChild(TT.el("p", {
    className: "modal-note",
    textContent: "※ 数値（制約値）は編集できません。和訳3フィールドのみ編集可能です。"
  }));

  var textareas = {};
  showFields.forEach(function(key) {
    if (!FIELD_LABELS[key]) return;
    var lbl = TT.el("label", { textContent: FIELD_LABELS[key] });
    var ta  = TT.el("textarea", { rows: "3", placeholder: FIELD_NOTES[key] });
    ta.value = organ[key] || "";
    textareas[key] = ta;
    modal.appendChild(lbl);
    modal.appendChild(ta);
  });

  // ボタン
  var btnSave   = TT.el("button", { className: "btn-save",   textContent: "保存" });
  var btnCancel = TT.el("button", { className: "btn-cancel", textContent: "キャンセル" });
  var actions   = TT.el("div",    { className: "modal-actions" }, btnCancel, btnSave);
  modal.appendChild(actions);

  function closeModal() {
    modal.classList.add("hidden");
    overlay.classList.add("hidden");
  }

  btnSave.addEventListener("click", function() {
    var updates = {};
    Object.keys(textareas).forEach(function(key) {
      updates[key] = textareas[key].value;
    });
    TT.updateOrgan(organId, updates);
    closeModal();
    if (onSave) onSave();
  });

  btnCancel.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);

  // ESCキーで閉じる
  function onKeydown(e) {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", onKeydown);
    }
  }
  document.addEventListener("keydown", onKeydown);

  modal.classList.remove("hidden");
  overlay.classList.remove("hidden");

  // 最初のtextareaにフォーカス
  var firstTa = modal.querySelector("textarea");
  if (firstTa) firstTa.focus();
};
```

- [ ] **Step 2: ブラウザで確認**

マトリクスで臓器の ▼ 展開 → 「和訳を編集…」をクリック。  
期待値:
- モーダルが表示される
- 3フィールドのテキストエリアがある（数値フィールドはない）
- 保存するとマトリクスが更新され ● 編集済みマーカーがつく
- ESCキーまたはキャンセルで閉じる

- [ ] **Step 3: コミット**

```bash
git add js/editor.js
git commit -m "feat: add editor.js modal for organJa/endpointJa/contouringJa"
```

---

## Task 9: js/export.js — data.js 再生成ダウンロード

**Files:**
- Create: `js/export.js`

- [ ] **Step 1: `export.js` を作成する**

```js
window.TT = window.TT || {};

/**
 * 現在の編集済みデータを data.js 形式にシリアライズしてダウンロード
 */
TT.exportDataJs = function() {
  var data   = TT.getMergedData();
  var json   = JSON.stringify(data, null, 2);
  var header = "// Timmerman Tables data (auto-generated from Timmerman 2021, ver 8-2021)\n// 編集可能フィールド: organJa, endpointJa, contouringJa\n";
  var content = header + "window.TIMMERMAN_DATA = " + json + ";\n";

  var blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
  var url  = URL.createObjectURL(blob);
  var a    = TT.el("a", { href: url, download: "data.js" });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // 通知
  var msg = document.createElement("div");
  msg.textContent = "data.js をダウンロードしました。docs/data.js を差し替えてください。";
  msg.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
    "background:#1f2937;color:white;padding:10px 20px;border-radius:8px;" +
    "font-size:0.85rem;z-index:200;box-shadow:0 4px 12px rgba(0,0,0,.3);";
  document.body.appendChild(msg);
  setTimeout(function() { document.body.removeChild(msg); }, 4000);
};
```

- [ ] **Step 2: ブラウザで確認**

マトリクスの「data.js を生成」ボタンをクリック。  
期待値:
- `data.js` がダウンロードされる
- 画面下部に「ダウンロードしました」トーストが表示される
- ダウンロードした data.js の先頭が `window.TIMMERMAN_DATA = {` から始まる

- [ ] **Step 3: コミット**

```bash
git add js/export.js
git commit -m "feat: add export.js for data.js blob download"
```

---

## Task 10: js/app.js — 初期化・配線

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: `app.js` を作成する**

```js
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
      if (tabId === "matrix")     TT.renderMatrix(panel);
      if (tabId === "contouring") TT.renderContouring(panel);
      if (tabId === "glossary")   TT.renderGlossary(panel);
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
```

- [ ] **Step 2: ブラウザで全機能を確認（受け入れ基準チェック）**

`index.html` を `file://` で開き、以下をすべて確認する:

| # | チェック項目 | 期待値 |
|---|---|---|
| 1 | file:// で直接開く | エラーなし、全機能が動く |
| 2 | 3タブすべて表示・切替 | マトリクス/Contouring/用語集約が切り替わる |
| 3 | 短/長分割の視覚区分 | 黄色帯(1-8fr)と青帯(10-30fr)が列ヘッダに表示 |
| 4 | 検索・フィルタ | 動作する |
| 5 | Contouringビュー | 10-30frの原文+和訳が表示 |
| 6 | 用語集約 | 重複なし4列、ソート動作 |
| 7 | 和訳編集→data.js生成 | モーダルで編集、DLしたdata.jsに反映 |
| 8 | 数値は編集できない | モーダルに数値フィールドなし |
| 9 | 出典・警告注記 | フッタに表示 |
| 10 | ダークモード切替 | ☀️/🌙 ボタンで切替、リロード後も状態が保持される |

- [ ] **Step 3: コミット**

```bash
git add js/app.js
git commit -m "feat: add app.js, complete Timmerman Viewer implementation"
```

---

## 受け入れ基準チェックリスト（最終確認）

- [ ] `file://` で `index.html` を直接開いて全機能が動く
- [ ] 3タブすべて表示・切替できる
- [ ] マトリクスで短/長分割が視覚区分されている（列ヘッダ色分け）
- [ ] 検索・Serial/Parallelフィルタが動く
- [ ] Contouringビューが10fr以降の原文＋和訳を表示
- [ ] 用語集約が重複なしで4列を表示
- [ ] 和訳3フィールドを編集→data.js生成DL→差し替えで反映される
- [ ] 数値（volMax等）は編集できない
- [ ] 出典・警告注記・pointDefがフッタに表示されている
- [ ] ☀️/🌙 ボタンでライト/ダークモード切替が動き、localStorage で状態が保持される
