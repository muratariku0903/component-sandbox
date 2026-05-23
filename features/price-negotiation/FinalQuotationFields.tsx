import {
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  Text,
} from "@chakra-ui/react";
import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { Field } from "@/components/ui/field";
import {
  NativeSelectField,
  NativeSelectRoot,
} from "@/components/ui/native-select";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { FilePickerField } from "./FilePickerField";
import {
  createEmptyFinalQuotation,
  type PriceNegotiationFormData,
  type TaxType,
} from "./types";

interface FinalQuotationFieldsProps {
  form: UseFormReturn<PriceNegotiationFormData>;
}

export function FinalQuotationFields({ form }: FinalQuotationFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "result.quotations",
  });

  return (
    <Box display="flex" flexDirection="column" gap={4}>
      {fields.map((field, index) => {
        const fieldErrors = errors.result?.quotations?.[index];
        const quotationFile = form.watch(`result.quotations.${index}.file`);
        const hasQuotationFile = !!quotationFile.fileName;

        return (
          <Box
            key={field.id}
            border="1px solid"
            borderColor="border"
            borderRadius="md"
            p={{ base: 3, md: 4 }}
            minW={0}
          >
            <HStack
              justify="space-between"
              align="center"
              mb={4}
              gap={3}
              flexWrap="wrap"
            >
              <Text fontSize="lg" fontWeight="bold">
                最終見積書 {index + 1}
              </Text>
              {index > 0 && (
                <IconButton
                  type="button"
                  aria-label="最終見積書を削除"
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                  onClick={() => remove(index)}
                >
                  <LuTrash2 />
                </IconButton>
              )}
            </HStack>

            <Grid
              templateColumns={{
                base: "minmax(0, 1fr)",
                md: "repeat(2, minmax(0, 1fr))",
              }}
              gap={4}
            >
              <GridItem minW={0}>
                <Field
                  label="見積金額"
                  required
                  invalid={!!fieldErrors?.amount}
                  errorText={fieldErrors?.amount?.message}
                >
                  <Input
                    type="number"
                    inputMode="numeric"
                    borderColor={
                      fieldErrors?.amount ? "border.error" : undefined
                    }
                    _focusVisible={
                      fieldErrors?.amount
                        ? { borderColor: "border.error" }
                        : undefined
                    }
                    {...register(`result.quotations.${index}.amount`, {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                  />
                </Field>
              </GridItem>

              <GridItem minW={0}>
                <Field
                  label="見積日"
                  required
                  invalid={!!fieldErrors?.quotationDate}
                  errorText={fieldErrors?.quotationDate?.message}
                >
                  <Input
                    type="date"
                    borderColor={
                      fieldErrors?.quotationDate ? "border.error" : undefined
                    }
                    _focusVisible={
                      fieldErrors?.quotationDate
                        ? { borderColor: "border.error" }
                        : undefined
                    }
                    {...register(`result.quotations.${index}.quotationDate`)}
                  />
                </Field>
              </GridItem>

              <GridItem minW={0}>
                <Field
                  label="税区分"
                  required
                  invalid={!!fieldErrors?.taxType}
                  errorText={fieldErrors?.taxType?.message}
                >
                  <Controller
                    control={control}
                    name={`result.quotations.${index}.taxType`}
                    render={({ field }) => (
                      <Box
                        border="1px solid"
                        borderColor={
                          fieldErrors?.taxType ? "border.error" : "transparent"
                        }
                        borderRadius="md"
                        px={fieldErrors?.taxType ? 3 : 0}
                        py={fieldErrors?.taxType ? 2 : 0}
                      >
                        <RadioGroup
                          value={field.value}
                          onValueChange={(event) =>
                            field.onChange((event.value ?? "") as TaxType)
                          }
                        >
                          <HStack gap={4} flexWrap="wrap">
                            <Radio value="tax_inclusive">税込</Radio>
                            <Radio value="tax_exclusive">税抜</Radio>
                          </HStack>
                        </RadioGroup>
                      </Box>
                    )}
                  />
                </Field>
              </GridItem>

              <GridItem minW={0}>
                <Field
                  label="見積No."
                  invalid={!!fieldErrors?.quotationNo}
                  errorText={fieldErrors?.quotationNo?.message}
                >
                  <Input
                    borderColor={
                      fieldErrors?.quotationNo ? "border.error" : undefined
                    }
                    _focusVisible={
                      fieldErrors?.quotationNo
                        ? { borderColor: "border.error" }
                        : undefined
                    }
                    {...register(`result.quotations.${index}.quotationNo`)}
                    placeholder="任意"
                  />
                </Field>
              </GridItem>

              <GridItem colSpan={{ base: 1, md: 2 }} minW={0}>
                <Field label="見積書ファイル">
                  <Controller
                    control={control}
                    name={`result.quotations.${index}.file`}
                    render={({ field }) => (
                      <FilePickerField
                        value={field.value}
                        onChange={field.onChange}
                        minH="132px"
                      />
                    )}
                  />
                </Field>
              </GridItem>

              {hasQuotationFile && (
                <GridItem colSpan={{ base: 1, md: 2 }} minW={0}>
                  <Field
                    label="受領区分"
                    required
                    invalid={!!fieldErrors?.receiptCategory}
                    errorText={fieldErrors?.receiptCategory?.message}
                  >
                    <NativeSelectRoot>
                      <NativeSelectField
                        placeholder="選択してください"
                        borderColor={
                          fieldErrors?.receiptCategory
                            ? "border.error"
                            : undefined
                        }
                        _focusVisible={
                          fieldErrors?.receiptCategory
                            ? { borderColor: "border.error" }
                            : undefined
                        }
                        {...register(
                          `result.quotations.${index}.receiptCategory`
                        )}
                        items={[
                          { value: "electronic", label: "電子" },
                          { value: "paper", label: "紙" },
                        ]}
                      />
                    </NativeSelectRoot>
                  </Field>
                </GridItem>
              )}
            </Grid>
          </Box>
        );
      })}

      <Button
        type="button"
        variant="outline"
        alignSelf={{ base: "stretch", sm: "flex-start" }}
        onClick={() => append(createEmptyFinalQuotation())}
      >
        <LuPlus />
        最終見積書追加
      </Button>
    </Box>
  );
}
