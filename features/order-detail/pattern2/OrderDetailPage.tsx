import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Box, Button, Input, Text, VStack } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field } from "@/components/ui/field";
import { OrderDetailSummary } from "./OrderDetailSummary";
import { QuotationTable } from "./QuotationTable";
import { AddOrderDetailModal, type ModalSavePayload } from "./AddOrderDetailModal";
import {
  createPageFormSchema,
  type Quotation,
  type PageFormData,
} from "../shared/types";
import { LuPlus, LuPencil } from "react-icons/lu";

export interface OrderDetailPageHandle {
  /** 親のボタンから呼ぶ。Zod 検証通過時のみ onSubmit に payload が流れる */
  submit: () => void;
}

interface OrderDetailPageProps {
  quotations: Quotation[];
  negotiationPrice?: number;
  initialData?: PageFormData;
  /** Zod 検証（発注名必須 + 明細必須 + 価格一致）通過時に呼ばれる */
  onSubmit?: (payload: PageFormData) => void;
  /** 送信可能かどうかが変わるたびに親へ通知。明細が1件以上あれば true */
  onCanSubmitChange?: (canSubmit: boolean) => void;
}

export const OrderDetailPage = forwardRef<OrderDetailPageHandle, OrderDetailPageProps>(
  function OrderDetailPage(
    { quotations, negotiationPrice = 0, initialData, onSubmit, onCanSubmitChange },
    ref
  ) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 外部コンテキスト（negotiationPrice）付きのスキーマをメモ化
    const schema = useMemo(
      () => createPageFormSchema(negotiationPrice),
      [negotiationPrice]
    );

    const pageForm = useForm<PageFormData>({
      resolver: zodResolver(schema),
      defaultValues: initialData ?? {
        orderName: "",
        taxType: "tax_exclusive",
        savedDetails: [],
      },
    });

    const savedDetails = pageForm.watch("savedDetails");
    const taxType = pageForm.watch("taxType");
    const hasDetails = savedDetails.length > 0;

    // 送信可能状態（明細1件以上）の変化を親へ通知。
    // unmount 時は false に戻す（タブ切替で active が別の孫に移るとき、古い状態を引きずらないため）
    useEffect(() => {
      onCanSubmitChange?.(hasDetails);
      return () => onCanSubmitChange?.(false);
    }, [hasDetails, onCanSubmitChange]);

    const { orderAmount, taxAmount } = useMemo(() => {
      const order = savedDetails.reduce((sum, d) => sum + d.subtotal, 0);
      const tax = savedDetails.reduce((sum, d) => {
        return (
          sum +
          d.details.reduce((detailSum, item) => {
            if (taxType === "tax_inclusive" && item.taxRate) {
              const amt = Number(item.amount) || 0;
              const rate = Number(item.taxRate) / 100;
              return detailSum + amt - amt / (1 + rate);
            }
            return detailSum;
          }, 0)
        );
      }, 0);
      return { orderAmount: order, taxAmount: Math.round(tax) };
    }, [savedDetails, taxType]);

    const handleModalSave = ({ taxType: nextTaxType, details }: ModalSavePayload) => {
      pageForm.setValue("taxType", nextTaxType);
      pageForm.setValue("savedDetails", details);
      // 明細が更新されたので前回の Zod エラー（価格不一致／明細なし）をクリア
      pageForm.clearErrors();
    };

    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          pageForm.handleSubmit((data) => {
            onSubmit?.(data);
          })();
        },
      }),
      [pageForm, onSubmit]
    );

    const rootError = pageForm.formState.errors.root?.message;

    return (
      <Box maxW="960px" mx="auto" p={6}>
        <VStack gap={6} align="stretch">
          <Field
            label="発注名"
            invalid={!!pageForm.formState.errors.orderName}
            errorText={pageForm.formState.errors.orderName?.message}
          >
            <Input
              {...pageForm.register("orderName")}
              placeholder="発注名を入力"
            />
          </Field>

          <Box>
            <Button
              type="button"
              colorPalette="blue"
              onClick={() => setIsModalOpen(true)}
            >
              {hasDetails ? <LuPencil /> : <LuPlus />}
              {hasDetails ? "発注明細編集" : "発注明細追加"}
            </Button>
          </Box>

          {savedDetails.map((detail, index) => (
            <QuotationTable
              key={`${detail.quotation.id}-${index}`}
              detail={detail}
            />
          ))}

          <OrderDetailSummary
            negotiationPrice={negotiationPrice}
            orderAmount={orderAmount}
            taxAmount={taxAmount}
            hasDetails={hasDetails}
          />

          {rootError && (
            <Text color="fg.error" fontSize="sm">
              {rootError}
            </Text>
          )}
        </VStack>

        <AddOrderDetailModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          quotations={quotations}
          onSave={handleModalSave}
          savedDetails={savedDetails}
          initialTaxType={taxType}
        />
      </Box>
    );
  }
);
