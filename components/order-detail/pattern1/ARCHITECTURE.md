# パターン1: useRef + useFieldArray（固定パス）

## 概要
React Hook Form の `useFieldArray` を固定名 `"currentDetails"` で使用し、見積書ごとのデータを `useRef` で退避/復元する方式。

---

## 状態管理（React Hook Form 2層構造）

### 全体像

```
ユーザー入力 (DetailInputForm)
    ↓  register() で双方向バインド
RHF currentDetails (useFieldArray)
    ↓  selectQuotation() で退避/復元
useRef (見積書ごとのデータストア)
    ↓  モーダル確定時に getAllQuotationData()
ページレベル RHF (savedDetails に上書き)
    ↓  認可依頼ボタンで handleSubmit()
API送信 (将来実装)
```

---

### 1. ページレベル RHF (`OrderDetailPage.tsx`)

```typescript
useForm<PageFormData>
```

| フィールド | 型 | 説明 |
|-----------|------|------|
| `orderName` | `string` | 発注名（テキスト入力） |
| `savedDetails` | `SavedQuotationDetail[]` | モーダルで確定済みの明細データ配列 |

- **用途**: モーダルで確定した明細を保持
- **操作**: `pageForm.setValue("savedDetails", details)` ... モーダル保存時に丸ごと上書き
- **消費**: 認可依頼ボタン押下時に `pageForm.handleSubmit()` で `orderName` + `savedDetails` を一括取得

#### SavedQuotationDetail（1件分の保存データ）

```typescript
{
  quotation: { id: string, name: string }   // 見積書情報
  taxType: "tax_exclusive" | "tax_inclusive" // 税区分
  details: DetailItem[]                     // 明細行の配列
  subtotal: number                          // 小計
}
```

---

### 2. モーダルレベル RHF (`useOrderDetailForm.ts`)

```typescript
useForm<ModalFormData>({
  defaultValues: {
    taxType: "tax_exclusive",
    currentDetails: [],
  },
})
```

| フィールド | 型 | 説明 |
|-----------|------|------|
| `taxType` | `"tax_exclusive" \| "tax_inclusive"` | 税区分。ラジオボタンで切替。初期値は税抜 |
| `currentDetails` | `DetailItem[]` | **現在選択中の見積書**の明細データ |

- `taxType` は `form.watch("taxType")` でリアクティブに取得
- `taxType === "tax_exclusive"` → 各明細の税率セレクトを非活性
- `taxType === "tax_inclusive"` → 各明細の税率セレクトを活性（8% / 10%）

#### DetailItem（明細1行分のデータ）

```typescript
{
  productName: string       // 商品名
  modelNumber: string       // 商品型番号
  unitPrice: number | ""    // 単価
  quantity: number | ""     // 数量
  taxRate: 8 | 10 | ""     // 税率（税込時のみ使用）
  amount: number | ""      // 金額（手動入力、自動計算なし）
}
```

---

### 3. useFieldArray（モーダル内の明細行管理）

```typescript
useFieldArray({ control, name: "currentDetails" })
```

- **name は固定値 `"currentDetails"`** を使用（動的に変えてはいけない）
- モーダル内で「現在表示中の見積書」の明細行を管理

| 操作 | メソッド | タイミング |
|------|---------|-----------|
| データ差し替え | `replace(details)` | 見積書切替時（ref のデータで上書き） |
| 行追加 | `append(createEmptyDetail())` | 「明細を追加」ボタン押下時 |
| 行削除 | `remove(index)` | 削除ボタン押下時（2行以上の場合のみ） |

#### 見積書切替時の replace() フロー

```
1. saveCurrentToRef()
   → 現在の入力値を structuredClone() で ref に退避

2. ref から切替先のデータを取得
   → 訪問済み: 保存されたデータをロード
   → 未訪問: 空の明細1行 (createEmptyDetail()) を生成

3. fieldArray.replace(data)
   → RHF のフィールドを丸ごと置き換え
```

---

### 4. useRef（見積書ごとのデータストア）

```typescript
const quotationDataRef = useRef<Record<string, DetailItem[]>>({});
```

- **キー**: 見積書ID（例: `"quote-1"`, `"quote-2"`）
- **値**: `DetailItem[]`（その見積書の明細データ）
- **RHF の外**で管理するデータストア

#### データ例

```typescript
{
  "quote-1": [
    { productName: "商品A", modelNumber: "M-001", unitPrice: 100, quantity: 10, taxRate: "", amount: 1000 },
    { productName: "商品B", modelNumber: "M-002", unitPrice: 200, quantity: 5, taxRate: "", amount: 1000 }
  ],
  "quote-2": [
    { productName: "商品C", modelNumber: "M-003", unitPrice: 500, quantity: 3, taxRate: "", amount: 1500 }
  ]
}
```

#### 主な操作

| 操作 | 関数 | 説明 |
|------|------|------|
| 退避 | `saveCurrentToRef()` | 現在の `currentDetails` を `ref[selectedId]` にディープコピー |
| 復元 | `selectQuotation(id)` 内 | `ref[id]` があれば `replace()` でロード |
| 集約 | `getAllQuotationData()` | 退避後に `ref` 全体をコピーして返却 |
| 初期化 | `initializeFromSaved(savedDetails)` | 保存済みデータから `ref` を復元し、最初の見積書を選択 |
| リセット | `resetForm()` | `ref = {}` で全データクリア |

#### なぜ RHF 外の useRef で管理するのか

`useFieldArray` の `name` を動的に変えると（例: `quotations.${id}.details`）、内部状態が破損し、前の見積書のフィールド数が次の見積書に漏れる。固定名 `"currentDetails"` + `useRef` で退避/復元する設計により回避。

---

### 5. その他の状態

| 管理方法 | 変数 | 説明 |
|---------|------|------|
| `useState<string>("")` | `selectedQuotationId` | 現在選択中の見積書ID。空文字 = 未選択 |
| `form.watch("taxType")` | `taxType` | 税区分のリアクティブ値。UI の制御に使用 |
| `form.watch()` (引数なし) | ― | モーダル内で呼び出し。全フィールドの変更で再レンダリングを発生させ、`isAllFilled()` の結果を `disabled` に反映 |

---

## 注意事項（実装時の教訓）

### useFieldArray の name は動的に変えない
- `useFieldArray({ name: \`quotations.\${id}.details\` })` のように動的にするとフィールド数が漏れる
- 固定パス + `useRef` での手動 save/load が安定

### register による非制御入力と再レンダリング
- RHF の `register` は非制御なので、入力してもコンポーネントは再レンダリングされない
- ボタンの活性/非活性など、入力値に連動する UI には `form.watch()` で再レンダリングをトリガーする必要がある

### NativeSelect の disabled
- `NativeSelectRoot` ではなく `NativeSelectField`（ネイティブ `<select>` 要素）に `disabled` を指定する

### valueAsNumber と NaN
- `register` に `valueAsNumber: true` を指定すると、空の数値入力は `NaN` を返す（`""` ではない）
- `isDetailEmpty` 等の判定では `Number.isNaN()` も考慮する必要がある
