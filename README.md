# 作業集中ブロッカー

作業時間中にホワイトリスト外の Web ページ閲覧をブロックし、集中をサポートする Chrome / Firefox 拡張機能です。

## 機能

- **タイマー式ブロック** — 作業時間(分数)を指定して開始すると、ホワイトリスト外の全 Web ページがブロックされます
- **既存タブもブロック** — 開始時に既に開いているタブも即座にブロック対象になります
- **ホワイトリスト** — ドメイン+サブドメイン単位で許可サイトを管理できます
- **ブロックページ** — ブロック時は残り時間をリアルタイム表示するページに差し替わります
- **元ページ復元** — 作業終了後、ブロックされていたタブは元の Web ページに自動で戻ります
- **開始前確認** — 開始時に確認ダイアログを表示。タイマー終了まで途中解除はできません
- **プリセット** — 30 分 / 60 分 / 90 分のプリセットボタンですぐに開始可能
- **デフォルトホワイトリスト** — Google、Bing、DuckDuckGo、Yahoo! JAPAN が初期登録済み

## 技術スタック

| 項目 | 技術 |
|---|---|
| フレームワーク | [WXT](https://wxt.dev) (Chrome/Firefox クロスブラウザ対応) |
| UI | TypeScript + React |
| CSS | Tailwind CSS v4 |
| ビルド | WXT 内蔵 (Vite ベース) |
| パッケージマネージャ | pnpm |

## 必要環境

- Node.js 18+
- pnpm

## セットアップ

```bash
# 依存関係のインストール
pnpm install
```

## 開発

```bash
# 開発モード (Chrome が自動で開きます)
pnpm dev

# Firefox 向け開発モード
pnpm dev:firefox
```

開発モードでは HMR が有効で、コード変更が即座に反映されます。

## ビルド

```bash
# Chrome 向けビルド
pnpm build

# Firefox 向けビルド
pnpm build:firefox
```

ビルド成果物は `.output/chrome-mv3/` (または `.output/firefox-mv3/`) に出力されます。

## Releases からインストール

配布ページ: [GitHub Releases](https://github.com/para7/work-support-extension/releases)

### Chrome

1. Releases から `*-chrome.zip` をダウンロード
2. zip を展開
3. Chrome で `chrome://extensions` を開く
4. 右上の「デベロッパーモード」を ON にする
5. 「パッケージ化されていない拡張機能を読み込む」をクリック
6. 展開したフォルダを選択

### Firefox

1. Releases から `*-firefox.zip` をダウンロード
2. zip を展開
3. Firefox で `about:debugging#/runtime/this-firefox` を開く
4. 「一時的なアドオンを読み込む」をクリック
5. 展開したフォルダ内の `manifest.json` を選択

> Firefox へのこの読み込み方法は一時的です。ブラウザ再起動後は再度読み込みが必要です。

## Chrome への手動インストール

1. `pnpm build` を実行
2. Chrome で `chrome://extensions` を開く
3. 右上の「デベロッパーモード」を ON にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. `.output/chrome-mv3/` フォルダを選択

## 配布用パッケージの作成

```bash
# Chrome 向け zip
pnpm zip

# Firefox 向け zip
pnpm zip:firefox
```

## プロジェクト構成

```
src/
  core/                 # ブラウザ非依存のビジネスロジック
    types.ts            # 共通型定義
    config.ts           # デフォルト設定・定数
    timer.ts            # タイマーロジック
    whitelist.ts        # ホワイトリスト判定
  utils/
    storage.ts          # chrome.storage.local ラッパー
    messaging.ts        # メッセージング抽象化
  entrypoints/
    background.ts       # Service Worker (タイマー管理・ブロック制御)
    popup/              # ポップアップ UI
    blocked/            # ブロックページ
  assets/
    styles.css          # Tailwind CSS エントリーポイント
```

`core/` ディレクトリはブラウザ API に一切依存しないピュアなロジックで構成されており、将来の Firefox 版との共通化や単体テストが容易です。

## 必要な権限

| 権限 | 用途 |
|---|---|
| `storage` | 設定・タイマー状態の保存 |
| `alarms` | Service Worker のタイマー管理 |
| `tabs` | タブの URL 取得とリダイレクト |
| `webNavigation` | ナビゲーション監視 |
| `<all_urls>` (host) | 全 URL の監視 |

## ライセンス

MIT
