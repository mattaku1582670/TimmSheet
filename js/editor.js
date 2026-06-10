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
