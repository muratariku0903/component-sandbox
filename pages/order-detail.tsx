import Head from "next/head";
import { OrderDetailPage } from "@/components/order-detail/OrderDetailPage";
import type { Quotation } from "@/components/order-detail/types";

// モックデータ（将来的にはAPIから取得）
const mockQuotations: Quotation[] = [
  { id: "quote-1", name: "見積書1" },
  { id: "quote-2", name: "見積書2" },
  { id: "quote-3", name: "見積書3" },
];

export default function OrderDetailRoute() {
  return (
    <>
      <Head>
        <title>発注明細</title>
      </Head>
      <OrderDetailPage quotations={mockQuotations} negotiationPrice={500000} />
    </>
  );
}
