import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "@/components/ui/provider";
import { AddOrderDetailModal } from "../AddOrderDetailModal";
import type { Quotation, SavedQuotationDetail } from "../../shared/types";
import type { ModalSavePayload } from "../AddOrderDetailModal";

const mockQuotations: Quotation[] = [
  { id: "quote-1", name: "見積書1" },
  { id: "quote-2", name: "見積書2" },
  { id: "quote-3", name: "見積書3" },
];

function renderModal(props: Partial<Parameters<typeof AddOrderDetailModal>[0]> = {}) {
  const onClose = vi.fn();
  const onSave = vi.fn();
  return {
    ...render(
      <Provider>
        <AddOrderDetailModal
          open
          quotations={mockQuotations}
          onClose={onClose}
          onSave={onSave}
          initialTaxType="tax_exclusive"
          {...props}
        />
      </Provider>
    ),
    onClose,
    onSave,
  };
}

/** 見積書選択セレクトを特定（税率セレクトと区別するため option[value="quote-1"] を持つものを探す） */
function getQuotationSelect(): HTMLElement {
  const selects = screen.getAllByRole("combobox");
  const found = selects.find(
    (el) => el.querySelector('option[value="quote-1"]') !== null
  );
  if (!found) throw new Error("quotation selector not found");
  return found;
}

/** 現在表示中の全ての「商品名」入力フィールドを取得 */
function getProductNameInputs(): HTMLInputElement[] {
  return screen.getAllByPlaceholderText("商品名") as HTMLInputElement[];
}

/** 現在表示中の「0」プレースホルダ数値入力を取得（順序は単価/数量/税率後の金額の並び） */
function getNumberInputs(): HTMLInputElement[] {
  return screen.getAllByPlaceholderText("0") as HTMLInputElement[];
}

/** N 行目 (0-origin) の amount フィールドを取得。1行あたり数値入力は 3 つ（unitPrice, quantity, amount）。 */
function getAmountInputAt(row: number): HTMLInputElement {
  const inputs = getNumberInputs();
  return inputs[row * 3 + 2];
}

/** N 行目 (0-origin) の商品名フィールドを取得 */
function getProductNameInputAt(row: number): HTMLInputElement {
  return getProductNameInputs()[row];
}

