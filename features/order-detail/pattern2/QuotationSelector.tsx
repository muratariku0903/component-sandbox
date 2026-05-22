import { Box, Text } from "@chakra-ui/react";
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
  onSelectQuotation: (id: string) => void | Promise<void>;
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
  const hasQuotations = quotations.length > 0;

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Field label="見積書を選択">
        {hasQuotations ? (
          <NativeSelectRoot>
            <NativeSelectField
              placeholder="選択してください"
              value={selectedQuotationId}
              onChange={(e) => void onSelectQuotation(e.target.value)}
              items={quotations.map((q) => ({
                value: q.id,
                label: q.name,
              }))}
            />
          </NativeSelectRoot>
        ) : (
          <Text color="fg.muted" fontSize="sm">
            連携された見積書はありません
          </Text>
        )}
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
            {!hasQuotations
              ? "見積書なしで明細を手入力します"
              : selectedQuotationId
                ? "選択された見積書のプレビュー"
                : "見積書を選択してください"}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
