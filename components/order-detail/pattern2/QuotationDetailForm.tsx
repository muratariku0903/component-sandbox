import { Box, Button, HStack, Input, Text, IconButton } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import {
  NativeSelectRoot,
  NativeSelectField,
} from "@/components/ui/native-select";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { TaxType } from "../shared/types";
import type { Pattern2ModalFormData } from "./types";
import { LuPlus, LuTrash2 } from "react-icons/lu";

interface QuotationDetailFormProps {
  form: UseFormReturn<Pattern2ModalFormData>;
  quotationIndex: number;
  taxType: TaxType;
}

export function QuotationDetailForm({
  form,
  quotationIndex,
  taxType,
}: QuotationDetailFormProps) {
  const { control, register } = form;
  const basePath = `quotationEntries.${quotationIndex}.details` as const;

  const { fields, append, remove } = useFieldArray({
    control,
    name: basePath,
  });

  const addRow = () =>
    append({
      productName: "",
      modelNumber: "",
      unitPrice: "",
      quantity: "",
      taxRate: "",
      amount: "",
    });

  const removeRow = (index: number) => {
    if (fields.length > 1) remove(index);
  };

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
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Text fontSize="sm" fontWeight="semibold">
              明細 {index + 1}
            </Text>
            {fields.length > 1 && (
              <IconButton
                aria-label="明細を削除"
                size="xs"
                variant="ghost"
                colorPalette="red"
                onClick={() => removeRow(index)}
              >
                <LuTrash2 />
              </IconButton>
            )}
          </Box>

          <HStack gap={3} flexWrap="wrap">
            <Field label="商品名" flex="1" minW="140px">
              <Input
                {...register(`${basePath}.${index}.productName`)}
                placeholder="商品名"
              />
            </Field>

            <Field label="商品型番号" flex="1" minW="120px">
              <Input
                {...register(`${basePath}.${index}.modelNumber`)}
                placeholder="型番号"
              />
            </Field>
          </HStack>

          <HStack gap={3} mt={3} flexWrap="wrap">
            <Field label="単価" flex="1" minW="100px">
              <Input
                type="number"
                {...register(`${basePath}.${index}.unitPrice`, {
                  valueAsNumber: true,
                })}
                placeholder="0"
              />
            </Field>

            <Field label="数量" flex="1" minW="80px">
              <Input
                type="number"
                {...register(`${basePath}.${index}.quantity`, {
                  valueAsNumber: true,
                })}
                placeholder="0"
              />
            </Field>

            <Field label="税率" flex="1" minW="80px">
              <NativeSelectRoot>
                <NativeSelectField
                  disabled={taxType === "tax_exclusive"}
                  {...register(`${basePath}.${index}.taxRate`, {
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
                {...register(`${basePath}.${index}.amount`, {
                  valueAsNumber: true,
                })}
                placeholder="0"
              />
            </Field>
          </HStack>
        </Box>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addRow}
        alignSelf="flex-start"
      >
        <LuPlus />
        明細を追加
      </Button>
    </Box>
  );
}
