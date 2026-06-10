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
