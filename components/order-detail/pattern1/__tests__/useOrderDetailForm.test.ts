import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOrderDetailForm } from "../hooks/useOrderDetailForm";
import type { Quotation, DetailItem, SavedQuotationDetail } from "../../shared/types";

const mockQuotations: Quotation[] = [
  { id: "quote-1", name: "見積書1" },
  { id: "quote-2", name: "見積書2" },
  { id: "quote-3", name: "見積書3" },
];

describe("useOrderDetailForm", () => {
  // --- 初期状態 ---
  describe("初期状態", () => {
    it("見積書が未選択の状態で初期化される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );
      expect(result.current.selectedQuotationId).toBe("");
      expect(result.current.taxType).toBe("tax_exclusive");
      expect(result.current.fieldArray.fields).toHaveLength(0);
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
      expect(result.current.fieldArray.fields).toHaveLength(1);
    });

    it("別の見積書に切り替えると空の明細1行が表示される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書1を選択して明細を追加
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.addDetailRow();
      });
      expect(result.current.fieldArray.fields).toHaveLength(2);

      // 見積書2に切り替え
      act(() => {
        result.current.selectQuotation("quote-2");
      });

      expect(result.current.selectedQuotationId).toBe("quote-2");
      // 見積書2は未訪問なので空の明細1行のみ
      expect(result.current.fieldArray.fields).toHaveLength(1);
    });

    it("見積書を切り替えても前の見積書のフィールド数が影響しない", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書1で明細を3行にする
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.addDetailRow();
      });
      act(() => {
        result.current.addDetailRow();
      });
      expect(result.current.fieldArray.fields).toHaveLength(3);

      // 見積書2に切り替え → 1行であるべき
      act(() => {
        result.current.selectQuotation("quote-2");
      });
      expect(result.current.fieldArray.fields).toHaveLength(1);

      // 見積書3に切り替え → 1行であるべき
      act(() => {
        result.current.selectQuotation("quote-3");
      });
      expect(result.current.fieldArray.fields).toHaveLength(1);
    });
  });

  // --- 入力値の保持 ---
  describe("入力値の保持", () => {
    it("見積書を切り替えて戻ると入力値が保持されている", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書1を選択して入力
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "テスト商品");
        result.current.form.setValue("currentDetails.0.modelNumber", "ABC-123");
      });

      // 見積書2に切り替え
      act(() => {
        result.current.selectQuotation("quote-2");
      });

      // 見積書1に戻る
      act(() => {
        result.current.selectQuotation("quote-1");
      });

      const details = result.current.form.getValues("currentDetails");
      expect(details[0].productName).toBe("テスト商品");
      expect(details[0].modelNumber).toBe("ABC-123");
    });

    it("見積書を切り替えて戻るとフィールド数も保持される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書1で明細2行にする
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.addDetailRow();
      });
      expect(result.current.fieldArray.fields).toHaveLength(2);

      // 見積書2に切り替え
      act(() => {
        result.current.selectQuotation("quote-2");
      });
      expect(result.current.fieldArray.fields).toHaveLength(1);

      // 見積書1に戻る → 2行であるべき
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      expect(result.current.fieldArray.fields).toHaveLength(2);
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
      expect(result.current.fieldArray.fields).toHaveLength(1);

      act(() => {
        result.current.addDetailRow();
      });
      expect(result.current.fieldArray.fields).toHaveLength(2);
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
      expect(result.current.fieldArray.fields).toHaveLength(2);

      act(() => {
        result.current.removeDetailRow(0);
      });
      expect(result.current.fieldArray.fields).toHaveLength(1);
    });

    it("明細が1行の場合は削除できない", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      expect(result.current.fieldArray.fields).toHaveLength(1);

      act(() => {
        result.current.removeDetailRow(0);
      });
      // 削除されずに1行のまま
      expect(result.current.fieldArray.fields).toHaveLength(1);
    });
  });

  // --- バリデーション (isAllFilled) ---
  describe("明細追加ボタンのバリデーション", () => {
    it("何も入力していない場合は false", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });

      expect(result.current.isAllFilled()).toBe(false);
    });

    it("税抜で全フィールド入力済みなら true", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-001");
        result.current.form.setValue("currentDetails.0.unitPrice", 100);
        result.current.form.setValue("currentDetails.0.quantity", 10);
        result.current.form.setValue("currentDetails.0.amount", 1000);
      });

      expect(result.current.isAllFilled()).toBe(true);
    });

    it("一部フィールドのみ入力は false", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        // modelNumber, unitPrice, quantity, amount は未入力
      });

      expect(result.current.isAllFilled()).toBe(false);
    });

    it("税込の場合、税率未選択なら false", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("taxType", "tax_inclusive");
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-001");
        result.current.form.setValue("currentDetails.0.unitPrice", 100);
        result.current.form.setValue("currentDetails.0.quantity", 10);
        result.current.form.setValue("currentDetails.0.amount", 1000);
        // taxRate 未選択
      });

      expect(result.current.isAllFilled()).toBe(false);
    });

    it("税込で税率も選択済みなら true", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("taxType", "tax_inclusive");
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-001");
        result.current.form.setValue("currentDetails.0.unitPrice", 100);
        result.current.form.setValue("currentDetails.0.quantity", 10);
        result.current.form.setValue("currentDetails.0.amount", 1000);
        result.current.form.setValue("currentDetails.0.taxRate", 10);
      });

      expect(result.current.isAllFilled()).toBe(true);
    });

    it("現在表示中の見積書が空なら false（空の明細はスキップしない）", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書1に全入力
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-001");
        result.current.form.setValue("currentDetails.0.unitPrice", 100);
        result.current.form.setValue("currentDetails.0.quantity", 10);
        result.current.form.setValue("currentDetails.0.amount", 1000);
      });

      // 見積書2に切り替え（空の明細1行 = 現在表示中が未完了）
      act(() => {
        result.current.selectQuotation("quote-2");
      });

      // 現在表示中の見積書2が空 → false
      expect(result.current.isAllFilled()).toBe(false);
    });

    it("空の見積書から入力済み見積書に戻ると true", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書1に全入力
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-001");
        result.current.form.setValue("currentDetails.0.unitPrice", 100);
        result.current.form.setValue("currentDetails.0.quantity", 10);
        result.current.form.setValue("currentDetails.0.amount", 1000);
      });

      // 見積書2に切り替え（空）
      act(() => {
        result.current.selectQuotation("quote-2");
      });
      expect(result.current.isAllFilled()).toBe(false);

      // 見積書1に戻る → 入力済みなので true
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      expect(result.current.isAllFilled()).toBe(true);
    });

    it("他の見積書の空の明細はスキップされる（NaN含む）", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書2に切り替えて数値フィールドをNaNにする（valueAsNumber: trueの未入力状態）
      act(() => {
        result.current.selectQuotation("quote-2");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.unitPrice", NaN);
        result.current.form.setValue("currentDetails.0.quantity", NaN);
        result.current.form.setValue("currentDetails.0.amount", NaN);
      });

      // 見積書1に切り替えて全入力
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-001");
        result.current.form.setValue("currentDetails.0.unitPrice", 100);
        result.current.form.setValue("currentDetails.0.quantity", 10);
        result.current.form.setValue("currentDetails.0.amount", 1000);
      });

      // 現在表示中の見積書1が完了済み + 見積書2は非表示で空（スキップ）→ true
      expect(result.current.isAllFilled()).toBe(true);
    });

    it("入力済みの見積書がある状態で、別の見積書が入力途中なら false", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書1に全入力
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-001");
        result.current.form.setValue("currentDetails.0.unitPrice", 100);
        result.current.form.setValue("currentDetails.0.quantity", 10);
        result.current.form.setValue("currentDetails.0.amount", 1000);
      });

      // 見積書2に切り替えて一部入力
      act(() => {
        result.current.selectQuotation("quote-2");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品B");
        // 他は未入力
      });

      // 見積書2が入力途中 → false
      expect(result.current.isAllFilled()).toBe(false);
    });

    it("非表示の見積書に入力済み明細と空の明細が混在する場合は false", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書1に全入力
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-001");
        result.current.form.setValue("currentDetails.0.unitPrice", 100);
        result.current.form.setValue("currentDetails.0.quantity", 10);
        result.current.form.setValue("currentDetails.0.amount", 1000);
      });

      // 見積書2に切り替え、明細1を全入力
      act(() => {
        result.current.selectQuotation("quote-2");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品B");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-002");
        result.current.form.setValue("currentDetails.0.unitPrice", 200);
        result.current.form.setValue("currentDetails.0.quantity", 5);
        result.current.form.setValue("currentDetails.0.amount", 1000);
      });

      // 見積書2に空の明細行を追加（明細2は空のまま）
      act(() => {
        result.current.addDetailRow();
      });

      // 見積書1に戻る
      act(() => {
        result.current.selectQuotation("quote-1");
      });

      // 非表示の見積書2に入力済み明細1 + 空の明細2 → 入力途中とみなして false
      expect(result.current.isAllFilled()).toBe(false);
    });
  });

  // --- リセット ---
  describe("フォームリセット", () => {
    it("リセットすると全状態が初期化される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // データを入力
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        result.current.form.setValue("taxType", "tax_inclusive");
      });

      // リセット
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.selectedQuotationId).toBe("");
      expect(result.current.taxType).toBe("tax_exclusive");
      expect(result.current.fieldArray.fields).toHaveLength(0);
    });

    it("リセット後に見積書を選択すると空の明細が表示される（前のデータが残らない）", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書1に入力
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.addDetailRow();
        result.current.form.setValue("currentDetails.0.productName", "商品A");
      });

      // リセット
      act(() => {
        result.current.resetForm();
      });

      // 同じ見積書1を再選択
      act(() => {
        result.current.selectQuotation("quote-1");
      });

      expect(result.current.fieldArray.fields).toHaveLength(1);
      const details = result.current.form.getValues("currentDetails");
      expect(details[0].productName).toBe("");
    });
  });

  // --- getAllQuotationData ---
  describe("getAllQuotationData", () => {
    it("全見積書の入力データを集約できる", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      // 見積書1に入力
      act(() => {
        result.current.selectQuotation("quote-1");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品A");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-001");
      });

      // 見積書2に切り替えて入力
      act(() => {
        result.current.selectQuotation("quote-2");
      });
      act(() => {
        result.current.form.setValue("currentDetails.0.productName", "商品B");
        result.current.form.setValue("currentDetails.0.modelNumber", "M-002");
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

      // 最初の見積書が選択されている
      expect(result.current.selectedQuotationId).toBe("quote-1");
      // 見積書1の明細が表示されている
      expect(result.current.fieldArray.fields).toHaveLength(2);
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

      // 見積書2に切り替え
      act(() => {
        result.current.selectQuotation("quote-2");
      });

      expect(result.current.selectedQuotationId).toBe("quote-2");
      expect(result.current.fieldArray.fields).toHaveLength(1);

      const details = result.current.form.getValues("currentDetails");
      expect(details[0].productName).toBe("商品C");
    });

    it("初期化後に見積書1に戻ると入力値が保持されている", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.initializeFromSaved(savedDetails);
      });

      // 見積書2に切り替え
      act(() => {
        result.current.selectQuotation("quote-2");
      });

      // 見積書1に戻る
      act(() => {
        result.current.selectQuotation("quote-1");
      });

      expect(result.current.fieldArray.fields).toHaveLength(2);
      const details = result.current.form.getValues("currentDetails");
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
      expect(result.current.fieldArray.fields).toHaveLength(0);
    });

    it("未保存の見積書を選択すると空の明細1行が表示される", () => {
      const { result } = renderHook(() =>
        useOrderDetailForm(mockQuotations)
      );

      act(() => {
        result.current.initializeFromSaved(savedDetails);
      });

      // 見積書3は保存データに含まれていない
      act(() => {
        result.current.selectQuotation("quote-3");
      });

      expect(result.current.fieldArray.fields).toHaveLength(1);
      const details = result.current.form.getValues("currentDetails");
      expect(details[0].productName).toBe("");
    });
  });
});
