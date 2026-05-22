import Head from "next/head";
import { OrderDetailDemo } from "@/features/order-detail/OrderDetailDemo";

export default function OrderDetailRoute() {
  return (
    <>
      <Head>
        <title>発注明細</title>
      </Head>
      <OrderDetailDemo />
    </>
  );
}
