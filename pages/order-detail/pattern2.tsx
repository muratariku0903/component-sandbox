import { useRef, useState } from "react";
import Head from "next/head";
import { Box, HStack, Button, Text, VStack } from "@chakra-ui/react";
import {
  OrderDetailTabContainer,
  type OrderDetailTabContainerHandle,
} from "@/features/order-detail/pattern2/OrderDetailTabContainer";
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
  taxType: "tax_exclusive",
  savedDetails: [
    {
      quotation: { id: "quote-1", name: "見積書1" },
      details: [
        { productName: "ノートPC", modelNumber: "NPC-001", unitPrice: 150000, quantity: 5, taxRate: "", amount: 750000 },
        { productName: "モニター", modelNumber: "MON-002", unitPrice: 45000, quantity: 5, taxRate: "", amount: 225000 },
      ],
      subtotal: 975000,
    },
    {
      quotation: { id: "quote-2", name: "見積書2" },
      details: [
        { productName: "キーボード", modelNumber: "KB-100", unitPrice: 8000, quantity: 10, taxRate: "", amount: 80000 },
      ],
      subtotal: 80000,
    },
  ],
};

/**
 * 3層構成デモ:
 *  - 親（このページ）: 送信ボタン + ref
 *  - 中間（OrderDetailTabContainer）: Tabs を保持し、active な孫に ref を forward
 *  - 孫（OrderDetailPage / OrderMemoContent）: 各自 useForm を持ち、useImperativeHandle で submit() を公開
 *
 * 親は「今どの孫が active か」を知らず、単に `tabRef.current?.submit()` を叩くだけ。
 */
export default function OrderDetailPattern2Route() {
  const [mode, setMode] = useState<"new" | "saved">("new");
  const [canSubmit, setCanSubmit] = useState(false);
  const tabRef = useRef<OrderDetailTabContainerHandle>(null);

  return (
    <>
      <Head>
        <title>発注明細（パターン2）</title>
      </Head>

      {/* 初期データモード切替 */}
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

      {/* 中間層: タブで孫を切替 */}
      <Box maxW="960px" mx="auto" px={6}>
        <OrderDetailTabContainer
          key={mode}
          ref={tabRef}
          quotations={mockQuotations}
          negotiationPrice={500000}
          initialData={mode === "saved" ? mockSavedData : undefined}
          onOrderDetailSubmit={(payload) => {
            // 実際はここで発注明細用 API を叩く
            console.log("[発注明細] API送信ペイロード:", payload);
          }}
          onMemoSubmit={(payload) => {
            // 発注明細とは別の API に投げる想定
            console.log("[メモ] API送信ペイロード:", payload);
          }}
          onCanSubmitChange={setCanSubmit}
        />
      </Box>

      {/* 親のボタン。active な孫の送信可能状態を canSubmit で受け取り、true のときだけ表示 */}
      {canSubmit && (
        <Box
          maxW="960px"
          mx="auto"
          px={6}
          mt={4}
          pt={4}
          borderTop="1px solid"
          borderColor="border"
        >
          <VStack align="stretch" gap={2}>
            <Text fontSize="xs" color="fg.muted">
              ↓ 親ページのボタン。現在 active なタブの孫コンポーネントの submit() を呼びます（バリデーション通過時に payload が console へ）
            </Text>
            <Button
              colorPalette="green"
              onClick={() => tabRef.current?.submit()}
            >
              API送信（外側のボタン）
            </Button>
          </VStack>
        </Box>
      )}
    </>
  );
}
