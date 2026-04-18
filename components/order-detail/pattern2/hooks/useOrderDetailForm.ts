import { useForm } from "react-hook-form";
import { useState, useCallback, useMemo } from "react";
import type { DetailItem, Quotation, SavedQuotationDetail } from "../../shared/types";
import type { Pattern2ModalFormData, QuotationFormEntry } from "../types";

const createEmptyDetail = (): DetailItem => ({
  productName: "",
  modelNumber: "",
  unitPrice: "",
  quantity: "",
  taxRate: "",
  amount: "",
});

export function useOrderDetailForm(quotations: Quotation[]) {
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("");

  const form = useForm<Pattern2ModalFormData>({
    defaultValues: {
      taxType: "tax_exclusive",
      quotationEntries: [],
    },
  });

  const { getValues } = form;

  const taxType = form.watch("taxType");

  // 選択中の見積書のインデックスを取得
  const selectedQuotationIndex = useMemo(() => {
    const entries = getValues("quotationEntries");
    return entries.findIndex((e) => e.quotationId === selectedQuotationId);
  }, [selectedQuotationId, getValues]);

  // 見積書選択
  const selectQuotation = useCallback(
    (quotationId: string) => {
      const entries = getValues("quotationEntries");
      const exists = entries.some((e) => e.quotationId === quotationId);

      if (!exists) {
        form.setValue("quotationEntries", [
          ...entries,
          { quotationId, details: [createEmptyDetail()] },
        ]);
      }

      setSelectedQuotationId(quotationId);
    },
    [form, getValues]
  );

  // 明細行を追加
  const addDetailRow = useCallback(() => {
    const entries = getValues("quotationEntries");
    const idx = entries.findIndex((e) => e.quotationId === selectedQuotationId);
    if (idx === -1) return;
    const details = [...entries[idx].details, createEmptyDetail()];
    form.setValue(`quotationEntries.${idx}.details`, details);
  }, [form, getValues, selectedQuotationId]);

  // 明細行を削除
  const removeDetailRow = useCallback(
    (detailIndex: number) => {
      const entries = getValues("quotationEntries");
      const idx = entries.findIndex(
        (e) => e.quotationId === selectedQuotationId
      );
      if (idx === -1) return;
      if (entries[idx].details.length <= 1) return;
      const details = entries[idx].details.filter((_, i) => i !== detailIndex);
      form.setValue(`quotationEntries.${idx}.details`, details);
    },
    [form, getValues, selectedQuotationId]
  );

  // 保存済みデータから初期化（モーダル再オープン時）
  const initializeFromSaved = useCallback(
    (savedDetails: SavedQuotationDetail[]) => {
      if (savedDetails.length === 0) return;

      const entries: QuotationFormEntry[] = savedDetails.map((saved) => ({
        quotationId: saved.quotation.id,
        details: structuredClone(saved.details),
      }));

      form.setValue("taxType", savedDetails[0].taxType);
      form.setValue("quotationEntries", entries);
      setSelectedQuotationId(savedDetails[0].quotation.id);
    },
    [form]
  );

  // フォームリセット
  const resetForm = useCallback(() => {
    form.reset({
      taxType: "tax_exclusive",
      quotationEntries: [],
    });
    setSelectedQuotationId("");
  }, [form]);

  // 数値フィールドが空かどうか
  const isNumericEmpty = (value: number | ""): boolean => {
    return value === "" || value === 0 || Number.isNaN(value);
  };

  // 明細が完全に空かどうか
  const isDetailEmpty = (detail: DetailItem): boolean => {
    return (
      detail.productName === "" &&
      detail.modelNumber === "" &&
      isNumericEmpty(detail.unitPrice) &&
      isNumericEmpty(detail.quantity) &&
      isNumericEmpty(detail.amount)
    );
  };

  // 明細が完全に入力済みかどうか（必須フィールドのみ）
  const isDetailComplete = (detail: DetailItem): boolean => {
    const base =
      detail.productName !== "" &&
      detail.amount !== "" &&
      !Number.isNaN(detail.amount) &&
      Number(detail.amount) > 0;

    if (form.getValues("taxType") === "tax_inclusive") {
      return base && (detail.taxRate === 8 || detail.taxRate === 10);
    }
    return base;
  };

  // 全見積書のデータを集約
  const getAllQuotationData = useCallback((): Record<string, DetailItem[]> => {
    const entries = getValues("quotationEntries");
    const result: Record<string, DetailItem[]> = {};
    for (const entry of entries) {
      result[entry.quotationId] = entry.details;
    }
    return result;
  }, [getValues]);

  // 送信可能かチェック
  const isAllFilled = useCallback((): boolean => {
    const entries = getValues("quotationEntries");
    let hasAtLeastOneComplete = false;

    for (const entry of entries) {
      if (!entry.details || entry.details.length === 0) continue;
      const isCurrent = entry.quotationId === selectedQuotationId;

      // 非表示の見積書: 全明細が空なら未着手としてスキップ
      if (!isCurrent) {
        const allEmpty = entry.details.every((d) => isDetailEmpty(d));
        if (allEmpty) continue;
      }

      for (const detail of entry.details) {
        if (isDetailEmpty(detail)) {
          return false;
        }
        if (isDetailComplete(detail)) {
          hasAtLeastOneComplete = true;
        } else {
          return false;
        }
      }
    }

    return hasAtLeastOneComplete;
  }, [selectedQuotationId, getValues, form]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    form,
    selectedQuotationId,
    selectedQuotationIndex,
    selectQuotation,
    taxType,
    addDetailRow,
    removeDetailRow,
    resetForm,
    initializeFromSaved,
    isAllFilled,
    getAllQuotationData,
  };
}
