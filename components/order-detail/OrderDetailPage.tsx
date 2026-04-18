import { useState, useMemo } from "react";
import { Box, Button, Input, Tabs, VStack } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { Field } from "@/components/ui/field";
import { OrderDetailSummary } from "./OrderDetailSummary";
import { QuotationTable } from "./QuotationTable";
import { AddOrderDetailModal } from "./AddOrderDetailModal";
import type { Quotation, SavedQuotationDetail, PageFormData } from "./types";
import { LuPlus, LuPencil } from "react-icons/lu";

interface OrderDetailPageProps {
  quotations: Quotation[];
  negotiationPrice?: number;
  initialData?: PageFormData;
}

export function OrderDetailPage({
  quotations,
  negotiationPrice = 0,
  initialData,
}: OrderDetailPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ページレベルのフォーム: 発注名 + 保存済み明細
  const pageForm = useForm<PageFormData>({
    defaultValues: initialData ?? {
      orderName: "",
      savedDetails: [],
    },
  });

  const savedDetails = pageForm.watch("savedDetails");
  const hasDetails = savedDetails.length > 0;

  const { orderAmount, taxAmount } = useMemo(() => {
    const order = savedDetails.reduce((sum, d) => sum + d.subtotal, 0);
    const tax = savedDetails.reduce((sum, d) => {
      return (
        sum +
        d.details.reduce((detailSum, item) => {
          if (d.taxType === "tax_inclusive" && item.taxRate) {
            const amt = Number(item.amount) || 0;
            const rate = Number(item.taxRate) / 100;
            return detailSum + amt - amt / (1 + rate);
          }
          return detailSum;
        }, 0)
      );
    }, 0);
    return { orderAmount: order, taxAmount: Math.round(tax) };
  }, [savedDetails]);

  const handleModalSave = (details: SavedQuotationDetail[]) => {
    pageForm.setValue("savedDetails", details);
  };

  const handleSubmit = pageForm.handleSubmit((data) => {
    // 将来的にここでAPIリクエストを送信
    console.log("認可依頼ペイロード:", data);
  });

  return (
    <Box maxW="960px" mx="auto" p={6}>
      <Tabs.Root defaultValue="order-detail">
        <Tabs.List>
          <Tabs.Trigger value="order-detail">発注明細</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="order-detail">
          <form onSubmit={handleSubmit}>
            <VStack gap={6} align="stretch">
              <Field label="発注名">
                <Input
                  {...pageForm.register("orderName", {
                    required: "発注名を入力してください",
                  })}
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

              <OrderDetailSummary
                negotiationPrice={negotiationPrice}
                orderAmount={orderAmount}
                taxAmount={taxAmount}
                hasDetails={hasDetails}
              />

              {savedDetails.map((detail, index) => (
                <QuotationTable
                  key={`${detail.quotation.id}-${index}`}
                  detail={detail}
                />
              ))}

              <Box pt={4}>
                <Button
                  type="submit"
                  colorPalette="green"
                  disabled={!hasDetails}
                >
                  認可依頼
                </Button>
              </Box>
            </VStack>
          </form>
        </Tabs.Content>
      </Tabs.Root>

      <AddOrderDetailModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        quotations={quotations}
        onSave={handleModalSave}
        savedDetails={savedDetails}
      />
    </Box>
  );
}
