# SUMI — Brand Concept Book（iPad提示用 / A・B分岐）

見込み顧客にiPadで見せ、その場でアンケートに回答してもらうための静的サイト。
プロダクトのデザイン2案（A / B）を分けて提示し、どちらが支持されるかを検証する。

## ページ構成

| URL | 役割 |
|---|---|
| `/` | 調査実施者用の入口。A案・B案・ランダムのいずれかを選ぶ |
| `/a/` | デザイン案A（斜めカットの非対称デザイン）を載せたブック |
| `/b/` | デザイン案B（全周ベゼルの対称デザイン）を載せたブック |

ブックは横めくり（スワイプ／画面左右のタップ／矢印キー）で全11ページ。
最終ページのボタンからアンケートフォームへ遷移する。

## ファイルの役割

| ファイル | 役割 |
|---|---|
| `assets/js/content.js` | **全ページのコピーとA/B差分。文言を直すのはここだけ** |
| `assets/js/book.js` | ページの組み立てと横めくりの制御 |
| `assets/css/book.css` | スタイル。黒地・明朝見出し・iPad前提のレスポンシブ |
| `a/index.html`, `b/index.html` | パターン指定だけを持つ入れ物。中身は持たない |
| `assets/img/product-a.png` | A案の製品画像（背景透過済み） |
| `assets/img/product-b.png` | B案の製品画像（背景透過済み） |
| `assets/img/src/` | Figmaから書き出した白背景の元画像 |
| `tools/cutout.py` | 白背景の画像を透過PNGに変換するスクリプト |

## よくある変更

### アンケートフォームのURLを設定する

`assets/js/content.js` の `surveyUrl` を書き換え、`surveyUrlIsPlaceholder` を `false` にする。

```js
surveyUrl: "https://forms.gle/xxxxxxxx",
surveyUrlIsPlaceholder: false
```

URLには `?v=a` / `?v=b` が自動で付与され、どちらのパターンを見た回答かをフォーム側で判別できる。

### 車内に取り付けた画像を追加する

画像を `assets/img/` に置き、`content.js` の該当パターンの `inCarImage` にパスを書く。
`null` のあいだは「制作中」のプレースホルダーが表示される。

```js
inCarImage: "assets/img/in-car-a.png",
```

### 文言を直す・ページを増やす

`content.js` の `SUMI_PAGES` を編集する。ページ数（「全11ページ」の表記とノンブル）は自動で追従する。
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

## 元になった資料

- ブランドコンセプトブック（Figma・v2 / 10ページ）: `Service` ファイルの section `261:872`
- デザイン案A / B の元画像: 同ファイルの section `269:1070`
- Mission・Vision・Value / ペルソナ / ブランドストーリー: Notion「SUMI」配下
