# セキュリティ監査レポート

- 対象: `work-support-extension` (Chrome MV3 拡張)
- 監査日: 2026-06-02
- 監査範囲: `src/`, `wxt.config.ts`, `package.json`, `pnpm-lock.yaml`
- 監査手法:
  - 静的コードレビュー（権限、メッセージ処理、URL 遷移、データ保存）
  - 機密情報スキャン（秘密鍵・トークン・`.env`）
  - 依存関係脆弱性スキャン（`pnpm audit --prod`, `pnpm audit`）

## 総評

本リポジトリにおいて、**本番配布物に直結する重大な脆弱性は検出されませんでした**。  
ただし、権限設計と入力検証の観点で改善余地があり、将来的な攻撃面を減らすために対応を推奨します。

## 主要な指摘事項

### 1) 依存関係（開発系）に既知脆弱性（High/Moderate）

- 重要度: **Medium**（開発経路限定のため）
- 根拠:
  - `pnpm audit` で 2 件検出
    - `tmp <0.2.6`（High, Path Traversal）
    - `uuid <11.1.1`（Moderate, 境界チェック不足）
  - 経路: `. > wxt > web-ext-run > ...`
- 影響:
  - 主にローカル開発時のツールチェーン上のリスク。拡張機能本体ランタイムに直接同梱されるリスクは低い。
- 推奨対応:
  - `wxt` / `web-ext-run` の更新で解消バージョンへ追従
  - 依存更新後に `pnpm audit` を再実行し結果を記録

### 2) `onMessage` のランタイム入力検証がない

- 重要度: **Medium**
- 該当箇所: `src/entrypoints/background.ts`
- 事象:
  - `unknown` メッセージを `MessageType` として即時キャストし、`msg.type` を直接参照している。
  - 不正フォーマット入力時に例外や未処理 Promise 拒否につながる余地がある。
- 影響:
  - 想定外メッセージによる Service Worker の不安定化（DoS 的挙動）リスク。
- 推奨対応:
  - 受信メッセージに対する型ガードを追加し、`type` と payload（`duration`, `settings`）を明示検証
  - 不正入力は安全に失敗させ、必ずエラーレスポンスを返す

### 3) `blocked.html?url=...` の遷移先 URL 検証不足

- 重要度: **Medium**
- 該当箇所: `src/entrypoints/background.ts`, `src/entrypoints/blocked/App.tsx`
- 事象:
  - クエリパラメータ `url` を復元時遷移先として使用しているが、スキーム許可リスト検証がない。
- 影響:
  - 拡張ページ URL を細工された場合、意図しない URL へ遷移する可能性。
- 推奨対応:
  - `http:` / `https:` のみ許可し、それ以外は `about:newtab` へフォールバック
  - 復元対象 URL の正規化・検証処理を共通関数化

### 4) 権限が広い（`<all_urls>` + `tabs` + `webNavigation`）

- 重要度: **Low**
- 該当箇所: `wxt.config.ts`
- 事象:
  - 機能要件上妥当だが、侵害時の影響範囲が大きい構成。
- 影響:
  - 供給網事故や将来バグ発生時の被害面積が広くなる。
- 推奨対応:
  - 可能ならホスト権限を `http://*/*`, `https://*/*` に限定
  - 将来的に optional host permissions の採用を検討

## 追加確認（問題なし）

- 機密情報:
  - `.env` / 鍵ファイル / トークン直書きは検出なし
- 危険 API:
  - `eval`, `innerHTML`, `dangerouslySetInnerHTML`, `document.cookie`, `fetch` の不適切利用は検出なし
- 依存関係（本番）:
  - `pnpm audit --prod`: `No known vulnerabilities found`

## 優先対応順（推奨）

1. `onMessage` 入力検証の実装（型ガード・バリデーション）
2. URL 復元時のスキーム検証追加
3. 開発依存の更新（`wxt` 系）と再監査
4. 権限最小化の検討

## 監査コマンド記録

```bash
pnpm audit --prod
pnpm audit
```
