window.TT = window.TT || {};

/**
 * volume文字列（例 "<10 / <20 / <30 / <40 cm³"）を各段階に分解する
 * 各パーツの単位を正規化して返す
 * 返り値例: ["<10cm³", "<20cm³", "<30cm³", "<40cm³"]
 */
function parseVolumeStages(volStr) {
  if (!volStr || volStr === "Mean dose") return [];
  // スペース区切り " / " で分割（スペースなし "/" は分割しない）
  var parts = volStr.split(" / ");
  // 末尾パーツから単位を検出
  var lastPart = parts[parts.length - 1].trim();
  var unitMatch = lastPart.match(/\s*(cm³|cm3|%)\s*$/);
  var unit = unitMatch ? unitMatch[1].replace("cm3", "cm³") : "";

  if (!unit) return parts.map(function(p) { return p.trim(); });

  // 全パーツの単位を統一（既存の単位を剥がして再付与）
  return parts.map(function(p) {
    return p.trim().replace(/\s*(cm³|cm3|%)\s*$/, "") + unit;
  });
}

/**
 * セル内容を td に直接書き込む
 * 表示形式: "<0.2cm³ 8Gy\nPt:10Gy" など
 */
function buildCellContent(td, frData, skipVolume) {
  if (!frData) {
    td.textContent = "—";
    td.classList.add("cell-empty");
    return;
  }

  var lines = [];

  if (frData.volume === "Mean dose") {
    if (frData.volMax != null) lines.push("Mean≤" + frData.volMax + "Gy");
    if (frData.maxPoint != null) lines.push("Max:" + frData.maxPoint + "Gy");
  } else {
    var volStages = parseVolumeStages(frData.volume || "");
    var volMaxParts = frData.volMax != null
      ? String(frData.volMax).split(" / ")
      : [];

    if (skipVolume) {
      if (volMaxParts.length > 0) {
        volMaxParts.forEach(function(d) { if (d.trim()) lines.push(d.trim() + "Gy"); });
      }
      if (frData.other) lines.push(frData.other);
    } else {
      if (volStages.length > 0 && volMaxParts.length > 0) {
        var n = Math.max(volStages.length, volMaxParts.length);
        for (var i = 0; i < n; i++) {
          var vol  = (volStages[i]   || volStages[volStages.length - 1] || "").trim();
          var dose = (volMaxParts[i] || "").trim();
          if (vol && dose) lines.push(vol + " " + dose + "Gy");
          else if (dose)  lines.push(dose + "Gy");
          else if (vol)   lines.push(vol);
        }
      } else if (volMaxParts.length > 0) {
        volMaxParts.forEach(function(d) { if (d.trim()) lines.push(d.trim() + "Gy"); });
      } else if (frData.other) {
        lines.push(frData.other);
      }
    }

    if (frData.maxPoint != null) lines.push("Max:" + frData.maxPoint + "Gy");
  }

  if (lines.length === 0) {
    td.textContent = "—";
    td.classList.add("cell-empty");
    return;
  }

  td.classList.add(lines.length > 1 ? "cell-multi" : "cell-value");
  lines.forEach(function(line, i) {
    if (i > 0) td.appendChild(document.createElement("br"));
    td.appendChild(document.createTextNode(line));
  });
}

