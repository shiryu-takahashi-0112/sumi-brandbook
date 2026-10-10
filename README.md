# SUMI — Brand Concept Book（iPad提示用 / A・B分岐）

見込み顧客にiPadで見せ、その場でアンケートに回答してもらうための静的サイト。
プロダクトのデザイン2案（A / B）を分けて提示し、どちらが支持されるかを検証する。

## ページ構成

| URL | 役割 |
|---|---|
| `/` | 調査実施者用の入口。A案・B案・ランダムのいずれかを選ぶ |
| `/a/` | デザイン案A（斜めカットの非対称デザイン）を載せたブック |
| `/b/` | デザイン案B（全周ベゼルの対称デザイン）を載せたブック |
| `/results/` | アンケートの回答一覧（A案・B案別の集計、CSV書き出し）。パスワードで保護 |
| `/api/answers` | アンケートの回答を受け取って保存する（ブックから自動で送られる） |

ブックは横めくり（スワイプ／画面左右のタップ／矢印キー）で全7ページ。
最終ページの「アンケートに回答する」を押すと、ブックの上にアンケートが開き、その場で答えて送れる。
答えはCloudflareのデータベース（D1 `sumi-survey`）に、どちらの案を見たかと一緒に保存される。

| # | ページ | 内容 |
|---|---|---|
| 1 | 表紙 | タグライン、読み方の案内 |
| 2 | コンセプト | コンセプト、使用シーン、Value3語 |
| 3 | ブランドについて | ブランドストーリー、名前の由来 |
| 4 | プロダクト | **A/Bで異なる唯一のページ**（画像・見出し・造形の説明） |
| 5 | 車内での佇まい | 装着画像（A/Bで異なる）、香りの考え方 |
| 6 | 想定価格帯 | 価格と、価格への感想を尋ねる問い |
| 7 | アンケート | アンケートを開くボタン |

## ファイルの役割

| ファイル | 役割 |
|---|---|
| `assets/js/content.js` | **全ページのコピー、A/B差分、アンケートの質問。文言を直すのはここだけ** |
| `assets/js/book.js` | ページの組み立てと横めくりの制御 |
| `assets/css/book.css` | スタイル。黒地・明朝見出し・iPad前提のレスポンシブ |
| `a/index.html`, `b/index.html` | パターン指定だけを持つ入れ物。中身は持たない |
| `assets/img/logo-white.svg` | **SUMIロゴ（暗い背景用）。Figmaからの書き出しをそのまま使う** |
| `assets/img/logo-black.svg` | SUMIロゴ（明るい背景用） |
| `assets/img/scene-*.jpg` | 各ページ下部の世界観カット（A/B共通・製品は写っていない） |
| `assets/img/in-car-*.jpg` | 車内装着画像（A/Bで異なる） |
| `assets/img/product-a.png` | A案の製品画像（背景透過済み） |
| `assets/img/product-b.png` | B案の製品画像（背景透過済み） |
| `assets/img/src/` | Figmaから書き出した白背景の元画像 |
| `tools/cutout.py` | 白背景の画像を透過PNGに変換するスクリプト |
| `tools/export_single.py` | ブックをA案・B案それぞれ1ファイルのHTMLに書き出す（Notionに貼る用） |
| `worker/index.js` | 回答の受け取りと一覧ページの認証 |
| `worker/schema.sql` | 回答を入れる表の定義 |
| `results/index.html` | 回答一覧ページ |

## よくある変更

### アンケートの質問を直す

`assets/js/content.js` の `SUMI_SURVEY` を編集する。
質問は全10問。種類は `single`（1つ選ぶ）、`multi`（いくつでも）、`text`（記入）、`fields`（記入欄だけ）。
選択肢の下に記入欄（香り・理由・金額など）を添えるときは `fields` を付ける。
前の答えによって出し分けるときは `showIf` を付ける。
回答一覧の集計と表も、ここの質問から自動で作られる。

### 回答を見る

`/results/` を開き、ユーザー名に `sumi`、パスワードにシークレット `RESULTS_PASSWORD` の値を入れる。
パスワードを決める・変えるときは次を実行する。

```bash
npx wrangler secret put RESULTS_PASSWORD
```

### 公開する

```bash
npx wrangler deploy
```

Notionに貼っている単体HTMLも、直したら書き出し直して貼り替える。

```bash
python3 tools/export_single.py https://sumi-brandbook.<サブドメイン>.workers.dev ~/.claude-work/sumi
```

### 車内に取り付けた画像を追加する

画像を `assets/img/` に置き、`content.js` の該当パターンの `inCarImage` にパスを書く。
`null` のあいだは「制作中」のプレースホルダーが表示される。

```js
inCarImage: "assets/img/in-car-a.png",
```

### 文言を直す・ページを増やす

`content.js` の `SUMI_PAGES` を編集する。ページ数（表紙の「全7ページ」表記とノンブル）は自動で追従する。
新しいレイアウトが必要な場合だけ `book.js` の `renderers` に追加する。

### 白背景の製品画像を差し替える

```bash
python3 tools/cutout.py assets/img/src/product-a.png assets/img/product-a.png
```

## ローカルで確認する

```bash
python3 -m http.server 4173
```

## デプロイ

Cloudflare Pages。ビルド不要の静的サイトなので、出力ディレクトリはリポジトリ直下。

```bash
npx wrangler pages deploy . --project-name sumi-brandbook
```

## ロゴの扱い

ロゴは必ず `assets/img/logo-*.svg` を使う。フォントで「SUMI」と組んで代用したり、
パスや色を編集したりしない。詳細は [CLAUDE.md](CLAUDE.md) を参照。

## 元になった資料

- ブランドコンセプトブック（Figma・v2 / 10ページ）: `Service` ファイルの section `261:872`
- デザイン案A / B の元画像: 同ファイルの section `269:1070`
- ロゴ（White / Black）: 同ファイルの section `122:930`
- Mission・Vision・Value / ペルソナ / ブランドストーリー: Notion「SUMI」配下
