import { Box, Button, HStack, Input, Text } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import {
  NativeSelectRoot,
  NativeSelectField,
} from "@/components/ui/native-select";
import type { UseFormReturn } from "react-hook-form";
import type { Pattern2ModalFormData } from "./types";
import { QuotationDetailForm } from "./QuotationDetailForm";
import { LuPlus } from "react-icons/lu";

interface DetailInputFormProps {
  quotationId: string;
  form: UseFormReturn<Pattern2ModalFormData>;
  quotationIndex: number;
}

export function DetailInputForm({
  quotationId,
  form,
  quotationIndex,
}: DetailInputFormProps) {
  if (!quotationId || quotationIndex === -1) {
    return <DisabledDetailPlaceholder />;
  }

  return (
    <QuotationDetailForm
      key={quotationId}
      form={form}
      quotationIndex={quotationIndex}
    />
  );
}

function DisabledDetailPlaceholder() {
  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Text fontWeight="bold" fontSize="md">
        明細入力
      </Text>

      <Box border="1px solid" borderColor="border" borderRadius="md" p={3}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Text fontSize="sm" fontWeight="semibold">
            明細 1
          </Text>
        </Box>

        <HStack gap={3} flexWrap="wrap">
          <Field label="商品名" flex="1" minW="140px">
            <Input placeholder="商品名" disabled />
          </Field>
          <Field label="商品型番号" flex="1" minW="120px">
            <Input placeholder="型番号" disabled />
          </Field>
        </HStack>

        <HStack gap={3} mt={3} flexWrap="wrap">
          <Field label="単価" flex="1" minW="100px">
            <Input type="number" placeholder="0" disabled />
          </Field>
          <Field label="数量" flex="1" minW="80px">
            <Input type="number" placeholder="0" disabled />
          </Field>
          <Field label="税率" flex="1" minW="80px">
            <NativeSelectRoot disabled>
              <NativeSelectField
                items={[
                  { value: "0", label: "非課税" },
                  { value: "8", label: "8%" },
                  { value: "10", label: "10%" },
                ]}
              />
            </NativeSelectRoot>
          </Field>
          <Field label="金額" flex="1" minW="100px">
            <Input type="number" placeholder="0" disabled />
          </Field>
        </HStack>
      </Box>

      <Button
        variant="outline"
        size="sm"
        disabled
        alignSelf="flex-start"
      >
        <LuPlus />
        明細を追加
      </Button>
    </Box>
  );
}
