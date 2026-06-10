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
