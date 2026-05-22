import type { UseFormReturn } from "react-hook-form";
import type { OrderDetailModalFormData } from "./types";
import { QuotationDetailForm } from "./QuotationDetailForm";

interface DetailInputFormProps {
  quotationId: string;
  form: UseFormReturn<OrderDetailModalFormData>;
  quotationIndex: number;
  canEditWithoutQuotation?: boolean;
}

export function DetailInputForm({
  quotationId,
  form,
  quotationIndex,
  canEditWithoutQuotation = false,
}: DetailInputFormProps) {
  const disabled =
    quotationIndex === -1 || (!quotationId && !canEditWithoutQuotation);

  return (
    <QuotationDetailForm
      key={quotationId || "placeholder"}
      form={form}
      quotationIndex={quotationIndex}
      disabled={disabled}
    />
  );
}
