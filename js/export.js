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
