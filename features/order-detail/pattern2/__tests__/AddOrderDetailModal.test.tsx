import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "@/components/ui/provider";
import { AddOrderDetailModal } from "../AddOrderDetailModal";
import type { Quotation, SavedQuotationDetail } from "../../shared/types";

const mockQuotations: Quotation[] = [
  { id: "quote-1", name: "見積書1" },
  { id: "quote-2", name: "見積書2" },
  { id: "quote-3", name: "見積書3" },
];

function renderModal(props: Partial<Parameters<typeof AddOrderDetailModal>[0]> = {}) {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    quotations: mockQuotations,
    onSave: vi.fn(),
    ...props,
  };
  return {
    ...render(
      <Provider>
        <AddOrderDetailModal {...defaultProps} />
      </Provider>
    ),
    onClose: defaultProps.onClose as ReturnType<typeof vi.fn>,
    onSave: defaultProps.onSave as ReturnType<typeof vi.fn>,
  };
}

describe("AddOrderDetailModal (pattern2)", () => {
  // --- 初期表示 ---
  describe("初期表示", () => {
    it("モーダルが表示される", () => {
      renderModal();
      expect(screen.getByText("発注明細追加")).toBeInTheDocument();
    });

    it("見積書未選択時は明細フィールドが表示されない", () => {
      renderModal();
      expect(
        screen.getByText("見積書を選択すると明細フィールドが表示されます")
      ).toBeInTheDocument();
    });

    it("明細追加ボタンが常に活性である", () => {
      renderModal();
      const submitBtn = screen.getByRole("button", { name: "明細追加" });
      expect(submitBtn).not.toBeDisabled();
    });

    it("税区分の初期値が税抜である", () => {
      renderModal();
      const taxExclusive = screen.getByLabelText("税抜");
      expect(taxExclusive).toBeChecked();
    });
  });

  // --- 見積書選択 ---
  describe("見積書選択", () => {
    it("見積書を選択すると明細入力フィールドが表示される", async () => {
      const user = userEvent.setup();
      renderModal();

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "quote-1");

      expect(screen.getByText("明細入力")).toBeInTheDocument();
      expect(screen.getByText("明細 1")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("商品名")).toBeInTheDocument();
    });

    it("見積書を選択すると空の明細1行だけ表示される", async () => {
      const user = userEvent.setup();
      renderModal();

      await user.selectOptions(screen.getByRole("combobox"), "quote-1");

      const detailHeaders = screen.getAllByText(/^明細 \d+$/);
      expect(detailHeaders).toHaveLength(1);
    });
  });

  // --- 明細行の追加 ---
  describe("明細行の追加・削除", () => {
    it("「明細を追加」ボタンで明細行が追加される", async () => {
      const user = userEvent.setup();
      renderModal();

      await user.selectOptions(screen.getByRole("combobox"), "quote-1");
      expect(screen.getAllByText(/^明細 \d+$/)).toHaveLength(1);

      await user.click(screen.getByRole("button", { name: /明細を追加/ }));
      expect(screen.getAllByText(/^明細 \d+$/)).toHaveLength(2);
    });

    it("明細が2行以上あれば削除ボタンが表示される", async () => {
      const user = userEvent.setup();
      renderModal();

      await user.selectOptions(screen.getByRole("combobox"), "quote-1");
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

      await user.selectOptions(screen.getByRole("combobox"), "quote-1");

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
      await user.selectOptions(screen.getByRole("combobox"), "quote-1");
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

      await user.selectOptions(screen.getByRole("combobox"), "quote-1");

      // 金額のみ入力（商品名が空）
      const numberInputs = screen.getAllByPlaceholderText("0");
      await user.type(numberInputs[2], "1000"); // amount

      const submitBtn = screen.getByRole("button", { name: "明細追加" });
      await user.click(submitBtn);

      expect(screen.getByText("商品名は必須です")).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it("全フィールド正しく入力するとバリデーション通過して保存される", async () => {
      const user = userEvent.setup();
      const { onSave, onClose } = renderModal();

      await user.selectOptions(screen.getByRole("combobox"), "quote-1");

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

    it("空の明細行が残っているとバリデーションエラーで保存できない", async () => {
      const user = userEvent.setup();
      const { onSave } = renderModal();

      await user.selectOptions(screen.getByRole("combobox"), "quote-1");

      // 1行目を正しく入力
      const productNameInputs = screen.getAllByPlaceholderText("商品名");
      await user.type(productNameInputs[0], "テスト商品");
      const numberInputs = screen.getAllByPlaceholderText("0");
      await user.type(numberInputs[2], "1000"); // 1行目のamount

      // 明細行を追加（2行目は空のまま）
      await user.click(screen.getByRole("button", { name: /明細を追加/ }));

      const submitBtn = screen.getByRole("button", { name: "明細追加" });
      await user.click(submitBtn);

      // 空行があるため保存ブロック、必須エラーが表示される
      expect(onSave).not.toHaveBeenCalled();
      expect(screen.getByText("商品名は必須です")).toBeInTheDocument();
      expect(screen.getByText("金額は必須です")).toBeInTheDocument();
    });
  });

  // --- 見積書切替時のバリデーション ---
  describe("見積書切替時のバリデーション", () => {
    it("入力途中の見積書から別の見積書に切替えるとバリデーションエラーが表示される", async () => {
      const user = userEvent.setup();
      renderModal();

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "quote-1");

      // 商品名だけ入力（amountが空 → 不正）
      await user.type(screen.getByPlaceholderText("商品名"), "テスト商品");

      // 見積書2に切替を試みる
      await user.selectOptions(select, "quote-2");

      // バリデーションエラーが表示される
      expect(screen.getByText("金額は必須です")).toBeInTheDocument();
      // 見積書1のままとどまる（明細1が表示されたまま）
      expect(screen.getByText("明細 1")).toBeInTheDocument();
    });

    it("正しく入力された見積書から別の見積書に切替えできる", async () => {
      const user = userEvent.setup();
      renderModal();

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "quote-1");

      // 全必須フィールドを入力
      await user.type(screen.getByPlaceholderText("商品名"), "テスト商品");
      const numberInputs = screen.getAllByPlaceholderText("0");
      await user.type(numberInputs[2], "1000"); // amount

      // 見積書2に切替
      await user.selectOptions(select, "quote-2");

      // 新しい空の明細行が表示される
      expect(screen.getByText("明細 1")).toBeInTheDocument();
      const productNameInput = screen.getByPlaceholderText("商品名");
      expect(productNameInput).toHaveValue("");
    });
  });

  // --- 保存 ---
  describe("保存", () => {
    it("明細追加ボタン押下でonSaveが呼ばれ、モーダルが閉じる", async () => {
      const user = userEvent.setup();
      const { onSave, onClose } = renderModal();

      await user.selectOptions(screen.getByRole("combobox"), "quote-1");

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

      const savedData = onSave.mock.calls[0][0];
      expect(savedData).toHaveLength(1);
      expect(savedData[0].quotation.id).toBe("quote-1");
      expect(savedData[0].details[0].productName).toBe("テスト商品");
      expect(savedData[0].subtotal).toBe(1000);
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
        taxType: "tax_exclusive",
        details: [
          { productName: "商品A", modelNumber: "M-001", unitPrice: 100, quantity: 10, taxRate: "", amount: 1000 },
        ],
        subtotal: 1000,
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
      expect(screen.getByText("明細 1")).toBeInTheDocument();
    });
  });
});
