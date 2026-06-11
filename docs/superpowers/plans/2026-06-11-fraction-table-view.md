# 分割回数別テーブルビュー Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** マトリクスタブ内にトグルボタンを追加し、選択した分割回数の線量制約テーブル（臓器/Volume/Volume max/Max point dose/Endpoint）を表示する分割回数別ビューを実装する。

**Architecture:** `js/view-fraction.js` に `TT.renderFractionView(wrap, state, updateView)` を新規追加。`js/view-matrix.js` のツールバーにトグルボタンを追加し、`state.mode`（`"matrix"` | `"fraction"`）と `state.fraction`（`"1"` 〜 `"30"`）で切り替えを制御する。既存のフィルタ・検索状態は両ビューで共有する。

**Tech Stack:** Vanilla JS (ES5相当), CSS3, HTML5 — ビルドツール・依存ライブラリなし

---

### Task 1: js/view-fraction.js を新規作成する

**Files:**
- Create: `js/view-fraction.js`

- [ ] **Step 1: ファイルを作成する**

以下の内容で `js/view-fraction.js` を作成する。

```js
window.TT = window.TT || {};

/**
 * 分割回数別ビューを描画する
 * @param {HTMLElement} wrap     - コンテンツエリア（matrix-wrap）
 * @param {object}      state    - { query, filter, fraction } を含む共有状態
 * @param {function}    updateView - ビュー全体を再描画するコールバック
 */
TT.renderFractionView = function(wrap, state, updateView) {
  wrap.innerHTML = "";

  // --- 分割回数セレクター ---
  var frSel = TT.el("div", { className: "fr-selector" });
  var frLabel = TT.el("span", { className: "fr-selector-label", textContent: "分割回数:" });
  frSel.appendChild(frLabel);

  TT.FRACTIONS.forEach(function(fr) {
    var btn = TT.el("button", {
      className: "fr-btn" + (fr === state.fraction ? " active" : ""),
      textContent: fr + " fr"
    });
    btn.addEventListener("click", function() {
      state.fraction = fr;
      updateView();
    });
    frSel.appendChild(btn);
  });
  wrap.appendChild(frSel);

  // --- データ取得・フィルタ ---
  var organs = TT.getOrgans();
  if (state.filter !== "all") {
    organs = organs.filter(function(o) { return o.type === state.filter; });
  }
  organs = organs.filter(function(o) { return TT.organMatchesQuery(o, state.query); });

  var fr = state.fraction;

  var sections = [
    { type: "serial",   label: "Serial OARs（最大点線量依存）" },
    { type: "parallel", label: "Parallel OARs（体積線量依存）" },
  ];

  sections.forEach(function(sec) {
    var secOrgans = organs.filter(function(o) { return o.type === sec.type; });
    if (secOrgans.length === 0) return;

    var table = TT.el("table", { className: "fr-table" });

    // thead
    var thead = TT.el("thead");
    var trh = TT.el("tr");
    ["臓器名", "Volume", "Volume max (Gy)", "Max point dose (Gy)", "Endpoint"].forEach(function(h) {
      trh.appendChild(TT.el("th", { textContent: h }));
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    // tbody
    var tbody = TT.el("tbody");

    // セクション見出し行
    var secRow = TT.el("tr", { className: "section-row" });
    secRow.appendChild(TT.el("td", { colspan: "5", textContent: sec.label }));
    tbody.appendChild(secRow);

    secOrgans.forEach(function(organ) {
      var frData = organ.fr && organ.fr[fr];
      if (!frData) return;

      var tr = TT.el("tr");

      // 臓器名セル
      var nameCell = TT.el("td", { className: "organ-cell fr-organ-cell" });
      nameCell.appendChild(TT.el("span", {
        className: "organ-ja",
        textContent: organ.organJa || organ.organEn
      }));
      nameCell.appendChild(TT.el("span", {
        className: "organ-en",
        textContent: organ.organEn
      }));
      tr.appendChild(nameCell);

      // Volume セル
      var volCell = TT.el("td", { className: "fr-cell" });
      frFillMultiStage(volCell, frData.volume, "");
      tr.appendChild(volCell);

      // Volume max セル
      var volMaxCell = TT.el("td", { className: "fr-cell" });
      frFillMultiStage(volMaxCell, frData.volMax, " Gy");
      tr.appendChild(volMaxCell);

      // Max point dose セル
      var mpCell = TT.el("td", { className: "fr-cell" });
      mpCell.textContent = frData.maxPoint != null ? frData.maxPoint + " Gy" : "—";
      tr.appendChild(mpCell);

      // Endpoint セル（臓器レベルの endpointJa 優先、なければ frData.endpointEn）
      var ep = (organ.endpointJa && organ.endpointJa.trim())
        ? organ.endpointJa
        : (frData.endpointEn || "—");
      tr.appendChild(TT.el("td", { className: "fr-cell", textContent: ep }));

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
  });
};

/**
 * " / " 区切りの値を <br> 改行してセルに書き込む
 * null または空文字列の場合は "—" を表示
 * @param {HTMLElement} td
 * @param {string|null} value - " / " 区切りの複数段階値
 * @param {string}      suffix - 各段階の後ろに付けるテキスト（例: " Gy"）
 */
function frFillMultiStage(td, value, suffix) {
  if (value == null || String(value).trim() === "") {
    td.textContent = "—";
    return;
  }
  var parts = String(value).split(" / ");
  parts.forEach(function(part, i) {
    if (i > 0) td.appendChild(document.createElement("br"));
    td.appendChild(document.createTextNode(part.trim() + suffix));
  });
}
```

