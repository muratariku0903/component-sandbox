import { useForm } from "react-hook-form";
import { useState, useCallback, useMemo } from "react";
import type { DetailItem, Quotation, SavedQuotationDetail } from "../../shared/types";
import { detailItemSchema, quotationDetailsSchema } from "../../shared/types";
import type { Pattern2ModalFormData, QuotationFormEntry } from "../types";

type DetailFieldName = keyof DetailItem;

const isDetailFieldName = (name: unknown): name is DetailFieldName =>
  typeof name === "string" && name in detailItemSchema.shape;

const createEmptyDetail = (): DetailItem => ({
  productName: "",
  modelNumber: "",
  unitPrice: "",
  quantity: "",
  taxRate: 10,
  amount: "",
});

/** 未選択時の表示用に使うダミーエントリ。最初の見積書選択時に claim（quotationId を差し替え）して再利用する */
const createInitialEntries = (): QuotationFormEntry[] => [
  { quotationId: "", details: [createEmptyDetail()] },
];

export function useOrderDetailForm(quotations: Quotation[]) {
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("");

  const form = useForm<Pattern2ModalFormData>({
    defaultValues: {
      taxType: "tax_exclusive",
      quotationEntries: createInitialEntries(),
    },
  });

  const { getValues } = form;

  const taxType = form.watch("taxType");

  // 選択中の見積書のインデックスを取得
  const selectedQuotationIndex = useMemo(() => {
    const entries = getValues("quotationEntries");
    return entries.findIndex((e) => e.quotationId === selectedQuotationId);
  }, [selectedQuotationId, getValues]);

  // 現在の見積書をバリデーション（全行を検証、空行も含む）。
  // 検証ロジックは quotationDetailsSchema（shared/types.ts）に集約されており、
  // ここでは Zod の結果を RHF の setError に流し込むだけ。
  const validateCurrentQuotation = useCallback((): boolean => {
    const entries = getValues("quotationEntries");
    const currentIdx = entries.findIndex(
      (e) => e.quotationId === selectedQuotationId
    );
    if (currentIdx === -1) return true;

    form.clearErrors(`quotationEntries.${currentIdx}.details`);

    const result = quotationDetailsSchema.safeParse(entries[currentIdx].details);
    if (result.success) return true;

    for (const issue of result.error.issues) {
      // issue.path = [detailIndex, fieldName]
      const detailIdx = issue.path[0];
      const fieldName = issue.path[1];
      if (typeof detailIdx !== "number" || !isDetailFieldName(fieldName)) continue;

      form.setError(
        `quotationEntries.${currentIdx}.details.${detailIdx}.${fieldName}`,
        { message: issue.message }
      );
    }

    return false;
  }, [form, getValues, selectedQuotationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 見積書選択
  const selectQuotation = useCallback(
    (quotationId: string) => {
      // 既に選択中の見積書がある場合、切替前にバリデーション
      if (selectedQuotationId && selectedQuotationId !== quotationId) {
        if (!validateCurrentQuotation()) {
          return; // バリデーション失敗: 切替を阻止
        }
        // バリデーション成功: エラーをクリア
        const entries = getValues("quotationEntries");
        const currentIdx = entries.findIndex(
          (e) => e.quotationId === selectedQuotationId
        );
        if (currentIdx !== -1) {
          form.clearErrors(`quotationEntries.${currentIdx}.details`);
        }
      }

      const entries = getValues("quotationEntries");
      // 未選択時の表示用ダミー（quotationId === ""）は選択が発生した時点で役割終了なので除去
      const entriesWithoutDummy = entries.filter((e) => e.quotationId !== "");
      const exists = entriesWithoutDummy.some(
        (e) => e.quotationId === quotationId
      );

      if (!exists) {
        form.setValue("quotationEntries", [
          ...entriesWithoutDummy,
          { quotationId, details: [createEmptyDetail()] },
        ]);
      } else if (entriesWithoutDummy.length !== entries.length) {
        // 既存だが、ダミーが残っていれば除去
        form.setValue("quotationEntries", entriesWithoutDummy);
      }

      setSelectedQuotationId(quotationId);
    },
    [form, getValues, selectedQuotationId, validateCurrentQuotation]
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
      quotationEntries: createInitialEntries(),
    });
    setSelectedQuotationId("");
  }, [form]);

  // 全見積書のデータを集約
  const getAllQuotationData = useCallback((): Record<string, DetailItem[]> => {
    const entries = getValues("quotationEntries");
    const result: Record<string, DetailItem[]> = {};
    for (const entry of entries) {
      result[entry.quotationId] = entry.details;
    }
    return result;
  }, [getValues]);

  return {
    form,
    selectedQuotationId,
    selectedQuotationIndex,
    selectQuotation,
    taxType,
    resetForm,
    initializeFromSaved,
    validateCurrentQuotation,
    getAllQuotationData,
  };
}
