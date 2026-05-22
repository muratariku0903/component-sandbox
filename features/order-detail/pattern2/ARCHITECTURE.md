# 発注明細: ネスト useFieldArray（RHF 内データ管理）

## 概要
全見積書のデータを React Hook Form の `quotationEntries` 配列で一括管理する方式。見積書ごとに `useFieldArray` をネストして明細行を管理する。

---

## 状態管理（React Hook Form 2層構造）

### 全体像

```
ユーザー入力 (QuotationDetailForm)
    ↓  register() で双方向バインド
RHF quotationEntries[idx].details (useFieldArray)
    ↓  見積書切替は selectedId の変更のみ（退避/復元不要）
RHF 内に全見積書データが常駐
    ↓  モーダル確定時に validateCurrentQuotation() → getAllQuotationData()
ページレベル RHF (savedDetails に上書き)
    ↓  認可依頼ボタンで handleSubmit()
API送信 (将来実装)
```

---

### 1. ページレベル RHF (`OrderDetailPage.tsx`)

`useForm<PageFormData>` で `orderName` と `savedDetails` を管理する。

---

### 2. モーダルレベル RHF (`AddOrderDetailModal.tsx` 内に直接実装)

```typescript
useForm<OrderDetailModalFormData>({
  resolver: zodResolver(orderDetailModalFormSchema),
  defaultValues: {
    taxType: "tax_exclusive",
    quotationEntries: [],
  },
})
```

| フィールド | 型 | 説明 |
|-----------|------|------|
| `taxType` | `"tax_exclusive" \| "tax_inclusive"` | 税区分。ラジオボタンで切替 |
| `quotationEntries` | `QuotationFormEntry[]` | 全見積書のデータ配列 |

#### QuotationFormEntry

```typescript
{
  quotationId: string       // 見積書ID
  details: DetailItem[]     // 明細行の配列
}
```

#### モーダル固有の型 (`types.ts`)

```typescript
interface QuotationFormEntry {
  quotationId: string;
  details: DetailItem[];
}

interface OrderDetailModalFormData {
  taxType: TaxType;
  quotationEntries: QuotationFormEntry[];
}
```

---

### 3. ネスト useFieldArray（見積書ごとの明細行管理）

```typescript
// QuotationDetailForm.tsx 内
useFieldArray({
  control,
  name: `quotationEntries.${quotationIndex}.details`,
})
```

- 各見積書が独自の `useFieldArray` を持つ
- `QuotationDetailForm` に `key={quotationId}` を指定し、見積書切替時にリマウント
- `shouldUnregister: false`（RHF デフォルト）により、アンマウントしてもデータは RHF に保持される

#### register パス

```typescript
register(`quotationEntries.${quotationIndex}.details.${detailIndex}.productName`)
register(`quotationEntries.${quotationIndex}.details.${detailIndex}.unitPrice`, { valueAsNumber: true })
```

---

### 4. 見積書切替のフロー

```
1. selectQuotation(id) 呼び出し

2. 現在の見積書のバリデーション（既に選択中の場合）
   → validateCurrentQuotation() でZod検証
   → 失敗: 切替を阻止、エラーメッセージ表示
   → 成功: エラーをクリアして続行

3. エントリの存在確認
   → 既存: 何もしない（データは RHF に残っている）
   → 新規: form.setValue("quotationEntries", [...entries, newEntry])

4. setSelectedQuotationId(id) で選択 ID を更新

5. DetailInputForm が key={quotationId} で QuotationDetailForm をリマウント
   → 新しい quotationIndex で useFieldArray が初期化
   → RHF 内のデータをそのまま読み込む（退避/復元なし）
```

RHF 内に全見積書のデータが常駐しているため、選択 ID の変更だけで切り替えが完了する。

---

### 5. Zodバリデーションフロー

**検証ルールは Zod スキーマに集約する。**
モーダル内のバリデーション処理は検証ロジックを持たず、RHF の `trigger()` を呼ぶだけにする。

#### スキーマ階層

