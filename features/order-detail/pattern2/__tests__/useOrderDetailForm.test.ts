import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOrderDetailForm } from "../hooks/useOrderDetailForm";
import type { Quotation, DetailItem, SavedQuotationDetail } from "../../shared/types";

const mockQuotations: Quotation[] = [
  { id: "quote-1", name: "見積書1" },
  { id: "quote-2", name: "見積書2" },
  { id: "quote-3", name: "見積書3" },
];

/** 選択中の見積書の明細を取得するヘルパー */
function getCurrentDetails(result: { current: ReturnType<typeof useOrderDetailForm> }): DetailItem[] {
  const entries = result.current.form.getValues("quotationEntries");
  const idx = result.current.selectedQuotationIndex;
  return idx >= 0 ? entries[idx].details : [];
}

/** 選択中の見積書の明細数を取得するヘルパー */
function getCurrentDetailCount(result: { current: ReturnType<typeof useOrderDetailForm> }): number {
  return getCurrentDetails(result).length;
}

/** 選択中の見積書の明細にsetValueするヘルパー */
function setDetailValue(
  result: { current: ReturnType<typeof useOrderDetailForm> },
  detailIndex: number,
  field: keyof DetailItem,
  value: string | number
) {
  const idx = result.current.selectedQuotationIndex;
  result.current.form.setValue(
    `quotationEntries.${idx}.details.${detailIndex}.${field}` as `quotationEntries.${number}.details.${number}.${keyof DetailItem}`,
    value as never
  );
}

