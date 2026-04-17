# 作業履歴

## プロジェクト概要
- Figma デザインに基づくコンポーネント設計・実装
- Figma ボード: https://www.figma.com/board/FkzXZGu3dn7zEEU5WKIjoJ/コンポーネント設計

## 作業ログ

### 2026-04-17
- プロジェクト初期セットアップ
- Figma MCP 接続確認済み（ファイルキー: `FkzXZGu3dn7zEEU5WKIjoJ`）
- Next.js (Pages Router) + TypeScript プロジェクト作成
- Chakra UI v3 (`@chakra-ui/react`, `@emotion/react`, `next-themes`) インストール
- Chakra CLI スニペット追加（`npx @chakra-ui/cli snippet add --all`）
- `_app.tsx`: ChakraProvider ラップ設定
- `_document.tsx`: `lang="ja"`, `suppressHydrationWarning` 追加
- rich-text-editor スニペットの型エラーを `@ts-nocheck` で対処（tiptap 未導入のため）
- ビルド確認 OK
- React Hook Form インストール

#### 発注明細コンポーネント実装
- Figma FigJam ワイヤーフレーム確認・要件整理
- コンポーネント設計プラン策定・承認

**作成ファイル:**
- `components/order-detail/types.ts` - 型定義（Quotation, DetailItem, ModalFormData, SavedQuotationDetail）
- `components/order-detail/hooks/useOrderDetailForm.ts` - RHF フォーム管理フック（見積書ごとの状態保持、金額自動計算、税率制御）
- `components/order-detail/QuotationSelector.tsx` - 見積書選択 + 税抜/税込ラジオ + プレビュー
- `components/order-detail/DetailInputForm.tsx` - 明細入力フィールド群（動的行追加/削除）
- `components/order-detail/AddOrderDetailModal.tsx` - 明細追加モーダル（2カラムレイアウト）
- `components/order-detail/OrderDetailSummary.tsx` - サマリー表示（価格交渉金額・発注金額・消費税）
- `components/order-detail/QuotationTable.tsx` - 見積書ごとの明細テーブル
- `components/order-detail/OrderDetailPage.tsx` - メインページコンポーネント
- `pages/order-detail.tsx` - ルートページ（モックデータ付き）

**技術ポイント:**
- RHF `useFieldArray` で見積書切替時の入力値保持を実現
- フォームパス: `quotations.{quotationId}.details.{index}.fieldName`
- 税抜時→税率非活性、税込時→8%/10%選択可
- 金額 = 単価 × 数量 の自動計算（watch + setValue）
- ビルド確認 OK (`/order-detail` ルート追加)

#### RHF 2層構造への改修
- ページレベル RHF 導入: `useForm<PageFormData>` で `orderName` + `savedDetails` を管理
- `PageFormData` 型追加（`types.ts`）
- `OrderDetailPage.tsx` 改修:
  - `useState<SavedQuotationDetail[]>` → `useFieldArray` に変更
  - 「発注名」入力フィールド追加
  - 認可依頼ボタンで `handleSubmit` → ペイロード取得（将来API送信用）
- RHF 構成:
  - **ページレベル**: `orderName` + `savedDetails[]`（最終ペイロード）
  - **モーダルレベル**: `taxType` + `currentDetails[]`（固定パス、一時入力）
- ビルド確認 OK

#### useFieldArray 動的name問題の修正
- **問題**: `useFieldArray` の `name` を `quotations.${id}.details` で動的に切り替えると、前の見積書のフィールド数が新しい見積書に漏れる
- **解決**: アーキテクチャを根本変更
  - `useFieldArray` の `name` を `"currentDetails"` に固定
  - 見積書ごとのデータは `useRef<Record<string, DetailItem[]>>` で RHF 外管理
  - 見積書切替時: 現在のデータを ref に退避 → 新しい見積書のデータを `fieldArray.replace()` でロード
  - `ModalFormData` 型を `{ taxType, currentDetails[] }` にシンプル化
- 金額フィールド: 自動計算を廃止、手動入力に変更
- 税率フィールド: `disabled` を `NativeSelectField` に直接適用
- バリデーション: 空明細はスキップ、入力途中は NG、1件以上完了で送信可能
- ビルド確認 OK
