# 問い合わせ一覧 仕様書

## 概要

`/inquiry` ルートに配置された問い合わせ一覧パーツ。テーブル形式で問い合わせを並べ、各行の編集アイコン押下で popover を表示し、popover 内の react-select で担当者を変更する。

実装ファイル:

```
features/inquiry/
  types.ts             # 型定義（Inquiry / Assignee / InquiryStatus）
  mocks.ts             # モックデータ（担当者10名、問い合わせ6件）
  InquiryTable.tsx     # テーブル + 行 + popover
  AssigneeSelect.tsx   # react-select ラッパー
pages/inquiry/index.tsx # ルート（state は useState で管理）
```

---

## 画面構成

### メインテーブル

カラム構成（左から右）:

| カラム | 内容 |
|---|---|
| タイトル | `inquiry.title` |
| ステータス | `STATUS_LABELS[inquiry.status]`（未対応／対応中／解決済み／クローズ） |
| 担当者 | 名前 or「未割当」（`assignee` が `null` のとき、`color="gray.500"` で薄字表示） |
| 作成日時 | `Intl.DateTimeFormat("ja-JP")` で `YYYY/MM/DD HH:mm` 形式 |
| 操作 | 鉛筆アイコンの `IconButton`、押下で popover を開く |

### 編集 popover

- トリガー: 操作カラムの鉛筆アイコン (`<LuPencil />`)
- 配置: `placement="bottom-end"`
- 内容:
  - 右上に `PopoverCloseButton`（×ボタン）
  - 「担当者」ラベル（太字、小サイズ）
  - その下に react-select（`AssigneeSelect`）
- 閉じる手段:
  - × ボタンクリック
  - popover 外をクリック（`closeOnBlur=true` のデフォルト挙動）
  - ESC キー
  - 同じトリガーを再クリック（トグル）
- 閉じない条件:
  - **担当者を選択しただけでは閉じない**（要件）
  - popover 内のテキストやセレクトの操作中に他の場所へ移動しない限り

---

## データモデル

```ts
type InquiryStatus = "open" | "in_progress" | "resolved" | "closed";

interface Assignee {
  id: string;
  name: string;
}

interface Inquiry {
  id: string;
  title: string;
  status: InquiryStatus;
  assignee: Assignee | null;
  createdAt: string; // ISO 8601
}
```

ステータスラベル対応表:

| status 値 | 表示 |
|---|---|
| open | 未対応 |
| in_progress | 対応中 |
| resolved | 解決済み |
| closed | クローズ |

---

## 担当者セレクト（react-select）

| 観点 | 仕様 |
|---|---|
| 選択タイプ | **単一選択**（`isMulti` ではない） |
| 検索 | タイプして候補を絞り込み（`isSearchable=true`、デフォルト） |
| クリア | 入力欄右の × アイコンで `null`（未割当）に戻す（`isClearable=true`） |
| プレースホルダ | `担当者を検索...` |
| 該当なし時 | `該当する担当者がいません` |
| 候補 | モック10名（`mockAssignees`） |

### 反映タイミング

- セレクトで選んだ瞬間に親の `onAssigneeChange(inquiryId, assignee)` が即時呼び出され、テーブルの行データが更新される
- popover は閉じない、選択された担当者がそのまま表示される
- 「保存」ボタンのような確定 UI は無し（即時反映）

---

## 状態管理

ページ (`pages/inquiry/index.tsx`):

- `useState<Inquiry[]>(mockInquiries)` で全行データを保持
- `handleAssigneeChange(id, assignee)` で immutable に該当行を更新

`features/inquiry/InquiryTable.tsx`:

- 表示ロジックのみ。state は持たない（presentational）
- `inquiries`, `assignees`, `onAssigneeChange` を props で受ける

`features/inquiry/AssigneeSelect.tsx`:

- react-select のラッパー（option 型・instanceId・各種オプションを集約）

---

## イベント伝播の設計

