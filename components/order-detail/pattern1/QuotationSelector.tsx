import { Box, Text, RadioGroup as ChakraRadioGroup } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import {
  NativeSelectRoot,
  NativeSelectField,
} from "@/components/ui/native-select";
import { Radio, RadioGroup } from "@/components/ui/radio";
import type { Quotation, TaxType } from "../shared/types";

interface QuotationSelectorProps {
  quotations: Quotation[];
  selectedQuotationId: string;
  onSelectQuotation: (id: string) => void;
  taxType: TaxType;
  onTaxTypeChange: (value: TaxType) => void;
}

export function QuotationSelector({
  quotations,
  selectedQuotationId,
  onSelectQuotation,
  taxType,
  onTaxTypeChange,
}: QuotationSelectorProps) {
  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Field label="見積書を選択">
        <NativeSelectRoot>
          <NativeSelectField
            placeholder="選択してください"
            value={selectedQuotationId}
            onChange={(e) => onSelectQuotation(e.target.value)}
            items={quotations.map((q) => ({
              value: q.id,
              label: q.name,
            }))}
          />
        </NativeSelectRoot>
      </Field>

      <Field label="税区分">
        <RadioGroup
          value={taxType}
          onValueChange={(e) => onTaxTypeChange(e.value as TaxType)}
        >
          <Box display="flex" gap={4}>
            <Radio value="tax_exclusive">税抜</Radio>
            <Radio value="tax_inclusive">税込</Radio>
          </Box>
        </RadioGroup>
      </Field>

      <Box>
        <Text fontSize="sm" fontWeight="bold" mb={2}>
          見積書プレビュー
        </Text>
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="md"
          p={4}
          minH="200px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="fg.muted" fontSize="sm">
            {selectedQuotationId
              ? "選択された見積書のプレビュー"
              : "見積書を選択してください"}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
