import { Box, Button, HStack, Input, Text, IconButton } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import {
  NativeSelectRoot,
  NativeSelectField,
} from "@/components/ui/native-select";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import type { ModalFormData, TaxType } from "../shared/types";
import { LuPlus, LuTrash2 } from "react-icons/lu";

interface DetailInputFormProps {
  quotationId: string;
  form: UseFormReturn<ModalFormData>;
  fieldArray: UseFieldArrayReturn<ModalFormData, "currentDetails">;
  taxType: TaxType;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
}

export function DetailInputForm({
  quotationId,
  form,
  fieldArray,
  taxType,
  onAddRow,
  onRemoveRow,
}: DetailInputFormProps) {
  const { register } = form;
  const { fields } = fieldArray;

  if (!quotationId) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="300px"
      >
        <Text color="fg.muted">見積書を選択すると明細フィールドが表示されます</Text>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      <Text fontWeight="bold" fontSize="md">
        明細入力
      </Text>

      {fields.map((field, index) => (
        <Box
          key={field.id}
          border="1px solid"
          borderColor="border"
          borderRadius="md"
          p={3}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Text fontSize="sm" fontWeight="semibold">
              明細 {index + 1}
            </Text>
            {fields.length > 1 && (
              <IconButton
                aria-label="明細を削除"
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={() => onRemoveRow(index)}
              >
                <LuTrash2 />
              </IconButton>
            )}
          </Box>

          <HStack gap={3} flexWrap="wrap">
            <Field label="商品名" flex="1" minW="140px">
              <Input
                {...register(`currentDetails.${index}.productName`)}
                placeholder="商品名"
              />
            </Field>

            <Field label="商品型番号" flex="1" minW="120px">
              <Input
                {...register(`currentDetails.${index}.modelNumber`)}
                placeholder="型番号"
              />
            </Field>
          </HStack>

          <HStack gap={3} mt={3} flexWrap="wrap">
            <Field label="単価" flex="1" minW="100px">
              <Input
                type="number"
                {...register(`currentDetails.${index}.unitPrice`, {
                  valueAsNumber: true,
                })}
                placeholder="0"
              />
            </Field>

            <Field label="数量" flex="1" minW="80px">
              <Input
                type="number"
                {...register(`currentDetails.${index}.quantity`, {
                  valueAsNumber: true,
                })}
                placeholder="0"
              />
            </Field>

            <Field label="税率" flex="1" minW="80px">
              <NativeSelectRoot>
                <NativeSelectField
                  disabled={taxType === "tax_exclusive"}
                  {...register(`currentDetails.${index}.taxRate`, {
                    valueAsNumber: true,
                  })}
                  placeholder="選択"
                  items={[
                    { value: "8", label: "8%" },
                    { value: "10", label: "10%" },
                  ]}
                />
              </NativeSelectRoot>
            </Field>

            <Field label="金額" flex="1" minW="100px">
              <Input
                type="number"
                {...register(`currentDetails.${index}.amount`, {
                  valueAsNumber: true,
                })}
                placeholder="0"
              />
            </Field>
          </HStack>
        </Box>
      ))}

      <Button variant="outline" size="sm" onClick={onAddRow} alignSelf="flex-start">
        <LuPlus />
        明細を追加
      </Button>
    </Box>
  );
}
