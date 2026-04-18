import { Box, Text } from "@chakra-ui/react";
import type { UseFormReturn } from "react-hook-form";
import type { TaxType } from "../shared/types";
import type { Pattern2ModalFormData } from "./types";
import { QuotationDetailForm } from "./QuotationDetailForm";

interface DetailInputFormProps {
  quotationId: string;
  form: UseFormReturn<Pattern2ModalFormData>;
  quotationIndex: number;
  taxType: TaxType;
}

export function DetailInputForm({
  quotationId,
  form,
  quotationIndex,
  taxType,
}: DetailInputFormProps) {
  if (!quotationId || quotationIndex === -1) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="300px"
      >
        <Text color="fg.muted">
          見積書を選択すると明細フィールドが表示されます
        </Text>
      </Box>
    );
  }

  return (
    <QuotationDetailForm
      key={quotationId}
      form={form}
      quotationIndex={quotationIndex}
      taxType={taxType}
    />
  );
}