describe("useOrderDetailForm (pattern2)", () => {
  // --- 初期状態 ---
  describe("初期状態", () => {
    it("見積書が未選択の状態で初期化される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );
      expect(result.current.selectedQuotationId).toBe("");
      expect(result.current.taxType).toBe("tax_exclusive");
      expect(result.current.form.getValues("quotationEntries")).toHaveLength(0);
    });
  });

  // --- 見積書選択 ---
  describe("見積書選択", () => {
    it("見積書を選択すると空の明細1行が初期化される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });

      expect(result.current.selectedQuotationId).toBe("quote-1");
      expect(getCurrentDetailCount(result)).toBe(1);
    });

    it("入力済みの見積書から別の見積書に切り替えられる", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
        setDetailValue(result, 0, "amount", 1000);
      });

      act(() => {
        result.current.selectQuotation("quote-2");
      });

      expect(result.current.selectedQuotationId).toBe("quote-2");
      expect(getCurrentDetailCount(result)).toBe(1);
    });

    it("見積書を切り替えても前の見積書のフィールド数が影響しない", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      // quote-1 は3行すべて入力（空行があると切替できない）
      act(() => {
        setDetailValue(result, 0, "productName", "商品A1");
        setDetailValue(result, 0, "amount", 1000);
      });
      act(() => {
        result.current.addDetailRow();
      });
      act(() => {
        setDetailValue(result, 1, "productName", "商品A2");
        setDetailValue(result, 1, "amount", 2000);
      });
      act(() => {
        result.current.addDetailRow();
      });
      act(() => {
        setDetailValue(result, 2, "productName", "商品A3");
        setDetailValue(result, 2, "amount", 3000);
      });
      expect(getCurrentDetailCount(result)).toBe(3);

      act(() => {
        result.current.selectQuotation("quote-2");
      });
      expect(getCurrentDetailCount(result)).toBe(1);

      // quote-2 も入力してから quote-3 へ切替
      act(() => {
        setDetailValue(result, 0, "productName", "商品B");
        setDetailValue(result, 0, "amount", 2000);
      });

      act(() => {
        result.current.selectQuotation("quote-3");
      });
      expect(getCurrentDetailCount(result)).toBe(1);
    });
  });

  // --- 入力値の保持 ---
  describe("入力値の保持", () => {
    it("見積書を切り替えて戻ると入力値が保持されている", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "テスト商品");
        setDetailValue(result, 0, "modelNumber", "ABC-123");
        setDetailValue(result, 0, "amount", 1000);
      });

      act(() => {
        result.current.selectQuotation("quote-2");
      });

      // quote-2 を入力しないと quote-1 に戻れないため、必須フィールドを入力
      act(() => {
        setDetailValue(result, 0, "productName", "商品B");
        setDetailValue(result, 0, "amount", 2000);
      });

      act(() => {
        result.current.selectQuotation("quote-1");
      });

      const details = getCurrentDetails(result);
      expect(details[0].productName).toBe("テスト商品");
      expect(details[0].modelNumber).toBe("ABC-123");
    });

    it("見積書を切り替えて戻るとフィールド数も保持される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      // quote-1 は2行とも入力（空行があると切替できない）
      act(() => {
        setDetailValue(result, 0, "productName", "商品A1");
        setDetailValue(result, 0, "amount", 1000);
      });
      act(() => {
        result.current.addDetailRow();
      });
      act(() => {
        setDetailValue(result, 1, "productName", "商品A2");
        setDetailValue(result, 1, "amount", 2000);
      });
      expect(getCurrentDetailCount(result)).toBe(2);

      act(() => {
        result.current.selectQuotation("quote-2");
      });
      expect(getCurrentDetailCount(result)).toBe(1);

      // quote-2 も入力してから quote-1 へ戻す
      act(() => {
        setDetailValue(result, 0, "productName", "商品B");
        setDetailValue(result, 0, "amount", 2000);
      });

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      expect(getCurrentDetailCount(result)).toBe(2);
    });
  });

  // --- 明細行の追加・削除 ---
  describe("明細行の追加・削除", () => {
    it("明細行を追加できる", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      expect(getCurrentDetailCount(result)).toBe(1);

      act(() => {
        result.current.addDetailRow();
      });
      expect(getCurrentDetailCount(result)).toBe(2);
    });

    it("明細が2行以上あれば削除できる", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.addDetailRow();
      });
      expect(getCurrentDetailCount(result)).toBe(2);

      act(() => {
        result.current.removeDetailRow(0);
      });
      expect(getCurrentDetailCount(result)).toBe(1);
    });

    it("明細が1行の場合は削除できない", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      expect(getCurrentDetailCount(result)).toBe(1);

      act(() => {
        result.current.removeDetailRow(0);
      });
      expect(getCurrentDetailCount(result)).toBe(1);
    });
  });

  // --- バリデーション (validateAllEntries) ---
  describe("validateAllEntries", () => {
    /** エラーメッセージを検証するテストでは formState.errors の購読が必要 */
    function renderWithErrors() {
      return renderHook(() => {
        const hookResult = useOrderDetailForm(mockQuotations);
        // formState.errors を購読してsetError時に再レンダリングを発火
        hookResult.form.formState.errors; // eslint-disable-line @typescript-eslint/no-unused-expressions
        return hookResult;
      });
    }

    it("空の明細行のみの場合は false で必須フィールドにエラーがセットされる", () => {
      const { result } = renderWithErrors();

      act(() => {
        result.current.selectQuotation("quote-1");
      });

      let valid: boolean;
      act(() => {
        valid = result.current.validateAllEntries();
      });

      expect(valid!).toBe(false);
      const errors = result.current.form.formState.errors;
      expect(errors.quotationEntries?.[0]?.details?.[0]?.productName?.message).toBe("商品名は必須です");
      expect(errors.quotationEntries?.[0]?.details?.[0]?.amount?.message).toBe("金額は必須です");
    });

    it("税抜で必須フィールド入力済みなら true", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
        setDetailValue(result, 0, "amount", 1000);
      });

      let valid: boolean;
      act(() => {
        valid = result.current.validateAllEntries();
      });

      expect(valid!).toBe(true);
    });

    it("商品名が未入力なら false でエラーがセットされる", () => {
      const { result } = renderWithErrors();

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "amount", 1000);
      });

      let valid: boolean;
      act(() => {
        valid = result.current.validateAllEntries();
      });

      expect(valid!).toBe(false);
      const errors = result.current.form.formState.errors;
      expect(errors.quotationEntries?.[0]?.details?.[0]?.productName?.message).toBe("商品名は必須です");
    });

    it("金額が未入力なら false でエラーがセットされる", () => {
      const { result } = renderWithErrors();

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
      });

      let valid: boolean;
      act(() => {
        valid = result.current.validateAllEntries();
      });

      expect(valid!).toBe(false);
      const errors = result.current.form.formState.errors;
      expect(errors.quotationEntries?.[0]?.details?.[0]?.amount?.message).toBe("金額は必須です");
    });

    it("税込で必須フィールド入力済みなら true（税率はデフォルト10%で常に有効）", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("taxType", "tax_inclusive");
        setDetailValue(result, 0, "productName", "商品A");
        setDetailValue(result, 0, "amount", 1000);
      });

      let valid: boolean;
      act(() => {
        valid = result.current.validateAllEntries();
      });

      expect(valid!).toBe(true);
    });

    it("他の見積書に空行があると false でその見積書にエラーがセットされる", () => {
      const { result } = renderWithErrors();

      // quote-1 を入力
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
        setDetailValue(result, 0, "amount", 1000);
      });
      // quote-2 に切替（quote-1 が valid なので切替成功）
      act(() => {
        result.current.selectQuotation("quote-2");
      });
      // quote-2 を入力
      act(() => {
        setDetailValue(result, 0, "productName", "商品B");
        setDetailValue(result, 0, "amount", 2000);
      });
      // quote-2 で空行を追加（保存はブロックされるはず）
      act(() => {
        result.current.addDetailRow();
      });

      let valid: boolean;
      act(() => {
        valid = result.current.validateAllEntries();
      });

      expect(valid!).toBe(false);
      const errors = result.current.form.formState.errors;
      // quote-2 (entry index 1) の row 1 にエラーがセットされる
      expect(errors.quotationEntries?.[1]?.details?.[1]?.productName?.message).toBe("商品名は必須です");
      expect(errors.quotationEntries?.[1]?.details?.[1]?.amount?.message).toBe("金額は必須です");
    });

    it("再バリデーション時に前回のエラーがクリアされる", () => {
      const { result } = renderWithErrors();

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "amount", 1000);
      });

      // 1回目: productName 未入力でエラー
      act(() => {
        result.current.validateAllEntries();
      });
      expect(result.current.form.formState.errors.quotationEntries?.[0]?.details?.[0]?.productName).toBeDefined();

      // productName を入力して再バリデーション
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
      });

      let valid: boolean;
      act(() => {
        valid = result.current.validateAllEntries();
      });

      expect(valid!).toBe(true);
      expect(result.current.form.formState.errors.quotationEntries).toBeUndefined();
    });
  });

  // --- 見積書切替時のバリデーション ---
  describe("見積書切替時のバリデーション", () => {
    /** エラーメッセージを検証するテストでは formState.errors の購読が必要 */
    function renderWithErrors() {
      return renderHook(() => {
        const hookResult = useOrderDetailForm(mockQuotations);
        hookResult.form.formState.errors; // eslint-disable-line @typescript-eslint/no-unused-expressions
        return hookResult;
      });
    }

    it("バリデーション失敗時は切替が阻止される", () => {
      const { result } = renderWithErrors();

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
        // amount 未入力 → バリデーション失敗
      });

      act(() => {
        result.current.selectQuotation("quote-2");
      });

      // 切替が阻止される
      expect(result.current.selectedQuotationId).toBe("quote-1");
    });

    it("バリデーション失敗時にエラーがセットされる", () => {
      const { result } = renderWithErrors();

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
      });

      act(() => {
        result.current.selectQuotation("quote-2");
      });

      const errors = result.current.form.formState.errors;
      expect(errors.quotationEntries?.[0]?.details?.[0]?.amount?.message).toBe("金額は必須です");
    });

    it("バリデーション成功時は切替できる", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
        setDetailValue(result, 0, "amount", 1000);
      });

      act(() => {
        result.current.selectQuotation("quote-2");
      });

      expect(result.current.selectedQuotationId).toBe("quote-2");
    });

    it("空の明細行のみの見積書からは切替が阻止され、最初の行に必須エラーがセットされる", () => {
      const { result } = renderWithErrors();

      act(() => {
        result.current.selectQuotation("quote-1");
      });

      act(() => {
        result.current.selectQuotation("quote-2");
      });

      // 切替が阻止される
      expect(result.current.selectedQuotationId).toBe("quote-1");
      // 最初の行に必須エラーがセットされる
      const errors = result.current.form.formState.errors;
      expect(errors.quotationEntries?.[0]?.details?.[0]?.productName?.message).toBe("商品名は必須です");
      expect(errors.quotationEntries?.[0]?.details?.[0]?.amount?.message).toBe("金額は必須です");
    });

    it("行1入力済 + 空の行2が追加された状態では切替が阻止され、行2にエラーがセットされる", () => {
      const { result } = renderWithErrors();

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      // 行1だけ正しく入力
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
        setDetailValue(result, 0, "amount", 1000);
      });
      // 空の行2を追加
      act(() => {
        result.current.addDetailRow();
      });

      act(() => {
        result.current.selectQuotation("quote-2");
      });

      // 切替が阻止される
      expect(result.current.selectedQuotationId).toBe("quote-1");
      // 行2に必須エラー、行1はエラーなし
      const errors = result.current.form.formState.errors;
      expect(errors.quotationEntries?.[0]?.details?.[0]?.productName).toBeUndefined();
      expect(errors.quotationEntries?.[0]?.details?.[1]?.productName?.message).toBe("商品名は必須です");
      expect(errors.quotationEntries?.[0]?.details?.[1]?.amount?.message).toBe("金額は必須です");
    });

    it("初回選択時はバリデーションなしで選択できる", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });

      expect(result.current.selectedQuotationId).toBe("quote-1");
    });
  });

  // --- リセット ---
  describe("フォームリセット", () => {
    it("リセットすると全状態が初期化される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
        result.current.form.setValue("taxType", "tax_inclusive");
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.selectedQuotationId).toBe("");
      expect(result.current.taxType).toBe("tax_exclusive");
      expect(result.current.form.getValues("quotationEntries")).toHaveLength(0);
    });

    it("リセット後に見積書を選択すると空の明細が表示される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.addDetailRow();
        setDetailValue(result, 0, "productName", "商品A");
      });

      act(() => {
        result.current.resetForm();
      });

      act(() => {
        result.current.selectQuotation("quote-1");
      });

      expect(getCurrentDetailCount(result)).toBe(1);
      const details = getCurrentDetails(result);
      expect(details[0].productName).toBe("");
    });
  });

  // --- getAllQuotationData ---
  describe("getAllQuotationData", () => {
    it("全見積書の入力データを集約できる", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "商品A");
        setDetailValue(result, 0, "modelNumber", "M-001");
        setDetailValue(result, 0, "amount", 1000);
      });

      act(() => {
        result.current.selectQuotation("quote-2");
      });
      act(() => {
        setDetailValue(result, 0, "productName", "商品B");
        setDetailValue(result, 0, "modelNumber", "M-002");
        setDetailValue(result, 0, "amount", 2000);
      });

      let allData: Record<string, DetailItem[]>;
      act(() => {
        allData = result.current.getAllQuotationData();
      });

      expect(allData!["quote-1"]).toBeDefined();
      expect(allData!["quote-2"]).toBeDefined();
      expect(allData!["quote-1"][0].productName).toBe("商品A");
      expect(allData!["quote-2"][0].productName).toBe("商品B");
    });
  });

  // --- initializeFromSaved ---
  describe("initializeFromSaved", () => {
    const savedDetails: SavedQuotationDetail[] = [
      {
        quotation: { id: "quote-1", name: "見積書1" },
        taxType: "tax_inclusive",
        details: [
          { productName: "商品A", modelNumber: "M-001", unitPrice: 100, quantity: 10, taxRate: 10, amount: 1000 },
          { productName: "商品B", modelNumber: "M-002", unitPrice: 200, quantity: 5, taxRate: 8, amount: 1000 },
        ],
        subtotal: 2000,
      },
      {
        quotation: { id: "quote-2", name: "見積書2" },
        taxType: "tax_inclusive",
        details: [
          { productName: "商品C", modelNumber: "M-003", unitPrice: 500, quantity: 3, taxRate: 10, amount: 1500 },
        ],
        subtotal: 1500,
      },
    ];

    it("保存済みデータから初期化できる", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.initializeFromSaved(savedDetails);
      });

      expect(result.current.selectedQuotationId).toBe("quote-1");
      expect(getCurrentDetailCount(result)).toBe(2);
    });

    it("税区分が復元される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.initializeFromSaved(savedDetails);
      });

      expect(result.current.taxType).toBe("tax_inclusive");
    });

    it("初期化後に見積書を切り替えると保存データが表示される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.initializeFromSaved(savedDetails);
      });

      act(() => {
        result.current.selectQuotation("quote-2");
      });

      expect(result.current.selectedQuotationId).toBe("quote-2");
      expect(getCurrentDetailCount(result)).toBe(1);

      const details = getCurrentDetails(result);
      expect(details[0].productName).toBe("商品C");
    });

    it("初期化後に見積書1に戻ると入力値が保持されている", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.initializeFromSaved(savedDetails);
      });

      act(() => {
        result.current.selectQuotation("quote-2");
      });

      act(() => {
        result.current.selectQuotation("quote-1");
      });

      expect(getCurrentDetailCount(result)).toBe(2);
      const details = getCurrentDetails(result);
      expect(details[0].productName).toBe("商品A");
      expect(details[1].productName).toBe("商品B");
    });

    it("初期化後にリセットすると全データがクリアされる", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.initializeFromSaved(savedDetails);
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.selectedQuotationId).toBe("");
      expect(result.current.taxType).toBe("tax_exclusive");
      expect(result.current.form.getValues("quotationEntries")).toHaveLength(0);
    });

    it("未保存の見積書を選択すると空の明細1行が表示される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.initializeFromSaved(savedDetails);
      });

      act(() => {
        result.current.selectQuotation("quote-3");
      });

      expect(getCurrentDetailCount(result)).toBe(1);
      const details = getCurrentDetails(result);
      expect(details[0].productName).toBe("");
    });
  });
});
