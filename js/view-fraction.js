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
 * @param {string|null} value  - " / " 区切りの複数段階値
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
