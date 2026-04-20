# パターン2: ネスト useFieldArray（RHF 内データ管理）

## 概要
全見積書のデータを React Hook Form の `quotationEntries` 配列で一括管理し、`useRef` を不要にする方式。見積書ごとに `useFieldArray` をネストして明細行を管理する。

---

## パターン1 との比較

| | パターン1 | パターン2 |
|---|----------|----------|
| データ保持 | RHF（現在の見積書）+ useRef（他の見積書） | RHF のみ（全見積書） |
| 見積書切替 | ref に退避 → ref から復元 → replace | selectedId を変更するだけ |
| useFieldArray | 固定名 `"currentDetails"` 1つ | 見積書ごとに `quotationEntries.${idx}.details` |
| バリデーション | リアルタイム活性制御（isAllFilled） | Zodクリック時検証（validateAllEntries） |
| コンポーネント | DetailInputForm が直接明細行を描画 | QuotationDetailForm に委譲 |

---

## 状態管理（React Hook Form 2層構造）

### 全体像

```
ユーザー入力 (QuotationDetailForm)
    ↓  register() で双方向バインド
RHF quotationEntries[idx].details (useFieldArray)
    ↓  見積書切替は selectedId の変更のみ（退避/復元不要）
RHF 内に全見積書データが常駐
    ↓  モーダル確定時に validateAllEntries() → getAllQuotationData()
ページレベル RHF (savedDetails に上書き)
    ↓  認可依頼ボタンで handleSubmit()
API送信 (将来実装)
```

---

### 1. ページレベル RHF (`OrderDetailPage.tsx`)

パターン1と同一。`useForm<PageFormData>` で `orderName` と `savedDetails` を管理。

---

### 2. モーダルレベル RHF (`useOrderDetailForm.ts`)

```typescript
useForm<Pattern2ModalFormData>({
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

#### Pattern2 固有の型 (`types.ts`)

```typescript
interface QuotationFormEntry {
  quotationId: string;
  details: DetailItem[];
}