function getCommonVolume(organ) {
  var frs = TT.FRACTIONS;
  var first = null;
  for (var i = 0; i < frs.length; i++) {
    var d = organ.fr && organ.fr[frs[i]];
    if (!d) continue;
    if (first === null) { first = d.volume || null; }
    else if (d.volume !== first) return null;
  }
  return first;
}

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

  var exportBtn = TT.el("button", {
    className: "export-btn",
    textContent: "data.js を生成",
    style: "margin-left:auto"
  });

  var modeMatrix = TT.el("button", { className: "toggle-btn active", textContent: "マトリクス表示" });
  var modeFr     = TT.el("button", { className: "toggle-btn",        textContent: "分割回数別" });
  var modeToggle = TT.el("div", { className: "toggle-group" }, modeMatrix, modeFr);

  var toolbar = TT.el("div", { className: "toolbar" },
    modeToggle, searchInput, filterBtns, exportBtn
  );
  container.appendChild(toolbar);

  // --- テーブルラッパ ---
  var wrap = TT.el("div", { className: "matrix-wrap" });
  container.appendChild(wrap);

  // 状態
  var state = { query: "", filter: "all", expanded: {}, mode: "matrix", fraction: "1" };

  // --- イベント ---
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

  searchInput.addEventListener("input", function() {
    state.query = this.value;
    updateView();
  });
  [filterAll, filterSerial, filterPar].forEach(function(btn) {
    btn.addEventListener("click", function() {
      state.filter = this.getAttribute("data-filter");
      filterBtns.querySelectorAll(".filter-btn").forEach(function(b) {
        b.classList.toggle("active", b === btn);
      });
      updateView();
    });
  });
  exportBtn.addEventListener("click", function() {
    TT.exportDataJs();
  });

  function updateView() {
    wrap.innerHTML = "";
    if (state.mode === "fraction") {
      TT.renderFractionView(wrap, state, updateView);
    } else {
      wrap.appendChild(buildTable());
    }
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
    trGroup.appendChild(TT.el("th", { rowspan: "2", style: "min-width:110px" }, "臓器"));
    trGroup.appendChild(TT.el("th", {
      colspan: "6",
      className: "col-short",
      textContent: "短分割 (1–8 fr)"
    }));
    trGroup.appendChild(TT.el("th", {
      colspan: "4",
      className: "col-long col-divider",
      textContent: "長分割 (10–30 fr)"
    }));
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
        var commonVol = (organ.type === "parallel") ? getCommonVolume(organ) : null;

        // 本体行
        var tr = TT.el("tr", { "data-organ-id": organ.organId });

        // 臓器名セル
        var nameCell = TT.el("td", { className: "organ-cell" });
        nameCell.appendChild(TT.el("span", { className: "organ-ja", textContent: organ.organJa }));
        nameCell.appendChild(TT.el("span", { className: "organ-en", textContent: organ.organEn }));
        if (commonVol) {
          nameCell.appendChild(TT.el("span", { className: "organ-vol", textContent: "Critical vol: " + commonVol }));
        }
        if (TT.isEdited(organ.organId)) {
          nameCell.appendChild(TT.el("span", { className: "edited-marker", title: "編集済み", textContent: "●" }));
        }
        var expandBtn = TT.el("button", {
          className: "expand-btn",
          textContent: state.expanded[organ.organId] ? "▲" : "▼",
          title: "詳細を展開"
        });
        expandBtn.addEventListener("click", function(e) {
          e.stopPropagation();
          state.expanded[organ.organId] = !state.expanded[organ.organId];
          updateView();
        });
        nameCell.appendChild(expandBtn);
        tr.appendChild(nameCell);

        // データセル
        frs.forEach(function(fr, i) {
          var isLong = TT.LONG_FRS.includes(fr);
          var cls = isLong && i === 6 ? "col-divider" : "";
          var frData = organ.fr && organ.fr[fr];
          var td = TT.el("td", { className: cls });
          buildCellContent(td, frData || null, !!commonVol);
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

  function buildDetailTable(organ) {
    var frs = TT.FRACTIONS;
    var tbl = TT.el("table", { className: "detail-table" });

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

    var editWrap = TT.el("div", { style: "padding:8px 10px;" });
    var editBtn = TT.el("button", { className: "edit-btn", textContent: "和訳を編集…" });
    editBtn.addEventListener("click", function() {
      TT.openEditor(organ.organId, function() { updateView(); });
    });
    editWrap.appendChild(editBtn);
    tbl.appendChild(editWrap);

    return tbl;
  }

  // 初期描画
  updateView();
};
