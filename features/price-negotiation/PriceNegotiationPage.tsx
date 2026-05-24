import {
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  Separator,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
import { Field } from "@/components/ui/field";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import {
  NativeSelectField,
  NativeSelectRoot,
} from "@/components/ui/native-select";
import { Radio, RadioGroup } from "@/components/ui/radio";
import { FilePickerField } from "./FilePickerField";
import { FinalQuotationFields } from "./FinalQuotationFields";
import { LuEllipsisVertical, LuPencil, LuTrash2 } from "react-icons/lu";
import {
  createEmptyFinalQuotation,
  createEmptyStoredFile,
  type FinalQuotation,
  priceNegotiationFormSchema,
  type ContactMethod,
  type PriceNegotiationFormData,
  type SupplierCandidate,
  type TaxType,
} from "./types";

type PriceNegotiationStatus =
  | "before"
  | "in_progress"
  | "pending_approval"
  | "approved";

const statusLabels: Record<PriceNegotiationStatus, string> = {
  before: "価格交渉前",
  in_progress: "価格交渉中",
  pending_approval: "価格交渉認可待ち",
  approved: "価格交渉認可後",
};

function cloneQuotation(quotation: FinalQuotation): FinalQuotation {
  return {
    ...quotation,
    file: { ...quotation.file },
  };
}

interface PriceNegotiationPageProps {
  suppliers: SupplierCandidate[];
}

export function PriceNegotiationPage({ suppliers }: PriceNegotiationPageProps) {
  const [status, setStatus] = useState<PriceNegotiationStatus>("before");
  const [editingQuotationIndex, setEditingQuotationIndex] = useState<
    number | null
  >(null);
  const [editingSnapshot, setEditingSnapshot] =
    useState<FinalQuotation | null>(null);
  const [quotationSaveError, setQuotationSaveError] = useState("");

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
    watch,
    formState: { errors },
  } = form;

  const result = watch("result");
  const isNegotiating = status === "in_progress";
  const shouldShowResult = status !== "before";
  const isReadOnlyResult =
    status === "pending_approval" || status === "approved";

  const getSupplierName = (supplierId: string) =>
    suppliers.find((supplier) => supplier.id === supplierId)?.name || "-";

  const startEditQuotation = (index: number) => {
    const quotation = form.getValues(`result.quotations.${index}`);
    setEditingSnapshot(cloneQuotation(quotation));
    setEditingQuotationIndex(index);
    setQuotationSaveError("");
  };

  const cancelEditQuotation = () => {
    if (editingQuotationIndex !== null && editingSnapshot) {
      form.setValue(
        `result.quotations.${editingQuotationIndex}`,
        cloneQuotation(editingSnapshot)
      );
      form.clearErrors(`result.quotations.${editingQuotationIndex}`);
    }
    setEditingQuotationIndex(null);
    setEditingSnapshot(null);
    setQuotationSaveError("");
  };

  const saveEditQuotation = async (index: number) => {
    const isValid = await form.trigger(`result.quotations.${index}`, {
      shouldFocus: true,
    });
    if (!isValid) return;

    const quotation = form.getValues(`result.quotations.${index}`);
    console.log("最終見積書 保存ペイロード:", {
      ...quotation,
      file: {
        fileName: quotation.file.fileName,
        filePath: quotation.file.filePath,
      },
    });

    setEditingQuotationIndex(null);
    setEditingSnapshot(null);
    setQuotationSaveError("");
  };

  const deleteQuotation = (index: number) => {
    if (index === 0) return;

    const quotations = form.getValues("result.quotations");
    form.setValue(
      "result.quotations",
      quotations.filter((_, currentIndex) => currentIndex !== index)
    );
    if (editingQuotationIndex === index) {
      setEditingQuotationIndex(null);
      setEditingSnapshot(null);
      setQuotationSaveError("");
    }
  };

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
    setStatus("pending_approval");
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
            <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <Text fontSize="xl" fontWeight="bold">
                価格交渉
              </Text>
              <Text color="fg.muted" fontSize="sm">
                {statusLabels[status]}
              </Text>
            </HStack>
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
                              disabled={!isNegotiating}
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

          {shouldShowResult && (
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
              {isReadOnlyResult ? (
                <ReadOnlyNegotiationResult
                  form={form}
                  result={result}
                  supplierName={getSupplierName(result.supplierId)}
                  editingQuotationIndex={editingQuotationIndex}
                  quotationSaveError={quotationSaveError}
                  onStartEditQuotation={startEditQuotation}
                  onCancelEditQuotation={cancelEditQuotation}
                  onSaveEditQuotation={saveEditQuotation}
                  onDeleteQuotation={deleteQuotation}
                />
              ) : (
                <VStack align="stretch" gap={4}>
                  <Grid
                    templateColumns={{
                      base: "minmax(0, 1fr)",
                      md: "repeat(2, minmax(0, 1fr))",
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
                            errors.result?.contactMemo
                              ? "border.error"
                              : undefined
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
              )}
            </Box>
          )}

          <HStack gap={3} flexWrap="wrap">
            {status === "before" && (
              <Button
                type="button"
                colorPalette="blue"
                w={{ base: "full", sm: "auto" }}
                onClick={() => setStatus("in_progress")}
              >
                交渉開始
              </Button>
            )}
            {status === "in_progress" && (
              <Button
                type="submit"
                colorPalette="green"
                w={{ base: "full", sm: "auto" }}
              >
                認可依頼
              </Button>
            )}
            {status === "pending_approval" && (
              <Button
                type="button"
                colorPalette="green"
                w={{ base: "full", sm: "auto" }}
                onClick={() => setStatus("approved")}
              >
                認可
              </Button>
            )}
          </HStack>
        </VStack>
      </form>
    </Box>
  );
}

function ReadOnlyNegotiationResult({
  form,
  result,
  supplierName,
  editingQuotationIndex,
  quotationSaveError,
  onStartEditQuotation,
  onCancelEditQuotation,
  onSaveEditQuotation,
  onDeleteQuotation,
}: {
  form: UseFormReturn<PriceNegotiationFormData>;
  result: PriceNegotiationFormData["result"];
  supplierName: string;
  editingQuotationIndex: number | null;
  quotationSaveError: string;
  onStartEditQuotation: (index: number) => void;
  onCancelEditQuotation: () => void;
  onSaveEditQuotation: (index: number) => void | Promise<void>;
  onDeleteQuotation: (index: number) => void;
}) {
  const taxTypeText =
    result.taxType === "tax_inclusive" ? "税込" : result.taxType === "tax_exclusive" ? "税抜" : "-";

  return (
    <VStack align="stretch" gap={4}>
      <Grid
        templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }}
        gap={4}
      >
        <ReadOnlyValue label="発注先" value={supplierName} />
        <ReadOnlyValue
          label="交渉金額"
          value={
            result.negotiatedAmount === ""
              ? "-"
              : `${Number(result.negotiatedAmount).toLocaleString()}円（${taxTypeText}）`
          }
        />
        <GridItem colSpan={{ base: 1, md: 2 }} minW={0}>
          <ReadOnlyValue label="連絡事項" value={result.contactMemo || "-"} />
        </GridItem>
      </Grid>

      <Separator />

      <VStack align="stretch" gap={4}>
        {result.quotations.map((quotation, index) => (
          <Box
            key={index}
            border="1px solid"
            borderColor="border"
            borderRadius="md"
            p={{ base: 3, md: 4 }}
            minW={0}
          >
            <HStack justify="space-between" align="center" mb={4} gap={3}>
              <Text fontSize="lg" fontWeight="bold">
                最終見積書 {index + 1}
              </Text>
              {editingQuotationIndex !== index && (
                <MenuRoot>
                  <MenuTrigger asChild>
                    <IconButton
                      type="button"
                      aria-label="最終見積書メニュー"
                      size="sm"
                      variant="ghost"
                    >
                      <LuEllipsisVertical />
                    </IconButton>
                  </MenuTrigger>
                  <MenuContent>
                    <MenuItem
                      value="edit"
                      onClick={() => onStartEditQuotation(index)}
                    >
                      <LuPencil />
                      編集
                    </MenuItem>
                    {index > 0 && (
                      <MenuItem
                        value="delete"
                        color="fg.error"
                        onClick={() => onDeleteQuotation(index)}
                      >
                        <LuTrash2 />
                        削除
                      </MenuItem>
                    )}
                  </MenuContent>
                </MenuRoot>
              )}
            </HStack>
            {editingQuotationIndex === index ? (
              <InlineQuotationEditForm
                form={form}
                index={index}
                saveError={quotationSaveError}
                onSave={() => void onSaveEditQuotation(index)}
                onCancel={onCancelEditQuotation}
              />
            ) : (
            <Grid
              templateColumns={{
                base: "minmax(0, 1fr)",
                md: "repeat(2, minmax(0, 1fr))",
              }}
              gap={4}
            >
              <ReadOnlyValue
                label="見積金額"
                value={
                  quotation.amount === ""
                    ? "-"
                    : `${Number(quotation.amount).toLocaleString()}円（${
                        quotation.taxType === "tax_inclusive" ? "税込" : "税抜"
                      }）`
                }
              />
              <ReadOnlyValue label="見積日" value={quotation.quotationDate || "-"} />
              <ReadOnlyValue label="見積No." value={quotation.quotationNo || "-"} />
              {quotation.file.fileName && (
                <ReadOnlyValue
                  label="受領区分"
                  value={
                    quotation.receiptCategory === "electronic"
                      ? "電子"
                      : quotation.receiptCategory === "paper"
                        ? "紙"
                        : "-"
                  }
                />
              )}
              <ReadOnlyValue
                label="見積書ファイル"
                value={quotation.file.fileName || "-"}
                colSpan={{ base: 1, md: 2 }}
              />
            </Grid>
            )}
          </Box>
        ))}
      </VStack>

      <Separator />

      <ReadOnlyValue
        label="注文書"
        value={result.orderFile.fileName || "-"}
      />
    </VStack>
  );
}