describe("AddOrderDetailModal (pattern2)", () => {
  // --- 初期表示 ---
  describe("初期表示", () => {
    it("モーダルが表示される", () => {
      renderModal();
      expect(screen.getByText("発注明細追加")).toBeInTheDocument();
    });

    it("見積書未選択時は明細入力フィールドと明細追加ボタンが非活性で表示される", () => {
      renderModal();
      // 空の明細1行とその入力群が表示される
      expect(screen.getByText("明細 1")).toBeInTheDocument();
      // 入力フィールドが全て非活性
      expect(screen.getByPlaceholderText("商品名")).toBeDisabled();
      expect(screen.getByPlaceholderText("型番号")).toBeDisabled();
      const numberInputs = screen.getAllByPlaceholderText("0");
      numberInputs.forEach((input) => expect(input).toBeDisabled());
      // 「明細を追加」ボタンが非活性
      expect(
        screen.getByRole("button", { name: /明細を追加/ })
      ).toBeDisabled();
    });

    it("見積書未選択時はフッターの明細追加ボタンが非活性", () => {
      renderModal();
      const submitBtn = screen.getByRole("button", { name: "明細追加" });
      expect(submitBtn).toBeDisabled();
    });

    it("見積書未選択時は税区分ラジオボタンは活性のまま", () => {
      renderModal();
      expect(screen.getByLabelText("税抜")).not.toBeDisabled();
      expect(screen.getByLabelText("税込")).not.toBeDisabled();
    });

    it("見積書を選択するとフィールドと各ボタンが活性になる", async () => {
      const user = userEvent.setup();
      renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");

      expect(screen.getByPlaceholderText("商品名")).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: /明細を追加/ })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "明細追加" })
      ).not.toBeDisabled();
    });

    it("税区分の初期値が税抜である", () => {
      renderModal();
      const taxExclusive = screen.getByLabelText("税抜");
      expect(taxExclusive).toBeChecked();
    });
  });

  // --- 見積書選択 ---
  describe("見積書選択", () => {
    it("見積書を選択すると明細入力フィールドが活性で表示される", async () => {
      const user = userEvent.setup();
      renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");

      expect(screen.getByText("明細入力")).toBeInTheDocument();
      expect(screen.getByText("明細 1")).toBeInTheDocument();
      const productNameInput = screen.getByPlaceholderText("商品名");
      expect(productNameInput).toBeInTheDocument();
      expect(productNameInput).not.toBeDisabled();
    });

    it("見積書を選択すると空の明細1行だけ表示される", async () => {
      const user = userEvent.setup();
      renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");

      const detailHeaders = screen.getAllByText(/^明細 \d+$/);
      expect(detailHeaders).toHaveLength(1);
    });

    it("見積書を切り替えても前の見積書のフィールド数・入力内容は影響しない", async () => {
      const user = userEvent.setup();
      renderModal();

      const select = getQuotationSelect();
      // 見積書1 に2行入力
      await user.selectOptions(select, "quote-1");
      await user.type(getProductNameInputAt(0), "商品A1");
      await user.type(getAmountInputAt(0), "1000");
      await user.click(screen.getByRole("button", { name: /明細を追加/ }));
      await user.type(getProductNameInputAt(1), "商品A2");
      await user.type(getAmountInputAt(1), "2000");
      expect(screen.getAllByText(/^明細 \d+$/)).toHaveLength(2);

      // 見積書2 へ切替 → 空の1行だけ
      await user.selectOptions(select, "quote-2");
      expect(screen.getAllByText(/^明細 \d+$/)).toHaveLength(1);
      expect(getProductNameInputAt(0)).toHaveValue("");
    });
  });

  // --- 明細行の追加 ---
  describe("明細行の追加・削除", () => {
    it("「明細を追加」ボタンで明細行が追加される", async () => {
      const user = userEvent.setup();
      renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");
      expect(screen.getAllByText(/^明細 \d+$/)).toHaveLength(1);

      await user.click(screen.getByRole("button", { name: /明細を追加/ }));
      expect(screen.getAllByText(/^明細 \d+$/)).toHaveLength(2);
    });

    it("明細が2行以上あれば削除ボタンが表示される", async () => {
      const user = userEvent.setup();
      renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");
      expect(screen.queryByLabelText("明細を削除")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /明細を追加/ }));
      expect(screen.getAllByLabelText("明細を削除")).toHaveLength(2);
    });
  });

  // --- 税率フィールド ---
  describe("税率フィールド", () => {
    it("税区分に関わらず税率セレクトは常に活性である", async () => {
      const user = userEvent.setup();
      renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");

      const findTaxRateSelect = () => {
        const selects = screen.getAllByRole("combobox");
        return selects.find(
          (el) => el.querySelector('option[value="8"]') !== null
        );
      };

      // 税抜（初期値）
      expect(findTaxRateSelect()).not.toBeDisabled();

      // 税込に切替
      await user.click(screen.getByLabelText("税込"));
      expect(findTaxRateSelect()).not.toBeDisabled();
    });
  });

  // --- バリデーション ---
  describe("バリデーション", () => {
    it("未入力で明細追加クリック時、バリデーションエラーが表示されonSaveが呼ばれない", async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal();

      // 見積書を選択して商品名だけ入力（amountが空）
      await user.selectOptions(getQuotationSelect(), "quote-1");
      await user.type(screen.getByPlaceholderText("商品名"), "テスト商品");

      const submitBtn = screen.getByRole("button", { name: "明細追加" });
      await user.click(submitBtn);

      // バリデーションエラーが表示される
      expect(screen.getByText("金額は必須です")).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it("商品名未入力でバリデーションエラーが表示される", async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");

      // 金額のみ入力（商品名が空）
      await user.type(getAmountInputAt(0), "1000");

      const submitBtn = screen.getByRole("button", { name: "明細追加" });
      await user.click(submitBtn);

      expect(screen.getByText("商品名は必須です")).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it("全フィールド正しく入力するとバリデーション通過して保存される", async () => {
      const user = userEvent.setup();
      const { onSave, onClose } = renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");

      await user.type(screen.getByPlaceholderText("商品名"), "テスト商品");
      await user.type(screen.getByPlaceholderText("型番号"), "ABC-123");

      const numberInputs = screen.getAllByPlaceholderText("0");
      await user.type(numberInputs[0], "100");  // unitPrice
      await user.type(numberInputs[1], "10");   // quantity
      await user.type(numberInputs[2], "1000"); // amount

      const submitBtn = screen.getByRole("button", { name: "明細追加" });
      await user.click(submitBtn);

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("税込で必須フィールドが入力済みなら保存できる（税率はデフォルト10%で常に有効）", async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");
      await user.click(screen.getByLabelText("税込"));
      await user.type(screen.getByPlaceholderText("商品名"), "テスト商品");
      await user.type(getAmountInputAt(0), "1000");

      await user.click(screen.getByRole("button", { name: "明細追加" }));

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it("空の明細行が残っているとバリデーションエラーで保存できない", async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");

      // 1行目を正しく入力
      await user.type(getProductNameInputAt(0), "テスト商品");
      await user.type(getAmountInputAt(0), "1000");

      // 明細行を追加（2行目は空のまま）
      await user.click(screen.getByRole("button", { name: /明細を追加/ }));

      const submitBtn = screen.getByRole("button", { name: "明細追加" });
      await user.click(submitBtn);

      // 空行があるため保存ブロック、必須エラーが表示される
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText("商品名は必須です")).toBeInTheDocument();
      expect(screen.getByText("金額は必須です")).toBeInTheDocument();
    });

    it("エラー表示後に必須を埋めて再度保存するとエラーがクリアされて保存される", async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");
      await user.type(getAmountInputAt(0), "1000");

      // 1回目: 商品名未入力のまま保存 → エラー
      await user.click(screen.getByRole("button", { name: "明細追加" }));
      expect(screen.getByText("商品名は必須です")).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();

      // 商品名を入力して再度保存 → 成功
      await user.type(getProductNameInputAt(0), "商品A");
      await user.click(screen.getByRole("button", { name: "明細追加" }));

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(screen.queryByText("商品名は必須です")).not.toBeInTheDocument();
    });
  });

  // --- 見積書切替時のバリデーション ---
  describe("見積書切替時のバリデーション", () => {
    it("入力途中の見積書から別の見積書に切替えるとバリデーションエラーが表示される", async () => {
      const user = userEvent.setup();
      renderModal();

      const select = getQuotationSelect();
      await user.selectOptions(select, "quote-1");

      // 商品名だけ入力（amountが空 → 不正）
      await user.type(screen.getByPlaceholderText("商品名"), "テスト商品");

      // 見積書2に切替を試みる
      await user.selectOptions(select, "quote-2");

      // バリデーションエラーが表示される
      expect(screen.getByText("金額は必須です")).toBeInTheDocument();
      // 見積書1のままとどまる（入力済みのテキストが保持されている）
      expect(getProductNameInputAt(0)).toHaveValue("テスト商品");
    });

    it("空の見積書（直後に選択して何も入力していない）からは別見積書に切替できず、最初の行に必須エラーがセットされる", async () => {
      const user = userEvent.setup();
      renderModal();

      const select = getQuotationSelect();
      await user.selectOptions(select, "quote-1");
      await user.selectOptions(select, "quote-2");

      expect(screen.getByText("商品名は必須です")).toBeInTheDocument();
      expect(screen.getByText("金額は必須です")).toBeInTheDocument();
    });

    it("行1入力済み + 空の行2 追加の状態では切替が阻止され、行2にエラーが表示される", async () => {
      const user = userEvent.setup();
      renderModal();

      const select = getQuotationSelect();
      await user.selectOptions(select, "quote-1");

      // 行1 を全入力
      await user.type(getProductNameInputAt(0), "商品A");
      await user.type(getAmountInputAt(0), "1000");

      // 空の行2 を追加
      await user.click(screen.getByRole("button", { name: /明細を追加/ }));

      // 切替試行
      await user.selectOptions(select, "quote-2");

      // 行2 にエラー（行1 のエラーは出ない）
      expect(screen.getByText("商品名は必須です")).toBeInTheDocument();
      expect(screen.getByText("金額は必須です")).toBeInTheDocument();
      // 行1 の入力が保持されている（＝ 切替は阻止された）
      expect(getProductNameInputAt(0)).toHaveValue("商品A");
    });

    it("正しく入力された見積書から別の見積書に切替えできる", async () => {
      const user = userEvent.setup();
      renderModal();

      const select = getQuotationSelect();
      await user.selectOptions(select, "quote-1");

      // 全必須フィールドを入力
      await user.type(screen.getByPlaceholderText("商品名"), "テスト商品");
      await user.type(getAmountInputAt(0), "1000");

      // 見積書2に切替
      await user.selectOptions(select, "quote-2");

      // 新しい空の明細行が表示される
      expect(screen.getByText("明細 1")).toBeInTheDocument();
      const productNameInput = screen.getByPlaceholderText("商品名");
      expect(productNameInput).toHaveValue("");
    });

    it("見積書を切り替えて戻ると入力値が保持される", async () => {
      const user = userEvent.setup();
      renderModal();

      const select = getQuotationSelect();
      // 見積書1 入力
      await user.selectOptions(select, "quote-1");
      await user.type(getProductNameInputAt(0), "商品A");
      await user.type(screen.getByPlaceholderText("型番号"), "ABC-123");
      await user.type(getAmountInputAt(0), "1000");

      // 見積書2 に切替（切替成功のため必須入力）
      await user.selectOptions(select, "quote-2");
      await user.type(getProductNameInputAt(0), "商品B");
      await user.type(getAmountInputAt(0), "2000");

      // 見積書1 に戻す
      await user.selectOptions(select, "quote-1");

      expect(getProductNameInputAt(0)).toHaveValue("商品A");
      expect(screen.getByPlaceholderText("型番号")).toHaveValue("ABC-123");
      expect(getAmountInputAt(0)).toHaveValue(1000);
    });
  });

  // --- 保存 ---
  describe("保存", () => {
    it("明細追加ボタン押下でonSaveが呼ばれ、モーダルが閉じる", async () => {
      const user = userEvent.setup();
      const { onSave, onClose } = renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");

      await user.type(screen.getByPlaceholderText("商品名"), "テスト商品");
      await user.type(screen.getByPlaceholderText("型番号"), "ABC-123");

      const numberInputs = screen.getAllByPlaceholderText("0");
      await user.type(numberInputs[0], "100");
      await user.type(numberInputs[1], "10");
      await user.type(numberInputs[2], "1000");

      const submitBtn = screen.getByRole("button", { name: "明細追加" });
      await user.click(submitBtn);

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);

      const payload = onSave.mock.calls[0][0] as ModalSavePayload;
      expect(payload.taxType).toBe("tax_exclusive");
      expect(payload.details).toHaveLength(1);
      expect(payload.details[0].quotation.id).toBe("quote-1");
      expect(payload.details[0].details[0].productName).toBe("テスト商品");
      expect(payload.details[0].subtotal).toBe(1000);
    });

    it("複数の見積書に入力した場合、全見積書分が保存される", async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal();

      const select = getQuotationSelect();
      await user.selectOptions(select, "quote-1");
      await user.type(getProductNameInputAt(0), "商品A");
      await user.type(getAmountInputAt(0), "1000");

      await user.selectOptions(select, "quote-2");
      await user.type(getProductNameInputAt(0), "商品B");
      await user.type(getAmountInputAt(0), "2000");

      await user.click(screen.getByRole("button", { name: "明細追加" }));

      expect(onSave).toHaveBeenCalledTimes(1);
      const payload = onSave.mock.calls[0][0] as ModalSavePayload;
      expect(payload.details).toHaveLength(2);

      const byId = Object.fromEntries(
        payload.details.map((d) => [d.quotation.id, d])
      );
      expect(byId["quote-1"].details[0].productName).toBe("商品A");
      expect(byId["quote-1"].subtotal).toBe(1000);
      expect(byId["quote-2"].details[0].productName).toBe("商品B");
      expect(byId["quote-2"].subtotal).toBe(2000);
    });

    it("モーダル内で税区分を切り替えると onSave ペイロードに反映される", async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal();

      await user.selectOptions(getQuotationSelect(), "quote-1");
      await user.click(screen.getByLabelText("税込"));
      await user.type(getProductNameInputAt(0), "商品A");
      await user.type(getAmountInputAt(0), "1000");

      await user.click(screen.getByRole("button", { name: "明細追加" }));

      const payload = onSave.mock.calls[0][0] as ModalSavePayload;
      expect(payload.taxType).toBe("tax_inclusive");
    });

    it("キャンセルボタンでonCloseが呼ばれる", async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal();

      await user.click(screen.getByRole("button", { name: "キャンセル" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // --- モーダル再オープン ---
  describe("モーダル再オープン", () => {
    const mockSavedDetails: SavedQuotationDetail[] = [
      {
        quotation: { id: "quote-1", name: "見積書1" },
        details: [
          { productName: "商品A", modelNumber: "M-001", unitPrice: 100, quantity: 10, taxRate: 10, amount: 1000 },
          { productName: "商品B", modelNumber: "M-002", unitPrice: 200, quantity: 5, taxRate: 8, amount: 1000 },
        ],
        subtotal: 2000,
      },
      {
        quotation: { id: "quote-2", name: "見積書2" },
        details: [
          { productName: "商品C", modelNumber: "M-003", unitPrice: 500, quantity: 3, taxRate: 10, amount: 1500 },
        ],
        subtotal: 1500,
      },
    ];

    it("savedDetailsがある場合、タイトルが「発注明細編集」になる", () => {
      renderModal({ savedDetails: mockSavedDetails });
      expect(screen.getByText("発注明細編集")).toBeInTheDocument();
    });

    it("savedDetailsがない場合、タイトルが「発注明細追加」になる", () => {
      renderModal();
      expect(screen.getByText("発注明細追加")).toBeInTheDocument();
    });

    it("savedDetailsがある場合、保存ボタンが「更新」になる", () => {
      renderModal({ savedDetails: mockSavedDetails });
      expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
    });

    it("savedDetailsがない場合、保存ボタンが「明細追加」になる", () => {
      renderModal();
      expect(screen.getByRole("button", { name: "明細追加" })).toBeInTheDocument();
    });

    it("savedDetailsがある場合、最初の見積書が選択状態で明細が表示される", () => {
      renderModal({ savedDetails: mockSavedDetails });

      expect(screen.getByText("明細入力")).toBeInTheDocument();
      // 最初の見積書は2行保存済み
      expect(screen.getAllByText(/^明細 \d+$/)).toHaveLength(2);
      expect(getProductNameInputAt(0)).toHaveValue("商品A");
      expect(getProductNameInputAt(1)).toHaveValue("商品B");
    });

    it("initialTaxType で初期表示のラジオが決まる", () => {
      // モーダルは自身の form で taxType を管理するが、初期値はページから受ける
      renderModal({ initialTaxType: "tax_inclusive" });
      expect(screen.getByLabelText("税込")).toBeChecked();
    });

    it("復元後に別の見積書に切り替えると、その見積書の保存データが表示される", async () => {
      const user = userEvent.setup();
      renderModal({ savedDetails: mockSavedDetails });

      await user.selectOptions(getQuotationSelect(), "quote-2");

      expect(screen.getAllByText(/^明細 \d+$/)).toHaveLength(1);
      expect(getProductNameInputAt(0)).toHaveValue("商品C");
    });

    it("復元後に未保存の見積書を選択すると空の明細1行が表示される", async () => {
      const user = userEvent.setup();
      renderModal({ savedDetails: mockSavedDetails });

      await user.selectOptions(getQuotationSelect(), "quote-3");

      expect(screen.getAllByText(/^明細 \d+$/)).toHaveLength(1);
      expect(getProductNameInputAt(0)).toHaveValue("");
    });
  });
});
