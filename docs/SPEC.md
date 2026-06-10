# Timmerman Tables 横断ビューア — 仕様書（Claude Code 実装用）

| | |
|---|---|
| バージョン | 2.0（Claude Code 実装用に再構成） |
| 要件定義 | Opus |
| 実装 | Claude Code |
| 同梱 | `data.js`（精読済みマスタ・実装前に完成） |

---

## 0. Claude Code への前提共有

- **データは作成済み**: 本仕様と同じフォルダの `data.js`（`window.TIMMERMAN_DATA`）に
  Timmerman 2021論文 Table 2-11（1/2/3/4/5/8/10/15/20/30 fr）の全制約値を
  正規化構造で格納済み。**実装側でデータを作り直す必要はない。**
  値はPDF全ページを画像精読して転記済み（テキスト抽出では欠落していた
  Endpoint列・長分割のMax point列も補完済み）。
- **環境**: `file://` で動作必須。ローカルネットワークフォルダ越しに複数PCで共有。
- **禁則**: CDN依存・サーバー・LLM連携・音声入力は使わない（mattaku標準）。
- **実装言語**: 素のHTML/CSS/JS。ビルドツール不要。
  ※ `file://` では ES modules の `import`（`type="module"`）が
  CORS(null origin)で**ブロックされる**ため、JS分割は
  「複数の `<script src>` をHTMLで順に読み込む」方式にすること。
  `fetch()` も同様に不可。データは `window.TIMMERMAN_DATA` 参照で統一。

## 1. 目的・スコープ

Timmerman制約表は分割回数ごとにテーブルが分かれている。これを
**特定臓器を回数横断で比較**できる単一ツールに統合する。

スコープは **Plan D（閲覧・検索特化）**。線量入力によるOK/NG判定や
DVH評価支援は**含めない**。

## 2. ファイル構成（保守性重視・機能ごと分割）

単一HTMLに全部入れず、機能単位でファイルを分ける。

```
timmerman-viewer/
├── index.html              … 骨格・タブ枠・各scriptの読み込み順定義のみ
├── data.js                 … window.TIMMERMAN_DATA（マスタ。生成済み・触らない）
├── css/
│   └── styles.css          … 全スタイル（CDN不可なのでsystem font）
└── js/
    ├── store.js            … データ取得・正規化・localStorage退避・編集状態管理
    ├── util.js             … 共通ヘルパ（DOM生成、検索正規化、定数）
    ├── view-matrix.js      … 機能①: 臓器×回数マトリクス一覧
    ├── view-contouring.js  … 機能②: Contouring instructions ビュー（10fr以降）
    ├── view-glossary.js    … 機能③: 用語集約ビュー（重複なし一覧）
    ├── editor.js           … 編集UI（organJa/endpointJa/contouringJa）
    ├── export.js           … data.js 再生成＆ダウンロード
    └── app.js              … 初期化・タブ切替・各viewの配線（最後に読み込む）
```

`index.html` の script 読み込み順（依存順・`type="module"`は使わない）:
```
data.js → util.js → store.js → view-matrix.js → view-contouring.js
→ view-glossary.js → editor.js → export.js → app.js
```
各jsは `window.TT = window.TT || {}` の名前空間に関数を生やす方式で
グローバル汚染を避ける（モジュール代わり）。

## 3. データ構造（data.js・確定済み）

```js
window.TIMMERMAN_DATA = {
  meta: {
    source, version, fractions:["1","2","3","4","5","8","10","15","20","30"],
    pointDef, notes:[...]
  },
  organs: [
    {
      organId: "spinal_cord",             // 正規化キー（不変）
      organEn: "Spinal cord and medulla", // 代表英語名
      organJa: "脊髄・延髄",              // 和訳（編集可）
      type: "serial",                     // "serial" | "parallel"
      endpointJa: "脊髄症",               // Endpoint日本語（編集可）
      contouringJa: "延髄：下橋から…",    // Contouring和訳（編集可）
      fr: {
        "1":  { rawName, volume, volMax, maxPoint, endpointEn, contouringEn?, other? },
        "10": { ..., contouringEn:"Entire bony canal...", ... },
      }
    }, ...
  ]
}
```

データ仕様の要点（実装が前提にしてよい）:
- `fr` のキーは存在する回数のみ（欠損回数はキー自体が無い → 空セル表示）。
- `volume` / `volMax` / `maxPoint` は**文字列**。複数段階は ` / ` 区切り
  （例: Rectum 10fr `volMax:"52 / 49 / 46 / 43"`、volume `"<10 / <20 / <30 / <40 cm³"`）。
  mean dose系は `volume:"Mean dose"`, `volMax:"<26"` のように入る。
