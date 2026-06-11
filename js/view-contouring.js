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