function InlineQuotationEditForm({
  form,
  index,
  saveError,
  onSave,
  onCancel,
}: {
  form: UseFormReturn<PriceNegotiationFormData>;
  index: number;
  saveError: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = form;
  const fieldErrors = errors.result?.quotations?.[index];
  const quotationFile = form.watch(`result.quotations.${index}.file`);
  const hasQuotationFile = !!quotationFile.fileName;

  return (
    <VStack align="stretch" gap={4}>
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
              borderColor={fieldErrors?.amount ? "border.error" : undefined}
              _focusVisible={
                fieldErrors?.amount ? { borderColor: "border.error" } : undefined
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
                    fieldErrors?.receiptCategory ? "border.error" : undefined
                  }
                  _focusVisible={
                    fieldErrors?.receiptCategory
                      ? { borderColor: "border.error" }
                      : undefined
                  }
                  {...register(`result.quotations.${index}.receiptCategory`)}
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

      {saveError && (
        <Text color="fg.error" fontSize="sm">
          {saveError}
        </Text>
      )}

      <HStack justify="flex-end" gap={3} flexWrap="wrap">
        <Button
          type="button"
          variant="outline"
          w={{ base: "full", sm: "auto" }}
          onClick={onCancel}
        >
          キャンセル
        </Button>
        <Button
          type="button"
          colorPalette="blue"
          w={{ base: "full", sm: "auto" }}
          onClick={onSave}
        >
          保存
        </Button>
      </HStack>
    </VStack>
  );
}

function ReadOnlyValue({
  label,
  value,
  colSpan,
}: {
  label: string;
  value: string;
  colSpan?: { base: number; md: number };
}) {
  return (
    <GridItem minW={0} colSpan={colSpan}>
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        px={4}
        py={3}
        minH="56px"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        gap={1}
      >
        <Text fontSize="xs" color="fg.muted">
          {label}
        </Text>
        <Text fontWeight="medium" overflowWrap="anywhere">
          {value}
        </Text>
      </Box>
    </GridItem>
  );
}