| スキーマ | 内容 |
|---------|------|
| `detailItemSchema` | 明細1行。`productName.min(1)` と `amount.refine(positive)` で必須チェック |
| `quotationFormEntrySchema` | 見積書1件分。`details` に `z.array(detailItemSchema)` を持つ |
| `orderDetailModalFormSchema` | モーダル全体。`taxType` と全見積書の `quotationEntries` を検証する |

クロス行/クロスフィールドの検証（合計金額チェックなど）が将来必要になれば `orderDetailModalFormSchema` に `.superRefine()` を追加する。

#### 明細追加/更新ボタン押下時・見積書切替時（共通：validateCurrentQuotation）

```
呼び出し
  ↓ form.trigger(`quotationEntries.${currentIdx}.details`)
  ↓ zodResolver(orderDetailModalFormSchema) が Zod schema を実行
  ├── true: 検証成功
  └── false: RHF が該当フィールドの errors にメッセージを反映
```

保存時: 失敗→保存中断、成功→保存処理へ
切替時: 失敗→切替阻止、成功→ setSelectedQuotationId(newId)

#### 不変条件（なぜ保存時も current のみで十分か）

- 初期状態または `initializeFromSaved` で入るデータは、保存時に検証済みなので valid
- UI で編集できるのは現在表示中の見積書のみ（他の見積書は RHF 内に残るが触れない）
- 見積書切替は「元の見積書の検証に成功した場合のみ実行」→ 切替時点で元の見積書は valid
- よって **現在表示中でない見積書のエントリは常に valid** という不変条件が成立

#### 不変条件（なぜ保存時も current のみで十分か）

- 初期状態または `initializeFromSaved` で入るデータは、保存時に検証済みなので valid
- UI で編集できるのは現在表示中の見積書のみ（他の見積書は RHF 内に残るが触れない）
- 見積書切替は「元の見積書の検証に成功した場合のみ実行」→ 切替時点で元の見積書は valid
- よって **現在表示中でない見積書のエントリは常に valid** という不変条件が成立
- 保存時は「現在表示中の見積書」さえ検証すれば全体の valid 性が保証される

#### エラー表示の仕組み

- `zodResolver` 経由で設定されたエラーは `form.formState.errors` に反映
- `QuotationDetailForm` が `errors?.quotationEntries?.[quotationIndex]?.details?.[index]` でアクセス
- `<Field invalid={!!fieldErrors?.fieldName} errorText={fieldErrors?.fieldName?.message}>` で表示
- `AddOrderDetailModal` で `form.formState.errors` を購読し、エラー変更時に再レンダリング（見積書切替ブロック時にセレクトを元の値に戻すため）

---

### 6. モーダル内部ロジック（AddOrderDetailModal 内に直接実装）

唯一の利用箇所が `AddOrderDetailModal` だけだったため、フックには切り出さず同コンポーネント内にロジックを直接記述する。

#### モーダル内に保持する状態・関数

| 名前 | 型 | 説明 |
|------|------|------|
| `selectedQuotationId` | `useState<string>` | 現在の見積書 ID（未選択時 `""`） |
| `selectedQuotationIndex` | `useMemo<number>` | `quotationEntries` 内の該当インデックス（-1 = 未選択） |
| `validateCurrentQuotation` | `() => boolean` | 現在の見積書の全明細行（空行含む）をZod検証。保存時・切替時の両方で使用 |
| `selectQuotation` | `(id: string) => void` | バリデーション → エントリ追加（未訪問時のみ）+ ID 変更 |
| `initializeFromSaved` | `(details) => void` | モーダル再オープン時に savedDetails から復元 |
| `resetForm` | `() => void` | ダミーエントリ1件だけの初期状態に戻す |

> 明細行の追加/削除は `QuotationDetailForm` 内の `useFieldArray.append` / `remove` で完結するため、モーダルからは公開していない。

---

## コンポーネント構成

```
AddOrderDetailModal
  ├── QuotationSelector
  └── DetailInputForm
        └── QuotationDetailForm（新規: 見積書ごとに useFieldArray を持つ）
              └── 明細行（register パスがネスト + エラー表示）
```

