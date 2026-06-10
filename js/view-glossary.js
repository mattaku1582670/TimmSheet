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
