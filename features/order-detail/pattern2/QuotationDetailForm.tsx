import { Box, Button, HStack, Input, Text, IconButton } from "@chakra-ui/react";
import type {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
} from "react";
import { Field } from "@/components/ui/field";
import {
  NativeSelectRoot,
  NativeSelectField,
} from "@/components/ui/native-select";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { OrderDetailModalFormData } from "./types";
import { LuPlus, LuTrash2 } from "react-icons/lu";

interface QuotationDetailFormProps {
  form: UseFormReturn<OrderDetailModalFormData>;
  quotationIndex: number;
  disabled?: boolean;
}

const integerControlKeys = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "Enter",
  "Escape",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

function normalizeIntegerInput(value: string): string {
  if (value === "") return "";

  const sign = value.startsWith("-") ? "-" : "";
  const integerPart = (sign ? value.slice(1) : value)
    .split(/[.,]/)[0]
    .replace(/\D/g, "");

  return `${sign}${integerPart}`;
}

function isIntegerText(value: string): boolean {
  return /^-?\d*$/.test(value);
}

export function QuotationDetailForm({
  form,
  quotationIndex,
  disabled = false,
}: QuotationDetailFormProps) {
  const { control, register, formState: { errors } } = form;
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
      taxRate: 10,
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

      {fields.map((field, index) => {
        const fieldErrors =
          errors?.quotationEntries?.[quotationIndex]?.details?.[index];
        const amountRegistration = register(`${basePath}.${index}.amount`, {
          setValueAs: (value) =>
            value === "" || value === "-" ? "" : Number(value),
        });

        const handleAmountKeyDown = (
          event: KeyboardEvent<HTMLInputElement>
        ) => {
          if (event.metaKey || event.ctrlKey || event.altKey) return;
          if (integerControlKeys.has(event.key)) return;

          if (event.key === "-") {
            const input = event.currentTarget;
            const canInsertMinus =
              input.selectionStart === 0 && !input.value.includes("-");
            if (!canInsertMinus) event.preventDefault();
            return;
          }

          if (!/^\d$/.test(event.key)) {
            event.preventDefault();
          }
        };

        const handleAmountPaste = (
          event: ClipboardEvent<HTMLInputElement>
        ) => {
          if (!isIntegerText(event.clipboardData.getData("text"))) {
            event.preventDefault();
          }
        };

        const handleAmountChange = (
          event: ChangeEvent<HTMLInputElement>
        ) => {
          event.currentTarget.value = normalizeIntegerInput(
            event.currentTarget.value
          );
          amountRegistration.onChange(event);
        };

        return (
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
                  disabled={disabled}
                >
                  <LuTrash2 />
                </IconButton>
              )}
            </Box>

            <HStack gap={3} flexWrap="wrap">
              <Field
                label="商品名"
                flex="1"
                minW="140px"
                invalid={!!fieldErrors?.productName}
                errorText={fieldErrors?.productName?.message}
              >
                <Input
                  {...register(`${basePath}.${index}.productName`)}
                  placeholder="商品名"
                  disabled={disabled}
                />
              </Field>

              <Field
                label="商品型番号"
                flex="1"
                minW="120px"
                invalid={!!fieldErrors?.modelNumber}
                errorText={fieldErrors?.modelNumber?.message}
              >
                <Input
                  {...register(`${basePath}.${index}.modelNumber`)}
                  placeholder="型番号"
                  disabled={disabled}
                />
              </Field>
            </HStack>

            <HStack gap={3} mt={3} flexWrap="wrap">
              <Field
                label="単価"
                flex="1"
                minW="100px"
                invalid={!!fieldErrors?.unitPrice}
                errorText={fieldErrors?.unitPrice?.message}
              >
                <Input
                  type="number"
                  {...register(`${basePath}.${index}.unitPrice`, {
                    valueAsNumber: true,
                  })}
                  placeholder="0"
                  disabled={disabled}
                />
              </Field>

              <Field
                label="数量"
                flex="1"
                minW="80px"
                invalid={!!fieldErrors?.quantity}
                errorText={fieldErrors?.quantity?.message}
              >
                <Input
                  type="number"
                  {...register(`${basePath}.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                  placeholder="0"
                  disabled={disabled}
                />
              </Field>

              <Field
                label="税率"
                flex="1"
                minW="80px"
                invalid={!!fieldErrors?.taxRate}
                errorText={fieldErrors?.taxRate?.message}
              >
                <NativeSelectRoot disabled={disabled}>
                  <NativeSelectField
                    {...register(`${basePath}.${index}.taxRate`, {
                      valueAsNumber: true,
                    })}
                    items={[
                      { value: "0", label: "非課税" },
                      { value: "8", label: "8%" },
                      { value: "10", label: "10%" },
                    ]}
                  />
                </NativeSelectRoot>
              </Field>

              <Field
                label="金額"
                flex="1"
                minW="100px"
                invalid={!!fieldErrors?.amount}
                errorText={fieldErrors?.amount?.message}
              >
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="-?[0-9]*"
                  {...amountRegistration}
                  onKeyDown={handleAmountKeyDown}
                  onPaste={handleAmountPaste}
                  onChange={handleAmountChange}
                  placeholder="0"
                  disabled={disabled}
                />
              </Field>
            </HStack>
          </Box>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={addRow}
        alignSelf="flex-start"
        disabled={disabled}
      >
        <LuPlus />
        明細を追加
      </Button>
    </Box>
  );
}