- [ ] **Step 2: ブラウザで動作確認できる準備が整っているか確認する（index.html への追加は Task 4 で行う）**

Task 4 まで完了しないと動作しないため、このステップはスキップしてよい。

- [ ] **Step 3: コミットする**

```bash
git add js/view-fraction.js
git commit -m "feat: add TT.renderFractionView for fraction-based table view"
```

---

### Task 2: js/view-matrix.js にビュートグルを追加する

**Files:**
- Modify: `js/view-matrix.js`（`TT.renderMatrix` 関数全体）

- [ ] **Step 1: state にモードと分割回数を追加する**

`js/view-matrix.js` の 132 行目付近にある state の宣言を以下に変更する：

```js
// 変更前
var state = { query: "", filter: "all", expanded: {} };

// 変更後
var state = { query: "", filter: "all", expanded: {}, mode: "matrix", fraction: "1" };
```

- [ ] **Step 2: ツールバーにトグルボタンを追加する**

104〜125 行目のツールバー構築部分を以下に変更する：

```js
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

  var modeMatrix = TT.el("button", { className: "toggle-btn active", textContent: "マトリクス表示" });
  var modeFr     = TT.el("button", { className: "toggle-btn",        textContent: "分割回数別" });
  var modeToggle = TT.el("div", { className: "toggle-group" }, modeMatrix, modeFr);

  var exportBtn = TT.el("button", {
    className: "export-btn",
    textContent: "data.js を生成",
    style: "margin-left:auto"
  });

  var toolbar = TT.el("div", { className: "toolbar" },
    modeToggle, searchInput, filterBtns, exportBtn
  );
  container.appendChild(toolbar);
```

- [ ] **Step 3: トグルボタンのイベントハンドラを追加する**

134 行目の `searchInput.addEventListener` の直前に以下を挿入する：

```js
  modeMatrix.addEventListener("click", function() {
    state.mode = "matrix";
    modeMatrix.classList.add("active");
    modeFr.classList.remove("active");
    updateView();
  });
  modeFr.addEventListener("click", function() {
    state.mode = "fraction";
    modeFr.classList.add("active");
    modeMatrix.classList.remove("active");
    updateView();
  });
```

- [ ] **Step 4: updateTable() を updateView() に置き換える**

`function updateTable()` を以下の `function updateView()` に置き換える：

```js
  function updateView() {
    wrap.innerHTML = "";
    if (state.mode === "fraction") {
      TT.renderFractionView(wrap, state, updateView);
    } else {
      wrap.appendChild(buildTable());
    }
  }
```

- [ ] **Step 5: 他の updateTable() 呼び出しを updateView() に変更する**

以下の3箇所を `updateTable()` → `updateView()` に変更する：

1. `searchInput.addEventListener` 内（約138行目）：
```js
  searchInput.addEventListener("input", function() {
    state.query = this.value;
    updateView();
  });
```

