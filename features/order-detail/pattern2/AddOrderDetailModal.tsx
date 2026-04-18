import { useEffect, useRef } from "react";
import { Button, Grid, GridItem } from "@chakra-ui/react";
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
import { useOrderDetailForm } from "./hooks/useOrderDetailForm";
import type { Quotation, SavedQuotationDetail, TaxType } from "../shared/types";

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
  const {
    form,
    selectedQuotationId,
    selectedQuotationIndex,
    selectQuotation,
    taxType,
    resetForm,
    initializeFromSaved,
    isAllFilled,
    getAllQuotationData,
  } = useOrderDetailForm(quotations);

  // フォーム値の変更で再レンダリング → isAllFilled() を再評価
  form.watch();

  // モーダルオープン時に保存済みデータがあれば初期化
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      if (savedDetails.length > 0) {
        initializeFromSaved(savedDetails);
      }
    }
    prevOpenRef.current = open;
  }, [open, savedDetails, initializeFromSaved]);

  const isEditing = savedDetails.length > 0;

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    const allData = getAllQuotationData();
    const currentTaxType = form.getValues("taxType");
    const results: SavedQuotationDetail[] = [];

    Object.entries(allData).forEach(([quotationId, details]) => {
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
                taxType={taxType}
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
            disabled={!isAllFilled()}
          >
            {isEditing ? "更新" : "明細追加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
