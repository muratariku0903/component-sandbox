import { useForm, useFieldArray } from "react-hook-form";
import { useState, useCallback, useRef } from "react";
import type { ModalFormData, DetailItem, Quotation, SavedQuotationDetail } from "../types";

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

  // 見積書ごとの明細データを保持（RHF 外で管理）
  const quotationDataRef = useRef<Record<string, DetailItem[]>>({});

  const form = useForm<ModalFormData>({
    defaultValues: {
      taxType: "tax_exclusive",
      currentDetails: [],
    },
  });

  const { control, getValues } = form;

  // 固定パスで useFieldArray を使用
  const fieldArray = useFieldArray({
    control,
    name: "currentDetails",
  });

  // 現在の入力内容を ref に退避
  const saveCurrentToRef = useCallback(() => {
    if (!selectedQuotationId) return;
    const current = getValues("currentDetails");
    if (current && current.length > 0) {
      quotationDataRef.current[selectedQuotationId] = structuredClone(current);
    }
  }, [selectedQuotationId, getValues]);

  // 見積書選択
  const selectQuotation = useCallback(
    (quotationId: string) => {
      // 現在の見積書のデータを退避
      saveCurrentToRef();

      // 新しい見積書のデータを読み込み
      const saved = quotationDataRef.current[quotationId];
      if (saved && saved.length > 0) {
        fieldArray.replace(saved);
      } else {
        fieldArray.replace([createEmptyDetail()]);
      }

      setSelectedQuotationId(quotationId);
    },
    [saveCurrentToRef, fieldArray]
  );

  // 税区分
  const taxType = form.watch("taxType");

  // 明細行を追加
  const addDetailRow = useCallback(() => {
    fieldArray.append(createEmptyDetail());
  }, [fieldArray]);

  // 明細行を削除
  const removeDetailRow = useCallback(
    (index: number) => {
      if (fieldArray.fields.length > 1) {
        fieldArray.remove(index);
      }
    },
    [fieldArray]
  );

  // 保存済みデータから初期化（モーダル再オープン時）
  const initializeFromSaved = useCallback(
    (savedDetails: SavedQuotationDetail[]) => {
      if (savedDetails.length === 0) return;

      // ref にデータをロード
      quotationDataRef.current = {};
      for (const saved of savedDetails) {
        quotationDataRef.current[saved.quotation.id] = structuredClone(saved.details);
      }

      // 税区分を復元
      form.setValue("taxType", savedDetails[0].taxType);

      // 最初の見積書を選択状態にする
      const firstId = savedDetails[0].quotation.id;
      const firstDetails = quotationDataRef.current[firstId];
      fieldArray.replace(firstDetails);
      setSelectedQuotationId(firstId);
    },
    [form, fieldArray]
  );

  // フォームリセット
  const resetForm = useCallback(() => {
    form.reset({
      taxType: "tax_exclusive",
      currentDetails: [],
    });
    setSelectedQuotationId("");
    quotationDataRef.current = {};
  }, [form]);

  // 明細が完全に空かどうか
  const isDetailEmpty = (detail: DetailItem): boolean => {
    return (
      detail.productName === "" &&
      detail.modelNumber === "" &&
      (detail.unitPrice === "" || detail.unitPrice === 0) &&
      (detail.quantity === "" || detail.quantity === 0) &&
      (detail.amount === "" || detail.amount === 0)
    );
  };

  // 明細が完全に入力済みかどうか
  const isDetailComplete = (detail: DetailItem): boolean => {
    const base =
      detail.productName !== "" &&
      detail.modelNumber !== "" &&
      detail.unitPrice !== "" &&
      Number(detail.unitPrice) > 0 &&
      detail.quantity !== "" &&
      Number(detail.quantity) > 0 &&
      detail.amount !== "" &&
      Number(detail.amount) > 0;

    if (form.getValues("taxType") === "tax_inclusive") {
      return base && (detail.taxRate === 8 || detail.taxRate === 10);
    }
    return base;
  };

  // 全見積書のデータを集約（現在の入力も含む）
  const getAllQuotationData = useCallback((): Record<string, DetailItem[]> => {
    // 現在の入力を退避
    saveCurrentToRef();
    return { ...quotationDataRef.current };
  }, [saveCurrentToRef]);

  // 送信可能かチェック
  const isAllFilled = useCallback((): boolean => {
    // 現在表示中のデータを一時的に ref に反映して判定
    const allData = { ...quotationDataRef.current };
    if (selectedQuotationId) {
      const current = getValues("currentDetails");
      if (current && current.length > 0) {
        allData[selectedQuotationId] = current;
      }
    }

    let hasAtLeastOneComplete = false;

    for (const [, details] of Object.entries(allData)) {
      if (!details || details.length === 0) continue;
      for (const detail of details) {
        if (isDetailEmpty(detail)) continue;
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
    selectQuotation,
    fieldArray,
    taxType,
    addDetailRow,
    removeDetailRow,
    resetForm,
    initializeFromSaved,
    isAllFilled,
    getAllQuotationData,
  };
}
