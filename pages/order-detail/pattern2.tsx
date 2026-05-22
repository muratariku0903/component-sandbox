import { useState } from "react";
import Head from "next/head";
import { Box, HStack, Button } from "@chakra-ui/react";
import { OrderDetailPage } from "@/features/order-detail/pattern2/OrderDetailPage";
import type { Quotation, PageFormData } from "@/features/order-detail/shared/types";

// モックデータ（将来的にはAPIから取得）
const mockQuotations: Quotation[] = [
  { id: "quote-1", name: "見積書1" },
  { id: "quote-2", name: "見積書2" },
  { id: "quote-3", name: "見積書3" },
];

// DB保存済みを想定したモックデータ
const mockSavedData: PageFormData = {
  orderName: "テスト発注 2025-001",
  savedDetails: [
    {
      quotation: { id: "quote-1", name: "見積書1" },
      taxType: "tax_exclusive",
      details: [
        { productName: "ノートPC", modelNumber: "NPC-001", unitPrice: 150000, quantity: 5, taxRate: "", amount: 750000 },
        { productName: "モニター", modelNumber: "MON-002", unitPrice: 45000, quantity: 5, taxRate: "", amount: 225000 },
      ],
      subtotal: 975000,
    },
    {
      quotation: { id: "quote-2", name: "見積書2" },
      taxType: "tax_exclusive",
      details: [
        { productName: "キーボード", modelNumber: "KB-100", unitPrice: 8000, quantity: 10, taxRate: "", amount: 80000 },
      ],
      subtotal: 80000,
    },
  ],
};

export default function OrderDetailRoute() {
  const [mode, setMode] = useState<"new" | "saved">("new");

  return (
    <>
      <Head>
        <title>発注明細</title>
      </Head>

      <Box bg="gray.100" p={3} mb={4}>
        <HStack gap={3} justify="center">
          <Button
            size="sm"
            variant={mode === "new" ? "solid" : "outline"}
            colorPalette="blue"
            onClick={() => setMode("new")}
          >
            新規
          </Button>
          <Button
            size="sm"
            variant={mode === "saved" ? "solid" : "outline"}
            colorPalette="blue"
            onClick={() => setMode("saved")}
          >
            保存済み（Mock）
          </Button>
        </HStack>
      </Box>

      <OrderDetailPage
        key={mode}
        quotations={mockQuotations}
        negotiationPrice={500000}
        initialData={mode === "saved" ? mockSavedData : undefined}
      />
    </>
  );
}