### QuotationDetailForm（新コンポーネント）

- `useFieldArray` を内部で生成（`fields`, `append`, `remove`）
- 明細の追加/削除ボタンもこのコンポーネント内に配置
- `key={quotationId}` によるリマウントで、見積書切替時にデータが自動ロードされる
- `form.formState.errors` からフィールド単位のエラーを取得し、`<Field invalid errorText>` で表示
- `disabled` prop で全入力・追加/削除ボタンを非活性化可能（見積書未選択時の表示に使用）

### DetailInputForm

- 薄いラッパー
- 見積書未選択時: `QuotationDetailForm` に `disabled` を渡して非活性の1行を表示
- 選択時: 通常モードで `<QuotationDetailForm key={quotationId} />` に委譲

### ダミーエントリの仕組み（未選択時の表示）

- `AddOrderDetailModal` の初期 `quotationEntries` は `[{ quotationId: "", details: [createEmptyDetail()] }]` の**1件のダミー**で始まる（`createInitialEntries()`）
- `selectedQuotationIndex` は `findIndex(e => e.quotationId === "")` で **0** を返すため、未選択でも `QuotationDetailForm` が正しい useFieldArray パスで動作する
- 見積書が1件も連携されていない場合は、この初期エントリをダミーではなく手入力用エントリとして扱い、入力・行追加・保存ボタンを活性にする
- 見積書0件時に保存された明細は、保存データ上では `quotation: { id: "manual-entry", name: "見積書なし" }` のグループとして扱う
- `selectQuotation(id)` 呼び出し時は、先にダミー（`quotationId === ""`）を除去してから、選択された見積書のエントリを append する
  - 最初の選択: ダミー除去 → 新規エントリ append（エントリ数は1件のまま）
  - 以降の選択: ダミーは既に存在しないので単に append
- `resetForm()` もダミーエントリ1件で初期化

---

## 認可依頼時のバリデーション（OrderDetailPage）

認可依頼ボタン押下時に価格交渉金額と発注金額の一致を検証する。

```
認可依頼ボタン押下
  ↓ RHF handleSubmit（orderName の required チェック）
  ↓ 通過後、コールバック内で金額チェック
  ├── negotiationPrice === orderAmount → 送信処理（console.log / 将来 API）
  └── negotiationPrice !== orderAmount → priceError に設定、送信中断
```

- `priceError` は `useState<string>("")` で管理
- 明細を再編集（`handleModalSave`）すると `setPriceError("")` でクリア
- サマリーは見積書テーブルの下、認可依頼ボタンの上に配置

---

## 注意事項（実装時の教訓）

### shouldUnregister: false の活用
- RHF のデフォルト設定 (`shouldUnregister: false`) により、`QuotationDetailForm` がアンマウントされても `quotationEntries[idx].details` のデータは保持される
- この仕組みにより、見積書切替時にデータの退避/復元が不要

### 明細行の追加/削除は QuotationDetailForm 側で完結
- `QuotationDetailForm` 内の `useFieldArray` の `append` / `remove` で行追加・削除を行う
- フックからは公開しない（プロダクションコードで二重に持つ必要がない）
- テストで行追加が必要な場合は、テスト側に `form.setValue` ベースのヘルパーを用意する

### selectedQuotationIndex の算出
- `useMemo` で `quotationEntries` 内の該当インデックスを算出
- `selectedQuotationId` が変わるたびに再計算される

### register と valueAsNumber
- `valueAsNumber: true` による空入力 → `NaN` の挙動に注意
- `detailItemSchema` 側で空文字・NaN を必須エラーとして扱う

### Zodバリデーションの実行
- `zodResolver(orderDetailModalFormSchema)` を `useForm` に設定する
- 保存時・見積書切替時は共通の `validateCurrentQuotation()` から `form.trigger()` を呼ぶ
- 空行も含め全行を検証する（空行スキップは行わない）。不要な行はゴミ箱アイコンで削除
