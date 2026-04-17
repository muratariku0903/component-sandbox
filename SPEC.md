# 発注明細機能 仕様書

## 画面構成

### メイン画面
- タブ切り替え（現時点では「発注明細」タブのみ）
- タブ内コンテンツ:
  - **発注名**（テキスト入力フィールド）
  - **発注明細追加ボタン** → 押下で明細追加モーダルを表示
  - **サマリー表示**
    - 価格交渉金額: 常時表示
    - 発注金額: 明細追加後に表示
    - 消費税: 明細追加後に表示
  - **見積書ごとの明細テーブル**（明細追加後に表示）
    - カラム: 商品名 / 商品型 / 金額
    - 各テーブルに小計
  - **認可依頼ボタン**
    - 明細が1件以上ないと非活性
    - 押下で発注名 + 全明細データをペイロードとして取得（将来的にAPI送信）

### 発注明細追加モーダル

#### 左側
- **見積書選択（セレクトボックス）**
  - 見積書IDの配列はページアクセス時に取得済み
  - セレクトボックスなので常に1つだけ選択
- **税区分（ラジオボタン）**
  - 税抜（初期値）/ 税込
  - 税抜 → 明細の税率フィールドが非活性
  - 税込 → 明細の税率フィールドが活性（8% / 10% 選択可）
- **見積書プレビュー**（プレースホルダー）

#### 右側（明細入力フィールド）
- 見積書を選択すると、その見積書の明細入力フィールドが表示される
- 各明細行のフィールド:
  - 商品名（テキスト）
  - 商品型番号（テキスト）
  - 単価（数値）
  - 数量（数値）
  - 税率（セレクト: 8% / 10%、税抜時は非活性）
  - 金額（数値、手動入力）
- 「明細を追加」ボタン → 新しい明細行を追加

#### フッター
- **キャンセル** → モーダルを閉じてフォームリセット
- **明細追加** → バリデーション通過時のみ活性。押下でモーダルを閉じ、メイン画面に反映

---

## モーダル再オープン時の挙動

### 初回オープン（明細未登録）
- 全フィールド空の初期状態で表示
- モーダルタイトル: 「発注明細追加」
- 保存ボタン文言: 「明細追加」
- メイン画面のボタン文言: 「発注明細追加」

### 再オープン（明細登録済み）
- 前回保存した内容で初期セットされる
  - `quotationDataRef` に保存済みデータをロード
  - `taxType` を復元
  - 最初の見積書が選択状態で表示
- モーダルタイトル: 「発注明細編集」
- 保存ボタン文言: 「更新」
- メイン画面のボタン文言: 「発注明細編集」

### 保存時のデータ処理
- 追加ではなく **上書き**（`pageForm.setValue("savedDetails", details)`）
- 既存の明細は新しい内容で丸ごと置換される

---

## 見積書切り替え時の挙動

### 基本動作
- 見積書1を選択 → 右に見積書1の明細フィールドが表示
- 見積書2に切り替え → 見積書1のフィールドが消え、見積書2のフィールドが表示

### 入力値の保持
- 見積書1で入力後、見積書2に切り替え、再び見積書1に戻ると入力値が保持されている

### 初期表示
- **未入力の見積書を選択した場合**: 空の明細1行がデフォルト表示される
- **別の見積書のフィールド数・入力内容が影響してはならない**

---

## 明細追加/更新ボタンのバリデーション

### 各明細の状態判定
| 状態 | 説明 |
|------|------|
| 完全に空 | 全フィールド未入力（`valueAsNumber: true` による `NaN` も空として扱う） |
| 入力完了 | 全必須フィールド入力済み（税込時は税率も必須） |
| 入力途中 | 一部フィールドのみ入力 |

### 現在表示中の見積書と他の見積書で判定が異なる

| 明細の状態 | 現在表示中の見積書 | 他の見積書（非表示・未着手） | 他の見積書（非表示・着手済み） |
|-----------|-----------------|------------------------|------------------------|
| 完全に空 | **NG（非活性）** | スキップ（無視） | **NG（非活性）** |
| 入力完了 | OK | OK | OK |
| 入力途中 | **NG（非活性）** | **NG（非活性）** | **NG（非活性）** |

**重要**:
- 現在表示中の見積書の明細が完全に入力されていない限り、ボタンは非活性になる
- 非表示の見積書は **全明細が空（未着手）** の場合のみスキップ。一部でも入力済み明細がある場合は着手済みとみなし、空の明細行も「未完了」として扱う

### 活性条件（まとめ）
1. **現在表示中の見積書**の全明細が入力完了であること
2. **他の見積書**について:
   - 全明細が空（未着手）→ スキップ
   - 1つでも入力済み明細がある（着手済み）→ 全明細が入力完了であること
3. 全体で入力完了の明細が **1件以上** 存在すること

### 具体例
| # | シナリオ | ボタン | 理由 |
|---|---------|--------|------|
| 1 | 見積書1を全入力 → 見積書1を表示中 | **活性** | 現在表示中の明細が全て完了 |
| 2 | 見積書1を全入力 → 見積書2を選択（空） | **非活性** | 現在表示中の見積書2が空 |
| 3 | 見積書1を全入力 → 見積書2（空）→ 見積書1に戻る | **活性** | 見積書1が完了、見積書2は非表示で全明細空（未着手）なのでスキップ |
| 4 | 見積書1を途中まで入力 | **非活性** | 入力途中がある |
| 5 | どの見積書にも入力がない | **非活性** | 完了した明細が0件 |
| 6 | 見積書1を全入力 → 見積書2を途中入力 → 見積書1に戻る | **非活性** | 非表示の見積書2に入力途中がある |
| 7 | 見積書1を全入力 → 見積書2の明細1を全入力 → 明細2を追加（空）→ 見積書1に戻る | **非活性** | 非表示の見積書2は着手済みだが空の明細行がある（未完了） |

### 保存時の挙動
- 完全に空の明細は保存対象から除外される
- 入力完了した明細のみがメイン画面に反映される

---

## 状態管理の詳細 (React Hook Form 2層構造)

### 全体像

```
ユーザー入力 (DetailInputForm)
    ↓  register() で双方向バインド
RHF currentDetails (useFieldArray)
    ↓  selectQuotation() で退避/復元
useRef (見積書ごとのデータストア)
    ↓  モーダル確定時に getAllQuotationData()
ページレベル RHF (savedDetails に追加)
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

---

## 技術スタック
- Next.js 16 (Pages Router)
- TypeScript (strict)
- Chakra UI v3
- React Hook Form
- Figma ボード: https://www.figma.com/board/FkzXZGu3dn7zEEU5WKIjoJ/コンポーネント設計
