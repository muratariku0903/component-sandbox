import {
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  Input,
  Separator,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Field } from "@/components/ui/field";
import {
  NativeSelectField,
  NativeSelectRoot,
} from "@/components/ui/native-select";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { FilePickerField } from "./FilePickerField";
import { FinalQuotationFields } from "./FinalQuotationFields";
import {
  createEmptyFinalQuotation,
  createEmptyStoredFile,
  priceNegotiationFormSchema,
  type ContactMethod,
  type PriceNegotiationFormData,
  type SupplierCandidate,
  type TaxType,
} from "./types";

interface PriceNegotiationPageProps {
  suppliers: SupplierCandidate[];
}

export function PriceNegotiationPage({ suppliers }: PriceNegotiationPageProps) {
  const form = useForm<PriceNegotiationFormData>({
    resolver: zodResolver(priceNegotiationFormSchema),
    defaultValues: {
      candidates: suppliers.map((supplier) => ({
        supplierId: supplier.id,
        contactMethod: "",
      })),
      result: {
        supplierId: "",
        negotiatedAmount: "",
        taxType: "tax_inclusive",
        contactMemo: "",
        quotations: [createEmptyFinalQuotation()],
        orderFile: createEmptyStoredFile(),
      },
    },
  });

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  const submitAuthorizationRequest = handleSubmit((data) => {
    const payload = {
      ...data,
      result: {
        ...data.result,
        quotations: data.result.quotations.map((quotation) => ({
          ...quotation,
          file: {
            fileName: quotation.file.fileName,
            filePath: quotation.file.filePath,
          },
        })),
        orderFile: {
          fileName: data.result.orderFile.fileName,
          filePath: data.result.orderFile.filePath,
        },
      },
    };

    console.log("価格交渉 認可依頼ペイロード:", payload);
  });

  return (
    <Box
      maxW="760px"
      w="full"
      mx={0}
      px={{ base: 3, md: 6 }}
      py={6}
      overflowX="hidden"
    >
      <form onSubmit={submitAuthorizationRequest} noValidate>
        <VStack align="stretch" gap={6}>
          <Box>
            <Text fontSize="xl" fontWeight="bold">
              価格交渉
            </Text>
          </Box>

          <Box
            border="1px solid"
            borderColor="border"
            borderRadius="md"
            p={{ base: 3, md: 5 }}
            minW={0}
          >
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              交渉先
            </Text>
            <VStack align="stretch" gap={4}>
              {suppliers.map((supplier, index) => {
                const contactMethodError =
                  errors.candidates?.[index]?.contactMethod;

                return (
                  <Box
                    key={supplier.id}
                    border="1px solid"
                    borderColor="border"
                    borderRadius="md"
                    p={{ base: 3, md: 4 }}
                    minW={0}
                  >
                    <Text fontWeight="semibold" mb={3}>
                      {supplier.name}
                    </Text>
                    <Field
                      label="交渉先連絡方法"
                      required
                      invalid={!!contactMethodError}
                      errorText={contactMethodError?.message}
                    >
                      <Controller
                        control={control}
                        name={`candidates.${index}.contactMethod`}
                        render={({ field }) => (
                          <Box
                            border="1px solid"
                            borderColor={
                              contactMethodError ? "border.error" : "transparent"
                            }
                            borderRadius="md"
                            px={contactMethodError ? 3 : 0}
                            py={contactMethodError ? 2 : 0}
                          >
                            <RadioGroup
                              value={field.value}
                              onValueChange={(event) =>
                                field.onChange(
                                  (event.value ?? "") as ContactMethod
                                )
                              }
                            >
                              <HStack gap={4} flexWrap="wrap">
                                <Radio value="email">メール</Radio>
                                <Radio value="tel">TEL</Radio>
                              </HStack>
                            </RadioGroup>
                          </Box>
                        )}
                      />
                    </Field>
                  </Box>
                );
              })}
            </VStack>
          </Box>

          <Box
            border="1px solid"
            borderColor="border"
            borderRadius="md"
            p={{ base: 3, md: 5 }}
            minW={0}
          >
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              交渉結果
            </Text>
            <VStack align="stretch" gap={4}>
              <Grid
                templateColumns={{
                  base: "minmax(0, 1fr)",
                  "2xl": "repeat(2, minmax(0, 1fr))",
                }}
                gap={4}
              >
                <GridItem minW={0}>
                  <Field
                    label="発注先"
                    required
                    invalid={!!errors.result?.supplierId}
                    errorText={errors.result?.supplierId?.message}
                  >
                    <NativeSelectRoot>
                      <NativeSelectField
                        placeholder="選択してください"
                        borderColor={
                          errors.result?.supplierId
                            ? "border.error"
                            : undefined
                        }
                        {...register("result.supplierId")}
                        items={suppliers.map((supplier) => ({
                          value: supplier.id,
                          label: supplier.name,
                        }))}
                      />
                    </NativeSelectRoot>
                  </Field>
                </GridItem>

                <GridItem minW={0}>
                  <Field
                    label="交渉金額"
                    required
                    invalid={!!errors.result?.negotiatedAmount}
                    errorText={errors.result?.negotiatedAmount?.message}
                  >
                    <Input
                      type="number"
                      inputMode="numeric"
                      borderColor={
                        errors.result?.negotiatedAmount
                          ? "border.error"
                          : undefined
                      }
                      _focusVisible={
                        errors.result?.negotiatedAmount
                          ? { borderColor: "border.error" }
                          : undefined
                      }
                      {...register("result.negotiatedAmount", {
                        valueAsNumber: true,
                      })}
                      placeholder="0"
                    />
                  </Field>
                </GridItem>

                <GridItem minW={0}>
                  <Field label="交渉金額の税区分" required>
                    <Controller
                      control={control}
                      name="result.taxType"
                      render={({ field }) => (
                        <RadioGroup
                          value={field.value}
                          onValueChange={(event) =>
                            field.onChange(event.value as TaxType)
                          }
                        >
                          <HStack gap={4} flexWrap="wrap">
                            <Radio value="tax_inclusive">税込</Radio>
                            <Radio value="tax_exclusive">税抜</Radio>
                          </HStack>
                        </RadioGroup>
                      )}
                    />
                  </Field>
                </GridItem>

                <GridItem minW={0}>
                  <Field
                    label="連絡事項"
                    invalid={!!errors.result?.contactMemo}
                    errorText={errors.result?.contactMemo?.message}
                  >
                    <Textarea
                      borderColor={
                        errors.result?.contactMemo ? "border.error" : undefined
                      }
                      _focusVisible={
                        errors.result?.contactMemo
                          ? { borderColor: "border.error" }
                          : undefined
                      }
                      {...register("result.contactMemo")}
                      placeholder="任意"
                      rows={3}
                    />
                  </Field>
                </GridItem>
              </Grid>

              <Separator />

              <FinalQuotationFields form={form} />

              <Separator />

              <Field label="注文書">
                <Controller
                  control={control}
                  name="result.orderFile"
                  render={({ field }) => (
                    <FilePickerField
                      value={field.value}
                      onChange={field.onChange}
                      minH="132px"
                    />
                  )}
                />
              </Field>
            </VStack>
          </Box>

          <Box>
            <Button
              type="submit"
              colorPalette="green"
              w={{ base: "full", sm: "auto" }}
            >
              認可依頼
            </Button>
          </Box>
        </VStack>
      </form>
    </Box>
  );
}
