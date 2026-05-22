import type { UseFormReturn } from "react-hook-form";
import type { OrderDetailModalFormData } from "./types";
import { QuotationDetailForm } from "./QuotationDetailForm";

interface DetailInputFormProps {
  quotationId: string;
  form: UseFormReturn<OrderDetailModalFormData>;
  quotationIndex: number;
}

export function DetailInputForm({
  quotationId,
  form,
  quotationIndex,
}: DetailInputFormProps) {
  const disabled = !quotationId || quotationIndex === -1;

  return (
    <QuotationDetailForm
      key={quotationId || "placeholder"}
      form={form}
      quotationIndex={quotationIndex}
      disabled={disabled}
    />
  );
}
