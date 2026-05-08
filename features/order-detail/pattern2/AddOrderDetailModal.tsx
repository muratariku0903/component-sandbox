import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Grid, GridItem } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
} from "@/components/ui/dialog";
import { QuotationSelector } from "./QuotationSelector";
import { DetailInputForm } from "./DetailInputForm";
import type {
  DetailItem,
  Quotation,
  SavedQuotationDetail,
  TaxType,
} from "../shared/types";
import { detailItemSchema, quotationDetailsSchema } from "../shared/types";
import type { Pattern2ModalFormData, QuotationFormEntry } from "./types";

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

/** 未選択時の表示用に使うダミーエントリ。最初の見積書選択時に除去する */
const createInitialEntries = (): QuotationFormEntry[] => [
  { quotationId: "", details: [createEmptyDetail()] },
];

/** モーダル保存時の payload。taxType と明細の両方をまとめてページ側へ commit する */
export interface ModalSavePayload {
  taxType: TaxType;
  details: SavedQuotationDetail[];
}

interface AddOrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  quotations: Quotation[];
  onSave: (payload: ModalSavePayload) => void;
  savedDetails?: SavedQuotationDetail[];
  /**
   * ページ側 taxType の現在値。モーダルを開いたときにこの値で初期化される。
   * モーダル操作中は内部 form で独立管理され、保存時に onSave 経由で commit、
   * キャンセル時は破棄される。
   */
  initialTaxType: TaxType;
}

export function AddOrderDetailModal({
  open,
  onClose,
  quotations,
  onSave,
  savedDetails = [],
  initialTaxType,
}: AddOrderDetailModalProps) {
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("");

  const form = useForm<Pattern2ModalFormData>({
    defaultValues: {
      taxType: initialTaxType,
      quotationEntries: createInitialEntries(),
    },
  });

  const { getValues } = form;
  // エラー変更・値変更の購読（見積書切替ブロック時の再レンダリング / radio の controlled 表示更新）
  form.watch();
  const _errors = form.formState.errors; // eslint-disable-line @typescript-eslint/no-unused-vars
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
  }, [form, getValues, selectedQuotationId]);

  const selectQuotation = useCallback(
    (quotationId: string) => {
      if (selectedQuotationId && selectedQuotationId !== quotationId) {
        if (!validateCurrentQuotation()) {
          return; // バリデーション失敗: 切替を阻止
        }
        const entries = getValues("quotationEntries");
        const currentIdx = entries.findIndex(
          (e) => e.quotationId === selectedQuotationId
        );
        if (currentIdx !== -1) {
          form.clearErrors(`quotationEntries.${currentIdx}.details`);
        }
      }

      const entries = getValues("quotationEntries");
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
        form.setValue("quotationEntries", entriesWithoutDummy);
      }

      setSelectedQuotationId(quotationId);
    },
    [form, getValues, selectedQuotationId, validateCurrentQuotation]
  );

  const initializeFromSaved = useCallback(
    (details: SavedQuotationDetail[]) => {
      if (details.length === 0) return;

      const entries: QuotationFormEntry[] = details.map((saved) => ({
        quotationId: saved.quotation.id,
        details: structuredClone(saved.details),
      }));

      form.setValue("quotationEntries", entries);
      setSelectedQuotationId(details[0].quotation.id);
    },
    [form]
  );

  const resetForm = useCallback(() => {
    form.reset({
      taxType: initialTaxType,
      quotationEntries: createInitialEntries(),
    });
    setSelectedQuotationId("");
  }, [form, initialTaxType]);

  // モーダルオープン時に、ページ側の現在値（initialTaxType + savedDetails）で内部 form を初期化
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      form.setValue("taxType", initialTaxType);
      if (savedDetails.length > 0) {
        initializeFromSaved(savedDetails);
      }
    }
    prevOpenRef.current = open;
  }, [open, savedDetails, initialTaxType, initializeFromSaved, form]);

  const isEditing = savedDetails.length > 0;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    // 現在の見積書のみ検証。他の見積書は「切替成功時に検証済み」の不変条件により既に valid
    if (!validateCurrentQuotation()) return;

    const entries = getValues("quotationEntries");
    const results: SavedQuotationDetail[] = [];

    entries.forEach(({ quotationId, details }) => {
      if (!quotationId) return;

      const filledDetails = details.filter(
        (d) =>
          d.productName !== "" ||
          d.modelNumber !== "" ||
          (d.unitPrice !== "" && Number(d.unitPrice) > 0) ||
          (d.amount !== "" && Number(d.amount) > 0)
      );
      if (filledDetails.length === 0) return;

      const quotation = quotations.find((q) => q.id === quotationId);
      if (!quotation) return;

      const subtotal = filledDetails.reduce(
        (sum, d) => sum + (Number(d.amount) || 0),
        0
      );

      results.push({
        quotation,
        details: filledDetails,
        subtotal,
      });
    });

    if (results.length > 0) {
      // taxType と明細をまとめてページ form に commit
      onSave({ taxType: getValues("taxType"), details: results });
      resetForm();
      onClose();
    }
  };

  return (
    <DialogRoot
      open={open}
      onOpenChange={(e) => !e.open && handleClose()}
      size="xl"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "発注明細編集" : "発注明細追加"}</DialogTitle>
        </DialogHeader>
        <DialogCloseTrigger />

        <DialogBody>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1.5fr" }} gap={6}>
            <GridItem>
              <QuotationSelector
                quotations={quotations}
                selectedQuotationId={selectedQuotationId}
                onSelectQuotation={selectQuotation}
                taxType={taxType}
                onTaxTypeChange={(value: TaxType) =>
                  form.setValue("taxType", value)
                }
              />
            </GridItem>
            <GridItem>
              <DetailInputForm
                quotationId={selectedQuotationId}
                form={form}
                quotationIndex={selectedQuotationIndex}
              />
            </GridItem>
          </Grid>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button
            colorPalette="blue"
            onClick={handleSave}
            disabled={!selectedQuotationId}
          >
            {isEditing ? "更新" : "明細追加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