interface Pattern2ModalFormData {
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

**パターン1 との決定的な違い**: データの退避/復元が一切不要。RHF 内に全見積書のデータが常駐しているため、選択 ID の変更だけで切り替えが完了する。

---

### 5. Zodバリデーションフロー

#### 明細追加/更新ボタン押下時（validateAllEntries）

```
ボタン押下
  ↓ form.clearErrors("quotationEntries") で全エラーをクリア
  ↓ 全 quotationEntries をループ
  ↓ 各明細行（空の行も含めすべて）について validateDetail() で検証:
  │     └── detailItemSchema.safeParse(detail)
  │           → productName: 空でないこと
  │           → amount: 空でない・NaN でない・0 より大きい
  │   エラーあり → form.setError() でフィールド単位にセット
  ↓
  ├── 全行 valid → 保存処理へ
  └── エラーあり → return（保存しない、エラー表示）
```

#### 見積書切替時（validateCurrentQuotation）

```
selectQuotation(newId) 呼び出し
  ↓ selectedQuotationId が存在 & newId と異なる
  ↓ validateCurrentQuotation()
  │   → 現在の見積書の全明細行（空の行も含む）を検証
  │   → 検証ロジックは validateAllEntries と同一
  ├── 失敗: return（setSelectedQuotationId しない = 切替阻止）
  └── 成功: エラーをクリアして setSelectedQuotationId(newId)
```

#### エラー表示の仕組み

- `form.setError()` で設定されたエラーは `form.formState.errors` に反映
- `QuotationDetailForm` が `errors?.quotationEntries?.[quotationIndex]?.details?.[index]` でアクセス
- `<Field invalid={!!fieldErrors?.fieldName} errorText={fieldErrors?.fieldName?.message}>` で表示
- `AddOrderDetailModal` で `form.formState.errors` を購読し、エラー変更時に再レンダリング（見積書切替ブロック時にセレクトを元の値に戻すため）

---

### 6. フック API（useOrderDetailForm）

#### パターン1 から削除されたもの

- `useRef` → 不要（全データが RHF 内）
- `fieldArray` / `replace()` → 不要（各 QuotationDetailForm が自身の useFieldArray を持つ）
- `saveCurrentToRef()` → 不要
- `isAllFilled()` → Zod検証に置換

#### 新しく追加されたもの

| 戻り値 | 型 | 説明 |
|--------|------|------|
| `selectedQuotationIndex` | `number` | 現在の見積書のインデックス（-1 = 未選択） |
| `validateAllEntries` | `() => boolean` | 全見積書の非空明細行をZod検証。エラー時は form.setError |
| `validateCurrentQuotation` | `() => boolean` | 現在の見積書の非空明細行をZod検証 |

#### 変更されたもの

| 関数 | パターン1 | パターン2 |
|------|----------|----------|
| `selectQuotation` | ref に退避 → replace で復元 | バリデーション → エントリ追加（未訪問時のみ）+ ID 変更 |
| `addDetailRow` | `fieldArray.append()` | `form.setValue()` で配列操作 |
| `removeDetailRow` | `fieldArray.remove()` | `form.setValue()` で配列操作 |
| `getAllQuotationData` | ref から集約 | `form.getValues("quotationEntries")` から変換 |

---

## コンポーネント構成

```
AddOrderDetailModal
  ├── QuotationSelector（pattern1 から再利用）
  └── DetailInputForm（pattern2 版）
        └── QuotationDetailForm（新規: 見積書ごとに useFieldArray を持つ）
              └── 明細行（register パスがネスト + エラー表示）
```

### QuotationDetailForm（新コンポーネント）

パターン1 の `DetailInputForm` が担っていた明細行の描画を分離。

- `useFieldArray` を内部で生成（`fields`, `append`, `remove`）
- 明細の追加/削除ボタンもこのコンポーネント内に配置
- `key={quotationId}` によるリマウントで、見積書切替時にデータが自動ロードされる
- `form.formState.errors` からフィールド単位のエラーを取得し、`<Field invalid errorText>` で表示
- `disabled` prop で全入力・追加/削除ボタンを非活性化可能（見積書未選択時の表示に使用）

### DetailInputForm（pattern2 版）

- 薄いラッパー
- 見積書未選択時: `QuotationDetailForm` に `disabled` を渡して非活性の1行を表示
- 選択時: 通常モードで `<QuotationDetailForm key={quotationId} />` に委譲

### ダミーエントリの仕組み（未選択時の表示）

- `useOrderDetailForm` の初期 `quotationEntries` は `[{ quotationId: "", details: [createEmptyDetail()] }]` の**1件のダミー**で始まる（`createInitialEntries()`）
- `selectedQuotationIndex` は `findIndex(e => e.quotationId === "")` で **0** を返すため、未選択でも `QuotationDetailForm` が正しい useFieldArray パスで動作する
- 最初の `selectQuotation(id)` 呼び出し時は、新規エントリ追加ではなく**ダミーエントリの `quotationId` を差し替えて claim** する（エントリ数は1件のまま）
- 以降の選択は従来通り append
- `resetForm()` もダミーエントリ1件で初期化

---

## 認可依頼時のバリデーション（OrderDetailPage）

パターン1と同一。認可依頼ボタン押下時に価格交渉金額と発注金額の一致を検証する。

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

### addDetailRow / removeDetailRow は form.setValue を使用
- `QuotationDetailForm` 内の `useFieldArray` の `append` / `remove` はコンポーネント内でのみ使用
- フックから公開する `addDetailRow` / `removeDetailRow` は `form.setValue` で直接配列操作
- テスト時に `renderHook` で `QuotationDetailForm` をレンダリングせずに済む

### selectedQuotationIndex の算出
- `useMemo` で `quotationEntries` 内の該当インデックスを算出
- `selectedQuotationId` が変わるたびに再計算される

### register と valueAsNumber
- パターン1と同様、`valueAsNumber: true` による空入力 → `NaN` の挙動に注意
- `detailItemSchema` 側で空文字・NaN を必須エラーとして扱う

### Zodバリデーションの手動実行
- `zodResolver` は使用せず、`detailItemSchema.safeParse()` を手動で呼び出す
- `form.setError()` / `form.clearErrors()` でエラーを制御
- 空行も含め全行を検証する（空行スキップは行わない）。不要な行はゴミ箱アイコンで削除
