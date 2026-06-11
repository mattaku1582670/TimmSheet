# Timmerman Tables Viewer

放射線治療（SBRT/SABR）のOAR線量制約をブラウザで参照するビューアです。

**出典:** Timmerman R. et al. *Int J Radiat Oncol Biol Phys.* 2022;112(1):4–21（ver 8-2021）

---

## 機能

### マトリクス表示
全臓器 × 全分割回数（1/2/3/4/5/8/10/15/20/30 fr）のクロス表。臓器名で検索・Serial/Parallel フィルタが可能。行をクリックで詳細（Volume条件・Vol Max・Max Point・Endpoint）を展開。

### 分割回数別表示
分割回数を1つ選択し、その回数の全臓器制約を一覧表示（臓器名・Volume・Volume max・Max point dose・Endpoint）。原論文のテーブル形式に近い参照ビュー。

### 用語集
全臓器のEndpoint・コンタリング指示の一覧。

### その他
- 日本語訳の編集（ブラウザの localStorage に保存）
- ダークモード対応
- `data.js を生成` ボタンで編集内容をエクスポート

---

## 使い方

ビルドツール不要。`index.html` をブラウザで直接開くだけで動作します。

```
git clone https://github.com/<your-repo>/TimmSheet.git
cd TimmSheet
# index.html をブラウザで開く
```

ローカル編集（和訳）は localStorage に保存されます。他端末に共有する場合は「data.js を生成」ボタンで出力した `data.js` を `docs/` に配置してください。

---

## 免責事項

- 制約値は技術・手法に依存し、将来変わりうる（著者自身が論文中で言及）。
- 和訳・Endpoint訳は参考情報です。
- 臨床判断は原論文および施設プロトコルに従ってください。

---

## 技術

Vanilla JS / HTML / CSS のみ。依存ライブラリ・ビルドツールなし。