行 (`<Tr>`) には `onClick` がデモ目的で付いていて、クリックすると `console.log("[row click]", ...)` を出す。ここで重要なのは **「ポップオーバー周りの操作は行クリックを発火させない」** という要件。

### `stopPropagation` の配置

| 配置 | 理由 |
|---|---|
| 編集アイコン (`IconButton.onClick`) | アイコン押下で行 onClick を発火させない |
| `<PopoverContent onClick={...}>` | popover 内部（×ボタン・本文・react-select オプション）からのクリックを一括ブロック |
| **操作セル (`<Td>`) には付けない** | セル全体で止めるとアイコン横の余白クリックも行クリック対象外になってしまう。空白部分も行クリックが拾えるように、止める範囲はアイコンと popover 内部だけに限定 |

### React Portal とイベントの関係

- React の合成イベントは **DOM tree ではなく React tree** をたどってバブルする
- `Portal` で別の DOM 位置にレンダーしても、React 上の親子関係は切れない
- そのため `<PopoverContent>` 内で `stopPropagation` すれば、portal 配下の全要素（react-select の menu など）からのクリックも、行までは届かない
- ただし react-select の `onChange` には `MouseEvent` が渡らないので、**option 単位ではなく popover 単位で止める**のが正解

### 期待挙動の早見表

| クリック箇所 | `[row click]` 出力 |
|---|---|
| タイトル / ステータス / 担当者 / 作成日時セル | ✅ |
| 操作セルの空白部分（行高が大きいとき） | ✅ |
| 編集アイコン（鉛筆） | ❌ |
| Popover の中（×ボタン・本文・react-select オプション） | ❌ |

---

## react-select の設計判断（重要）

### menu portal を**使わない**

通常、popover や modal の中で react-select を使うときは `menuPortalTarget={document.body}` でメニューを portal するのが定石（メニューが popover 枠で見切れないようにするため）。**今回は意図的に portal していない**。

理由:

- Chakra v2 の `<Popover>` は `closeOnBlur=true` がデフォルトで、ネイティブの focus blur を見て popover を閉じる
- メニューを `document.body` に portal すると、option クリック時に focus が popover の DOM 外へ移る → `closeOnBlur` が誤発火 → popover が閉じる
- それを防ごうと `closeOnBlur=false` にすると、今度は別の行のトリガーを押しても元の popover が閉じず、複数同時オープン状態になる
- → menu を popover 内部に直接描画することで、option クリック時も focus は popover 内に留まり、`closeOnBlur` が正しく機能（外クリックでは閉じる、option 選択では閉じない）

副作用は最小限で、popover content は `overflow:visible` のため、メニューが popover 枠を越えて表示されても問題ない。

### `instanceId` に行 ID を渡す（SSR ハイドレーション対策）

react-select の内部 ID は通常モジュール単位のグローバルカウンタで自動採番されるが、SSR と CSR で生成順がズレる（StrictMode の二重実行・Hot Reload など）と `react-select-2-input` vs `react-select-3-input` のような不一致が起きてハイドレーション警告が出る。

`instanceId={`assignee-${inquiry.id}`}` のように **行 ID 由来の安定文字列** を渡すことで、SSR/CSR 双方で同じ ID が生成される。

---

## 技術スタック

- Next.js 15 (Pages Router)
- React 18
- TypeScript (strict)
- Chakra UI v2.10.x
- react-select 5.x
- vitest + @testing-library/react（このパーツに対するテストは未追加）

---

## モックデータ

担当者10名（`u1` 〜 `u10`、和名）、問い合わせ6件（`i1` 〜 `i6`、ログイン不具合・決済エラー・アカウント削除依頼など）。`mocks.ts` 参照。

将来的に API 化する場合は、`pages/inquiry/index.tsx` の `useState(mockInquiries)` 部分を `useQuery`/`useSWR` 等に置き換え、`onAssigneeChange` の実装を mutation 呼び出しに差し替える形を想定している。