2. `[filterAll, filterSerial, filterPar].forEach` 内（約140-147行目）：
```js
  [filterAll, filterSerial, filterPar].forEach(function(btn) {
    btn.addEventListener("click", function() {
      state.filter = this.getAttribute("data-filter");
      filterBtns.querySelectorAll(".filter-btn").forEach(function(b) {
        b.classList.toggle("active", b === btn);
      });
      updateView();
    });
  });
```

3. `expandBtn.addEventListener` 内（`buildTable` 関数内、約240-244行目）：
```js
        expandBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          state.expanded[organ.organId] = !state.expanded[organ.organId];
          updateView();
        });
```

4. `TT.openEditor` コールバック内（`buildDetailTable` 関数内、約307-309行目）：
```js
      editBtn.addEventListener("click", function() {
        TT.openEditor(organ.organId, function() { updateView(); });
      });
```

5. 末尾の初期描画呼び出し（約317行目）：
```js
  // 初期描画
  updateView();
```

- [ ] **Step 6: コミットする**

```bash
git add js/view-matrix.js
git commit -m "feat: add matrix/fraction view toggle to matrix toolbar"
```

---

### Task 3: css/styles.css に分割回数別ビューのスタイルを追加する

**Files:**
- Modify: `css/styles.css`（末尾付近、既存の `/* ===== Contouring View ===== */` セクションの前に追加）

- [ ] **Step 1: styles.css の末尾（`/* ===== Contouring View ===== */` の直前）に以下を追加する**

現在の styles.css 276行目付近、`/* ===== Contouring View ===== */` の直前に追加する：

```css
/* ===== Fraction View ===== */
.fr-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.fr-selector-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-right: 4px;
  white-space: nowrap;
}
.fr-btn {
  padding: 4px 10px;
  border: 1px solid var(--border-2);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background .15s, color .15s, border-color .15s;
}
.fr-btn:hover { background: var(--blue-pale); color: var(--blue); border-color: var(--blue); }
.fr-btn.active { background: var(--blue); color: white; border-color: var(--blue); }

.fr-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.85rem;
  background: var(--surface);
  box-shadow: var(--shadow);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 16px;
}
.fr-table th, .fr-table td {
  border: 1px solid var(--border);
  padding: 6px 10px;
  text-align: left;
}
.fr-table thead th {
  background: var(--surface-2);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 2;
}
.fr-table tbody tr:hover > td { background: var(--blue-pale); }
.fr-organ-cell {
  min-width: 130px;
  max-width: 180px;
}
.fr-cell {
  max-width: 200px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.6;
}
```

- [ ] **Step 2: コミットする**

```bash
git add css/styles.css
git commit -m "feat: add CSS styles for fraction-based table view"
```

---

### Task 4: index.html に script タグを追加する

**Files:**
- Modify: `index.html`（50〜57行目のスクリプト読み込み部分）

- [ ] **Step 1: view-fraction.js の script タグを追加する**

`index.html` の53行目（`<script src="js/view-matrix.js"></script>` の直前）に追加する：

```html
  <!-- script読み込み順: 依存順 -->
  <script src="docs/data.js"></script>
  <script src="js/util.js"></script>
  <script src="js/store.js"></script>
  <script src="js/view-fraction.js"></script>
  <script src="js/view-matrix.js"></script>
  <script src="js/view-glossary.js"></script>
  <script src="js/editor.js"></script>
  <script src="js/export.js"></script>
  <script src="js/app.js"></script>
```

- [ ] **Step 2: ブラウザで動作を確認する**

`index.html` をブラウザで開き、以下を確認する：

1. マトリクスタブを開くとツールバーに「マトリクス表示」「分割回数別」ボタンが表示されている
2. 「分割回数別」ボタンをクリックすると、frセレクター（1fr〜30fr）と Serial/Parallel の2テーブルが表示される
3. frボタンをクリックすると対応する分割回数のデータに切り替わる
4. 臓器名検索・Serial/Parallel フィルタが分割回数別ビューにも効く
5. 「マトリクス表示」ボタンで元のマトリクス表示に戻る
6. ダークモードに切り替えても表示が崩れない

- [ ] **Step 3: コミットする**

```bash
git add index.html
git commit -m "feat: load view-fraction.js in index.html"
```
