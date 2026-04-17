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

  // 数値フィールドが空かどうか（valueAsNumber: true の場合 NaN になる）
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

  // 明細が完全に入力済みかどうか（必須フィールドのみチェック）
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

  // 全見積書のデータを集約（現在の入力も含む）
  const getAllQuotationData = useCallback((): Record<string, DetailItem[]> => {
    // 現在の入力を退避
    saveCurrentToRef();
    return { ...quotationDataRef.current };
  }, [saveCurrentToRef]);

  // 送信可能かチェック
  // 現在表示中の見積書: 全明細が入力完了でなければ非活性（空もNG）
  // 他の見積書:
  //   全明細が空（未着手）→ スキップ
  //   一部入力済み + 一部空 → NG（入力途中とみなす）
  //   入力途中 → NG
  const isAllFilled = useCallback((): boolean => {
    const allData = { ...quotationDataRef.current };
    if (selectedQuotationId) {
      const current = getValues("currentDetails");
      if (current && current.length > 0) {
        allData[selectedQuotationId] = current;
      }
    }

    let hasAtLeastOneComplete = false;

    for (const [quotationId, details] of Object.entries(allData)) {
      if (!details || details.length === 0) continue;
      const isCurrent = quotationId === selectedQuotationId;

      // 非表示の見積書: 全明細が空なら未着手としてスキップ
      if (!isCurrent) {
        const allEmpty = details.every((d) => isDetailEmpty(d));
        if (allEmpty) continue;
      }

      for (const detail of details) {
        if (isDetailEmpty(detail)) {
          // 現在表示中、または一部入力済みの見積書 → 空の明細は「未完了」
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
