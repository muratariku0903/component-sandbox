import Head from "next/head";
import { PriceNegotiationDemo } from "@/features/price-negotiation/PriceNegotiationDemo";

export default function PriceNegotiationRoute() {
  return (
    <>
      <Head>
        <title>価格交渉</title>
      </Head>
      <PriceNegotiationDemo />
    </>
  );
}