- `maxPoint:null` の臓器あり（腎門・parallel系）。`volMax:null` もあり
  （Bile duct/Ureter/Penile bulb短分割等＝max pointのみ）。
- `other` は長分割parallelの Lung V-dose（例 `"V-16 Gy <37%"`）。
- `contouringEn` は**10/15/20/30fr の fr 内**にのみ存在（短分割には無い）。
- `rawName` は各回数での原文表記（表記ゆれ併記用）。
- 38臓器（serial 35 / parallel 3）。長分割のみ8臓器、短分割のみ5臓器、
  Growth plateは30frのみ。

## 4. 機能要件

### 4.1 機能①: マトリクス一覧（メイン・初期表示）
- 行=臓器、列=分割回数（1〜30fr の10列）。
- **Serial / Parallel でセクション分割**（見出し）。
- セル内容: 既定は `Volume max`。トグルで `Max point dose` 切替、
  または両方併記（切替UIを推奨）。`null`や欠損は「—」。
- **短分割/長分割の視覚区分**: 列ヘッダで 1-8fr と 10-30fr を色帯や区切り線で
  区別（決定事項）。
- インクリメンタル検索: 臓器名（英 `organEn`/`rawName` + 和 `organJa`）対象。
- フィルタ: Serial / Parallel / 全て。
- 各臓器行から詳細（その臓器の全回数を縦に並べた表）に展開できると望ましい。
  rawName の表記ゆれもここで提示。

### 4.2 機能②: Contouring instructions ビュー（別タブ）
- 10fr以降にのみ存在する輪郭定義を表示する**専用ビュー**。
- 臓器選択 → 各回数(10/15/20/30)の `contouringEn` 原文 ＋ `contouringJa` 和訳を表示。
- マトリクスとは分離（メインを煩雑にしない＝要件）。
- 短分割しか持たない臓器は「Contouring指示は長分割テーブルのみ」と明示。

### 4.3 機能③: 用語集約ビュー（別タブ）
- 全臓器を**重複なし**で一覧化。列:
  - 臓器名（英語 `organEn`）
  - 臓器名（和訳 `organJa`）
  - Endpoint（日本語 `endpointJa`）
  - Contouring instruction（日本語 `contouringJa`）
- 臓器マスタの参照・編集起点。ソート/検索可。

### 4.4 編集と保存（方式A・確定）
- `organJa` / `endpointJa` / `contouringJa` をUI上で編集可能（インライン or モーダル）。
- 編集は即 `store.js` の状態に反映し、localStorageに退避（作業途中保存）。
- **「data.js を生成」ボタン**（export.js）: 現在の全データを
  `window.TIMMERMAN_DATA = {...}` 形式の文字列に再シリアライズし、
  `data.js` としてBlobダウンロード。ユーザーが手動で差し替え→全PCに反映。
- `file://`ではJSから直接ファイル書込不可のため、この生成DL方式が唯一の共有手段。
- 編集対象は和訳3フィールドのみ。**数値（volMax等）は編集対象外**
  （論文転記値を保護。誤改変防止）。

## 5. 非機能・体裁

- 3タブ（マトリクス / Contouring / 用語集約）を単一画面で切替。
- CDN不可 → `@import` フォント禁止。system font stack を使用。
- インラインSVG favicon（base64 data URI、`file://`対応）必須（mattaku慣習）。
- 印刷対応（`@media print`）は任意。
- localStorageは編集退避にのみ使用（共有データではない点に注意表示）。

## 6. ツール内に明示する注記（必須）

- 出典: Timmerman R. IJROBP 2022;112(1):4-21（ver 8-2021）。
- 制約値は技術・手法に依存し将来変わりうる旨（著者自身が論文で警告）。
- 和訳・Endpoint訳は参考。臨床判断は原論文・施設プロトコルに従う。
- `meta.notes` / `meta.pointDef` をフッタ等に表示すること。

## 7. 受け入れ基準

- [ ] `file://` で `index.html` を直接開いて全機能が動く（サーバー不要）。
- [ ] 3タブすべて表示・切替できる。
- [ ] マトリクスで短/長分割が視覚区分されている。
- [ ] 検索・Serial/Parallelフィルタが動く。
- [ ] Contouringビューが10fr以降の原文＋和訳を表示。
- [ ] 用語集約が重複なしで4列を表示。
- [ ] 和訳3フィールドを編集→data.js生成DL→差し替えで反映される。
- [ ] 数値は編集できない（保護）。
- [ ] 出典・警告注記が表示されている。
