import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Grid, GridItem } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type { OrderDetailModalFormData, QuotationFormEntry } from "./types";
import { orderDetailModalFormSchema } from "./types";

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

const manualQuotation: Quotation = {
  id: "manual-entry",
  name: "見積書なし",
};

interface AddOrderDetailModalProps {
  open: boolean;
  onClose: () => void;
  quotations: Quotation[];
  onSave: (details: SavedQuotationDetail[]) => void;
  savedDetails?: SavedQuotationDetail[];
}

export function AddOrderDetailModal({
  open,
  onClose,
  quotations,
  onSave,
  savedDetails = [],
}: AddOrderDetailModalProps) {
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>("");
  const canEditWithoutQuotation = quotations.length === 0;

  const form = useForm<OrderDetailModalFormData>({
    resolver: zodResolver(orderDetailModalFormSchema),
    defaultValues: {
      taxType: "tax_exclusive",
      quotationEntries: createInitialEntries(),
    },
  });

  const { getValues } = form;
  const taxType = form.watch("taxType");
  // エラー変更の購読（見積書切替ブロック時にセレクトを元の値に戻すため）
  form.watch();
  const _errors = form.formState.errors; // eslint-disable-line @typescript-eslint/no-unused-vars

  // 選択中の見積書のインデックスを取得
  const selectedQuotationIndex = useMemo(() => {
    const entries = getValues("quotationEntries");
    return entries.findIndex((e) => e.quotationId === selectedQuotationId);
  }, [selectedQuotationId, getValues]);

  async function validateCurrentQuotation(): Promise<boolean> {
    const entries = getValues("quotationEntries");
    const currentIdx = entries.findIndex(
      (e) => e.quotationId === selectedQuotationId
    );
    if (currentIdx === -1) return true;

    return form.trigger(`quotationEntries.${currentIdx}.details`, {
      shouldFocus: true,
    });
  }

  async function selectQuotation(quotationId: string) {
    if (selectedQuotationId && selectedQuotationId !== quotationId) {
      if (!(await validateCurrentQuotation())) {
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
  }

  function initializeFromSaved(details: SavedQuotationDetail[]) {
    if (details.length === 0) return;

    const entries: QuotationFormEntry[] = details.map((saved) => ({
      quotationId: saved.quotation.id,
      details: structuredClone(saved.details),
    }));

    form.setValue("taxType", details[0].taxType);
    form.setValue("quotationEntries", entries);
    setSelectedQuotationId(details[0].quotation.id);
  }

  function resetForm() {
    form.reset({
      taxType: "tax_exclusive",
      quotationEntries: createInitialEntries(),
    });
    setSelectedQuotationId("");
  }

  // モーダルオープン時に保存済みデータがあれば初期化
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      if (savedDetails.length > 0) {
        initializeFromSaved(savedDetails);
      }
    }
    prevOpenRef.current = open;
  }, [open, savedDetails]);

  const isEditing = savedDetails.length > 0;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    // 現在の見積書のみ検証。他の見積書は「切替成功時に検証済み」の不変条件により既に valid
    if (!(await validateCurrentQuotation())) return;

    const entries = getValues("quotationEntries");
    const currentTaxType = form.getValues("taxType");
    const results: SavedQuotationDetail[] = [];

    entries.forEach(({ quotationId, details }) => {
      if (!quotationId && !canEditWithoutQuotation) return;

      const filledDetails = details.filter(
        (d) =>
          d.productName !== "" ||
          d.modelNumber !== "" ||
          (d.unitPrice !== "" && Number(d.unitPrice) > 0) ||
          (d.amount !== "" && Number(d.amount) > 0)
      );
      if (filledDetails.length === 0) return;

      const quotation = quotationId
        ? quotations.find((q) => q.id === quotationId)
        : manualQuotation;
      if (!quotation) return;

      const subtotal = filledDetails.reduce(
        (sum, d) => sum + (Number(d.amount) || 0),
        0
      );

      results.push({
        quotation,
        taxType: currentTaxType,
        details: filledDetails,
        subtotal,
      });
    });

    if (results.length > 0) {
      onSave(results);
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
                canEditWithoutQuotation={canEditWithoutQuotation}
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
            disabled={!selectedQuotationId && !canEditWithoutQuotation}
          >
            {isEditing ? "更新" : "明細追加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
